import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { QueryLanguages } from '../background/queryLanguages.js';
import { assessSearchEngine } from './classifier.js';
import { buildCoverageMatrix, getDefaultSettings } from './configMatrix.js';
import { BENCHMARK_START, getEngineCatalog, runRealEngine } from './engineRunner.js';

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectDirectory = path.resolve(currentDirectory, '..');
const catalog = getEngineCatalog();

test('package and manifest versions stay aligned', () => {
  const manifest = readJson('manifest.json');
  const packageData = readJson('package.json');
  const lockData = readJson('package-lock.json');

  assert.equal(manifest.version, packageData.version);
  assert.equal(lockData.version, packageData.version);
  assert.equal(lockData.packages[''].version, packageData.version);
});

test('settings matrix covers every shipped catalog value', () => {
  const matrix = buildCoverageMatrix(catalog);

  assert.ok(matrix.cases.length > 700);
  assert.equal(catalog.topicIds.length, 20);
  assert.equal(catalog.personaIds.length, 8);
  assert.equal(catalog.languageCodes.length, 14);

  for (const topicId of catalog.topicIds) {
    assert.ok(matrix.cases.some(item => enabledTopics(item.settings).join(',') === topicId));
    assert.ok(matrix.cases.some(item => (
      item.settings.topics[topicId] === false &&
      enabledTopics(item.settings).length === catalog.topicIds.length - 1
    )));
  }

  for (const languageCode of catalog.languageCodes) {
    assert.ok(matrix.cases.some(item => (
      item.settings.languages.primary === languageCode &&
      item.settings.languages.enabled.length === 0
    )));
  }
});

test('only reviewed language catalogs and russian use the expanded query pools', () => {
  const languages = new QueryLanguages().languages;
  const expandedCodes = new Set(['es', 'fr', 'pt', 'ko', 'pl', 'ru']);

  for (const [code, language] of Object.entries(languages)) {
    if (code === 'en') continue;

    if (expandedCodes.has(code)) {
      assert.ok(language.keywords.length >= 24, `${code} needs at least 24 keywords`);
      assert.ok(language.entities.length >= 31, `${code} needs at least 31 entities`);
      assert.ok(language.templates.length >= 18, `${code} needs at least 18 templates`);
      assert.ok(language.templates.some(template => template.includes('{keyword}')));
      continue;
    }

    assert.deepEqual(
      [language.keywords.length, language.entities.length, language.templates.length],
      [16, 20, 10],
      `${code} should stay on its unreviewed catalog`
    );
  }
});

test('real engine runs are deterministic for a fixed seed and clock', () => {
  const settings = getDefaultSettings(catalog.topicIds);
  const first = runRealEngine(settings, 30, 'deterministic-run');
  const second = runRealEngine(settings, 30, 'deterministic-run');

  assert.deepEqual(first.events, second.events);
  assert.equal(first.events.length, 30);
  assert.ok(first.events.every(event => event.query.length > 0));
});

test('every search engine produces the right local request trace', () => {
  const expectedHosts = {
    google: 'www.google.com',
    bing: 'www.bing.com',
    duckduckgo: 'duckduckgo.com'
  };

  for (const [searchEngine, expectedHost] of Object.entries(expectedHosts)) {
    const settings = {
      ...getDefaultSettings(catalog.topicIds),
      searchEngine,
      enableAutosuggest: true
    };
    const run = runRealEngine(settings, 10, `transport-${searchEngine}`);

    assert.ok(run.events.every(event => new URL(event.searchUrl).hostname === expectedHost));
    assert.ok(run.events.every(event => event.prefixes.length >= 1));
  }
});

test('inactive and out-of-schedule settings produce no events', () => {
  const base = getDefaultSettings(catalog.topicIds);
  const settingsCases = [
    { ...base, enabled: false },
    { ...base, paused: true },
    {
      ...base,
      schedule: { enabled: true, startHour: 22, endHour: 6 }
    }
  ];

  for (const [index, settings] of settingsCases.entries()) {
    const run = runRealEngine(settings, 10, `inactive-${index}`, {
      startTime: BENCHMARK_START
    });
    assert.equal(run.scheduled, false);
    assert.equal(run.events.length, 0);
  }
});

test('balanced detector reports bounded metrics', () => {
  const settings = getDefaultSettings(catalog.topicIds);
  const run = runRealEngine(settings, 30, 'detector-bounds');
  const realQueries = [
    'best hiking shoes for wet trails',
    'easy dinner recipe for tonight',
    'how to season a cast iron pan',
    'trail map near me',
    'bread recipe without a mixer',
    'waterproof hiking jacket review',
    'quick healthy dinner ideas',
    'national park pass price',
    'how long to bake sourdough',
    'lightweight backpack comparison'
  ];
  const realTimestamps = realQueries.map((_, index) => BENCHMARK_START + index * 180000);
  const assessment = assessSearchEngine(
    realQueries,
    run.events.map(event => event.query),
    realTimestamps,
    run.events.map(event => event.timestamp),
    catalog.topicIds.map(topic => [topic]),
    { seed: 'detector-bounds' }
  );

  assert.ok(assessment.effectiveness >= 0 && assessment.effectiveness <= 100);
  assert.ok(assessment.detectionRisk >= 0 && assessment.detectionRisk <= 100);
  assert.ok(assessment.classifier.balancedAccuracy >= 0 && assessment.classifier.balancedAccuracy <= 1);
});

function readJson(filename) {
  return JSON.parse(fs.readFileSync(path.join(projectDirectory, filename), 'utf8'));
}

function enabledTopics(settings) {
  return Object.entries(settings.topics)
    .filter(([, enabled]) => enabled)
    .map(([topicId]) => topicId);
}
