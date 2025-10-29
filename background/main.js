/**
 * QueryVeil Background Script (Combined Version)
 * Main orchestrator for privacy-preserving query noise generation
 * 
 * This file combines all modules into one for Firefox compatibility
 */

// ============================================================================
// BEHAVIOR SIMULATOR
// ============================================================================

class BehaviorSimulator {
  constructor() {
    this.currentSession = null;
    this.lastQueryTime = null;
    this.queriesThisHour = 0;
    this.hourResetTime = Date.now() + 3600000;
  }

  getNextQueryDelay(settings) {
    const now = Date.now();
    
    if (now > this.hourResetTime) {
      this.queriesThisHour = 0;
      this.hourResetTime = now + 3600000;
    }

    if (!this.currentSession || this.currentSession.queriesRemaining <= 0) {
      return this.startNewSession(settings);
    }

    return this.getWithinSessionDelay(settings);
  }

  startNewSession(settings) {
    const sessionGap = this.gammaRandom(2, 1800000);
    const sessionLength = Math.floor(this.normalRandom(4, 2));
    const queriesInSession = Math.max(2, Math.min(8, sessionLength));
    
    this.currentSession = {
      queriesRemaining: queriesInSession,
      topic: null,
      startTime: Date.now() + sessionGap
    };

    return sessionGap;
  }

  getWithinSessionDelay(settings) {
    const baseDelay = this.exponentialRandom(180000);
    const jitter = this.normalRandom(0, 30000);
    const timeWeight = this.getTimeOfDayWeight();
    const intensityMultiplier = this.getIntensityMultiplier(settings.intensity);
    
    const totalDelay = Math.max(
      60000,
      (baseDelay + jitter) * timeWeight / intensityMultiplier
    );

    this.currentSession.queriesRemaining--;
    return totalDelay;
  }

  getTimeOfDayWeight() {
    const hour = new Date().getHours();
    if (hour >= 0 && hour < 6) return 4.0;
    if (hour >= 6 && hour < 9) return 1.5;
    if (hour >= 9 && hour < 23) return 1.0;
    return 2.0;
  }

  getIntensityMultiplier(intensity) {
    const multipliers = {
      'low': 0.5,
      'medium': 1.0,
      'high': 1.8
    };
    return multipliers[intensity] || 1.0;
  }

  canExecuteQuery(intensity) {
    const maxQueries = {
      'low': 6,
      'medium': 12,
      'high': 20
    };
    return this.queriesThisHour < (maxQueries[intensity] || 12);
  }

  recordQuery() {
    this.queriesThisHour++;
    this.lastQueryTime = Date.now();
  }

  shouldMixWithActivity(userState) {
    if (userState === 'locked') return false;
    const threshold = userState === 'active' ? 0.7 : 0.3;
    return Math.random() < threshold;
  }

  exponentialRandom(mean) {
    return -Math.log(1 - Math.random()) * mean;
  }

  normalRandom(mean, stdDev) {
    const u1 = Math.random();
    const u2 = Math.random();
    const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    return z0 * stdDev + mean;
  }

  gammaRandom(shape, scale) {
    if (shape === 2) {
      return -scale * (Math.log(Math.random()) + Math.log(Math.random()));
    }
    let sum = 0;
    for (let i = 0; i < shape; i++) {
      sum += this.exponentialRandom(1);
    }
    return sum * scale;
  }

  getQueryComplexity() {
    const rand = Math.random();
    if (rand < 0.30) return 'short';
    if (rand < 0.80) return 'medium';
    if (rand < 0.95) return 'long';
    return 'very_long';
  }

  shouldAddTypo() {
    return Math.random() < 0.015;
  }

  shouldClickResult() {
    return Math.random() < 0.40;
  }

  getResultDwellTime() {
    const rand = Math.random();
    if (rand < 0.70) {
      return this.normalRandom(10000, 3000);
    } else if (rand < 0.95) {
      return this.normalRandom(37500, 15000);
    } else {
      return this.normalRandom(120000, 40000);
    }
  }

  shouldRefineSearch() {
    return Math.random() < 0.10;
  }

  getSessionInfo() {
    return this.currentSession;
  }
}

// ============================================================================
// QUERY GENERATOR
// ============================================================================

class QueryGenerator {
  constructor() {
    this.topics = this.initializeTopics();
    this.markovChains = this.buildMarkovChains();
    this.currentSessionTopic = null;
  }

  initializeTopics() {
    return {
      news: {
        enabled: true,
        keywords: ['news', 'today', 'latest', 'breaking', 'update', 'report'],
        entities: ['politics', 'economy', 'technology', 'world', 'local', 'business'],
        templates: ['{entity} {keyword}', 'latest {entity} {keyword}', '{entity} news today']
      },
      shopping: {
        enabled: true,
        keywords: ['best', 'buy', 'cheap', 'review', 'price', 'deal'],
        entities: ['laptop', 'phone', 'headphones', 'camera', 'watch', 'shoes'],
        templates: ['best {entity}', '{entity} {keyword}', '{entity} reviews']
      },
      entertainment: {
        enabled: true,
        keywords: ['watch', 'stream', 'review', 'rating', 'trailer'],
        entities: ['movie', 'show', 'series', 'documentary', 'game', 'music'],
        templates: ['best {entity} to {keyword}', 'new {entity} releases', 'top rated {entity}']
      },
      technology: {
        enabled: true,
        keywords: ['how to', 'tutorial', 'guide', 'tips', 'fix', 'install'],
        entities: ['windows', 'mac', 'linux', 'android', 'software', 'app'],
        templates: ['{keyword} {entity}', '{entity} tutorial', 'learn {entity}']
      },
      health: {
        enabled: true,
        keywords: ['symptoms', 'treatment', 'causes', 'prevention', 'remedy'],
        entities: ['headache', 'back pain', 'sleep', 'stress', 'nutrition', 'fitness'],
        templates: ['{entity} {keyword}', 'how to treat {entity}', '{entity} remedies']
      },
      travel: {
        enabled: true,
        keywords: ['visit', 'vacation', 'hotel', 'flight', 'things to do'],
        entities: ['paris', 'tokyo', 'new york', 'london', 'beach', 'mountain'],
        templates: ['best {keyword} in {entity}', '{entity} travel {keyword}', '{keyword} to {entity}']
      },
      food: {
        enabled: true,
        keywords: ['recipe', 'how to make', 'restaurant', 'best', 'near me'],
        entities: ['pizza', 'pasta', 'sushi', 'burger', 'salad', 'dessert'],
        templates: ['{keyword} {entity}', 'best {entity} near me', '{entity} recipe']
      },
      education: {
        enabled: true,
        keywords: ['learn', 'course', 'tutorial', 'how to', 'guide'],
        entities: ['python', 'math', 'history', 'science', 'language', 'photography'],
        templates: ['{keyword} {entity}', 'online {entity} course', '{entity} for beginners']
      },
      local: {
        enabled: true,
        keywords: ['near me', 'nearby', 'best', 'open now', 'directions'],
        entities: ['restaurant', 'coffee shop', 'gym', 'library', 'park', 'hospital'],
        templates: ['{entity} {keyword}', 'best {entity} near me', '{entity} nearby']
      },
      general: {
        enabled: true,
        keywords: ['what is', 'how to', 'why', 'when', 'where'],
        entities: ['weather', 'time', 'calendar', 'calculator', 'translate'],
        templates: ['{keyword} {entity}', '{entity} today', 'current {entity}']
      }
    };
  }

  buildMarkovChains() {
    return {
      starts: ['how to', 'what is', 'best', 'why', 'where', 'when'],
      transitions: {
        'how to': ['fix', 'make', 'create', 'learn', 'get'],
        'what is': ['the best', 'a good', 'the meaning of'],
        'best': ['way to', 'time to', 'place for']
      }
    };
  }

  generateQuery(complexity, settings, sessionInfo) {
    let topic;
    if (sessionInfo && sessionInfo.topic) {
      topic = sessionInfo.topic;
    } else {
      topic = this.selectRandomTopic(settings);
      if (sessionInfo) {
        sessionInfo.topic = topic;
      }
    }

    const topicData = this.topics[topic];

    switch (complexity) {
      case 'short':
        return this.generateShortQuery(topicData);
      case 'medium':
        return this.generateMediumQuery(topicData);
      case 'long':
        return this.generateLongQuery(topicData);
      case 'very_long':
        return this.generateVeryLongQuery(topicData);
      default:
        return this.generateMediumQuery(topicData);
    }
  }

  selectRandomTopic(settings) {
    const enabledTopics = Object.keys(this.topics).filter(
      topic => settings.topics?.[topic] !== false
    );
    return enabledTopics[Math.floor(Math.random() * enabledTopics.length)];
  }

  generateShortQuery(topicData) {
    const useEntity = Math.random() < 0.7;
    if (useEntity) {
      return this.randomElement(topicData.entities);
    } else {
      const keyword = this.randomElement(topicData.keywords);
      const entity = this.randomElement(topicData.entities);
      return `${keyword} ${entity}`;
    }
  }

  generateMediumQuery(topicData) {
    const template = this.randomElement(topicData.templates);
    const keyword = this.randomElement(topicData.keywords);
    const entity = this.randomElement(topicData.entities);
    
    let query = template
      .replace('{keyword}', keyword)
      .replace('{entity}', entity);
    
    if (Math.random() < 0.2) {
      query += ' 2024';
    }
    
    return query;
  }

  generateLongQuery(topicData) {
    const keyword = this.randomElement(topicData.keywords);
    const entity = this.randomElement(topicData.entities);
    const entity2 = this.randomElement(topicData.entities);
    
    const patterns = [
      `how to ${keyword} ${entity} ${entity2}`,
      `best ${keyword} ${entity} for ${entity2}`,
      `${keyword} ${entity} vs ${entity2} comparison`
    ];
    
    return this.randomElement(patterns);
  }

  generateVeryLongQuery(topicData) {
    const entity = this.randomElement(topicData.entities);
    const keyword = this.randomElement(topicData.keywords);
    
    const patterns = [
      `what is the best way to ${keyword} ${entity} for beginners`,
      `how do i ${keyword} ${entity} without spending too much money`,
      `what are the benefits of ${keyword} ${entity} every day`
    ];
    
    return this.randomElement(patterns);
  }

  addTypo(query) {
    const words = query.split(' ');
    if (words.length < 3) return query;
    
    const wordIndex = Math.floor(Math.random() * (words.length - 1)) + 1;
    const word = words[wordIndex];
    if (word.length < 4) return query;
    
    const typoType = Math.random();
    if (typoType < 0.4) {
      words[wordIndex] = this.adjacentKeyTypo(word);
    } else if (typoType < 0.7) {
      const pos = Math.floor(Math.random() * word.length);
      words[wordIndex] = word.slice(0, pos) + word[pos] + word.slice(pos);
    }
    
    return words.join(' ');
  }

  adjacentKeyTypo(word) {
    const keyboard = {
      'a': ['s', 'w'], 'e': ['w', 'r'], 'i': ['u', 'o'],
      'o': ['i', 'p'], 't': ['r', 'y'], 'n': ['b', 'm']
    };
    
    const pos = Math.floor(Math.random() * word.length);
    const char = word[pos].toLowerCase();
    
    if (keyboard[char]) {
      const replacement = this.randomElement(keyboard[char]);
      return word.slice(0, pos) + replacement + word.slice(pos + 1);
    }
    
    return word;
  }

  refineQuery(originalQuery) {
    const refinements = [
      `${originalQuery} reddit`,
      `${originalQuery} 2024`,
      `best ${originalQuery}`,
      `${originalQuery} reviews`
    ];
    return this.randomElement(refinements);
  }

  updateTopicSettings(topicSettings) {
    Object.keys(topicSettings).forEach(topic => {
      if (this.topics[topic]) {
        this.topics[topic].enabled = topicSettings[topic];
      }
    });
  }

  randomElement(array) {
    return array[Math.floor(Math.random() * array.length)];
  }
}

// ============================================================================
// ANTI-DETECTION
// ============================================================================

class AntiDetection {
  constructor() {
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.backoffMultiplier = 1;
  }

  getReferrer(searchEngine) {
    const rand = Math.random();
    if (rand < 0.60) {
      return this.getSearchEngineHomepage(searchEngine);
    } else if (rand < 0.85) {
      return `${this.getSearchEngineHomepage(searchEngine)}/search?q=previous+query`;
    } else {
      const sites = ['https://news.google.com/', 'https://www.reddit.com/'];
      return this.randomElement(sites);
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

  buildSearchURL(searchEngine, query) {
    const encodedQuery = encodeURIComponent(query);
    const urls = {
      'google': `https://www.google.com/search?q=${encodedQuery}`,
      'bing': `https://www.bing.com/search?q=${encodedQuery}`,
      'duckduckgo': `https://duckduckgo.com/?q=${encodedQuery}`
    };
    return urls[searchEngine] || urls['google'];
  }

  getHeaders(referrer) {
    const headers = {
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'DNT': '1',
      'Upgrade-Insecure-Requests': '1'
    };

    if (referrer) {
      headers['Referer'] = referrer;
    }

    return headers;
  }

  async executeQuery(searchEngine, query) {
    const referrer = this.getReferrer(searchEngine);
    const url = this.buildSearchURL(searchEngine, query);
    const headers = this.getHeaders(referrer);

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
      return { success: true, status: response.status, url: url };

    } catch (error) {
      this.handleFailure();
      return { success: false, error: error.message };
    }
  }

  async simulateResultClick(resultURL, searchURL, dwellTime) {
    try {
      await this.delay(2000 + Math.random() * 6000);
      
      const response = await fetch(resultURL, {
        method: 'GET',
        headers: {
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Referer': searchURL,
          'DNT': '1'
        },
        credentials: 'include',
        redirect: 'follow'
      });

      await this.delay(dwellTime);
      return { success: response.ok, dwellTime: dwellTime };

    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  getResultPosition() {
    const rand = Math.random();
    if (rand < 0.50) return 1;
    if (rand < 0.70) return 2;
    if (rand < 0.82) return 3;
    if (rand < 0.90) return 4;
    if (rand < 0.95) return 5;
    return Math.floor(Math.random() * 5) + 6;
  }

  handleRateLimit() {
    console.log('[QueryVeil] Rate limit detected');
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

  resetFailureTracking() {
    if (this.backoffMultiplier > 1) {
      this.backoffMultiplier = Math.max(this.backoffMultiplier * 0.9, 1);
    }
    if (this.lastFailureTime && (Date.now() - this.lastFailureTime > 3600000)) {
      this.failureCount = 0;
    }
  }

  getBackoffMultiplier() {
    return this.backoffMultiplier;
  }

  shouldPause() {
    return this.failureCount > 10 && 
           this.lastFailureTime && 
           (Date.now() - this.lastFailureTime < 3600000);
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

  generateMockResultURL(query, position) {
    const domains = ['wikipedia.org', 'reddit.com', 'youtube.com'];
    const domain = this.randomElement(domains);
    const slug = query.toLowerCase().replace(/\s+/g, '-').substring(0, 50);
    return `https://www.${domain}/${slug}`;
  }

  getStats() {
    return {
      failureCount: this.failureCount,
      backoffMultiplier: this.backoffMultiplier,
      lastFailureTime: this.lastFailureTime
    };
  }

  randomElement(array) {
    return array[Math.floor(Math.random() * array.length)];
  }
}

// ============================================================================
// MAIN QUERYVEIL CLASS
// ============================================================================

class QueryVeil {
  constructor() {
    this.behaviorSim = new BehaviorSimulator();
    this.queryGen = new QueryGenerator();
    this.antiDetect = new AntiDetection();
    
    this.settings = null;
    this.isActive = false;
    this.isPaused = false;
    this.statistics = {
      totalQueries: 0,
      queriesThisSession: 0,
      sessionStartTime: Date.now()
    };
    
    this.alarmName = 'queryVeilScheduler';
    this.init();
  }

  async init() {
    console.log('[QueryVeil] Initializing...');
    await this.loadSettings();
    this.setupListeners();
    if (this.settings.enabled) {
      this.start();
    }
    console.log('[QueryVeil] Initialized');
  }

  async loadSettings() {
    try {
      const stored = await browser.storage.local.get('settings');
      this.settings = stored.settings || this.getDefaultSettings();
      
      const stats = await browser.storage.local.get('statistics');
      if (stats.statistics) {
        this.statistics = { ...this.statistics, ...stats.statistics };
      }
    } catch (error) {
      console.error('[QueryVeil] Error loading settings:', error);
      this.settings = this.getDefaultSettings();
    }
  }

  getDefaultSettings() {
    return {
      enabled: false,
      intensity: 'medium',
      searchEngine: 'google',
      enableResultClicks: false,
      debugMode: false,
      schedule: { enabled: false, startHour: 9, endHour: 23 },
      topics: {
        news: true, shopping: true, entertainment: true, technology: true,
        health: true, travel: true, food: true, education: true,
        local: true, general: true
      }
    };
  }

  async saveSettings() {
    try {
      await browser.storage.local.set({ settings: this.settings });
    } catch (error) {
      console.error('[QueryVeil] Error saving settings:', error);
    }
  }

  async saveStatistics() {
    try {
      await browser.storage.local.set({ statistics: this.statistics });
    } catch (error) {
      console.error('[QueryVeil] Error saving statistics:', error);
    }
  }

  setupListeners() {
    browser.alarms.onAlarm.addListener((alarm) => {
      if (alarm.name === this.alarmName) {
        this.handleAlarm();
      }
    });

    browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
      return true;
    });

    browser.runtime.onStartup.addListener(() => {
      if (this.settings.enabled) {
        this.start();
      }
    });

    browser.runtime.onInstalled.addListener((details) => {
      if (details.reason === 'install') {
        this.handleFirstInstall();
      }
    });
  }

  async handleFirstInstall() {
    console.log('[QueryVeil] First install detected');
    browser.runtime.openOptionsPage();
    this.updateBadge();
  }

  async handleMessage(message, sender, sendResponse) {
    switch (message.type) {
      case 'getStatus':
        sendResponse({
          isActive: this.isActive,
          isPaused: this.isPaused,
          settings: this.settings,
          statistics: this.statistics,
          antiDetectStats: this.antiDetect.getStats()
        });
        break;

      case 'updateSettings':
        this.settings = { ...this.settings, ...message.settings };
        await this.saveSettings();
        if (message.settings.topics) {
          this.queryGen.updateTopicSettings(message.settings.topics);
        }
        if (this.isActive) {
          this.stop();
          this.start();
        }
        sendResponse({ success: true });
        break;

      case 'toggle':
        if (this.isActive) {
          this.stop();
        } else {
          this.start();
        }
        sendResponse({ isActive: this.isActive });
        break;

      case 'pause':
        this.isPaused = message.paused;
        this.updateBadge();
        sendResponse({ isPaused: this.isPaused });
        break;

      case 'generateNow':
        this.executeNoiseQuery();
        sendResponse({ success: true });
        break;

      default:
        sendResponse({ error: 'Unknown message type' });
    }
  }

  start() {
    if (this.isActive) return;
    
    if (this.settings.debugMode) {
      console.log('[QueryVeil] Starting noise generation');
    }
    this.isActive = true;
    this.isPaused = false;
    this.statistics.sessionStartTime = Date.now();
    this.statistics.queriesThisSession = 0;
    
    this.settings.enabled = true;
    this.saveSettings();
    this.scheduleNextQuery();
    this.updateBadge();
  }

  stop() {
    if (!this.isActive) return;
    
    if (this.settings.debugMode) {
      console.log('[QueryVeil] Stopping noise generation');
    }
    this.isActive = false;
    this.settings.enabled = false;
    this.saveSettings();
    browser.alarms.clear(this.alarmName);
    this.updateBadge();
  }

  async scheduleNextQuery() {
    if (!this.isActive) return;

    if (this.settings.schedule.enabled && !this.isWithinSchedule()) {
      const nextCheck = this.getNextScheduleCheck();
      browser.alarms.create(this.alarmName, { when: Date.now() + nextCheck });
      return;
    }

    let delay = this.behaviorSim.getNextQueryDelay(this.settings);
    delay *= this.antiDetect.getBackoffMultiplier();
    
    browser.alarms.create(this.alarmName, { when: Date.now() + delay });
    if (this.settings.debugMode) {
      console.log(`[QueryVeil] Next query scheduled in ${Math.round(delay / 1000)}s`);
    }
  }

  async handleAlarm() {
    if (!this.isActive || this.isPaused) {
      this.scheduleNextQuery();
      return;
    }

    if (this.antiDetect.shouldPause()) {
      if (this.settings.debugMode) {
        console.log('[QueryVeil] Too many failures, pausing temporarily');
      }
      this.isPaused = true;
      this.updateBadge();
      setTimeout(() => {
        this.isPaused = false;
        this.updateBadge();
      }, 3600000);
      return;
    }

    await this.executeNoiseQuery();
    this.scheduleNextQuery();
  }

  async executeNoiseQuery() {
    try {
      if (!this.behaviorSim.canExecuteQuery(this.settings.intensity)) {
        if (this.settings.debugMode) {
          console.log('[QueryVeil] Rate limit reached for this hour');
        }
        return;
      }

      const userState = await this.antiDetect.getUserIdleState();
      if (!this.behaviorSim.shouldMixWithActivity(userState)) {
        if (this.settings.debugMode) {
          console.log('[QueryVeil] Skipping query due to user state');
        }
        return;
      }

      const sessionInfo = this.behaviorSim.getSessionInfo();
      const complexity = this.behaviorSim.getQueryComplexity();
      let query = this.queryGen.generateQuery(complexity, this.settings, sessionInfo);
      
      if (this.behaviorSim.shouldAddTypo()) {
        query = this.queryGen.addTypo(query);
      }

      if (this.settings.debugMode) {
        console.log(`[QueryVeil] Executing query: "${query}"`);
      }

      const result = await this.antiDetect.executeQuery(this.settings.searchEngine, query);

      if (result.success) {
        this.behaviorSim.recordQuery();
        this.statistics.totalQueries++;
        this.statistics.queriesThisSession++;
        await this.saveStatistics();

        if (this.settings.enableResultClicks && this.behaviorSim.shouldClickResult()) {
          await this.simulateResultInteraction(query, result.url);
        }

        if (this.behaviorSim.shouldRefineSearch()) {
          const refinedQuery = this.queryGen.refineQuery(query);
          if (this.settings.debugMode) {
            console.log(`[QueryVeil] Refinement query: "${refinedQuery}"`);
          }
          await this.antiDetect.delay(2000 + Math.random() * 3000);
          await this.antiDetect.executeQuery(this.settings.searchEngine, refinedQuery);
        }
      } else {
        if (this.settings.debugMode) {
          console.error('[QueryVeil] Query failed:', result.error);
        }
      }
    } catch (error) {
      console.error('[QueryVeil] Error executing query:', error);
    }
  }

  async simulateResultInteraction(query, searchURL) {
    try {
      const position = this.antiDetect.getResultPosition();
      const dwellTime = this.behaviorSim.getResultDwellTime();
      const resultURL = this.antiDetect.generateMockResultURL(query, position);
      
      if (this.settings.debugMode) {
        console.log(`[QueryVeil] Simulating click on result #${position}, dwell time: ${Math.round(dwellTime/1000)}s`);
      }
      await this.antiDetect.simulateResultClick(resultURL, searchURL, dwellTime);
    } catch (error) {
      if (this.settings.debugMode) {
        console.error('[QueryVeil] Error simulating result click:', error);
      }
    }
  }

  isWithinSchedule() {
    if (!this.settings.schedule.enabled) return true;
    const hour = new Date().getHours();
    return hour >= this.settings.schedule.startHour && 
           hour < this.settings.schedule.endHour;
  }

  getNextScheduleCheck() {
    const now = new Date();
    const startHour = this.settings.schedule.startHour;
    const nextStart = new Date();
    nextStart.setHours(startHour, 0, 0, 0);
    if (nextStart <= now) {
      nextStart.setDate(nextStart.getDate() + 1);
    }
    return nextStart - now;
  }

  updateBadge() {
    let text = '';
    let color = '#666666';
    
    if (this.isActive && !this.isPaused) {
      text = 'ON';
      color = '#00AA00';
    } else if (this.isPaused) {
      text = '||';
      color = '#FFA500';
    } else {
      text = 'OFF';
      color = '#AA0000';
    }
    
    browser.browserAction.setBadgeText({ text });
    browser.browserAction.setBadgeBackgroundColor({ color });
  }
}

// Initialize extension
const queryVeil = new QueryVeil();
globalThis.queryVeil = queryVeil;
