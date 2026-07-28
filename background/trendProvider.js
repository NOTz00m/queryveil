// trend provider fetches real-time trending topics from google trends
// and injects them into query generation so noise queries reflect
// what real humans are actually searching for right now.
// everything is cached locally, fetch happens every few hours at most.

const browser = globalThis.browser || globalThis.chrome;

export class TrendProvider {
  constructor() {
    this.CACHE_KEY = 'trendCache';
    // refresh every 3 hours so frequent enough to stay current,
    // infrequent enough to not look like automated polling
    this.CACHE_TTL = 3 * 60 * 60 * 1000;
    this.TRENDS_URL = 'https://trends.google.com/trending/rss?geo=US';
    this.cachedTopics = [];
    this.lastFetch = 0;
  }

  // initialize from storage cache so we don't fetch on every service worker restart
  async init() {
    try {
      const data = await browser.storage.local.get(this.CACHE_KEY);
      if (data[this.CACHE_KEY]) {
        const cache = data[this.CACHE_KEY];
        this.cachedTopics = cache.topics || [];
        this.lastFetch = cache.timestamp || 0;
      }
    } catch (e) {
      // storage read failed, not a big deal, we'll just fetch fresh
    }
  }

  // get trending topics, fetching fresh if cache is stale.
  // returns an array of strings like ["world cup", "new phone", "heat wave"]
  async getTrendingTopics() {
    const now = Date.now();

    // serve from cache if still fresh
    if (this.cachedTopics.length > 0 && (now - this.lastFetch) < this.CACHE_TTL) {
      return this.cachedTopics;
    }

    // try to fetch fresh trends
    try {
      const fresh = await this.fetchTrends();
      if (fresh.length > 0) {
        this.cachedTopics = fresh;
        this.lastFetch = now;
        await this.saveCache();
      }
    } catch (e) {
      // fetch failed so just use whatever we have cached lul
      // if cache is empty too, the query generator falls back to
      // its static word lists (no degradation)
    }

    return this.cachedTopics;
  }

  // hit the google trends rss feed and pull out the trending topic titles
  async fetchTrends() {
    const response = await fetch(this.TRENDS_URL, {
      method: 'GET',
      headers: {
        'Accept': 'application/xml, text/xml, application/rss+xml',
        'Accept-Language': 'en-US,en;q=0.5'
      },
      credentials: 'omit', // no cookies needed for public rss
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error(`trends fetch failed: ${response.status}`);
    }

    const text = await response.text();
    return this.parseRSS(text);
  }

  // pull <title> elements out of the rss xml.
  // we're intentionally using regex instead of a dom parser here because
  // service workers don't always have one available, and the
  // rss format is simple enough that regex is reliable for this
  parseRSS(xml) {
    const topics = [];
    // match <title> tags inside <item> blocks
    // the rss structure is: <item><title>topic</title>...</item>
    const itemRegex = /<item>[\s\S]*?<\/item>/gi;
    const titleRegex = /<title><!\[CDATA\[(.*?)\]\]>|<title>(.*?)<\/title>/i;

    const items = xml.match(itemRegex) || [];

    for (const item of items) {
      const titleMatch = item.match(titleRegex);
      if (titleMatch) {
        const title = (titleMatch[1] || titleMatch[2] || '').trim();
        if (title && title.length > 1 && title.length < 100) {
          topics.push(title);
        }
      }
    }

    // cap at 20 trends as more than enough variety
    return topics.slice(0, 20);
  }

  // persist cache to storage so it survives service worker restarts
  async saveCache() {
    try {
      await browser.storage.local.set({
        [this.CACHE_KEY]: {
          topics: this.cachedTopics,
          timestamp: this.lastFetch
        }
      });
    } catch (e) {
      // write failed, not critical we'll just refetch next time
    }
  }

  // check if we have any trends available (cached or fresh)
  hasTrends() {
    return this.cachedTopics.length > 0;
  }

  // pick a random trending topic. returns null if no trends available
  getRandomTrend() {
    if (this.cachedTopics.length === 0) return null;
    return this.cachedTopics[Math.floor(Math.random() * this.cachedTopics.length)];
  }
}
