import assert from 'node:assert/strict';
import test from 'node:test';

import { buildSearchURL, matchSearchURL, learnParams, isBlockedURL, ENGINES } from '../background/engines.js';
import { RequestShaper } from '../background/requestShaper.js';
import { AntiDetection, parseSuggestions } from '../background/antiDetection.js';
import { BehaviorSimulator } from '../background/behaviorSimulator.js';
import { QueryGenerator } from '../background/queryGenerator.js';
import { PersonaEngine } from '../background/personaEngine.js';
import { personalizeTopics, personalizePersona, stableSubset, topicLeanings } from '../background/installProfile.js';
import { detectRegion } from '../background/trendProvider.js';
import { withSeed } from './random.js';

const headerMap = headers => Object.fromEntries(headers.map(h => [h.name.toLowerCase(), h.value]));

test('search urls match what firefox 159 builds for each engine', () => {
  // captured from browser.search.search() on firefox 159 (default region)
  assert.equal(buildSearchURL('google', 'test query'), 'https://www.google.com/search?client=firefox-b-d&q=test+query');
  assert.equal(buildSearchURL('bing', 'test query'), 'https://www.bing.com/search?pc=MOZI&form=MOZLBR&q=test+query');
  assert.equal(buildSearchURL('duckduckgo', 'test query'), 'https://duckduckgo.com/?t=ffab&q=test+query');
  assert.equal(
    buildSearchURL('google', 'a b', [['client', 'firefox-b-1-d'], ['channel', 'entpr']]),
    'https://www.google.com/search?client=firefox-b-1-d&channel=entpr&q=a+b'
  );
});

test('learning from real searches keeps build params and never the query', () => {
  const match = matchSearchURL('https://www.google.com/search?client=firefox-b-1-d&q=secret+thing&oq=secret&gs_lp=xyz');
  assert.equal(match.engine.id, 'google');
  assert.deepEqual(learnParams(match.engine, match.params), [['client', 'firefox-b-1-d']]);
  assert.equal(matchSearchURL('https://www.google.com/maps'), null);
  assert.ok(isBlockedURL('google', 'https://www.google.com/sorry/index?continue=x'));
  assert.ok(!isBlockedURL('google', 'https://www.google.com/search?q=x'));
});

test('suggest urls use the firefox address bar endpoints', () => {
  assert.equal(ENGINES.google.suggestURL('ab c'), 'https://www.google.com/complete/search?client=firefox&channel=fen&q=ab+c');
  assert.equal(ENGINES.bing.suggestURL('ab'), 'https://www.bing.com/osjson.aspx?form=OSDJAS&query=ab');
  assert.equal(ENGINES.duckduckgo.suggestURL('ab'), 'https://ac.duckduckgo.com/ac/?q=ab&type=list');
  assert.deepEqual(parseSuggestions('["ab",["abc","abd"]]'), ['abc', 'abd']);
  assert.deepEqual(parseSuggestions('not json'), []);
});

test('a background fetch is reshaped into a typed navigation', () => {
  const shaper = new RequestShaper();
  const url = buildSearchURL('google', 'hello');
  shaper.expectFetch(url);
  // what firefox 159 actually sent for a background fetch
  const result = shaper.shape({
    url,
    tabId: -1,
    type: 'xmlhttprequest',
    requestHeaders: [
      { name: 'Host', value: 'www.google.com' },
      { name: 'User-Agent', value: 'ua' },
      { name: 'Accept', value: '*/*' },
      { name: 'Accept-Language', value: 'en-GB,en;q=0.9' },
      { name: 'Cookie', value: 'NID=1' },
      { name: 'Sec-Fetch-Dest', value: 'empty' },
      { name: 'Sec-Fetch-Mode', value: 'cors' },
      { name: 'Sec-Fetch-Site', value: 'same-origin' },
      { name: 'Priority', value: 'u=4' }
    ]
  });
  const h = headerMap(result.requestHeaders);
  assert.equal(h.accept, 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8');
  assert.equal(h['sec-fetch-dest'], 'document');
  assert.equal(h['sec-fetch-mode'], 'navigate');
  assert.equal(h['sec-fetch-site'], 'none');
  assert.equal(h['sec-fetch-user'], '?1');
  assert.equal(h.priority, 'u=0, i');
  assert.equal(h['upgrade-insecure-requests'], '1');
  assert.equal(h.cookie, 'NID=1');
  assert.equal(h['accept-language'], 'en-GB,en;q=0.9');
  // firefox's own order: user-agent before accept, cookie before sec-fetch
  const names = result.requestHeaders.map(x => x.name.toLowerCase());
  assert.ok(names.indexOf('user-agent') < names.indexOf('accept'));
  assert.ok(names.indexOf('cookie') < names.indexOf('sec-fetch-dest'));
  // only once per expected url
  assert.deepEqual(shaper.shape({ url, tabId: -1, type: 'xmlhttprequest', requestHeaders: [] }), {});
});

test('cover tab navigations get address bar activation headers', () => {
  const shaper = new RequestShaper();
  shaper.markCoverTab(7, 'typed');
  const headers = [
    { name: 'Accept', value: 'text/html' },
    { name: 'Sec-Fetch-Site', value: 'same-origin' }
  ];
  const typed = headerMap(shaper.shape({ url: 'https://www.google.com/search?q=x', tabId: 7, type: 'main_frame', requestHeaders: headers }).requestHeaders);
  assert.equal(typed['sec-fetch-site'], 'none');
  assert.equal(typed['sec-fetch-user'], '?1');

  shaper.markCoverTab(7, 'click');
  const click = headerMap(shaper.shape({ url: 'https://www.google.com/url?q=x', tabId: 7, type: 'main_frame', requestHeaders: headers }).requestHeaders);
  assert.equal(click['sec-fetch-site'], 'same-origin');
  assert.equal(click['sec-fetch-user'], '?1');

  // subresources and other tabs are left alone
  assert.deepEqual(shaper.shape({ url: 'https://www.google.com/x.js', tabId: 7, type: 'script', requestHeaders: headers }), {});
  assert.deepEqual(shaper.shape({ url: 'https://www.google.com/search?q=x', tabId: 8, type: 'main_frame', requestHeaders: headers }), {});
});

test('suggest requests lose cookies and sec-fetch like firefox own', () => {
  const shaper = new RequestShaper();
  const url = ENGINES.google.suggestURL('ab');
  shaper.expectSuggest(url);
  const h = headerMap(shaper.shape({
    url,
    tabId: -1,
    type: 'xmlhttprequest',
    requestHeaders: [
      { name: 'Accept', value: '*/*' },
      { name: 'Cookie', value: 'NID=1' },
      { name: 'Sec-Fetch-Site', value: 'same-origin' }
    ]
  }).requestHeaders);
  assert.equal(h.cookie, undefined);
  assert.equal(h['sec-fetch-site'], undefined);
  assert.equal(h.accept, '*/*');
});

test('user searches are noticed only outside cover tabs', () => {
  const seen = [];
  const learned = [];
  const shaper = new RequestShaper({
    onUserSearch: id => seen.push(id),
    onLearnedParams: (id, params) => learned.push([id, params])
  });
  shaper.markCoverTab(3, 'typed');
  shaper.observe({ tabId: 3, url: 'https://www.google.com/search?client=firefox-b-d&q=a' });
  shaper.observe({ tabId: 4, url: 'https://www.google.com/search?client=firefox-b-1-d&q=a' });
  shaper.observe({ tabId: 4, url: 'https://www.google.com/search?q=from+homepage' });
  assert.deepEqual(seen, ['google', 'google']);
  assert.deepEqual(learned, [['google', [['client', 'firefox-b-1-d']]]]);
});

test('typing sends one suggest per keystroke at human speed', () => {
  const transport = new AntiDetection();
  const prefixes = transport.generateTypingPrefixes('best pizza');
  assert.deepEqual(prefixes, ['b', 'be', 'bes', 'best', 'best p', 'best pi', 'best piz', 'best pizz', 'best pizza']);
  const delays = withSeed(1, () => transport.generateKeystrokeDelays('best pizza', prefixes.length));
  assert.equal(delays.length, prefixes.length);
  const mean = delays.reduce((a, b) => a + b, 0) / delays.length;
  assert.ok(mean > 80 && mean < 900, `mean keystroke gap ${mean}`);
});

test('idle state gates scheduled searches', () => {
  const behavior = new BehaviorSimulator();
  assert.equal(behavior.shouldRunForIdleState('locked'), false);
  assert.equal(behavior.shouldRunForIdleState('active'), true);
  const idleRuns = withSeed(5, () => Array.from({ length: 1000 }, () => behavior.shouldRunForIdleState('idle')).filter(Boolean).length);
  assert.ok(idleRuns > 40 && idleRuns < 180);
});

test('install profiles are stable per seed and differ between installs', () => {
  const generator = new QueryGenerator();
  const a1 = personalizeTopics(generator.initializeTopics(), { seed: 11 });
  const a2 = personalizeTopics(generator.initializeTopics(), { seed: 11 });
  const b = personalizeTopics(generator.initializeTopics(), { seed: 12 });
  assert.deepEqual(a1, a2);
  assert.notDeepEqual(a1.shopping.entities, b.shopping.entities);
  const full = generator.initializeTopics().shopping.entities.length;
  assert.ok(a1.shopping.entities.length < full && a1.shopping.entities.length >= 6);
  assert.deepEqual(stableSubset([1, 2, 3], 1, 'x', 0.5), [1, 2, 3]);
  const lean = topicLeanings(['news', 'food'], { seed: 3 });
  assert.ok(lean.news >= 0.5 && lean.news <= 1.7);
});

test('personas keep a stable core and drift a little month to month', () => {
  const persona = new PersonaEngine().getActivePersona({ persona: 'student' });
  const profile = { seed: 99 };
  const jan = personalizePersona(persona, profile, new Date(2026, 0, 10));
  const janAgain = personalizePersona(persona, profile, new Date(2026, 0, 28));
  const feb = personalizePersona(persona, profile, new Date(2026, 1, 10));
  assert.deepEqual(jan, janAgain);
  const janSet = new Set(Object.values(jan.entities).flat());
  const febSet = new Set(Object.values(feb.entities).flat());
  const shared = [...janSet].filter(item => febSet.has(item)).length;
  assert.ok(shared / janSet.size > 0.6, 'most interests carry over');
  assert.equal(personalizePersona(persona, null, new Date()), persona);
});

test('sessions keep one language and years are never stale', () => {
  const date = () => new Date(2031, 4, 1);
  const generator = new QueryGenerator({ date });
  const settings = { topics: {}, languages: { primary: 'en', enabled: ['fr'], mixPercentage: 100 } };
  const session = {};
  const results = withSeed(4, () => Array.from({ length: 6 }, () => generator.generateQuery('medium', settings, session, null, [])));
  assert.ok(results.every(result => result.language === results[0].language));

  const persona = new PersonaEngine().getActivePersona({ persona: 'gamer' });
  const queries = withSeed(9, () => Array.from({ length: 300 }, () => generator.generateQuery('short', { topics: {} }, null, persona, []).query));
  assert.ok(queries.every(query => !query.includes('{year}')));
  assert.ok(queries.every(query => !/\b2025\b/.test(query)));
});

test('region for trends comes from the browser language', () => {
  assert.equal(detectRegion(['en-GB', 'en']), 'GB');
  assert.equal(detectRegion(['de']), 'US');
  assert.equal(detectRegion([]), 'US');
});
