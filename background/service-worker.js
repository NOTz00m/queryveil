import { BehaviorSimulator } from './behaviorSimulator.js';
import { QueryGenerator } from './queryGenerator.js';
import { AntiDetection } from './antiDetection.js';
import { PersonaEngine } from './personaEngine.js';
import { TrendProvider } from './trendProvider.js';
import { PrivacyScore } from './privacyScore.js';

const browser = globalThis.browser || globalThis.chrome;

class QueryVeilService {
  constructor() {
    this.behaviorSim = new BehaviorSimulator();
    this.queryGen = new QueryGenerator();
    this.antiDetect = new AntiDetection();
    this.personaEngine = new PersonaEngine();
    this.trendProvider = new TrendProvider();
    this.privacyScore = new PrivacyScore();

    this.settings = null;
    this.ALARM_NAME = 'queryVeilScheduler';

    // load settings immediately so we're ready when alarms fire
    this.initializationPromise = this.loadSettings();
  }

  // called on install, update, and browser startup
  async init(reason) {
    console.log('[QueryVeil] initializing, reason:', reason);
    await this.initializationPromise;

    // initialize trend cache from storage
    await this.trendProvider.init();

    // reset session stats on startup
    if (reason === 'startup') {
      const stats = await this.getStatistics();
      stats.queriesThisSession = 0;
      stats.sessionStartTime = Date.now();
      await browser.storage.local.set({ statistics: stats });
    }

    this.updateBadge();

    // make sure the alarm is running if we're supposed to be active
    if (this.settings.enabled && !this.settings.paused) {
      const alarm = await browser.alarms.get(this.ALARM_NAME);
      if (!alarm || reason === 'install') {
        if (reason === 'install') console.log('[QueryVeil] fresh install/update — rescheduling');
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
    } catch (e) {
      console.error('badge update failed', e);
    }
  }

  async broadcastStatus() {
    try {
      const stats = await this.getStatistics();
      const scoreData = this.privacyScore.calculate(this.settings, stats);
      await browser.runtime.sendMessage({
        type: 'statusUpdated',
        isActive: this.settings?.enabled ?? false,
        isPaused: this.settings?.paused ?? false,
        settings: this.settings,
        statistics: stats,
        privacyScore: scoreData
      }).catch(() => {});
    } catch (e) {
      // no receivers open, that's fine
    }
  }

  async loadSettings() {
    try {
      const result = await browser.storage.local.get(['settings', 'statistics', 'simulatorState']);
      this.settings = result.settings || this.getDefaultSettings();

      // merge in any new default keys (handles upgrades gracefully)
      const defaults = this.getDefaultSettings();
      this.settings = { ...defaults, ...this.settings };
      this.settings.topics = { ...defaults.topics, ...(this.settings.topics || {}) };
      this.settings.schedule = { ...defaults.schedule, ...(this.settings.schedule || {}) };

      if (this.settings.topics) {
        this.queryGen.updateTopicSettings(this.settings.topics);
      }

      if (result.simulatorState) {
        this.behaviorSim.setState(result.simulatorState);
      }

    } catch (error) {
      console.error('[QueryVeil] error loading settings:', error);
      this.settings = this.getDefaultSettings();
    }
    return this.settings;
  }

  async saveState() {
    try {
      const state = this.behaviorSim.getState();
      await browser.storage.local.set({ simulatorState: state });
    } catch (e) {
      console.error('[QueryVeil] failed to save state:', e);
    }
  }

  getDefaultSettings() {
    return {
      enabled: false,
      paused: false,
      intensity: 'medium',
      customRate: 12,
      searchEngine: 'google',
      enableResultClicks: false,
      enableAutosuggest: false,
      enableTrends: true,
      persona: 'none',
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
        general: true,
        automotive: true,
        pets: true,
        realestate: true,
        careers: true,
        parenting: true,
        science: true,
        sports: true
      }
    };
  }

  setupListeners() {
    browser.alarms.onAlarm.addListener(async (alarm) => {
      await this.initializationPromise;
      if (alarm.name === this.ALARM_NAME) {
        await this.handleAlarm();
      }
    });

    browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.processMessage(message, sendResponse);
      return true; // keep the channel open for async response
    });

    browser.storage.onChanged.addListener(async (changes, area) => {
      if (area === 'local' && changes.settings) {
        await this.initializationPromise;
        this.settings = changes.settings.newValue;
        this.queryGen.updateTopicSettings(this.settings.topics);
        this.handleSettingsChange();
      }
    });
  }

  async processMessage(message, sendResponse) {
    try {
      await this.initializationPromise;

      switch (message.type) {
        case 'getStatus': {
          const stats = await this.getStatistics();
          const scoreData = this.privacyScore.calculate(this.settings, stats);
          sendResponse({
            isActive: this.settings?.enabled ?? false,
            isPaused: this.settings?.paused ?? false,
            settings: this.settings,
            statistics: stats,
            privacyScore: scoreData
          });
          break;
        }
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
          await this.saveSettings();
          sendResponse({ success: true, paused: this.settings.paused });
          break;

        case 'updateSettings':
          this.settings = { ...this.settings, ...message.settings };
          await this.saveSettings();
          sendResponse({ success: true });
          break;

        case 'getStats': {
          const s = await this.getStatistics();
          sendResponse(s);
          break;
        }
        case 'getPrivacyScore': {
          const stats = await this.getStatistics();
          const scoreData = this.privacyScore.calculate(this.settings, stats);
          sendResponse(scoreData);
          break;
        }
        case 'getPersonas':
          sendResponse({ personas: this.personaEngine.getPersonaList() });
          break;

        case 'panic':
          this.handlePanic();
          sendResponse({ success: true });
          break;

        default:
          sendResponse({ success: false, error: 'unknown message type' });
      }
    } catch (error) {
      console.error('[QueryVeil] message processing error:', error);
      sendResponse({ success: false, error: error.toString() });
    }
  }

  async handleAlarm() {
    if (!this.settings.enabled) return;
    if (this.settings.paused) return;

    if (this.shouldPauseForSchedule()) {
      if (this.settings.debugMode) console.log('[QueryVeil] paused by schedule');
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
      console.log(`[QueryVeil] next query in ${safeDelay.toFixed(2)} minutes`);
    }
    browser.alarms.create(this.ALARM_NAME, { delayInMinutes: safeDelay });
    this.saveState();
  }

  async executeQuery() {
    const complexity = this.behaviorSim.getQueryComplexity();
    const sessionInfo = this.behaviorSim.getSessionInfo();

    // get persona config (null if persona is 'none')
    const persona = this.personaEngine.getActivePersona(this.settings);

    // get trending topics if trends are enabled
    let trends = [];
    if (this.settings.enableTrends) {
      trends = await this.trendProvider.getTrendingTopics();
    }

    const query = this.queryGen.generateQuery(complexity, this.settings, sessionInfo, persona, trends);

    if (this.settings.debugMode) {
      console.log(`[QueryVeil] executing: "${query}" on ${this.settings.searchEngine}${persona ? ` (persona: ${persona.name})` : ''}`);
    }

    try {
      // simulate autosuggest typing if enabled
      if (this.settings.enableAutosuggest) {
        await this.antiDetect.simulateAutosuggest(this.settings.searchEngine, query);
      }

      const result = await this.antiDetect.executeQuery(this.settings.searchEngine, query);

      if (result.success) {
        this.updateStats();
        if (this.settings.enableResultClicks && this.behaviorSim.shouldClickResult()) {
          if (this.settings.debugMode) console.log('[QueryVeil] would click result (simulation)');
        }
      }
      this.broadcastStatus();
    } catch (e) {
      if (this.settings.debugMode) console.error('[QueryVeil] query execution failed', e);
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
    if (this.settings.debugMode) console.log('[QueryVeil] settings changed, rescheduling');
    browser.alarms.clear(this.ALARM_NAME);

    this.updateBadge();
    this.broadcastStatus();

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
    console.warn('[QueryVeil] PANIC — killing everything');
    this.settings.enabled = false;
    this.settings.paused = false;
    this.saveSettings();
    browser.alarms.clearAll();
  }
}

// boot up
const service = new QueryVeilService();
service.setupListeners();
browser.runtime.onInstalled.addListener(() => service.init('install'));
browser.runtime.onStartup.addListener(() => service.init('startup'));
