// queryveil adversarial benchmark
// run with: npm run benchmark

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { QueryGenerator } from '../background/queryGenerator.js';
import { assessSearchEngine } from './classifier.js';
import { buildCoverageMatrix, buildEffectivenessScenarios } from './configMatrix.js';
import {
  BENCHMARK_START,
  getEngineCatalog,
  runRealEngine,
  validateEngineRun
} from './engineRunner.js';
import { average } from './metrics.js';
import { getProfiles } from './profiles.js';
import { createRandom, hashSeed } from './random.js';
import { formatConsoleReport, formatMarkdownReport } from './report.js';

const BENCHMARK_SEED = 'queryveil-v1.3';
const COVERAGE_QUERY_COUNT = 12;
const TRIALS_PER_PROFILE = 5;
const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectDirectory = path.resolve(currentDirectory, '..');

function main() {
  const startedAt = Date.now();
  const packageData = JSON.parse(
    fs.readFileSync(path.join(projectDirectory, 'package.json'), 'utf8')
  );
  const catalog = getEngineCatalog();
  const matrix = buildCoverageMatrix(catalog);
  const coverage = runSettingsAudit(matrix, catalog);
  const scenarios = runEffectivenessTrials(catalog);
  const results = {
    meta: {
      version: packageData.version,
      seed: BENCHMARK_SEED,
      generatedAt: new Date().toISOString(),
      durationMs: Date.now() - startedAt,
      trialsPerProfile: TRIALS_PER_PROFILE,
      profileCount: Object.keys(getProfiles()).length
    },
    coverage,
    scenarios
  };

  fs.writeFileSync(
    path.join(currentDirectory, 'results.json'),
    JSON.stringify(results, null, 2) + '\n'
  );
  fs.writeFileSync(
    path.join(projectDirectory, 'BENCHMARK.md'),
    formatMarkdownReport(results)
  );
  process.stdout.write(formatConsoleReport(results));

  if (coverage.failures.length > 0) {
    process.exitCode = 1;
  }
}

function runSettingsAudit(matrix, catalog) {
  const failures = [];
  let generatedQueries = 0;
  let autosuggestRequests = 0;
  let clickIntents = 0;
  let clickEligibleQueries = 0;
  const observedLanguages = new Set();
  const observedHosts = new Set();

  for (const testCase of matrix.cases) {
    const run = runRealEngine(
      testCase.settings,
      COVERAGE_QUERY_COUNT,
      `${BENCHMARK_SEED}/${testCase.name}`
    );
    const caseFailures = validateEngineRun(run, testCase.settings, catalog);

    if (run.scheduled && run.events.length !== COVERAGE_QUERY_COUNT) {
      caseFailures.push(`expected ${COVERAGE_QUERY_COUNT} events, got ${run.events.length}`);
    }
    if (!run.scheduled && run.events.length !== 0) {
      caseFailures.push('inactive configuration produced events');
    }

    for (const event of run.events) {
      generatedQueries++;
      autosuggestRequests += event.prefixes.length;
      clickIntents += event.clickIntent ? 1 : 0;
      if (testCase.settings.enableResultClicks) clickEligibleQueries++;
      observedLanguages.add(event.language);
      observedHosts.add(new URL(event.searchUrl).hostname);
    }

    if (caseFailures.length > 0) {
      failures.push({
        configuration: testCase.name,
        failures: [...new Set(caseFailures)]
      });
    }
  }

  return {
    configurations: matrix.cases.length,
    pairwiseInteractions: countPairwiseInteractions(matrix.dimensions),
    generatedQueries,
    autosuggestRequests,
    resultClickIntentRate: clickEligibleQueries === 0 ? 0 : clickIntents / clickEligibleQueries,
    observedLanguages: [...observedLanguages].sort(),
    observedHosts: [...observedHosts].sort(),
    failures,
    dimensions: matrix.dimensions,
    values: {
      searchEngines: ['google', 'bing', 'duckduckgo'],
      personas: ['none', ...catalog.personaIds],
      languages: catalog.languageCodes,
      topics: catalog.topicIds
    }
  };
}

function runEffectivenessTrials(catalog) {
  const profiles = getProfiles();
  const topicKeywordSets = getTopicKeywordSets();
  const scenarios = buildEffectivenessScenarios(catalog);

  return scenarios.map(scenario => {
    const trials = [];

    for (const [profileId, profile] of Object.entries(profiles)) {
      for (let trialIndex = 0; trialIndex < TRIALS_PER_PROFILE; trialIndex++) {
        const settings = clone(scenario.settings);
        if (scenario.personaByProfile) {
          settings.persona = scenario.personaByProfile[profileId];
        }

        const noiseCount = Math.round(profile.queries.length * scenario.noiseRatio);
        const seed = `${BENCHMARK_SEED}/${scenario.id}/${profileId}/${trialIndex}`;
        const run = runRealEngine(settings, noiseCount, seed, {
          startTime: BENCHMARK_START + trialIndex * 86400000
        });
        const noiseQueries = run.events.map(event => event.query);
        const noiseTimestamps = run.events.map(event => event.timestamp);
        const realTimestamps = generateHumanTimeline(
          profile.queries.length,
          `${seed}/human`
        );
        const assessment = assessSearchEngine(
          profile.queries,
          noiseQueries,
          realTimestamps,
          noiseTimestamps,
          topicKeywordSets,
          { seed }
        );

        trials.push({
          profileId,
          trial: trialIndex + 1,
          noiseCount,
          effectiveness: assessment.effectiveness,
          resistance: assessment.resistance,
          profileDilution: assessment.profileDilution,
          detectionRisk: assessment.detectionRisk,
          classifierBalancedAccuracy: assessment.classifier?.balancedAccuracy ?? null,
          classifierAuc: assessment.classifier?.auc ?? null,
          anomalyScore: assessment.anomaly?.score ?? null,
          clusterConfusion: assessment.cluster?.confusionScore ?? null,
          uniqueQueryRate: noiseQueries.length === 0
            ? null
            : new Set(noiseQueries.map(query => query.toLocaleLowerCase())).size / noiseQueries.length
        });
      }
    }

    return {
      id: scenario.id,
      label: scenario.label,
      description: scenario.description,
      noiseRatio: scenario.noiseRatio,
      effectiveness: mean(trials, 'effectiveness'),
      resistance: mean(trials, 'resistance'),
      profileDilution: mean(trials, 'profileDilution'),
      detectionRisk: mean(trials, 'detectionRisk'),
      classifierBalancedAccuracy: nullableMean(trials, 'classifierBalancedAccuracy'),
      classifierAuc: nullableMean(trials, 'classifierAuc'),
      anomalyScore: nullableMean(trials, 'anomalyScore'),
      clusterConfusion: nullableMean(trials, 'clusterConfusion'),
      uniqueQueryRate: nullableMean(trials, 'uniqueQueryRate'),
      trialCount: trials.length,
      trials
    };
  });
}

function getTopicKeywordSets() {
  const generator = new QueryGenerator({
    date: () => new Date(BENCHMARK_START)
  });
  return Object.values(generator.topics).map(topic => topic.keywords);
}

function generateHumanTimeline(count, seed) {
  const random = createRandom(hashSeed(seed));
  const timestamps = [];
  let timestamp = BENCHMARK_START;

  for (let index = 0; index < count; index++) {
    timestamps.push(timestamp);
    if (random() < 0.78) {
      timestamp += 5000 + random() * 70000;
    } else {
      timestamp += 45 * 60000 + random() * 8 * 3600000;
    }
  }

  return timestamps;
}

function countPairwiseInteractions(dimensions) {
  let count = 0;
  for (let left = 0; left < dimensions.length; left++) {
    for (let right = left + 1; right < dimensions.length; right++) {
      count += dimensions[left].values.length * dimensions[right].values.length;
    }
  }
  return count;
}

function mean(items, key) {
  return average(items.map(item => item[key]));
}

function nullableMean(items, key) {
  const values = items.map(item => item[key]).filter(value => value !== null);
  return values.length === 0 ? null : average(values);
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

main();
