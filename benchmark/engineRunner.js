// runs the same modules used by the extension without making network requests

import { AntiDetection } from '../background/antiDetection.js';
import { BehaviorSimulator } from '../background/behaviorSimulator.js';
import { PersonaEngine } from '../background/personaEngine.js';
import { QueryGenerator } from '../background/queryGenerator.js';
import { shouldPauseForSchedule } from '../background/settings.js';
import { hashSeed, withSeed } from './random.js';

const BENCHMARK_START = Date.UTC(2026, 6, 15, 14, 0, 0);
const TREND_FIXTURES = [
  'summer travel delays',
  'major football transfer',
  'new phone launch',
  'heatwave forecast',
  'interest rate decision',
  'streaming series finale',
  'space mission update',
  'rail strike dates'
];

export function getEngineCatalog() {
  const generator = new QueryGenerator();
  const personas = new PersonaEngine();

  return {
    topicIds: Object.keys(generator.topics),
    personaIds: Object.keys(personas.personas),
    languageCodes: Object.keys(generator.queryLanguages.languages)
  };
}

export function runRealEngine(settings, count, seed, options = {}) {
  return withSeed(hashSeed(seed), () => {
    let clock = options.startTime || BENCHMARK_START;
    const date = () => new Date(clock);
    const generator = new QueryGenerator({ date });
    const personas = new PersonaEngine();
    const behavior = new BehaviorSimulator({
      now: () => clock,
      date
    });
    const transport = new AntiDetection();
    const activePersona = personas.getActivePersona(settings);
    const trends = settings.enableTrends ? TREND_FIXTURES : [];
    const scheduled = settings.enabled &&
      !settings.paused &&
      !shouldPauseForSchedule(settings, date());

    generator.updateTopicSettings(settings.topics);

    const events = [];
    if (!scheduled) {
      return { events, scheduled, settings };
    }

    for (let index = 0; index < count; index++) {
      const complexity = behavior.getQueryComplexity();
      const sessionInfo = behavior.getSessionInfo();
      const result = generator.generateQuery(
        complexity,
        settings,
        sessionInfo,
        activePersona,
        trends
      );
      const referrer = transport.getReferrer(settings.searchEngine);
      const searchUrl = transport.buildSearchURL(
        settings.searchEngine,
        result.query,
        result.language
      );
      const headers = transport.getHeaders(referrer, result.language);
      const prefixes = settings.enableAutosuggest
        ? transport.generateTypingPrefixes(result.query)
        : [];
      const clickIntent = settings.enableResultClicks && behavior.shouldClickResult();
      const resultPosition = clickIntent ? transport.getResultPosition() : null;
      const dwellTime = clickIntent ? Math.max(1000, behavior.getResultDwellTime()) : null;

      events.push({
        index,
        query: result.query,
        language: result.language,
        complexity,
        timestamp: clock,
        searchUrl,
        headers,
        prefixes,
        clickIntent,
        resultPosition,
        dwellTime
      });

      behavior.recordQuery();
      const delay = behavior.getNextQueryDelay(settings);
      clock += delay;
    }

    return { events, scheduled, settings };
  });
}

export function validateEngineRun(run, settings, catalog) {
  const failures = [];
  const expectedHost = {
    google: 'www.google.com',
    bing: 'www.bing.com',
    duckduckgo: 'duckduckgo.com'
  }[settings.searchEngine];

  for (const event of run.events) {
    if (!event.query || typeof event.query !== 'string') {
      failures.push('empty query');
    }
    if (!catalog.languageCodes.includes(event.language)) {
      failures.push(`unknown language ${event.language}`);
    }
    if (new URL(event.searchUrl).hostname !== expectedHost) {
      failures.push(`wrong search host for ${settings.searchEngine}`);
    }
    if (!event.headers.Accept || !event.headers['Accept-Language']) {
      failures.push('missing request headers');
    }
    if (settings.enableAutosuggest && event.prefixes.length === 0) {
      failures.push('autosuggest produced no prefixes');
    }
    if (!settings.enableAutosuggest && event.prefixes.length !== 0) {
      failures.push('autosuggest ran while disabled');
    }
  }

  return [...new Set(failures)];
}

export { BENCHMARK_START, TREND_FIXTURES };
