// formats benchmark output for the terminal and user documentation

function formatConsoleReport(results) {
  const lines = [
    '',
    'queryveil benchmark',
    '='.repeat(88),
    `engine version: ${results.meta.version}`,
    `seed: ${results.meta.seed}`,
    `settings configurations: ${results.coverage.configurations}`,
    `pairwise setting interactions: ${results.coverage.pairwiseInteractions}`,
    `coverage failures: ${results.coverage.failures.length}`,
    '',
    row(['setting', 'score', 'resist', 'dilute', 'classifier', 'anomaly']),
    '-'.repeat(88)
  ];

  for (const scenario of results.scenarios) {
    lines.push(row([
      scenario.label,
      number(scenario.effectiveness),
      number(scenario.resistance),
      percent(scenario.profileDilution),
      scenario.classifierBalancedAccuracy === null
        ? 'n/a'
        : percent(scenario.classifierBalancedAccuracy),
      scenario.anomalyScore === null
        ? 'n/a'
        : number(scenario.anomalyScore)
    ]));
  }

  lines.push('');
  lines.push('higher score, resistance, and dilution are better. lower classifier accuracy and anomaly are better.');
  lines.push(`raw results: benchmark/results.json`);
  lines.push(`user report: BENCHMARK.md`);
  lines.push('');

  return lines.join('\n');
}

function formatMarkdownReport(results) {
  const measuredScenarios = results.scenarios.filter(scenario => scenario.effectiveness > 0);
  const best = {
    effectiveness: Math.max(...measuredScenarios.map(scenario => scenario.effectiveness)),
    resistance: Math.max(...measuredScenarios.map(scenario => scenario.resistance)),
    profileDilution: Math.max(...measuredScenarios.map(scenario => scenario.profileDilution)),
    classifierBalancedAccuracy: Math.min(...measuredScenarios.map(scenario => scenario.classifierBalancedAccuracy)),
    anomalyScore: Math.min(...measuredScenarios.map(scenario => scenario.anomalyScore))
  };
  const lines = [
    '# Benchmark and Effectiveness',
    '',
    `**Last run:** ${results.meta.generatedAt.slice(0, 10)}  `,
    `**Extension version:** ${results.meta.version}  `,
    `**Benchmark seed:** \`${results.meta.seed}\``,
    '',
    '## Summary',
    '',
    `QueryVeil passed **${results.coverage.configurations} real-engine settings configurations** with **${results.coverage.failures.length} failures**. The audit covers every user-selectable value, boundary values such as custom rates of 1 and 60 queries per hour, every topic and language, and every pair of settings at least once.`,
    '',
    '> The overall score is deliberately conservative. It combines resistance to a balanced text classifier, behavioral anomaly signals, and how much the original interest profile is diluted. It is not a promise that a search provider cannot detect generated traffic.',
    '',
    '| Configuration | Effectiveness ↑ | Detector Resistance ↑ | Profile Dilution ↑ | Classifier Accuracy ↓ | Anomaly Risk ↓ |',
    '|:---|---:|---:|---:|---:|---:|'
  ];

  for (const scenario of results.scenarios) {
    lines.push(
      `| **${titleCase(scenario.label)}** | ${bestNumber(scenario.effectiveness, best.effectiveness, '/100')} | ${bestNumber(scenario.resistance, best.resistance, '/100')} | ${bestPercent(scenario.profileDilution, best.profileDilution)} | ${scenario.classifierBalancedAccuracy === null ? 'N/A' : bestPercent(scenario.classifierBalancedAccuracy, best.classifierBalancedAccuracy)} | ${scenario.anomalyScore === null ? 'N/A' : bestNumber(scenario.anomalyScore, best.anomalyScore, '/100')} |`
    );
  }

  lines.push(
    '',
    '_Bold values mark the strongest measured result in each column. Arrows show whether higher or lower is better._',
    '',
    '### How to Read the Scores',
    '',
    '- **Effectiveness** is the combined benchmark score. Higher is better.',
    '- **Detector resistance** is the inverse of estimated detection risk. Higher is better.',
    "- **Profile dilution** measures how much noise pushes the real user's strongest topic signals out of the combined stream. Higher is better.",
    '- **Classifier accuracy** comes from balanced, stratified 5-fold validation. 50% is chance. Lower is better.',
    '- **Anomaly risk** compares lexical, topic, timing, syntax, session, and repetition patterns. Lower is better.',
    '',
    '## Test Coverage',
    '',
    `The settings audit generated **${results.coverage.generatedQueries.toLocaleString('en-US')} queries** by calling the shipped \`QueryGenerator\`, \`PersonaEngine\`, \`BehaviorSimulator\`, and \`AntiDetection\` modules. No benchmark-only query generator is used.`,
    '',
    '| Area | Coverage |',
    '|:---|:---|',
    '| **Intensity** | Low, medium, high, custom 1/hr, custom 12/hr, and custom 60/hr |',
    `| **Search engines** | ${results.coverage.values.searchEngines.map(titleCase).join(', ')} |`,
    `| **Personas** | None plus all ${results.coverage.values.personas.length - 1} shipped personas |`,
    `| **Languages** | All ${results.coverage.values.languages.length} primary languages, every additional language at 50%, and the all-language mix |`,
    `| **Topics** | All ${results.coverage.values.topics.length} topics alone, each topic disabled once, all enabled, five-topic sets, and none enabled |`,
    '| **Feature switches** | Every on/off combination for trends, autosuggest, result clicks, and debug mode |',
    '| **State and schedule** | Active, paused, off, daytime, overnight, disabled, and equal-hour all-day boundary |',
    `| **Interactions** | ${results.coverage.pairwiseInteractions} distinct pairwise value interactions |`,
    '',
    'The effectiveness trials use five synthetic but human-shaped search profiles, repeated deterministic runs, fixed trend fixtures, balanced class sizes, and a fixed clock. This keeps releases comparable and prevents live trends or the current time from moving the result around.',
    '',
    '## Feature Checks',
    '',
    '- All request URLs resolved to the selected search engine and used matching language headers.',
    `- Autosuggest produced **${results.coverage.autosuggestRequests.toLocaleString('en-US')} incremental prefix requests** in enabled cases and none in disabled cases.`,
    `- The observed result-click decision rate was **${percent(results.coverage.resultClickIntentRate)}** when that setting was enabled.`,
    '- All generated languages were recognized by the shipped language catalog.',
    '- Paused, disabled, and out-of-schedule configurations produced no search events.',
    '',
    '> **Result-click limitation:** the current service worker makes a realistic click decision but does not issue a result-page request. The benchmark measures the decision path, not live result engagement. Enabling it currently does not improve the effectiveness score.',
    '',
    '## Methodology',
    '',
    'The simulated detector uses:',
    '',
    '- A multinomial Naive Bayes text classifier with balanced, stratified 5-fold validation',
    '- TF-IDF centroid separation',
    '- Lexical and topic distribution divergence',
    '- Inter-arrival burstiness and timing distribution distance',
    '- Query length, question shape, digits, URLs, and repeated-query signals',
    '- Topic transition likelihood across sessions',
    '',
    'The benchmark never contacts Google, Bing, DuckDuckGo, or Google Trends. Transport URLs, headers, and autosuggest traces are constructed locally, and fixed trend fixtures stand in for the live feed.',
    '',
    '## Limitations',
    '',
    "- This is a reproducible adversarial simulation, not access to a search provider's private detection model.",
    '- The real-profile fixtures are intentionally small so the suite can run locally and in CI.',
    '- Multilingual noise can increase profile dilution while also being easy to separate from an English-only history. The combined score reflects both effects.',
    '- Effectiveness depends on time, volume, account history, provider behavior, and settings. No score is a guarantee of anonymity.',
    '',
    'Run `npm run benchmark` to regenerate this file and `benchmark/results.json`.'
  );

  return lines.join('\n') + '\n';
}

function row(cells) {
  const widths = [24, 10, 10, 10, 14, 10];
  return cells.map((cell, index) => String(cell).padEnd(widths[index])).join(' ');
}

function percent(value) {
  return `${(value * 100).toFixed(1)}%`;
}

function number(value) {
  return Number(value).toFixed(1);
}

function bestNumber(value, bestValue, suffix = '') {
  const rendered = `${number(value)}${suffix}`;
  return nearlyEqual(value, bestValue) ? `**${rendered}**` : rendered;
}

function bestPercent(value, bestValue) {
  const rendered = percent(value);
  return nearlyEqual(value, bestValue) ? `**${rendered}**` : rendered;
}

function nearlyEqual(left, right) {
  return Math.abs(left - right) < 0.000001;
}

function titleCase(value) {
  return String(value)
    .replace(/\b\w/g, letter => letter.toUpperCase())
    .replace('Duckduckgo', 'DuckDuckGo')
    .replace('/Hr', '/hr');
}

export { formatConsoleReport, formatMarkdownReport };
