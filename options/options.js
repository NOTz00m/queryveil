const browser = globalThis.browser || globalThis.chrome;

const topicCategories = [
  { id: 'news', label: 'News' },
  { id: 'shopping', label: 'Shopping' },
  { id: 'entertainment', label: 'Entertainment' },
  { id: 'technology', label: 'Technology' },
  { id: 'health', label: 'Health' },
  { id: 'travel', label: 'Travel' },
  { id: 'food', label: 'Food' },
  { id: 'education', label: 'Education' },
  { id: 'gaming', label: 'Gaming' },
  { id: 'finance', label: 'Finance' },
  { id: 'hobbies', label: 'Hobbies' },
  { id: 'local', label: 'Local' },
  { id: 'general', label: 'General' },
  { id: 'automotive', label: 'Automotive' },
  { id: 'pets', label: 'Pets' },
  { id: 'realestate', label: 'Real estate' },
  { id: 'careers', label: 'Careers' },
  { id: 'parenting', label: 'Parenting' },
  { id: 'science', label: 'Science' },
  { id: 'sports', label: 'Sports' }
];

const availableLanguages = [
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'ar', name: 'Arabic' },
  { code: 'hi', name: 'Hindi' },
  { code: 'it', name: 'Italian' },
  { code: 'nl', name: 'Dutch' },
  { code: 'tr', name: 'Turkish' },
  { code: 'pl', name: 'Polish' },
  { code: 'ru', name: 'Russian' }
];

const recommendedTopics = new Set([
  'news',
  'technology',
  'food',
  'finance',
  'general',
  'shopping',
  'entertainment',
  'local'
]);

let currentSettings = null;
let personaList = [];
let isDirty = false;

document.addEventListener('DOMContentLoaded', async () => {
  await Promise.all([loadSettings(), loadPersonas()]);
  populateTopicGrid();
  populateLanguageGrid();
  updateUI();
  setupEventListeners();
  setDirty(false);

  browser.runtime.onMessage.addListener(message => {
    if (message.type !== 'statusUpdated' || isDirty) return;
    currentSettings = message.settings;
    updateUI();
  });
});

async function loadSettings() {
  try {
    const response = await browser.runtime.sendMessage({ type: 'getStatus' });
    currentSettings = response.settings;
  } catch (error) {
    console.error('error loading settings:', error);
    currentSettings = getDefaultSettings();
  }
}

async function loadPersonas() {
  try {
    const response = await browser.runtime.sendMessage({ type: 'getPersonas' });
    if (!response?.personas) return;

    personaList = response.personas;
    const select = document.getElementById('persona');
    for (const persona of personaList) {
      const option = document.createElement('option');
      option.value = persona.id;
      option.textContent = persona.name;
      select.appendChild(option);
    }
  } catch (error) {
    console.error('error loading personas:', error);
  }
}

function getDefaultSettings() {
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
    topics: Object.fromEntries(topicCategories.map(topic => [topic.id, true]))
  };
}

function populateTopicGrid() {
  const grid = document.getElementById('topicGrid');
  grid.replaceChildren(...topicCategories.map(topic => createChoice(
    `topic-${topic.id}`,
    topic.label,
    'topic-checkbox',
    currentSettings?.topics?.[topic.id] !== false
  )));
}

function populateLanguageGrid() {
  const enabled = new Set(currentSettings?.languages?.enabled || []);
  const grid = document.getElementById('languageGrid');
  grid.replaceChildren(...availableLanguages.map(language => createChoice(
    `lang-${language.code}`,
    language.name,
    'language-checkbox',
    enabled.has(language.code)
  )));
}

function createChoice(id, labelText, className, checked) {
  const item = document.createElement('div');
  const checkbox = document.createElement('input');
  const label = document.createElement('label');

  item.className = 'topic-item';
  checkbox.type = 'checkbox';
  checkbox.className = className;
  checkbox.id = id;
  checkbox.checked = checked;
  label.className = 'topic-label';
  label.htmlFor = id;
  label.textContent = labelText;
  item.append(checkbox, label);

  return item;
}

function updateUI() {
  if (!currentSettings) return;

  setValue('intensity', currentSettings.intensity || 'medium');
  setValue('customRate', currentSettings.customRate ?? 12);
  setValue('searchEngine', currentSettings.searchEngine || 'google');
  setChecked('enableResultClicks', currentSettings.enableResultClicks);
  setChecked('enableAutosuggest', currentSettings.enableAutosuggest);
  setChecked('enableTrends', currentSettings.enableTrends !== false);
  setChecked('debugMode', currentSettings.debugMode);
  setValue('persona', currentSettings.persona || 'none');
  setChecked('scheduleEnabled', currentSettings.schedule?.enabled);
  setValue('startHour', currentSettings.schedule?.startHour ?? 9);
  setValue('endHour', currentSettings.schedule?.endHour ?? 23);
  setValue('primaryLanguage', currentSettings.languages?.primary || 'en');
  setValue('langMixPercentage', currentSettings.languages?.mixPercentage ?? 0);

  const enabledLanguages = new Set(currentSettings.languages?.enabled || []);
  for (const language of availableLanguages) {
    setChecked(`lang-${language.code}`, enabledLanguages.has(language.code));
  }
  for (const topic of topicCategories) {
    setChecked(`topic-${topic.id}`, currentSettings.topics?.[topic.id] !== false);
  }

  updateConditionalFields();
  updatePersonaDescription();
  updateCounts();
  updateSummary();
}

function setupEventListeners() {
  const form = document.getElementById('settingsForm');
  form.addEventListener('submit', saveSettings);
  form.addEventListener('change', handleFormChange);
  form.addEventListener('input', handleFormChange);

  document.getElementById('customRate').addEventListener('input', event => {
    clampInput(event.target, 1, 60);
  });
  document.getElementById('langMixPercentage').addEventListener('input', event => {
    clampInput(event.target, 0, 50);
  });
  document.getElementById('startHour').addEventListener('input', event => {
    clampInput(event.target, 0, 23);
  });
  document.getElementById('endHour').addEventListener('input', event => {
    clampInput(event.target, 0, 23);
  });
  document.getElementById('allTopicsBtn').addEventListener('click', () => {
    setTopicSelection(() => true);
  });
  document.getElementById('recommendedTopicsBtn').addEventListener('click', () => {
    setTopicSelection(topicId => recommendedTopics.has(topicId));
  });
  document.getElementById('panicBtn').addEventListener('click', panicStop);
}

function handleFormChange(event) {
  if (event.target.id === 'persona') updatePersonaDescription();
  updateConditionalFields();
  updateCounts();
  updateSummary();
  setDirty(true);
}

function updateConditionalFields() {
  const customRateGroup = document.getElementById('customRateGroup');
  customRateGroup.style.display = getValue('intensity') === 'custom' ? 'flex' : 'none';

  const scheduleEnabled = isChecked('scheduleEnabled');
  const scheduleHours = document.getElementById('scheduleHours');
  scheduleHours.style.opacity = scheduleEnabled ? '1' : '0.45';
  for (const input of scheduleHours.querySelectorAll('input')) {
    input.disabled = !scheduleEnabled;
  }

  const hasAdditionalLanguage = availableLanguages.some(language => isChecked(`lang-${language.code}`));
  document.getElementById('langMixGroup').style.display = hasAdditionalLanguage ? 'flex' : 'none';
}

function updatePersonaDescription() {
  const element = document.getElementById('personaDescription');
  const selected = getValue('persona');
  const persona = personaList.find(item => item.id === selected);

  if (!persona) {
    element.textContent = '';
    element.style.display = 'none';
    return;
  }

  element.textContent = persona.description;
  element.style.display = 'block';
}

function updateCounts() {
  const topicCount = topicCategories.filter(topic => isChecked(`topic-${topic.id}`)).length;
  const languageCount = availableLanguages.filter(language => isChecked(`lang-${language.code}`)).length;
  document.getElementById('topicCount').textContent = `${topicCount} selected`;
  document.getElementById('languageCount').textContent = `${languageCount} selected`;
}

function updateSummary() {
  const topicCount = topicCategories.filter(topic => isChecked(`topic-${topic.id}`)).length;
  const intensity = getValue('intensity');
  const pace = intensity === 'custom'
    ? `${integerValue('customRate', 12)}/hr`
    : intensity;
  const engine = {
    google: 'Google',
    bing: 'Bing',
    duckduckgo: 'DuckDuckGo'
  }[getValue('searchEngine')];
  const persona = getValue('persona');
  const personaText = persona === 'none' ? 'Random profile' : 'Focused persona';
  const trends = isChecked('enableTrends') ? 'live trends' : 'static topics';

  const paceLabel = pace.replace(/^./, letter => letter.toUpperCase());
  document.getElementById('profileSummary').textContent = `${paceLabel}, ${engine}, ${topicCount} topics`;
  document.getElementById('profileDetail').textContent = `${personaText} with ${trends}`;
}

function setTopicSelection(predicate) {
  for (const topic of topicCategories) {
    setChecked(`topic-${topic.id}`, predicate(topic.id));
  }
  updateCounts();
  updateSummary();
  setDirty(true);
}

async function saveSettings(event) {
  event.preventDefault();
  const saveButton = document.getElementById('saveBtn');
  const settings = collectSettings();

  if (settings.intensity === 'custom' &&
      (settings.customRate < 1 || settings.customRate > 60)) {
    alert('Custom rate must be between 1 and 60 queries per hour.');
    return;
  }

  saveButton.textContent = 'Saving...';
  saveButton.disabled = true;

  try {
    await browser.runtime.sendMessage({
      type: 'updateSettings',
      settings
    });
    currentSettings = settings;
    saveButton.textContent = 'Saved';
    setDirty(false);

    setTimeout(() => {
      saveButton.textContent = 'Save settings';
      saveButton.disabled = false;
    }, 1200);
  } catch (error) {
    console.error('error saving settings:', error);
    alert('Could not save settings.');
    saveButton.textContent = 'Save settings';
    saveButton.disabled = false;
  }
}

function collectSettings() {
  const topics = Object.fromEntries(
    topicCategories.map(topic => [topic.id, isChecked(`topic-${topic.id}`)])
  );
  const enabledLanguages = availableLanguages
    .filter(language => isChecked(`lang-${language.code}`))
    .map(language => language.code);

  return {
    enabled: currentSettings?.enabled || false,
    paused: currentSettings?.paused || false,
    intensity: getValue('intensity'),
    customRate: integerValue('customRate', 12),
    searchEngine: getValue('searchEngine'),
    enableResultClicks: isChecked('enableResultClicks'),
    enableAutosuggest: isChecked('enableAutosuggest'),
    enableTrends: isChecked('enableTrends'),
    persona: getValue('persona'),
    debugMode: isChecked('debugMode'),
    languages: {
      primary: getValue('primaryLanguage'),
      enabled: enabledLanguages,
      mixPercentage: integerValue('langMixPercentage', 0)
    },
    schedule: {
      enabled: isChecked('scheduleEnabled'),
      startHour: integerValue('startHour', 9),
      endHour: integerValue('endHour', 23)
    },
    topics
  };
}

async function panicStop() {
  const confirmed = confirm(
    'Stop all generated searches now? Your settings and local counters will stay in place.'
  );
  if (!confirmed) return;

  try {
    await browser.runtime.sendMessage({ type: 'panic' });
    window.close();
  } catch (error) {
    console.error('error stopping queryveil:', error);
  }
}

function setDirty(value) {
  isDirty = value;
  const state = document.getElementById('unsavedState');
  state.textContent = value ? 'Unsaved changes' : 'No unsaved changes';
  state.classList.toggle('is-dirty', value);
}

function clampInput(input, minimum, maximum) {
  if (input.value === '') return;
  const value = Number.parseInt(input.value, 10);
  if (value < minimum) input.value = minimum;
  if (value > maximum) input.value = maximum;
}

function getValue(id) {
  return document.getElementById(id).value;
}

function setValue(id, value) {
  document.getElementById(id).value = value;
}

function isChecked(id) {
  return document.getElementById(id).checked;
}

function setChecked(id, value) {
  document.getElementById(id).checked = Boolean(value);
}

function integerValue(id, fallback) {
  const value = Number.parseInt(getValue(id), 10);
  return Number.isNaN(value) ? fallback : value;
}
