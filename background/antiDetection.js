// makes generated queries indistinguishable
// from real human searches handles request headers, rate limiting,
// backoff on failures, and optional autosuggest simulation

import { QueryLanguages } from './queryLanguages.js';

const browser = globalThis.browser || globalThis.chrome;

export class AntiDetection {
  constructor() {
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.backoffMultiplier = 1;
    this.queryLanguages = new QueryLanguages();
  }

  // pick a realistic referrer for the search request
  // distribution matches how real users actually arrive at search engines
  // most type the url or use a bookmark, some come from a previous search,
  // a few come from news/social links
  getReferrer(searchEngine) {
    const rand = Math.random();

    if (rand < 0.60) {
      return this.getSearchEngineHomepage(searchEngine);
    } else if (rand < 0.85) {
      return `${this.getSearchEngineHomepage(searchEngine)}/search?q=previous+query`;
    } else if (rand < 0.95) {
      const newsSites = [
        'https://news.google.com/',
        'https://www.bbc.com/news',
        'https://www.cnn.com/',
        'https://www.nytimes.com/',
        'https://www.theguardian.com/'
      ];
      return this.randomElement(newsSites);
    } else {
      const socialSites = [
        'https://twitter.com/',
        'https://www.reddit.com/',
        'https://www.facebook.com/',
        'https://www.linkedin.com/'
      ];
      return this.randomElement(socialSites);
    }
  }

  getSearchEngineHomepage(searchEngine) {
    const homepages = {
      'google': 'https://www.google.com',
      'bing': 'https://www.bing.com',
      'duckduckgo': 'https://duckduckgo.com'
    };
    return homepages[searchEngine] || 'https://www.google.com';
  }

  buildSearchURL(searchEngine, query, langCode = 'en') {
    const encodedQuery = encodeURIComponent(query);
    const urls = {
      'google': `https://www.google.com/search?q=${encodedQuery}`,
      'bing': `https://www.bing.com/search?q=${encodedQuery}`,
      'duckduckgo': `https://duckduckgo.com/?q=${encodedQuery}`
    };
    let url = urls[searchEngine] || urls['google'];

    // add language params for non-english queries
    if (langCode && langCode !== 'en') {
      const lang = this.queryLanguages.getLanguage(langCode);
      if (lang?.searchParams) {
        const params = new URLSearchParams(lang.searchParams);
        url += '&' + params.toString();
      }
    }

    return url;
  }

  // get the autocomplete/suggest endpoint url for each search engine
  // these are the same endpoints the browser hits when you type
  // in the search box using them makes our queries look typed
  getSuggestURL(searchEngine, partialQuery) {
    const encoded = encodeURIComponent(partialQuery);
    const urls = {
      'google': `https://www.google.com/complete/search?q=${encoded}&client=gws-wiz`,
      'bing': `https://www.bing.com/AS/Suggestions?qry=${encoded}&cvid=${this.randomCvid()}`,
      'duckduckgo': `https://duckduckgo.com/ac/?q=${encoded}&type=list`
    };
    return urls[searchEngine] || urls['google'];
  }

  // random bing cvid parameter bing uses this as a conversation id
  // for suggest requests just needs to look like a hex string
  randomCvid() {
    const chars = '0123456789ABCDEF';
    let result = '';
    for (let i = 0; i < 32; i++) {
      result += chars[Math.floor(Math.random() * chars.length)];
    }
    return result;
  }

  // minimal headers that match normal browser behavior.
  // we intentionally don't set sec-fetch-* because those are
  // handled by the browser automatically and setting them manually
  // can actually look suspicious
  getHeaders(referrer, langCode = 'en') {
    // pick accept-language based on query language
    let acceptLang = 'en-US,en;q=0.5';
    if (langCode && langCode !== 'en') {
      const lang = this.queryLanguages.getLanguage(langCode);
      if (lang?.acceptLanguage) {
        acceptLang = lang.acceptLanguage;
      }
    }

    const headers = {
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Accept-Language': acceptLang,
      'DNT': '1',
      'Upgrade-Insecure-Requests': '1',
      'Cache-Control': 'max-age=0'
    };

    if (referrer) {
      headers['Referer'] = referrer;
    }

    return headers;
  }

  getSecFetchSite(referrer) {
    if (!referrer) return 'none';
    try {
      const referrerDomain = new URL(referrer).hostname;
      if (referrerDomain.includes('google.com') ||
          referrerDomain.includes('bing.com') ||
          referrerDomain.includes('duckduckgo.com')) {
        return 'same-origin';
      }
      return 'cross-site';
    } catch (e) {
      return 'none';
    }
  }

  // simulate the autosuggest/autocomplete requests that happen when
  // a real user types a query character by character in the search box
  // without this queries appear "out of nowhere" with no prior suggest
  // traffic which is a detectable signal
  // fires 3-6 prefix requests with realistic inter-keystroke timing
  // then returns the actual search query fires after this
  async simulateAutosuggest(searchEngine, query) {
    const words = query.split(' ');
    if (words.length === 0) return;

    // pick 3-6 incremental prefixes of the query to simulate typing.
    // we don't send every single character, real autocomplete
    // doesn't fire on every keystroke either, it debounces
    const prefixes = this.generateTypingPrefixes(query);

    for (const prefix of prefixes) {
      const suggestUrl = this.getSuggestURL(searchEngine, prefix);

      try {
        await fetch(suggestUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json, text/javascript, */*; q=0.01',
            'Accept-Language': 'en-US,en;q=0.5'
          },
          credentials: 'include',
          cache: 'no-store'
        });
      } catch (e) {
        // suggest request failed just skip it
        // the real search will still fire
      }

      // inter-keystroke delay 80-250ms with occasional longer pauses
      // simulates thinking or reading suggestions
      const baseDelay = 80 + Math.random() * 170;
      const thinkPause = Math.random() < 0.3 ? (300 + Math.random() * 700) : 0;
      await this.delay(baseDelay + thinkPause);
    }
  }

  // generate realistic typing prefixes for autosuggest simulation.
  // humans don't type one char at a time they type in bursts,
  // and autocomplete fires after debounce periods.
  // we simulate 3-6 checkpoints through the query string
  generateTypingPrefixes(query) {
    const prefixes = [];
    const len = query.length;
    if (len < 3) return [query];

    // number of suggest requests: 3-6, proportional to query length
    const numPrefixes = Math.min(6, Math.max(3, Math.floor(len / 4)));

    for (let i = 1; i <= numPrefixes; i++) {
      // distribute checkpoints through the string with some randomness
      const targetPos = Math.floor((len * i) / (numPrefixes + 1));
      // add ±1 char of jitter so it's not perfectly evenly spaced
      const jitter = Math.floor(Math.random() * 3) - 1;
      const pos = Math.max(2, Math.min(len, targetPos + jitter));
      prefixes.push(query.substring(0, pos));
    }

    return prefixes;
  }

  // execute the actual search query with anti-detection measures
  async executeQuery(searchEngine, query, options = {}) {
    const langCode = options.language || 'en';
    const referrer = this.getReferrer(searchEngine);
    const url = this.buildSearchURL(searchEngine, query, langCode);
    const headers = this.getHeaders(referrer, langCode);

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: headers,
        credentials: 'include',
        cache: 'default',
        redirect: 'follow'
      });

      if (response.status === 429) {
        this.handleRateLimit();
        throw new Error('Rate limited');
      }

      if (!response.ok) {
        this.handleFailure();
        throw new Error(`HTTP ${response.status}`);
      }

      this.resetFailureTracking();

      // only read the body when a click is planned, otherwise let it drop
      let body = '';
      if (options.readBody) {
        try {
          body = await response.text();
        } catch (e) {
          body = '';
        }
      }

      return {
        success: true,
        status: response.status,
        url: url,
        body
      };

    } catch (error) {
      this.handleFailure();
      return {
        success: false,
        error: error.message
      };
    }
  }

  // simulate clicking a search result: wait while the page gets scanned,
  // then fetch the result page itself. no-cors means we need no extra host
  // permissions and never read the response, nothing on that page runs
  // (no scripts, images, or trackers), it's a single document request
  async simulateResultClick(resultURL, options = {}) {
    try {
      await this.delay(this.getClickDelay());

      const response = await fetch(resultURL, {
        method: 'GET',
        mode: 'no-cors',
        headers: {
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': this.getHeaders(null, options.language)['Accept-Language']
        },
        credentials: 'include',
        cache: 'default',
        redirect: 'follow'
      });

      // opaque responses report status 0, getting one back means it went out
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
      const url = this.unwrapResultLink(this.decodeEntities(match[1]));
      if (!url || seen.has(url) || !this.isOrganicResult(url)) continue;
      seen.add(url);
      links.push(url);
    }

    return links;
  }

  decodeEntities(value) {
    return value
      .replace(/&amp;/g, '&')
      .replace(/&#x2F;/gi, '/')
      .replace(/&#39;/g, "'")
      .replace(/&quot;/g, '"');
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

  // exponential backoff on rate limiting doubles each time, caps at 8x
  handleRateLimit() {
    console.log('[QueryVeil] rate limit detected, backing off');
    this.backoffMultiplier = Math.min(this.backoffMultiplier * 2, 8);
    this.failureCount++;
    this.lastFailureTime = Date.now();
  }

  handleFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    if (this.failureCount > 5) {
      this.backoffMultiplier = Math.min(this.backoffMultiplier * 1.5, 4);
    }
  }

  // gradually reduce backoff after successful queries
  resetFailureTracking() {
    if (this.backoffMultiplier > 1) {
      this.backoffMultiplier = Math.max(this.backoffMultiplier * 0.9, 1);
    }
    // reset failure count if it's been over an hour since last failure
    if (this.lastFailureTime && (Date.now() - this.lastFailureTime > 3600000)) {
      this.failureCount = 0;
    }
  }

  getBackoffMultiplier() {
    return this.backoffMultiplier;
  }

  // pause if too many failures in the last hour
  shouldPause() {
    if (this.failureCount > 10 &&
        this.lastFailureTime &&
        (Date.now() - this.lastFailureTime < 3600000)) {
      return true;
    }
    return false;
  }

  async getUserIdleState() {
    try {
      const idleTime = await browser.idle.queryState(15);
      return idleTime;
    } catch (error) {
      return 'active';
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  randomElement(array) {
    return array[Math.floor(Math.random() * array.length)];
  }

  getStats() {
    return {
      failureCount: this.failureCount,
      backoffMultiplier: this.backoffMultiplier,
      lastFailureTime: this.lastFailureTime
    };
  }
}
