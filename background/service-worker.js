import { BehaviorSimulator } from './behaviorSimulator.js';import { QueryGenerator } from './queryGenerator.js';import { AntiDetection } from './antiDetection.js';const browser = globalThis.browser || globalThis.chrome;class QueryVeilService {  constructor() {    this.behaviorSim = new BehaviorSimulator();    this.queryGen = new QueryGenerator();    this.antiDetect = new AntiDetection();        this.settings = null;    this.ALARM_NAME = 'queryVeilScheduler';        // Initialize settings immediately when the script loads
    this.initializationPromise = this.loadSettings();
  }

  // Called on runtime.onInstalled and runtime.onStartup
  async init() {
    console.log('[QueryVeil] Service Worker Initializing...');
    await this.initializationPromise;

    this.updateBadge(); // Ensure badge is correct
    
    // Ensure alarm state is correct (resume if needed)
    if (this.settings.enabled && !this.settings.paused) {
      const alarm = await browser.alarms.get(this.ALARM_NAME);
      if (!alarm) {
        this.scheduleNextRun();
      }
    }
  }

  async updateBadge() {
    try {
      if (this.settings && this.settings.enabled && !this.settings.paused) {
        await browser.action.setBadgeText({ text: 'ON' });
        await browser.action.setBadgeBackgroundColor({ color: '#48bb78' });
      } else {
        await browser.action.setBadgeText({ text: '' });
      }
    } catch (e) { console.error('Badge update failed', e); }
  }

  async broadcastStatus() {
    try {
      const stats = await this.getStatistics();
      // Using catch because sendMessage throws if no receivers are open
      await browser.runtime.sendMessage({ 
        type: 'statusUpdated',
        isActive: this.settings?.enabled ?? false,
        isPaused: this.settings?.paused ?? false,
        settings: this.settings,
        statistics: stats
      }).catch(() => {}); 
    } catch (e) {
      // Ignore connection errors
    }
  }

  async loadSettings() {
    try {
      const result = await browser.storage.local.get(['settings', 'statistics']);
      this.settings = result.settings || this.getDefaultSettings();
      
      // Ensure specific defaults exist (migration)
      const defaults = this.getDefaultSettings();
      this.settings = { ...defaults, ...this.settings };
      this.settings.topics = { ...defaults.topics, ...(this.settings.topics || {}) };
      this.settings.schedule = { ...defaults.schedule, ...(this.settings.schedule || {}) };

      // Apply topic settings to query generator
      if (this.settings.topics) {
        this.queryGen.updateTopicSettings(this.settings.topics);
      }
    } catch (error) {
      console.error('[QueryVeil] Error loading settings:', error);
      this.settings = this.getDefaultSettings();
    }
    return this.settings;
  }

  getDefaultSettings() {
    return {
      enabled: false,
      paused: false,
      intensity: 'medium',
      customRate: 12, // Queries per hour
      searchEngine: 'google',
      enableResultClicks: false,
      debugMode: false,
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
        gaming: true,
        finance: true,
        hobbies: true,
        local: true,
        general: true
      }
    };
  }

  setupListeners() {
    // Alarm listener
    browser.alarms.onAlarm.addListener(async (alarm) => {
      // Ensure settings loaded before processing alarm
      await this.initializationPromise;
      if (alarm.name === this.ALARM_NAME) {
        await this.handleAlarm();
      }
    });

    // Message listener
    browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
      // Must return true to keep channel open
      this.processMessage(message, sendResponse);
      return true; 
    });

    // Storage change listener
    browser.storage.onChanged.addListener(async (changes, area) => {
      if (area === 'local' && changes.settings) {
        await this.initializationPromise; // Ensure we don't overwrite with null
        this.settings = changes.settings.newValue;
        this.queryGen.updateTopicSettings(this.settings.topics);
        this.handleSettingsChange();
      }
    });
  }

  // Wrapper to handle async message processing
  async processMessage(message, sendResponse) {
    try {
      await this.initializationPromise;
      
      switch (message.type) {
        case 'getStatus':
            const stats = await this.getStatistics();
            sendResponse({ 
                isActive: this.settings?.enabled ?? false,
                isPaused: this.settings?.paused ?? false,
                settings: this.settings,
                statistics: stats
            });
            break;
        case 'toggle':
            this.settings.enabled = !this.settings.enabled;
            if (!this.settings.enabled) {
                this.settings.paused = false; 
                await browser.alarms.clear(this.ALARM_NAME);
            }
            await this.saveSettings();
            sendResponse({ success: true, enabled: this.settings.enabled });
            break;
        case 'pause':
            this.settings.paused = message.paused !== undefined ? message.paused : !this.settings.paused;
            await this.saveSettings(); // saveSettings calls broadcastStatus
            sendResponse({ success: true, paused: this.settings.paused });
            break;
        case 'updateSettings':
            this.settings = { ...this.settings, ...message.settings };
            await this.saveSettings();
            sendResponse({ success: true });
            break;
        case 'getStats':
             const s = await this.getStatistics();
             sendResponse(s);
             break;
        case 'panic':
            this.handlePanic();
            sendResponse({ success: true });
            break;
        default:
            // Unknown message
            sendResponse({ success: false, error: 'Unknown message type' });
      }
    } catch (error) {
       console.error('[QueryVeil] Message processing error:', error);
       sendResponse({ success: false, error: error.toString() });
    }
  }

  async handleAlarm() {
    if (!this.settings.enabled) return; 
    if (this.settings.paused) return;

    if (this.shouldPauseForSchedule()) {
      if (this.settings.debugMode) console.log('[QueryVeil] Paused by schedule');
      browser.alarms.create(this.ALARM_NAME, { delayInMinutes: 30 });
      return;
    }

    await this.executeQuery();
    this.scheduleNextRun();
  }

  shouldPauseForSchedule() {
    if (!this.settings.schedule?.enabled) return false;
    
    const hour = new Date().getHours();
    const start = this.settings.schedule.startHour;
    const end = this.settings.schedule.endHour;
    
    if (start < end) {
      return hour < start || hour >= end;
    } else {
      return hour < start && hour >= end;
    }
  }

  scheduleNextRun() {
    const delayMs = this.behaviorSim.getNextQueryDelay(this.settings);
    const delayMinutes = delayMs / 60000;
    const safeDelay = Math.max(0.1, delayMinutes);
    
    if (this.settings.debugMode) {
      console.log(`[QueryVeil] Next query in ${safeDelay.toFixed(2)} minutes`);
    }
    browser.alarms.create(this.ALARM_NAME, { delayInMinutes: safeDelay });
  }

  async executeQuery() {
    const complexity = this.behaviorSim.getQueryComplexity();
    const sessionInfo = this.behaviorSim.getSessionInfo();
    const query = this.queryGen.generateQuery(complexity, this.settings, sessionInfo);

    if (this.settings.debugMode) {
      console.log(`[QueryVeil] Executing: "${query}" on ${this.settings.searchEngine}`);
    }

    try {
      const result = await this.antiDetect.executeQuery(this.settings.searchEngine, query);
      
      if (result.success) {
        this.updateStats();
        if (this.settings.enableResultClicks && this.behaviorSim.shouldClickResult()) {
            if (this.settings.debugMode) console.log('[QueryVeil] Simulation: Would click result');
        }
      }
      this.broadcastStatus();
    } catch (e) {
      if (this.settings.debugMode) console.error('[QueryVeil] Query execution failed', e);
    }
  }

  async updateStats() {
    const data = await browser.storage.local.get('statistics');
    const stats = data.statistics || { totalQueries: 0, queriesThisSession: 0 };
    
    stats.totalQueries++;
    stats.queriesThisSession++;
    stats.lastQueryTime = Date.now();
    
    await browser.storage.local.set({ statistics: stats });
    this.broadcastStatus();
  }

  handleSettingsChange() {
    if (this.settings.debugMode) console.log('[QueryVeil] Settings changed, re-evaluating schedule');
    browser.alarms.clear(this.ALARM_NAME);
    
    this.updateBadge(); // Update badge
    this.broadcastStatus(); // Notify UI

    if (this.settings.enabled && !this.settings.paused) {
      this.scheduleNextRun();
    }
  }

  async saveSettings() {
    await browser.storage.local.set({ settings: this.settings });
    await this.updateBadge();
    await this.broadcastStatus();
  }

  async getStatistics() {
    const data = await browser.storage.local.get('statistics');
    return data.statistics || { totalQueries: 0, queriesThisSession: 0, sessionStartTime: Date.now() };
  }

  handlePanic() {
    console.warn('[QueryVeil] PANIC TRIGGERED');
    this.settings.enabled = false;
    this.settings.paused = false;
    this.saveSettings();
    browser.alarms.clearAll();
  }
}

// Initialize the service instance
const service = new QueryVeilService();
service.setupListeners(); // Listeners must be synchronous to Register
browser.runtime.onInstalled.addListener(() => service.init());
browser.runtime.onStartup.addListener(() => service.init());

