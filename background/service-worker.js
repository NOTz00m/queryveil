import { BehaviorSimulator } from './behaviorSimulator.js';
import { QueryGenerator } from './queryGenerator.js';
import { AntiDetection } from './antiDetection.js';
import { PersonaEngine } from './personaEngine.js';
import { TrendProvider } from './trendProvider.js';
import { PrivacyScore } from './privacyScore.js';
import { RequestShaper } from './requestShaper.js';
import { CoverTab } from './coverTab.js';
import { RealDataPool } from './realDataPool.js';
import { loadInstallProfile, personalizePersona } from './installProfile.js';
import { shouldPauseForSchedule } from './settings.js';

const browser = globalThis.browser || globalThis.chrome;

const MAIN_ALARM = 'queryVeilScheduler';
const ECHO_ALARM = 'queryVeilEcho';
const COVER_CLOSE_ALARM = 'queryVeilCoverClose';

class QueryVeilService {
  constructor(shaper) {
    this.shaper = shaper;
    this.behaviorSim = new BehaviorSimulator();
    this.queryGen = new QueryGenerator();
    this.antiDetect = new AntiDetection(shaper);
    this.coverTab = new CoverTab(shaper);
    this.personaEngine = new PersonaEngine();
    this.trendProvider = new TrendProvider();
    this.privacyScore = new PrivacyScore();
    this.pool = new RealDataPool();

    this.settings = null;
    this.profile = null;
    this.learnedSearchParams = {};
    this.running = false;
    this.ALARM_NAME = MAIN_ALARM;

    // load settings immediately so we're ready when alarms fire
    this.initializationPromise = this.loadSettings();
  }

  // called on install, update, and browser startup
  async init(reason) {
    await this.initializationPromise;
    await this.trendProvider.init();
    await this.coverTab.cleanupOrphans();

    if (reason === 'startup') {
      const stats = await this.getStatistics();
      stats.queriesThisSession = 0;
      stats.sessionStartTime = Date.now();
      await browser.storage.local.set({ statistics: stats });
    }

    this.updateBadge();

    if (this.settings.enabled && !this.settings.paused) {
      const alarm = await browser.alarms.get(MAIN_ALARM);
      if (!alarm || reason === 'install') this.scheduleNextRun();
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

  // which transport actually runs. real page mode needs firefox's
  // tabs.hide, search.search and blocking webRequest
  getActiveMode() {
    const pageCapable = CoverTab.isSupported() && this.shaper.isActive();
    return this.settings?.requestMode === 'page' && pageCapable ? 'page' : 'background';
  }

  async buildStatus() {
    const stats = await this.getStatistics();
    let nextRunAt = null;
    try {
      const alarm = await browser.alarms.get(MAIN_ALARM);
      nextRunAt = alarm?.scheduledTime ?? null;
    } catch (e) {
      // alarms api unavailable, the ui just won't show a countdown
    }

    return {
      isActive: this.settings?.enabled ?? false,
      isPaused: this.settings?.paused ?? false,
      settings: this.settings,
      statistics: stats,
      privacyScore: this.privacyScore.calculate(this.settings, stats),
      nextRunAt,
      activeMode: this.getActiveMode(),
      capabilities: { pageMode: CoverTab.isSupported() && this.shaper.isActive() }
    };
  }

  async broadcastStatus() {
    try {
      const status = await this.buildStatus();
      await browser.runtime.sendMessage({ type: 'statusUpdated', ...status }).catch(() => {});
    } catch (e) {
      // no receivers open
    }
  }

  async loadSettings() {
    try {
      const result = await browser.storage.local.get([
        'settings', 'simulatorState', 'transportState', 'learnedSearchParams'
      ]);
      const defaults = this.getDefaultSettings();
      this.settings = { ...defaults, ...(result.settings || {}) };
      this.settings.topics = { ...defaults.topics, ...(this.settings.topics || {}) };
      this.settings.schedule = { ...defaults.schedule, ...(this.settings.schedule || {}) };
      this.settings.languages = { ...defaults.languages, ...(this.settings.languages || {}) };

      this.profile = await loadInstallProfile(browser.storage.local);
      this.queryGen.applyInstallProfile(this.profile);
      this.queryGen.updateTopicSettings(this.settings.topics);

      if (result.simulatorState) this.behaviorSim.setState(result.simulatorState);
      if (result.transportState) this.antiDetect.setState(result.transportState);
      this.learnedSearchParams = result.learnedSearchParams || {};
    } catch (error) {
      console.error('[QueryVeil] error loading settings:', error);
      this.settings = this.getDefaultSettings();
    }
    return this.settings;
  }

  async saveState() {
    try {
      await browser.storage.local.set({
        simulatorState: this.behaviorSim.getState(),
        transportState: this.antiDetect.getState()
      });
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
      // 'page' loads results in a hidden tab (firefox), 'background' fetches
      requestMode: 'page',
      // skip searches while the computer is idle or locked, and place some
      // cover searches right after real ones
      followActivity: true,
      enableResultClicks: false,
      enableAutosuggest: false,
      enableTrends: true,
      persona: 'none',
      debugMode: false,
      languages: {
        primary: 'en',
        enabled: [],
        mixPercentage: 0
      },
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
      if (alarm.name === MAIN_ALARM) await this.handleAlarm();
      if (alarm.name === ECHO_ALARM) await this.handleEcho();
      if (alarm.name === COVER_CLOSE_ALARM) await this.coverTab.release();
    });

    browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.processMessage(message, sendResponse);
      return true; // keep the channel open for async response
    });

    browser.storage.onChanged.addListener(async (changes, area) => {
      if (area === 'local' && changes.settings) {
        await this.initializationPromise;
        const defaults = this.getDefaultSettings();
        this.settings = { ...defaults, ...changes.settings.newValue };
        this.queryGen.updateTopicSettings(this.settings.topics);
        this.handleSettingsChange();
      }
    });

    this.coverTab.registerListeners();
  }

  async processMessage(message, sendResponse) {
    try {
      await this.initializationPromise;

      switch (message.type) {
        case 'getStatus':
          sendResponse(await this.buildStatus());
          break;

        case 'toggle':
          this.settings.enabled = !this.settings.enabled;
          if (!this.settings.enabled) {
            this.settings.paused = false;
            await browser.alarms.clear(MAIN_ALARM);
            await browser.alarms.clear(ECHO_ALARM);
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

        case 'getStats':
          sendResponse(await this.getStatistics());
          break;

        case 'getPrivacyScore': {
          const stats = await this.getStatistics();
          sendResponse(this.privacyScore.calculate(this.settings, stats));
          break;
        }

        case 'getPersonas':
          sendResponse({ personas: this.personaEngine.getPersonaList() });
          break;

        case 'panic':
          await this.handlePanic();
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

  canRunNow() {
    return this.settings.enabled && !this.settings.paused && !shouldPauseForSchedule(this.settings);
  }

  async handleAlarm() {
    if (!this.settings.enabled || this.settings.paused) return;

    if (shouldPauseForSchedule(this.settings)) {
      this.debug('paused by schedule');
      this.scheduleIn(30 * 60000);
      return;
    }

    // repeated captchas or 429s inside the last hour: stand down
    if (this.antiDetect.shouldPause()) {
      this.debug('too many blocks, pausing for an hour');
      this.scheduleIn(60 * 60000);
      return;
    }

    if (this.running) {
      this.scheduleIn(2 * 60000);
      return;
    }

    if (this.settings.followActivity) {
      const idleState = await this.getIdleState();
      if (!this.behaviorSim.shouldRunForIdleState(idleState)) {
        this.debug(`user is ${idleState}, holding off`);
        this.scheduleIn((5 + Math.random() * 10) * 60000);
        return;
      }
    }

    if (!this.behaviorSim.canExecuteQuery(this.settings.intensity, this.settings.customRate)) {
      this.debug('hourly cap reached');
      this.scheduleIn((5 + Math.random() * 5) * 60000);
      return;
    }

    await this.executeQuery();
    this.scheduleNextRun();
  }

  // a cover search placed shortly after one of the user's real searches
  async handleEcho() {
    if (!this.canRunNow() || this.running) return;
    if (!this.behaviorSim.canExecuteQuery(this.settings.intensity, this.settings.customRate)) return;
    this.debug('echo search after a real one');
    await this.executeQuery();
  }

  async onUserSearch(engineId) {
    await this.initializationPromise;
    if (!this.settings.followActivity || !this.canRunNow()) return;
    // only echo on the engine the cover searches go to
    if (engineId !== this.settings.searchEngine) return;

    const pending = await browser.alarms.get(ECHO_ALARM);
    if (pending) return;
    const last = this.behaviorSim.lastQueryTime;
    if (last && Date.now() - last < 60000) return;

    const delay = this.behaviorSim.getEchoDelay();
    if (delay === null) return;
    browser.alarms.create(ECHO_ALARM, { delayInMinutes: delay / 60000 });
  }

  // the partner code the user's own firefox puts on searches, so
  // background mode searches carry the same one
  async onLearnedParams(engineId, params) {
    await this.initializationPromise;
    const current = JSON.stringify(this.learnedSearchParams[engineId] || []);
    if (current === JSON.stringify(params)) return;
    this.learnedSearchParams[engineId] = params;
    await browser.storage.local.set({ learnedSearchParams: this.learnedSearchParams });
  }

  async getIdleState() {
    try {
      return await browser.idle.queryState(120);
    } catch (e) {
      return 'active';
    }
  }

  scheduleIn(delayMs) {
    browser.alarms.create(MAIN_ALARM, { delayInMinutes: Math.max(0.5, delayMs / 60000) });
  }

  scheduleNextRun() {
    const base = this.behaviorSim.getNextQueryDelay(this.settings);
    // backoff after captchas or rate limits stretches every gap
    const delayMs = base * this.antiDetect.getBackoffMultiplier();
    const delayMinutes = Math.max(0.1, delayMs / 60000);

    this.debug(`next query in ${delayMinutes.toFixed(2)} minutes`);
    browser.alarms.create(MAIN_ALARM, { delayInMinutes: delayMinutes });
    this.saveState();
  }

  // choose the next query. later searches in a session usually follow on
  // from the last one: something the engine itself suggested or listed
  // as related, or a refinement, the way people actually dig into a topic
  async chooseQuery(session, persona, trends) {
    if (session && session.queriesDone > 0) {
      const language = session.language || 'en';
      if (Math.random() < 0.4) {
        const followUp = await this.pool.pickFollowUp(session);
        if (followUp) return { query: followUp, language, source: 'engine' };
      }
      if (language === 'en' && session.lastQuery && this.behaviorSim.shouldRefineSearch()) {
        return { query: this.queryGen.refineQuery(session.lastQuery), language, source: 'refine' };
      }
    }

    const complexity = this.behaviorSim.getQueryComplexity();
    const result = this.queryGen.generateQuery(complexity, this.settings, session, persona, trends);
    return { ...result, source: 'generated' };
  }

  async executeQuery() {
    this.running = true;
    try {
      const session = this.behaviorSim.getSessionInfo();
      const basePersona = this.personaEngine.getActivePersona(this.settings);
      const persona = personalizePersona(basePersona, this.profile, new Date());
      const trends = this.settings.enableTrends ? await this.trendProvider.getTrendingTopics() : [];

      let { query, language, source } = await this.chooseQuery(session, persona, trends);
      if (this.behaviorSim.shouldAddTypo()) query = this.queryGen.addTypo(query);

      const engineId = this.settings.searchEngine;
      const context = { topic: session?.topic, language, sessionId: session?.id };
      const harvested = [];

      if (this.settings.enableAutosuggest) {
        const suggestions = await this.antiDetect.simulateAutosuggest(engineId, query);
        harvested.push(...suggestions);
        // sometimes take one of the completions instead of finishing typing
        const completion = suggestions.find(s => s.toLowerCase().startsWith(query.toLowerCase()) && s.length > query.length);
        if (completion && Math.random() < 0.2) query = completion;
      }

      const mode = this.getActiveMode();
      const wantsClick = this.settings.enableResultClicks && this.behaviorSim.shouldClickResult();
      this.debug(`searching "${query}" on ${engineId} [${mode}, ${source}${language !== 'en' ? `, ${language}` : ''}${persona ? `, persona ${persona.name}` : ''}]`);

      const outcome = mode === 'page'
        ? await this.searchInPage(engineId, query, wantsClick)
        : await this.searchInBackground(engineId, query, wantsClick);

      if (mode === 'page') {
        // keep the hidden tab for the rest of this session, close it once
        // the session is over or nothing has run for ten minutes
        if (!session || session.queriesRemaining <= 0) {
          await this.coverTab.release();
        } else {
          browser.alarms.create(COVER_CLOSE_ALARM, { delayInMinutes: 10 });
        }
      }

      if (outcome.blocked) {
        this.antiDetect.handleRateLimit();
        this.debug('engine served a captcha or block page, backing off');
      } else if (outcome.success) {
        this.antiDetect.resetFailureTracking();
        harvested.push(...(outcome.related || []));
        await this.updateStats();
        if (outcome.clicked) await this.recordClick();
        this.behaviorSim.recordQuery();
        if (session) {
          session.lastQuery = query;
          session.queriesDone = (session.queriesDone || 0) + 1;
        }
      } else {
        this.antiDetect.handleFailure();
        this.debug(`search failed: ${outcome.error || 'unknown'}`);
      }

      if (harvested.length) await this.pool.add(harvested, context);
      await this.saveState();
      this.broadcastStatus();
    } catch (e) {
      this.debug(`query execution failed ${e}`);
    } finally {
      this.running = false;
    }
  }

  async searchInPage(engineId, query, wantsClick) {
    const dwell = Math.min(90000, Math.max(3000, this.behaviorSim.getResultDwellTime()));
    return this.coverTab.search({
      engineId,
      query,
      click: wantsClick,
      clickPosition: this.antiDetect.getResultPosition(),
      scanDelay: this.antiDetect.getClickDelay(),
      dwellTime: dwell
    });
  }

  async searchInBackground(engineId, query, wantsClick) {
    const result = await this.antiDetect.executeQuery(engineId, query, {
      learnedParams: this.learnedSearchParams[engineId]
    });
    if (!result.success) return result;

    const related = this.antiDetect.extractRelatedSearches(engineId, result.body, query);
    let clicked = false;

    if (wantsClick) {
      const links = this.antiDetect.extractResultLinks(engineId, result.body);
      if (links.length) {
        const position = Math.min(this.antiDetect.getResultPosition(), links.length);
        const click = await this.antiDetect.simulateResultClick(links[position - 1]);
        clicked = click.success;
      }
    }

    return { success: true, related, clicked };
  }

  async updateStats() {
    const stats = await this.getStatistics();
    const now = Date.now();

    stats.totalQueries = (stats.totalQueries || 0) + 1;
    stats.queriesThisSession = (stats.queriesThisSession || 0) + 1;
    stats.lastQueryTime = now;
    // timestamps only, never query text. powers the activity strip in the popup
    stats.recentQueries = this.trimRecent([...(stats.recentQueries || []), now]);

    await browser.storage.local.set({ statistics: stats });
  }

  async recordClick() {
    const stats = await this.getStatistics();
    const now = Date.now();
    stats.resultClicks = (stats.resultClicks || 0) + 1;
    stats.recentClicks = this.trimRecent([...(stats.recentClicks || []), now]);
    await browser.storage.local.set({ statistics: stats });
  }

  // keep the last 24 hours, capped so storage never grows unbounded
  trimRecent(times) {
    const cutoff = Date.now() - 24 * 3600000;
    return times.filter(time => time > cutoff).slice(-200);
  }

  handleSettingsChange() {
    this.debug('settings changed, rescheduling');
    browser.alarms.clear(MAIN_ALARM);

    this.updateBadge();
    this.broadcastStatus();

    if (this.settings.enabled && !this.settings.paused) {
      this.scheduleNextRun();
    } else {
      browser.alarms.clear(ECHO_ALARM);
      this.coverTab.release();
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

  async handlePanic() {
    console.warn('[QueryVeil] panic, stopping everything');
    this.settings.enabled = false;
    this.settings.paused = false;
    await browser.alarms.clearAll();
    await this.coverTab.cleanupOrphans();
    await this.saveSettings();
  }

  debug(message) {
    if (this.settings?.debugMode) console.log(`[QueryVeil] ${message}`);
  }
}

// boot. listeners are registered synchronously at top level so firefox
// can wake the event page for them
const shaper = new RequestShaper({
  onUserSearch: engineId => service.onUserSearch(engineId),
  onLearnedParams: (engineId, params) => service.onLearnedParams(engineId, params)
});
shaper.register();

// the keep-alive heartbeat in coverTab.js relies on a storage.session
// listener existing. measured on firefox 159: without it the event page is
// stopped about 30 seconds into a long dwell
browser.storage?.session?.onChanged?.addListener(() => {});

const service = new QueryVeilService(shaper);
service.setupListeners();
browser.runtime.onInstalled.addListener(() => service.init('install'));
browser.runtime.onStartup.addListener(() => service.init('startup'));
