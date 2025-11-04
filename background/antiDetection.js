/**
 * Anti-Detection Layer
 * Ensures queries are indistinguishable from real human searches
 */

export class AntiDetection {
  constructor() {
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.backoffMultiplier = 1;
  }

  /**
   * Get realistic referrer header
   * @param {string} searchEngine
   * @returns {string}
   */
  getReferrer(searchEngine) {
    const rand = Math.random();
    
    if (rand < 0.60) {
      // Direct navigation (typed URL or bookmark)
      return this.getSearchEngineHomepage(searchEngine);
    } else if (rand < 0.85) {
      // From same search engine (previous search)
      return `${this.getSearchEngineHomepage(searchEngine)}/search?q=previous+query`;
    } else if (rand < 0.95) {
      // From news sites
      const newsSites = [
        'https://news.google.com/',
        'https://www.bbc.com/news',
        'https://www.cnn.com/',
        'https://www.nytimes.com/',
        'https://www.theguardian.com/'
      ];
      return this.randomElement(newsSites);
    } else {
      // From social media
      const socialSites = [
        'https://twitter.com/',
        'https://www.reddit.com/',
        'https://www.facebook.com/',
        'https://www.linkedin.com/'
      ];
      return this.randomElement(socialSites);
    }
  }

  /**
   * Get search engine homepage
   * @param {string} searchEngine
   * @returns {string}
   */
  getSearchEngineHomepage(searchEngine) {
    const homepages = {
      'google': 'https://www.google.com',
      'bing': 'https://www.bing.com',
      'duckduckgo': 'https://duckduckgo.com'
    };
    return homepages[searchEngine] || 'https://www.google.com';
  }

  /**
   * Build search URL with proper encoding
   * @param {string} searchEngine
   * @param {string} query
   * @returns {string}
   */
  buildSearchURL(searchEngine, query) {
    const encodedQuery = encodeURIComponent(query);
    
    const urls = {
      'google': `https://www.google.com/search?q=${encodedQuery}`,
      'bing': `https://www.bing.com/search?q=${encodedQuery}`,
      'duckduckgo': `https://duckduckgo.com/?q=${encodedQuery}`
    };
    
    return urls[searchEngine] || urls['google'];
  }

  /**
   * Get realistic request headers that match normal browser behavior
   * @param {string} referrer
   * @returns {Object}
   */
  getHeaders(referrer) {
    // Use minimal headers - let browser handle most automatically
    // This ensures consistency with real browsing
    const headers = {
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Accept-Encoding': 'gzip, deflate, br',
      'DNT': '1',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': this.getSecFetchSite(referrer),
      'Sec-Fetch-User': '?1',
      'Cache-Control': 'max-age=0'
    };

    if (referrer) {
      headers['Referer'] = referrer;
    }

    return headers;
  }

  /**
   * Determine Sec-Fetch-Site based on referrer
   * @param {string} referrer
   * @returns {string}
   */
  getSecFetchSite(referrer) {
    if (!referrer) return 'none';
    
    try {
      const referrerDomain = new URL(referrer).hostname;
      // If referrer is same as search engine, it's same-origin
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

  /**
   * Execute search query with anti-detection measures
   * @param {string} searchEngine
   * @param {string} query
   * @param {Object} options
   * @returns {Promise<Object>}
   */
  async executeQuery(searchEngine, query, options = {}) {
    const referrer = this.getReferrer(searchEngine);
    const url = this.buildSearchURL(searchEngine, query);
    const headers = this.getHeaders(referrer);

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: headers,
        credentials: 'include', // Include cookies like normal browsing
        cache: 'default',
        redirect: 'follow'
      });

      // Handle rate limiting
      if (response.status === 429) {
        this.handleRateLimit();
        throw new Error('Rate limited');
      }

      // Handle other errors
      if (!response.ok) {
        this.handleFailure();
        throw new Error(`HTTP ${response.status}`);
      }

      // Success - reset failure tracking
      this.resetFailureTracking();

      return {
        success: true,
        status: response.status,
        url: url
      };

    } catch (error) {
      this.handleFailure();
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Simulate clicking on a search result
   * @param {string} resultURL
   * @param {string} searchURL
   * @param {number} dwellTime
   * @returns {Promise<Object>}
   */
  async simulateResultClick(resultURL, searchURL, dwellTime) {
    try {
      // Wait for "think time" before clicking
      await this.delay(this.getClickDelay());

      // Fetch the result page with search engine as referrer
      const response = await fetch(resultURL, {
        method: 'GET',
        headers: {
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Referer': searchURL,
          'DNT': '1',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'cross-site',
          'Sec-Fetch-User': '?1'
        },
        credentials: 'include',
        redirect: 'follow'
      });

      // Simulate dwelling on the page
      await this.delay(dwellTime);

      return {
        success: response.ok,
        dwellTime: dwellTime
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get realistic delay before clicking a result (milliseconds)
   * @returns {number}
   */
  getClickDelay() {
    // Users take 2-8 seconds to scan results and click
    return 2000 + Math.random() * 6000;
  }

  /**
   * Select which result to "click" based on realistic patterns
   * @returns {number} Position (1-10)
   */
  getResultPosition() {
    // Users heavily favor top results (exponential distribution)
    const rand = Math.random();
    
    if (rand < 0.50) return 1;  // 50% click first result
    if (rand < 0.70) return 2;  // 20% click second
    if (rand < 0.82) return 3;  // 12% click third
    if (rand < 0.90) return 4;  // 8% click fourth
    if (rand < 0.95) return 5;  // 5% click fifth
    
    // Remaining 5% distributed across positions 6-10
    return Math.floor(Math.random() * 5) + 6;
  }

  /**
   * Handle rate limiting with exponential backoff
   */
  handleRateLimit() {
    console.log('[QueryVeil] Rate limit detected, applying backoff');
    this.backoffMultiplier = Math.min(this.backoffMultiplier * 2, 8);
    this.failureCount++;
    this.lastFailureTime = Date.now();
  }

  /**
   * Handle general query failure
   */
  handleFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    // If too many failures, increase backoff
    if (this.failureCount > 5) {
      this.backoffMultiplier = Math.min(this.backoffMultiplier * 1.5, 4);
    }
  }

  /**
   * Reset failure tracking after success
   */
  resetFailureTracking() {
    // Gradually reduce backoff
    if (this.backoffMultiplier > 1) {
      this.backoffMultiplier = Math.max(this.backoffMultiplier * 0.9, 1);
    }
    
    // Reset failure count if it's been a while
    if (this.lastFailureTime && (Date.now() - this.lastFailureTime > 3600000)) {
      this.failureCount = 0;
    }
  }

  /**
   * Get current backoff multiplier for delay adjustments
   * @returns {number}
   */
  getBackoffMultiplier() {
    return this.backoffMultiplier;
  }

  /**
   * Check if we should pause due to too many failures
   * @returns {boolean}
   */
  shouldPause() {
    // Pause if more than 10 failures in last hour
    if (this.failureCount > 10 && 
        this.lastFailureTime && 
        (Date.now() - this.lastFailureTime < 3600000)) {
      return true;
    }
    return false;
  }

  /**
   * Check user's idle state to determine if we should query
   * @returns {Promise<string>} 'active', 'idle', or 'locked'
   */
  async getUserIdleState() {
    try {
      // Query idle state (15 seconds threshold for "idle")
      const idleTime = await browser.idle.queryState(15);
      return idleTime; // Returns 'active', 'idle', or 'locked'
    } catch (error) {
      // If idle API not available, assume active
      return 'active';
    }
  }

  /**
   * Delay helper
   * @param {number} ms
   * @returns {Promise}
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Helper: Get random element from array
   * @param {Array} array
   * @returns {*}
   */
  randomElement(array) {
    return array[Math.floor(Math.random() * array.length)];
  }

  /**
   * Generate realistic result URLs for simulation
   * @param {string} query
   * @param {number} position
   * @returns {string}
   */
  generateMockResultURL(query, position) {
    // Generate plausible result URLs based on query topic
    const domains = [
      'wikipedia.org',
      'reddit.com',
      'youtube.com',
      'amazon.com',
      'stackoverflow.com',
      'medium.com',
      'github.com',
      'nytimes.com',
      'bbc.com',
      'cnn.com'
    ];
    
    const domain = this.randomElement(domains);
    const slug = query.toLowerCase().replace(/\s+/g, '-').substring(0, 50);
    
    return `https://www.${domain}/${slug}`;
  }

  /**
   * Get statistics for monitoring
   * @returns {Object}
   */
  getStats() {
    return {
      failureCount: this.failureCount,
      backoffMultiplier: this.backoffMultiplier,
      lastFailureTime: this.lastFailureTime
    };
  }
}
