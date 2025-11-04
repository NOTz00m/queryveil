/**
 * QueryVeil Background Script
 * Main script for privacy-preserving query noise generation
 * 
 * Note: This file includes all classes inline to work with Firefox's background.scripts
 * For the modular source, see the separate files in this directory.
 */

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

  /**
   * Initialize the extension
   */
  async init() {
    console.log('[QueryVeil] Initializing...');
    
    // Load settings first and ensure they're fully applied
    await this.loadSettings();
    
    // Apply topic settings to query generator
    if (this.settings.topics) {
      this.queryGen.updateTopicSettings(this.settings.topics);
    }
    
    // Set up listeners
    this.setupListeners();
    
    // Start if enabled - settings are now fully loaded and applied
    if (this.settings.enabled) {
      console.log('[QueryVeil] Auto-starting from saved settings');
      this.start();
    }
    
    console.log('[QueryVeil] Initialized with intensity:', this.settings.intensity);
  }

  /**
   * Load user settings from storage
   */
  async loadSettings() {
    try {
      const stored = await browser.storage.local.get('settings');
      this.settings = stored.settings || this.getDefaultSettings();
      
      // Validate settings structure
      if (!this.settings.intensity) {
        this.settings.intensity = 'medium';
      }
      if (!this.settings.topics) {
        this.settings.topics = this.getDefaultSettings().topics;
      }
      
      // Load statistics
      const stats = await browser.storage.local.get('statistics');
      if (stats.statistics) {
        this.statistics = { ...this.statistics, ...stats.statistics };
      }
      
      console.log('[QueryVeil] Settings loaded:', this.settings.intensity, 'intensity');
    } catch (error) {
      console.error('[QueryVeil] Error loading settings:', error);
      this.settings = this.getDefaultSettings();
    }
  }

  /**
   * Get default settings
   * @returns {Object}
   */
  getDefaultSettings() {
    return {
      enabled: false,
      intensity: 'medium',
      customRate: 12,
      searchEngine: 'google',
      enableResultClicks: false,
      schedule: {
        enabled: false,
        startHour: 9,
        endHour: 23
      },
      topics: {
        news: true,
        shopping: true,
        entertainment: true,
        technology: true,
        health: true,
        travel: true,
        food: true,
        education: true,
        local: true,
        general: true
      }
    };
  }

  /**
   * Save settings to storage
   */
  async saveSettings() {
    try {
      await browser.storage.local.set({ settings: this.settings });
    } catch (error) {
      console.error('[QueryVeil] Error saving settings:', error);
    }
  }

  /**
   * Save statistics to storage
   */
  async saveStatistics() {
    try {
      await browser.storage.local.set({ statistics: this.statistics });
    } catch (error) {
      console.error('[QueryVeil] Error saving statistics:', error);
    }
  }

  /**
   * Set up event listeners
   */
  setupListeners() {
    // Alarm for scheduled queries
    browser.alarms.onAlarm.addListener((alarm) => {
      if (alarm.name === this.alarmName) {
        this.handleAlarm();
      }
    });

    // Message listener for popup/options communication
    browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
      return true; // Keep channel open for async response
    });

    // Extension startup
    browser.runtime.onStartup.addListener(() => {
      if (this.settings.enabled) {
        this.start();
      }
    });

    // Extension installed/updated
    browser.runtime.onInstalled.addListener((details) => {
      if (details.reason === 'install') {
        this.handleFirstInstall();
      }
    });
  }

  /**
   * Handle first installation
   */
  async handleFirstInstall() {
    console.log('[QueryVeil] First install detected');
    
    // Open options page
    browser.runtime.openOptionsPage();
    
    // Set badge to indicate inactive state
    this.updateBadge();
  }

  /**
   * Handle messages from popup/options
   */
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
        
        // Update query generator topics
        if (message.settings.topics) {
          this.queryGen.updateTopicSettings(message.settings.topics);
        }
        
        // Restart if needed
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
        // Manual trigger for testing
        this.executeNoiseQuery();
        sendResponse({ success: true });
        break;

      default:
        sendResponse({ error: 'Unknown message type' });
    }
  }

  /**
   * Start generating noise queries
   */
  start() {
    if (this.isActive) return;
    
    console.log('[QueryVeil] Starting noise generation');
    this.isActive = true;
    this.isPaused = false;
    this.statistics.sessionStartTime = Date.now();
    this.statistics.queriesThisSession = 0;
    
    this.settings.enabled = true;
    this.saveSettings();
    
    // Schedule first query
    this.scheduleNextQuery();
    
    // Update UI
    this.updateBadge();
  }

  /**
   * Stop generating noise queries
   */
  stop() {
    if (!this.isActive) return;
    
    console.log('[QueryVeil] Stopping noise generation');
    this.isActive = false;
    
    this.settings.enabled = false;
    this.saveSettings();
    
    // Cancel scheduled queries
    browser.alarms.clear(this.alarmName);
    
    // Update UI
    this.updateBadge();
  }

  /**
   * Schedule next noise query
   */
  async scheduleNextQuery() {
    if (!this.isActive) return;

    // Check if we're within schedule
    if (this.settings.schedule.enabled && !this.isWithinSchedule()) {
      // Schedule check for start of next allowed period
      const nextCheck = this.getNextScheduleCheck();
      browser.alarms.create(this.alarmName, { when: Date.now() + nextCheck });
      return;
    }

    // Get delay from behavior simulator
    let delay = this.behaviorSim.getNextQueryDelay(this.settings);
    
    // Apply backoff if there have been failures
    delay *= this.antiDetect.getBackoffMultiplier();
    
    // Schedule the alarm
    browser.alarms.create(this.alarmName, { when: Date.now() + delay });
    
    console.log(`[QueryVeil] Next query scheduled in ${Math.round(delay / 1000)}s`);
  }

  /**
   * Handle scheduled alarm
   */
  async handleAlarm() {
    // Don't do anything if inactive - no rescheduling
    if (!this.isActive) {
      return;
    }

    // If paused, reschedule for later
    if (this.isPaused) {
      this.scheduleNextQuery();
      return;
    }

    // Check if we should pause due to errors
    if (this.antiDetect.shouldPause()) {
      console.log('[QueryVeil] Too many failures, pausing temporarily');
      this.isPaused = true;
      this.updateBadge();
      
      // Resume after 1 hour
      setTimeout(() => {
        this.isPaused = false;
        this.updateBadge();
      }, 3600000);
      
      return;
    }

    // Execute the query
    await this.executeNoiseQuery();
    
    // Schedule next query
    this.scheduleNextQuery();
  }

  /**
   * Execute a single noise query
   */
  async executeNoiseQuery() {
    try {
      // Check rate limiting
      if (!this.behaviorSim.canExecuteQuery(this.settings.intensity, this.settings.customRate)) {
        console.log('[QueryVeil] Rate limit reached for this hour');
        return;
      }

      // Get user's idle state
      const userState = await this.antiDetect.getUserIdleState();
      
      // Decide if we should mix with user activity
      if (!this.behaviorSim.shouldMixWithActivity(userState)) {
        console.log('[QueryVeil] Skipping query due to user state');
        return;
      }

      // Get session info
      const sessionInfo = this.behaviorSim.getSessionInfo();
      
      // Determine query complexity
      const complexity = this.behaviorSim.getQueryComplexity();
      
      // Generate query
      let query = this.queryGen.generateQuery(complexity, this.settings, sessionInfo);
      
      // Add typo?
      if (this.behaviorSim.shouldAddTypo()) {
        query = this.queryGen.addTypo(query);
      }

      console.log(`[QueryVeil] Executing query: "${query}"`);

      // Execute the search
      const result = await this.antiDetect.executeQuery(
        this.settings.searchEngine,
        query
      );

      if (result.success) {
        // Record successful query
        this.behaviorSim.recordQuery();
        this.statistics.totalQueries++;
        this.statistics.queriesThisSession++;
        await this.saveStatistics();

        // Simulate result click?
        if (this.settings.enableResultClicks && this.behaviorSim.shouldClickResult()) {
          await this.simulateResultInteraction(query, result.url);
        }

        // Should we do a refinement search?
        if (this.behaviorSim.shouldRefineSearch()) {
          const refinedQuery = this.queryGen.refineQuery(query);
          console.log(`[QueryVeil] Refinement query: "${refinedQuery}"`);
          
          // Wait a bit before refinement
          await this.antiDetect.delay(2000 + Math.random() * 3000);
          
          await this.antiDetect.executeQuery(
            this.settings.searchEngine,
            refinedQuery
          );
        }

      } else {
        console.error('[QueryVeil] Query failed:', result.error);
      }

    } catch (error) {
      console.error('[QueryVeil] Error executing query:', error);
    }
  }

  /**
   * Simulate clicking and viewing a result page
   */
  async simulateResultInteraction(query, searchURL) {
    try {
      const position = this.antiDetect.getResultPosition();
      const dwellTime = this.behaviorSim.getResultDwellTime();
      
      // Generate realistic result URL
      const resultURL = this.antiDetect.generateMockResultURL(query, position);
      
      console.log(`[QueryVeil] Simulating click on result #${position}, dwell time: ${Math.round(dwellTime/1000)}s`);
      
      await this.antiDetect.simulateResultClick(resultURL, searchURL, dwellTime);
      
    } catch (error) {
      console.error('[QueryVeil] Error simulating result click:', error);
    }
  }

  /**
   * Check if current time is within allowed schedule
   * @returns {boolean}
   */
  isWithinSchedule() {
    if (!this.settings.schedule.enabled) return true;
    
    const hour = new Date().getHours();
    return hour >= this.settings.schedule.startHour && 
           hour < this.settings.schedule.endHour;
  }

  /**
   * Get milliseconds until next schedule check
   * @returns {number}
   */
  getNextScheduleCheck() {
    const now = new Date();
    const startHour = this.settings.schedule.startHour;
    
    const nextStart = new Date();
    nextStart.setHours(startHour, 0, 0, 0);
    
    // If start time is earlier today and we've passed it, schedule for tomorrow
    if (nextStart <= now) {
      nextStart.setDate(nextStart.getDate() + 1);
    }
    
    return nextStart - now;
  }

  /**
   * Update extension badge
   */
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
    
    browser.action.setBadgeText({ text });
    browser.action.setBadgeBackgroundColor({ color });
  }
}

// Initialize extension
const queryVeil = new QueryVeil();

// Make available for debugging
globalThis.queryVeil = queryVeil;
