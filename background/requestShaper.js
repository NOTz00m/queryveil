// request shaping with blocking webRequest (firefox mv3 keeps it).
//
// measured on firefox 159 against a local header echo server:
//  - a background fetch() goes out as Sec-Fetch-Site: same-origin,
//    Sec-Fetch-Mode: cors, Sec-Fetch-Dest: empty, Accept: */*,
//    priority: u=4. a typed search is a navigation and looks nothing like that
//  - tabs.create / tabs.update / search.search navigations are proper
//    navigations, but firefox marks them Sec-Fetch-Site: same-origin with
//    no Sec-Fetch-User, because the extension triggered them. a search typed
//    into the address bar is Sec-Fetch-Site: none, Sec-Fetch-User: ?1
//  - firefox's own address bar suggest requests are sent anonymously
//    (no cookies) and, being system-principal xhr, carry no Sec-Fetch headers
//  - every one of these headers can be rewritten in onBeforeSendHeaders
//
// this module rewrites our own requests to match those real shapes and
// leaves every other request in the browser untouched

import { SEARCH_URL_PATTERNS, SUGGEST_URL_PATTERNS, matchSearchURL, learnParams } from './engines.js';

const browser = globalThis.browser || globalThis.chrome;

// header values firefox 159 sends on a top-level navigation
const NAV_ACCEPT = 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8';

// firefox's header order on a navigation, used when we rebuild headers
const NAV_ORDER = [
  'host', 'user-agent', 'accept', 'accept-language', 'accept-encoding',
  'referer', 'connection', 'cookie', 'upgrade-insecure-requests',
  'sec-fetch-dest', 'sec-fetch-mode', 'sec-fetch-site', 'sec-fetch-user',
  'priority', 'te'
];

export class RequestShaper {
  constructor({ onUserSearch, onLearnedParams } = {}) {
    // tabId -> 'typed' (address bar search) or 'click' (result click)
    this.coverTabs = new Map();
    this.pendingFetches = new Set();
    this.pendingSuggests = new Set();
    this.onUserSearch = onUserSearch || (() => {});
    this.onLearnedParams = onLearnedParams || (() => {});
    this.registered = false;
  }

  // must run synchronously at top level so firefox can wake the
  // event page for these listeners
  register() {
    if (this.registered || !browser.webRequest?.onBeforeSendHeaders) return;
    this.registered = true;

    try {
      browser.webRequest.onBeforeSendHeaders.addListener(
        details => this.shape(details),
        { urls: [...SEARCH_URL_PATTERNS, ...SUGGEST_URL_PATTERNS] },
        ['blocking', 'requestHeaders']
      );
    } catch (e) {
      // chrome mv3 has no blocking webRequest for normal installs
      this.registered = false;
    }

    try {
      browser.webRequest.onBeforeRequest.addListener(
        details => this.observe(details),
        { urls: SEARCH_URL_PATTERNS, types: ['main_frame'] }
      );
    } catch (e) {
      // observation is optional
    }
  }

  isActive() {
    return this.registered;
  }

  markCoverTab(tabId, kind) {
    this.coverTabs.set(tabId, kind);
  }

  releaseCoverTab(tabId) {
    this.coverTabs.delete(tabId);
  }

  isCoverTab(tabId) {
    return this.coverTabs.has(tabId);
  }

  expectFetch(url) {
    this.pendingFetches.add(normalize(url));
  }

  expectSuggest(url) {
    this.pendingSuggests.add(normalize(url));
  }

  shape(details) {
    const url = normalize(details.url);

    if (details.tabId >= 0 && this.coverTabs.has(details.tabId)) {
      if (details.type !== 'main_frame') return {};
      const kind = this.coverTabs.get(details.tabId);
      return { requestHeaders: this.shapeTabNavigation(details.requestHeaders, kind) };
    }

    if (this.pendingFetches.has(url)) {
      this.pendingFetches.delete(url);
      return { requestHeaders: this.shapeFetchAsNavigation(details.requestHeaders) };
    }

    if (this.pendingSuggests.has(url)) {
      this.pendingSuggests.delete(url);
      return { requestHeaders: this.shapeSuggest(details.requestHeaders) };
    }

    return {};
  }

  // a real tab navigation already has the right accept, priority and
  // upgrade-insecure-requests. only the user-activation signals are off
  shapeTabNavigation(headers, kind) {
    const out = headers
      .filter(h => !/^sec-fetch-user$/i.test(h.name))
      .map(h => ({ ...h }));
    if (kind === 'typed') {
      // typed into the address bar: no initiating site at all
      setHeader(out, 'Sec-Fetch-Site', 'none');
    }
    // a click keeps the site firefox computed from the results page,
    // which is already right (same-origin for engine redirects)
    out.push({ name: 'Sec-Fetch-User', value: '?1' });
    return order(out);
  }

  // background mode: turn a cors fetch into what a typed navigation sends
  shapeFetchAsNavigation(headers) {
    const out = headers.filter(h => !/^(origin|sec-fetch-.*|accept|priority|upgrade-insecure-requests|referer)$/i.test(h.name));
    out.push(
      { name: 'Accept', value: NAV_ACCEPT },
      { name: 'Upgrade-Insecure-Requests', value: '1' },
      { name: 'Sec-Fetch-Dest', value: 'document' },
      { name: 'Sec-Fetch-Mode', value: 'navigate' },
      { name: 'Sec-Fetch-Site', value: 'none' },
      { name: 'Sec-Fetch-User', value: '?1' },
      { name: 'Priority', value: 'u=0, i' }
    );
    return order(out);
  }

  // match firefox's own anonymous, system-principal suggest xhr
  shapeSuggest(headers) {
    return headers.filter(h => !/^(origin|referer|cookie|sec-fetch-.*)$/i.test(h.name));
  }

  // notice the user's own searches. used to place cover searches near
  // real ones and to learn the partner code their firefox uses.
  // only the engine and the build params are kept, never the query
  observe(details) {
    if (details.tabId < 0 || this.coverTabs.has(details.tabId)) return;
    const match = matchSearchURL(details.url);
    if (!match) return;

    const learned = learnParams(match.engine, match.params);
    // only trust urls that carry the partner param, i.e. came from the
    // address bar or search bar rather than the engine's own homepage
    if (learned.length && learned[0][0] === match.engine.learnableParams[0]) {
      this.onLearnedParams(match.engine.id, learned);
    }
    this.onUserSearch(match.engine.id);
  }
}

function normalize(url) {
  try {
    return new URL(url).href;
  } catch (e) {
    return url;
  }
}

function setHeader(headers, name, value) {
  const existing = headers.find(h => h.name.toLowerCase() === name.toLowerCase());
  if (existing) existing.value = value;
  else headers.push({ name, value });
}

function order(headers) {
  const rank = name => {
    const index = NAV_ORDER.indexOf(name.toLowerCase());
    return index === -1 ? NAV_ORDER.length : index;
  };
  return [...headers].sort((a, b) => rank(a.name) - rank(b.name));
}
