// real page mode (firefox): run a cover search in a hidden tab so the
// results page loads exactly like a real one. scripts, styles, images and
// the engine's own telemetry beacons all load, the page gets first-party
// cookies, and a result click happens inside the page so the engine's
// click handlers see it and the result site gets a real referer.
//
// flow: hidden blank tab -> browser.search.search() (firefox builds the
// url with its own partner codes) -> scan the page -> maybe click one
// result -> dwell -> park the tab on about:blank -> remove what the run
// left in history.
//
// firefox has no way to open a tab already hidden, so a new tab can show
// in the tab strip for an instant before tabs.hide() takes it out. to keep
// that rare, one hidden tab is reused for a whole search session and only
// closed (and removed from recently closed tabs) once the session is over.
// it's opened at the far end of the tab strip, never next to your tab
//
// limits that can't be fixed from an extension:
//  - the tab is hidden, so document.visibilityState is 'hidden' while the
//    results page runs. a real search is usually in a visible tab
//  - clicks dispatched by a script are isTrusted=false inside the page
//  - the result site gets no Sec-Fetch-User header, because rewriting
//    headers there would need access to every site

import { getEngine, isBlockedURL } from './engines.js';

const browser = globalThis.browser || globalThis.chrome;

const COVER_TAB_KEY = 'queryveilCover';

export class CoverTab {
  constructor(shaper) {
    this.shaper = shaper;
    this.run = null;
    this.tabId = null;
    this.historyListenerAdded = false;
  }

  static isSupported() {
    return Boolean(
      browser.tabs?.hide &&
      browser.search?.search &&
      browser.scripting?.executeScript
    );
  }

  // history.onVisited is registered once; it only records while a run is active
  registerListeners() {
    if (this.historyListenerAdded || !browser.history?.onVisited) return;
    this.historyListenerAdded = true;
    browser.history.onVisited.addListener(item => {
      if (this.run) this.run.visits.push({ url: item.url, time: Date.now() });
    });
  }

  // close cover tabs left behind if the background was stopped mid-run
  // or the browser restarted with one open. tabs are tagged through the
  // sessions api so we never touch another extension's hidden tabs
  async cleanupOrphans() {
    if (!browser.sessions?.getTabValue) return;
    try {
      const hidden = await browser.tabs.query({ hidden: true });
      for (const tab of hidden) {
        const tagged = await browser.sessions.getTabValue(tab.id, COVER_TAB_KEY).catch(() => null);
        if (tagged) await this.closeTab(tab.id);
      }
    } catch (e) {
      // nothing to clean
    }
    this.tabId = null;
    await browser.storage?.session?.remove?.('coverTabId').catch(() => {});
  }

  // the hidden tab from earlier in this session, or a new one
  async acquireTab() {
    if (this.tabId === null) {
      const stored = await browser.storage?.session?.get?.('coverTabId').catch(() => null);
      this.tabId = stored?.coverTabId ?? null;
    }

    if (this.tabId !== null) {
      try {
        const tab = await browser.tabs.get(this.tabId);
        const tagged = await browser.sessions?.getTabValue?.(tab.id, COVER_TAB_KEY).catch(() => null);
        if (tagged && tab.hidden && !tab.active) return tab.id;
        // the user revealed it from the tab list and may be using it now.
        // it's theirs, stop treating it as ours
        if (tagged) await browser.sessions.removeTabValue(tab.id, COVER_TAB_KEY).catch(() => {});
      } catch (e) {
        // gone
      }
      this.tabId = null;
    }

    // index is clamped to the end of the tab strip
    const tab = await browser.tabs.create({ url: 'about:blank', active: false, index: 100000 });
    await browser.tabs.hide(tab.id).catch(() => {});
    await browser.tabs.update(tab.id, { muted: true }).catch(() => {});
    await browser.sessions?.setTabValue?.(tab.id, COVER_TAB_KEY, true).catch(() => {});
    this.tabId = tab.id;
    await browser.storage?.session?.set?.({ coverTabId: tab.id }).catch(() => {});
    return tab.id;
  }

  // between searches in a session the tab waits on about:blank,
  // which uses next to no memory and adds nothing to history
  async park(tabId) {
    this.shaper.releaseCoverTab(tabId);
    await browser.tabs.update(tabId, { url: 'about:blank' }).catch(() => {});
  }

  // end of a search session, pause, or stop
  async release() {
    if (this.run || this.tabId === null) return;
    const tabId = this.tabId;
    this.tabId = null;
    await browser.storage?.session?.remove?.('coverTabId').catch(() => {});
    await this.closeTab(tabId);
  }

  // runs one search. options: { engineId, query, click, clickPosition,
  // scanDelay, dwellTime }. returns { success, blocked, related, clicked }
  async search(options) {
    const engine = getEngine(options.engineId);
    const run = { visits: [], start: Date.now(), query: options.query, clickHost: null };
    this.run = run;

    const keepAlive = startKeepAlive();
    let tabId = null;

    try {
      tabId = await this.acquireTab();
      this.shaper.markCoverTab(tabId, 'typed');
      const loaded = waitForLoad(tabId, 20000);
      await browser.search.search({ query: options.query, engine: engine.name, tabId });
      await loaded;

      const current = await browser.tabs.get(tabId);
      if (current.url && isBlockedURL(engine.id, current.url)) {
        return { success: false, blocked: true, related: [] };
      }

      const scan = await this.scan(tabId, engine, options.query, options.scanDelay);
      if (scan.blocked) return { success: false, blocked: true, related: [] };

      let clicked = false;
      if (options.click && scan.links.length > 0) {
        const pick = scan.links[Math.min(options.clickPosition, scan.links.length) - 1];
        run.clickHost = hostOf(pick.href);
        if (!isRiskyLink(pick.href)) {
          this.shaper.markCoverTab(tabId, 'click');
          const navigated = waitForLoad(tabId, 15000);
          clicked = await this.clickLink(tabId, pick);
          if (clicked) {
            await navigated;
            await delay(options.dwellTime);
          }
        }
      }

      return { success: true, blocked: false, related: scan.related, clicked };
    } catch (error) {
      return { success: false, blocked: false, related: [], error: String(error) };
    } finally {
      keepAlive.stop();
      if (tabId !== null) await this.park(tabId);
      this.run = null;
      await this.cleanHistory(run, engine);
    }
  }

  // scroll through the results like someone reading them, then report
  // the organic links and the engine's related searches
  async scan(tabId, engine, query, scanDelay) {
    const [injection] = await browser.scripting.executeScript({
      target: { tabId },
      func: scanResultsPage,
      args: [engine.host, query, scanDelay]
    });
    return injection?.result || { links: [], related: [], blocked: false };
  }

  async clickLink(tabId, link) {
    const [injection] = await browser.scripting.executeScript({
      target: { tabId },
      func: clickResultLink,
      args: [link.index, link.href]
    });
    return Boolean(injection?.result);
  }

  async closeTab(tabId) {
    this.shaper.releaseCoverTab(tabId);
    const before = await recentlyClosedIds();
    try {
      await browser.tabs.remove(tabId);
    } catch (e) {
      return;
    }
    await forgetClosedTab(before);
  }

  // delete the history entries this run created. a url is only removed
  // when every visit to it happened during the run, so pages the user has
  // visited themselves stay in their history
  async cleanHistory(run, engine) {
    if (!browser.history?.deleteUrl || run.visits.length === 0) return;
    const end = Date.now();
    const urls = new Set();

    for (const visit of run.visits) {
      if (belongsToRun(visit.url, run, engine)) urls.add(visit.url);
    }

    for (const url of urls) {
      try {
        const visits = await browser.history.getVisits({ url });
        const allOurs = visits.every(v => v.visitTime >= run.start - 1000 && v.visitTime <= end + 1000);
        if (allOurs) await browser.history.deleteUrl({ url });
      } catch (e) {
        // leave it
      }
    }
  }
}

function belongsToRun(url, run, engine) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch (e) {
    return false;
  }
  if (parsed.hostname === engine.host) {
    const q = parsed.searchParams.get(engine.queryParam);
    if (q && q.trim().toLowerCase() === run.query.trim().toLowerCase()) return true;
    // engine click redirects (/url, /ck/a, /l/) only during a click
    if (run.clickHost && /^\/(url|ck\/a|l\/)/.test(parsed.pathname)) return true;
    return false;
  }
  return Boolean(run.clickHost) && stripWww(parsed.hostname) === stripWww(run.clickHost);
}

async function recentlyClosedIds() {
  try {
    const recent = await browser.sessions.getRecentlyClosed({ maxResults: 25 });
    return new Set(recent.map(entry => entry.tab?.sessionId).filter(Boolean));
  } catch (e) {
    return null;
  }
}

// firefox adds the closed tab to recently closed a moment after
// tabs.remove() resolves (seen on firefox 159), so look for the new
// entry for up to about three seconds
async function forgetClosedTab(before) {
  if (!before || !browser.sessions?.forgetClosedTab) return;
  for (let attempt = 0; attempt < 12; attempt++) {
    await delay(250);
    try {
      const recent = await browser.sessions.getRecentlyClosed({ maxResults: 25 });
      const added = recent.find(entry => entry.tab?.sessionId && !before.has(entry.tab.sessionId));
      if (added) {
        await browser.sessions.forgetClosedTab(added.tab.windowId, added.tab.sessionId);
        return;
      }
    } catch (e) {
      return;
    }
  }
}

// firefox stops an idle event page after about 30 seconds even while a
// setTimeout is pending (we measured this on firefox 159). a storage.session
// write every 10 seconds, with an onChanged listener registered, keeps it
// running through a long dwell
function startKeepAlive() {
  const area = browser.storage?.session;
  if (!area) return { stop() {} };
  const timer = setInterval(() => area.set({ coverHeartbeat: Date.now() }).catch(() => {}), 10000);
  return { stop: () => clearInterval(timer) };
}

function waitForLoad(tabId, timeout) {
  return new Promise(resolve => {
    let sawLoading = false;
    const timer = setTimeout(done, timeout);
    function listener(id, info) {
      if (id !== tabId) return;
      if (info.status === 'loading') sawLoading = true;
      if (info.status === 'complete' && sawLoading) done();
    }
    function done() {
      clearTimeout(timer);
      browser.tabs.onUpdated.removeListener(listener);
      resolve();
    }
    browser.tabs.onUpdated.addListener(listener);
  });
}

// skip links whose url looks like it performs an action when opened
function isRiskyLink(href) {
  try {
    const parsed = new URL(href);
    if (parsed.protocol !== 'https:') return true;
    if (/logout|log-out|signout|sign-out|unsubscribe|delete|remove|confirm|verify|token=|download/i.test(parsed.pathname + parsed.search)) return true;
    // files that would open firefox's download panel
    return /\.(zip|rar|7z|tar|gz|exe|msi|dmg|pkg|apk|iso|bin|docx?|xlsx?|pptx?|odt|mp3|mp4|mkv|avi|mov|torrent)$/i.test(parsed.pathname);
  } catch (e) {
    return true;
  }
}

function hostOf(href) {
  try {
    return new URL(href).hostname;
  } catch (e) {
    return null;
  }
}

function stripWww(host) {
  return host.replace(/^www\./, '');
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// --- functions injected into the results page. they run in the page,
// so they can't use anything from this module's scope ---

async function scanResultsPage(engineHost, query, scanDelay) {
  const blocked = Boolean(document.querySelector(
    'form#captcha-form, #recaptcha, iframe[src*="recaptcha"], .anomaly-modal__modal, #b_captcha'
  ));

  // read down the page in a few steps
  const steps = 3 + Math.floor(Math.random() * 3);
  for (let i = 0; i < steps; i++) {
    await new Promise(resolve => setTimeout(resolve, scanDelay / steps));
    window.scrollBy({ top: 200 + Math.random() * 350, behavior: 'smooth' });
  }

  const anchors = [...document.querySelectorAll('a[href]')];
  const links = [];
  const related = [];
  const seen = new Set();
  const lowerQuery = query.trim().toLowerCase();

  anchors.forEach((anchor, index) => {
    let url;
    try {
      url = new URL(anchor.href);
    } catch (e) {
      return;
    }

    // related searches and refinements are links back to the engine
    if (url.hostname === engineHost) {
      const q = url.searchParams.get('q');
      const text = anchor.textContent.trim();
      if (q && text.length > 2 && q.trim().toLowerCase() !== lowerQuery && related.length < 20) {
        related.push(q.trim());
      }
      return;
    }

    if (url.protocol !== 'https:' && url.protocol !== 'http:') return;
    // organic results put the link around or inside a heading
    const heading = anchor.querySelector('h3, h2') || anchor.closest('h3, h2');
    if (!heading || seen.has(url.href) || links.length >= 10) return;
    seen.add(url.href);
    links.push({ index, href: anchor.href });
  });

  return { links, related: [...new Set(related)], blocked };
}

function clickResultLink(index, expectedHref) {
  const anchor = document.querySelectorAll('a[href]')[index];
  if (!anchor || anchor.href !== expectedHref) return false;
  // a new-tab link would open a visible tab, keep it in this one
  anchor.removeAttribute('target');
  anchor.scrollIntoView({ block: 'center' });
  const init = { bubbles: true, cancelable: true, view: window, button: 0 };
  // engines rewrite or log the link on mousedown, so send the whole sequence
  anchor.dispatchEvent(new MouseEvent('mouseover', init));
  anchor.dispatchEvent(new MouseEvent('mousedown', init));
  anchor.dispatchEvent(new MouseEvent('mouseup', init));
  anchor.click();
  return true;
}
