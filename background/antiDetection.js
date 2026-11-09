// transport for cover searches: address bar style autosuggest, background
// mode searches and clicks, captcha detection, and backoff.
//
// rule of thumb: never set a header the browser would set itself. earlier
// versions added DNT, Cache-Control, a fixed Accept and a per-query
// Accept-Language. none of those appear on the user's real searches, so
// they made cover searches easy to tell apart. firefox now fills in its
// own headers and RequestShaper fixes the few that give a fetch away

import { getEngine, buildSearchURL, isBlockedURL } from './engines.js';

// what firefox 159 sends as Accept on a navigation. used by the benchmark
// to describe the request trace, never set by hand on a real request
export const NAVIGATION_ACCEPT = 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8';

export class AntiDetection {
  constructor(shaper = null) {
    this.shaper = shaper;
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.backoffMultiplier = 1;
  }

  getState() {
    return {
      failureCount: this.failureCount,
      lastFailureTime: this.lastFailureTime,
      backoffMultiplier: this.backoffMultiplier
    };
  }

  setState(state) {
    if (!state) return;
    this.failureCount = state.failureCount || 0;
    this.lastFailureTime = state.lastFailureTime || null;
    this.backoffMultiplier = state.backoffMultiplier || 1;
  }

  buildSearchURL(searchEngine, query, learnedParams = null) {
    return buildSearchURL(searchEngine, query, learnedParams);
  }

  // the headers a navigation carries, for the benchmark trace. firefox
  // picks Accept-Language from the user's own language prefs
  describeNavigationHeaders() {
    return {
      Accept: NAVIGATION_ACCEPT,
      'Accept-Language': 'browser default',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1'
    };
  }

  // type the query the way the address bar sees it: one suggest request
  // per keystroke, sent without cookies like firefox's own. returns the
  // suggestions the engine sent back for the longest prefix, which are
  // real queries other people type
  async simulateAutosuggest(searchEngine, query) {
    const engine = getEngine(searchEngine);
    const prefixes = this.generateTypingPrefixes(query);
    const timings = this.generateKeystrokeDelays(query, prefixes.length);
    let suggestions = [];

    for (let i = 0; i < prefixes.length; i++) {
      await this.delay(timings[i]);
      const url = engine.suggestURL(prefixes[i]);
      this.shaper?.expectSuggest(url);

      try {
        const response = await fetch(url, {
          method: 'GET',
          credentials: 'omit',
          cache: 'no-store'
        });
        // only parse the last few, earlier ones are just typing noise
        if (i >= prefixes.length - 3 && response.ok) {
          const parsed = parseSuggestions(await response.text());
          if (parsed.length) suggestions = parsed;
        }
      } catch (e) {
        // a failed suggest doesn't stop the search
      }
    }

    // pause between the last key and pressing enter
    await this.delay(300 + Math.random() * 900);
    return suggestions;
  }

  // every prefix, one per keystroke. firefox's address bar asks for
  // suggestions on each key (its debounce is shorter than human typing),
  // so skipping prefixes makes the typing look impossibly fast.
  // long queries are usually pasted or picked from history, so cap them
  generateTypingPrefixes(query) {
    const text = query.slice(0, 60);
    const prefixes = [];
    for (let i = 1; i <= text.length; i++) {
      // the space alone doesn't change what was asked for
      if (text[i - 1] === ' ' && i < text.length) continue;
      prefixes.push(text.slice(0, i));
    }
    return prefixes.length ? prefixes : [query];
  }

  // inter-key delays: lognormal around ~170ms (roughly 50-60 wpm), longer
  // after a space, and the odd hesitation while reading the suggestions
  generateKeystrokeDelays(query, count) {
    const delays = [];
    for (let i = 0; i < count; i++) {
      const base = Math.exp(5.1 + 0.35 * gaussian());
      const wordGap = query[i] === ' ' ? 120 + Math.random() * 200 : 0;
      const hesitation = Math.random() < 0.06 ? 400 + Math.random() * 900 : 0;
      delays.push(Math.min(2500, base + wordGap + hesitation));
    }
    return delays;
  }

  // background mode search. the shaper turns this fetch into what a typed
  // navigation sends. what it can't add are the page's scripts, images and
  // beacons, which is why real page mode is the default on firefox
  async executeQuery(searchEngine, query, options = {}) {
    const url = this.buildSearchURL(searchEngine, query, options.learnedParams);
    this.shaper?.expectFetch(url);

    try {
      const response = await fetch(url, {
        method: 'GET',
        // set here rather than in the shaper so firefox puts it in the
        // same place in the header order as on a real navigation
        headers: { 'Upgrade-Insecure-Requests': '1' },
        credentials: 'include',
        cache: 'default',
        redirect: 'follow'
      });

      if (response.status === 429 || isBlockedURL(searchEngine, response.url)) {
        this.handleRateLimit();
        return { success: false, blocked: true, error: 'blocked or rate limited' };
      }

      if (!response.ok) {
        this.handleFailure();
        return { success: false, error: `HTTP ${response.status}` };
      }

      let body = '';
      try {
        body = await response.text();
      } catch (e) {
        body = '';
      }

      if (looksLikeChallenge(body)) {
        this.handleRateLimit();
        return { success: false, blocked: true, error: 'challenge page' };
      }

      this.resetFailureTracking();
      return { success: true, status: response.status, url, body };
    } catch (error) {
      this.handleFailure();
      return { success: false, error: error.message };
    }
  }

  // background mode click: wait while the page gets scanned, then request
  // the result page. no-cors, so nothing on that page runs and we never
  // read it. it gets the site's first-party cookies like a real visit, but
  // no google referer, which only real page mode can provide
  async simulateResultClick(resultURL) {
    if (isRiskyLink(resultURL)) return { success: false, error: 'skipped action-like link' };
    try {
      await this.delay(this.getClickDelay());
      const response = await fetch(resultURL, {
        method: 'GET',
        mode: 'no-cors',
        credentials: 'include',
        cache: 'default',
        redirect: 'follow'
      });
      return { success: response.type === 'opaque' || response.ok, url: resultURL };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // pull organic result links out of a results page.
  // each engine wraps outbound links differently, so unwrap those first,
  // then drop anything that points back at the engine itself
  extractResultLinks(searchEngine, html) {
    if (!html) return [];

    const seen = new Set();
    const links = [];
    const pattern = /href\s*=\s*["']([^"'<>\s]+)["']/gi;
    let match;

    while ((match = pattern.exec(html)) && links.length < 10) {
      const url = this.unwrapResultLink(decodeEntities(match[1]));
      if (!url || seen.has(url) || !this.isOrganicResult(url)) continue;
      seen.add(url);
      links.push(url);
    }

    return links;
  }

  // related searches on a results page are links back to the engine with
  // a different q. those are real queries the engine thinks people ask next
  extractRelatedSearches(searchEngine, html, query) {
    if (!html) return [];
    const engine = getEngine(searchEngine);
    const related = new Set();
    const pattern = /href\s*=\s*["']([^"'<>\s]+)["']/gi;
    const lowerQuery = query.trim().toLowerCase();
    let match;

    while ((match = pattern.exec(html)) && related.size < 20) {
      try {
        const url = new URL(decodeEntities(match[1]), `https://${engine.host}`);
        if (url.hostname !== engine.host) continue;
        const q = url.searchParams.get(engine.queryParam);
        if (q && q.trim().toLowerCase() !== lowerQuery) related.add(q.trim());
      } catch (e) {
        // skip
      }
    }
    return [...related];
  }

  unwrapResultLink(href) {
    try {
      if (href.startsWith('//')) href = `https:${href}`;

      // google: /url?q=<target>&sa=...
      if (href.startsWith('/url?') || href.includes('google.com/url?')) {
        const params = new URL(href, 'https://www.google.com').searchParams;
        return params.get('q') || params.get('url');
      }

      // duckduckgo: //duckduckgo.com/l/?uddg=<encoded target>
      if (href.includes('/l/?') && href.includes('uddg=')) {
        return new URL(href, 'https://duckduckgo.com').searchParams.get('uddg');
      }

      // bing: /ck/a?...&u=a1<base64url target>
      if (href.includes('bing.com/ck/a?') || href.startsWith('/ck/a?')) {
        const encoded = new URL(href, 'https://www.bing.com').searchParams.get('u');
        if (!encoded?.startsWith('a1')) return null;
        const base64 = encoded.slice(2).replace(/-/g, '+').replace(/_/g, '/');
        return atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '='));
      }

      return href;
    } catch (e) {
      return null;
    }
  }

  isOrganicResult(url) {
    let parsed;
    try {
      parsed = new URL(url);
    } catch (e) {
      return false;
    }

    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return false;
    if (/\.(js|css|png|jpe?g|gif|svg|ico|webp|woff2?|json|xml)$/i.test(parsed.pathname)) return false;

    const host = parsed.hostname.toLowerCase();
    const engineHosts = [
      'google.', 'gstatic.', 'googleapis.', 'googleusercontent.', 'googleadservices.',
      'doubleclick.', 'bing.com', 'bing.net', 'microsoft.com', 'live.com',
      'duckduckgo.com', 'duck.com', 'w3.org', 'schema.org'
    ];
    return !engineHosts.some(engineHost => host.includes(engineHost));
  }

  // 2-8 seconds to scan results before clicking matches eye tracking studies
  getClickDelay() {
    return 2000 + Math.random() * 6000;
  }

  // which result position to click heavily favors top results
  // 50% click #1, drops off exponentially from there
  getResultPosition() {
    const rand = Math.random();
    if (rand < 0.50) return 1;
    if (rand < 0.70) return 2;
    if (rand < 0.82) return 3;
    if (rand < 0.90) return 4;
    if (rand < 0.95) return 5;
    return Math.floor(Math.random() * 5) + 6;
  }

  // captcha or 429: double the spacing, capped at 8x
  handleRateLimit() {
    this.backoffMultiplier = Math.min(this.backoffMultiplier * 2, 8);
    this.failureCount++;
    this.lastFailureTime = Date.now();
  }

  handleFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    if (this.failureCount > 5) {
      this.backoffMultiplier = Math.min(this.backoffMultiplier * 1.5, 8);
    }
  }

  // ease back toward normal spacing after successful searches
  resetFailureTracking() {
    if (this.backoffMultiplier > 1) {
      this.backoffMultiplier = Math.max(this.backoffMultiplier * 0.85, 1);
    }
    if (this.lastFailureTime && (Date.now() - this.lastFailureTime > 3600000)) {
      this.failureCount = 0;
    }
  }

  getBackoffMultiplier() {
    return this.backoffMultiplier;
  }

  // stop for a while after repeated blocks inside the last hour
  shouldPause() {
    return this.failureCount > 10 &&
      this.lastFailureTime !== null &&
      (Date.now() - this.lastFailureTime < 3600000);
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// google (client=firefox), bing osjson and duckduckgo type=list all answer
// in the opensearch shape: ["query", ["suggestion", ...]]
export function parseSuggestions(text) {
  try {
    const data = JSON.parse(text);
    if (Array.isArray(data) && Array.isArray(data[1])) {
      return data[1].filter(item => typeof item === 'string' && item.length > 1).slice(0, 10);
    }
  } catch (e) {
    // not json
  }
  return [];
}

function looksLikeChallenge(html) {
  if (!html) return false;
  return /id=["']captcha-form["']|g-recaptcha|unusual traffic from your computer|anomaly-modal|b_captcha/i.test(html.slice(0, 200000));
}

function isRiskyLink(href) {
  try {
    const parsed = new URL(href);
    if (parsed.protocol !== 'https:') return true;
    return /logout|log-out|signout|sign-out|unsubscribe|delete|remove|confirm|verify|token=|download/i.test(parsed.pathname + parsed.search);
  } catch (e) {
    return true;
  }
}

function decodeEntities(value) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&#x2F;/gi, '/')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"');
}

function gaussian() {
  const u1 = Math.random() || Number.MIN_VALUE;
  const u2 = Math.random();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}
