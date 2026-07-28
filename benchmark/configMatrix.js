// builds exhaustive value coverage and pairwise interaction coverage

const SEARCH_ENGINES = ['google', 'bing', 'duckduckgo'];
const INTENSITIES = [
  { id: 'low', intensity: 'low', customRate: 12 },
  { id: 'medium', intensity: 'medium', customRate: 12 },
  { id: 'high', intensity: 'high', customRate: 12 },
  { id: 'custom-1', intensity: 'custom', customRate: 1 },
  { id: 'custom-12', intensity: 'custom', customRate: 12 },
  { id: 'custom-60', intensity: 'custom', customRate: 60 }
];
const ACTIVE_STATES = [
  { id: 'active', enabled: true, paused: false },
  { id: 'paused', enabled: true, paused: true },
  { id: 'off', enabled: false, paused: false }
];
const SCHEDULES = [
  { id: 'off', enabled: false, startHour: 9, endHour: 23 },
  { id: 'day', enabled: true, startHour: 9, endHour: 23 },
  { id: 'overnight', enabled: true, startHour: 22, endHour: 6 },
  { id: 'all-day', enabled: true, startHour: 0, endHour: 0 }
];

export function getDefaultSettings(topicIds) {
  return {
    enabled: true,
    paused: false,
    intensity: 'medium',
    customRate: 12,
    searchEngine: 'google',
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
    topics: topicMap(topicIds)
  };
}

export function buildCoverageMatrix(catalog) {
  const dimensions = buildPairwiseDimensions(catalog);
  const cases = [];
  const seen = new Set();

  const addCase = (name, values, kind) => {
    const settings = applyValues(getDefaultSettings(catalog.topicIds), values, catalog);
    const signature = JSON.stringify(settings);
    if (seen.has(signature)) return;
    seen.add(signature);
    cases.push({ name, kind, settings });
  };

  addCase('defaults', {}, 'baseline');

  for (const [dimensionIndex, dimension] of dimensions.entries()) {
    for (const [valueIndex, value] of dimension.values.entries()) {
      addCase(
        `value/${dimension.name}/${value.id}`,
        { [dimension.name]: value },
        'value'
      );

      for (let otherIndex = dimensionIndex + 1; otherIndex < dimensions.length; otherIndex++) {
        const other = dimensions[otherIndex];

        for (const [otherValueIndex, otherValue] of other.values.entries()) {
          const values = {
            [dimension.name]: value,
            [other.name]: otherValue
          };

          // rotate the remaining values so pair coverage also gets broad higher-order coverage
          for (let fillIndex = 0; fillIndex < dimensions.length; fillIndex++) {
            const fill = dimensions[fillIndex];
            if (values[fill.name]) continue;
            const offset = dimensionIndex + valueIndex + otherIndex + otherValueIndex + fillIndex;
            values[fill.name] = fill.values[offset % fill.values.length];
          }

          addCase(
            `pair/${dimension.name}-${value.id}/${other.name}-${otherValue.id}`,
            values,
            'pair'
          );
        }
      }
    }
  }

  for (const topicId of catalog.topicIds) {
    addCase(
      `topic/only-${topicId}`,
      { topicMode: { id: `only-${topicId}`, mode: 'only', topicId } },
      'topic'
    );
    addCase(
      `topic/without-${topicId}`,
      { topicMode: { id: `without-${topicId}`, mode: 'without', topicId } },
      'topic'
    );
  }

  for (const languageCode of catalog.languageCodes) {
    addCase(
      `language/primary-${languageCode}`,
      { languageMode: { id: `primary-${languageCode}`, primary: languageCode, enabled: [], mixPercentage: 0 } },
      'language'
    );

    if (languageCode !== 'en') {
      addCase(
        `language/mix-${languageCode}-50`,
        { languageMode: { id: `mix-${languageCode}-50`, primary: 'en', enabled: [languageCode], mixPercentage: 50 } },
        'language'
      );
    }
  }

  return {
    cases,
    dimensions: dimensions.map(dimension => ({
      name: dimension.name,
      values: dimension.values.map(value => value.id)
    }))
  };
}

export function buildEffectivenessScenarios(catalog) {
  const base = getDefaultSettings(catalog.topicIds);
  const coreTopics = topicMap(catalog.topicIds, false);

  for (const topic of ['news', 'technology', 'food', 'finance', 'general']) {
    if (topic in coreTopics) coreTopics[topic] = true;
  }

  return [
    {
      id: 'off',
      label: 'off',
      description: 'extension disabled',
      noiseRatio: 0,
      settings: { ...base, enabled: false }
    },
    {
      id: 'low-minimal',
      label: 'low, 5 topics',
      description: 'low intensity with five topics and realism features off',
      noiseRatio: 2,
      settings: {
        ...base,
        intensity: 'low',
        enableTrends: false,
        topics: coreTopics
      }
    },
    {
      id: 'default',
      label: 'default',
      description: 'medium intensity, all topics, trends on, no persona',
      noiseRatio: 4,
      settings: { ...base }
    },
    {
      id: 'balanced',
      label: 'balanced',
      description: 'medium intensity with autosuggest and trends',
      noiseRatio: 4,
      settings: {
        ...base,
        enableAutosuggest: true
      }
    },
    {
      id: 'aligned-persona',
      label: 'aligned persona',
      description: 'high intensity with a persona close to the real profile',
      noiseRatio: 5,
      personaByProfile: {
        cookingHiker: 'foodie',
        financeNerd: 'business',
        busyParent: 'parent',
        techGamer: 'gamer',
        careerChanger: 'techpro'
      },
      settings: {
        ...base,
        intensity: 'high',
        enableAutosuggest: true
      }
    },
    {
      id: 'decoy-persona',
      label: 'decoy persona',
      description: 'high intensity with a deliberately different ghost persona',
      noiseRatio: 5,
      personaByProfile: {
        cookingHiker: 'techpro',
        financeNerd: 'foodie',
        busyParent: 'gamer',
        techGamer: 'retiree',
        careerChanger: 'fitness'
      },
      settings: {
        ...base,
        intensity: 'high',
        enableAutosuggest: true
      }
    },
    {
      id: 'multilingual',
      label: 'multilingual',
      description: 'high intensity with every extra language mixed at 35%',
      noiseRatio: 5,
      settings: {
        ...base,
        intensity: 'high',
        enableAutosuggest: true,
        languages: {
          primary: 'en',
          enabled: catalog.languageCodes.filter(code => code !== 'en'),
          mixPercentage: 35
        }
      }
    },
    {
      id: 'maximum-volume',
      label: 'custom 30/hr',
      description: 'custom 30 per hour with all realism features enabled',
      noiseRatio: 6,
      settings: {
        ...base,
        intensity: 'custom',
        customRate: 30,
        enableResultClicks: true,
        enableAutosuggest: true,
        enableTrends: true
      }
    }
  ];
}

function buildPairwiseDimensions(catalog) {
  const primaryLanguages = ['en', ...catalog.languageCodes.filter(code => code !== 'en').slice(0, 3)];
  const extraLanguages = catalog.languageCodes.filter(code => code !== 'en');
  const allTopics = { id: 'all', mode: 'all' };
  const noTopics = { id: 'none', mode: 'none' };
  const coreTopics = { id: 'core-five', mode: 'list', topicIds: ['news', 'technology', 'food', 'finance', 'general'] };
  const singleTopic = { id: 'technology-only', mode: 'only', topicId: 'technology' };
  const narrowTopics = { id: 'privacy-mix', mode: 'list', topicIds: ['technology', 'finance', 'careers', 'science', 'general'] };

  return [
    { name: 'activeState', values: ACTIVE_STATES },
    { name: 'intensity', values: INTENSITIES },
    { name: 'searchEngine', values: SEARCH_ENGINES.map(id => ({ id })) },
    { name: 'persona', values: ['none', ...catalog.personaIds].map(id => ({ id })) },
    { name: 'autosuggest', values: [false, true].map(value => ({ id: value ? 'on' : 'off', value })) },
    { name: 'trends', values: [false, true].map(value => ({ id: value ? 'on' : 'off', value })) },
    { name: 'resultClicks', values: [false, true].map(value => ({ id: value ? 'on' : 'off', value })) },
    { name: 'debugMode', values: [false, true].map(value => ({ id: value ? 'on' : 'off', value })) },
    {
      name: 'languageMode',
      values: [
        ...primaryLanguages.map(code => ({ id: `primary-${code}`, primary: code, enabled: [], mixPercentage: 0 })),
        { id: 'all-mixed-50', primary: 'en', enabled: extraLanguages, mixPercentage: 50 }
      ]
    },
    { name: 'topicMode', values: [allTopics, coreTopics, narrowTopics, singleTopic, noTopics] },
    { name: 'schedule', values: SCHEDULES }
  ];
}

function applyValues(settings, values, catalog) {
  const output = JSON.parse(JSON.stringify(settings));

  if (values.activeState) {
    output.enabled = values.activeState.enabled;
    output.paused = values.activeState.paused;
  }
  if (values.intensity) {
    output.intensity = values.intensity.intensity;
    output.customRate = values.intensity.customRate;
  }
  if (values.searchEngine) output.searchEngine = values.searchEngine.id;
  if (values.persona) output.persona = values.persona.id;
  if (values.autosuggest) output.enableAutosuggest = values.autosuggest.value;
  if (values.trends) output.enableTrends = values.trends.value;
  if (values.resultClicks) output.enableResultClicks = values.resultClicks.value;
  if (values.debugMode) output.debugMode = values.debugMode.value;
  if (values.languageMode) {
    output.languages = {
      primary: values.languageMode.primary,
      enabled: [...values.languageMode.enabled],
      mixPercentage: values.languageMode.mixPercentage
    };
  }
  if (values.topicMode) {
    output.topics = topicSettings(values.topicMode, catalog.topicIds);
  }
  if (values.schedule) {
    output.schedule = {
      enabled: values.schedule.enabled,
      startHour: values.schedule.startHour,
      endHour: values.schedule.endHour
    };
  }

  return output;
}

function topicSettings(mode, topicIds) {
  if (mode.mode === 'all') return topicMap(topicIds);
  if (mode.mode === 'none') return topicMap(topicIds, false);

  const topics = topicMap(topicIds, mode.mode === 'without');

  if (mode.mode === 'only') {
    topics[mode.topicId] = true;
  } else if (mode.mode === 'without') {
    topics[mode.topicId] = false;
  } else if (mode.mode === 'list') {
    for (const topicId of mode.topicIds) {
      if (topicId in topics) topics[topicId] = true;
    }
  }

  return topics;
}

function topicMap(topicIds, enabled = true) {
  return Object.fromEntries(topicIds.map(topicId => [topicId, enabled]));
}

export { ACTIVE_STATES, INTENSITIES, SCHEDULES, SEARCH_ENGINES };
