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
  { id: 'automotive', label: 'Cars' },
  { id: 'pets', label: 'Pets' },
  { id: 'realestate', label: 'Housing' },
  { id: 'careers', label: 'Careers' },
  { id: 'parenting', label: 'Parenting' },
  { id: 'science', label: 'Science' },
  { id: 'sports', label: 'Sports' }
];

// reviewed means a native speaker has gone over the catalog, see CONTRIBUTING.md
const languages = [
  { code: 'en', name: 'English', reviewed: true },
  { code: 'es', name: 'Spanish', reviewed: true },
  { code: 'fr', name: 'French', reviewed: true },
  { code: 'de', name: 'German', reviewed: true },
  { code: 'pt', name: 'Portuguese', reviewed: true },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean', reviewed: true },
  { code: 'ar', name: 'Arabic' },
  { code: 'hi', name: 'Hindi' },
  { code: 'it', name: 'Italian' },
  { code: 'nl', name: 'Dutch' },
  { code: 'tr', name: 'Turkish' },
  { code: 'pl', name: 'Polish', reviewed: true },
  { code: 'ro', name: 'Romanian', reviewed: true },
  { code: 'ru', name: 'Russian' }
];
const extraLanguages = languages.filter(language => language.code !== 'en');

const recommendedTopics = new Set([
  'news', 'technology', 'food', 'finance', 'general', 'shopping', 'entertainment', 'local'
]);

const ENGINES = { google: 'Google', bing: 'Bing', duckduckgo: 'DuckDuckGo' };
const RATES = { low: 6, medium: 12, high: 20 };

let currentSettings = null;
let pageModeSupported = true;
let personaList = [];
let saveTimer = null;
let savePending = false;

document.addEventListener('DOMContentLoaded', async () => {
  const [status] = await Promise.all([loadStatus(), loadPersonas()]);
  currentSettings = status?.settings || getDefaultSettings();
  pageModeSupported = status?.capabilities?.pageMode !== false;
  renderRunState(status);

  buildHourSelects();
  buildPersonaList();
  buildLanguageControls();
  buildTopicChips();
  fillForm();
  setupEventListeners();
  trackCurrentSection();

  browser.runtime.onMessage.addListener(message => {
    if (message.type !== 'statusUpdated') return;
    renderRunState(message);
    // don't stomp on edits that haven't been written yet
    if (savePending) return;
    currentSettings = message.settings;
    fillForm();
  });
});

async function loadStatus() {
  try {
    return await browser.runtime.sendMessage({ type: 'getStatus' });
  } catch (error) {
    console.error('error loading settings:', error);
    return null;
  }
}

async function loadPersonas() {
  try {
    const response = await browser.runtime.sendMessage({ type: 'getPersonas' });
    personaList = response?.personas || [];
  } catch (error) {
    console.error('error loading personas:', error);
  }
}

function getDefaultSettings() {
  return {
    intensity: 'medium',
    customRate: 12,
    searchEngine: 'google',
    requestMode: 'page',
    followActivity: true,
    enableResultClicks: false,
    enableAutosuggest: false,
    enableTrends: true,
    persona: 'none',
    debugMode: false,
    languages: { primary: 'en', enabled: [], mixPercentage: 0 },
    schedule: { enabled: false, startHour: 9, endHour: 23 },
    topics: Object.fromEntries(topicCategories.map(topic => [topic.id, true]))
  };
}

// building the dynamic parts of the form

function buildHourSelects() {
  for (const id of ['startHour', 'endHour']) {
    const select = document.getElementById(id);
    for (let hour = 0; hour < 24; hour++) {
      select.add(new Option(`${String(hour).padStart(2, '0')}:00`, String(hour)));
    }
  }
}

function buildPersonaList() {
  const options = [
    { id: 'none', name: 'No persona', description: 'Broad, unrelated searches across your topics' },
    ...personaList
  ];
  document.getElementById('personaList').replaceChildren(...options.map(persona => {
    const label = document.createElement('label');
    const input = document.createElement('input');
    const body = document.createElement('span');
    const name = document.createElement('b');
    const description = document.createElement('small');

    input.type = 'radio';
    input.name = 'persona';
    input.value = persona.id;
    name.textContent = persona.name;
    description.textContent = persona.description;
    body.append(name, description);
    label.append(input, body);
    return label;
  }));
}

function buildLanguageControls() {
  const primary = document.getElementById('primaryLanguage');
  for (const language of languages) {
    primary.add(new Option(language.name, language.code));
  }

  document.getElementById('languageChips').replaceChildren(...extraLanguages.map(language => (
    createChip(`lang-${language.code}`, language.name, language.reviewed)
  )));
}

function buildTopicChips() {
  document.getElementById('topicChips').replaceChildren(...topicCategories.map(topic => (
    createChip(`topic-${topic.id}`, topic.label)
  )));
}

function createChip(id, text, reviewed = false) {
  const label = document.createElement('label');
  const input = document.createElement('input');
  const body = document.createElement('span');

  input.type = 'checkbox';
  input.id = id;
  body.textContent = text;
  if (reviewed) {
    const mark = document.createElement('span');
    mark.className = 'reviewed-mark';
    mark.textContent = '✓';
    mark.title = 'Reviewed by a native speaker';
    body.append(mark);
  }
  label.append(input, body);
  return label;
}

// settings to form

function fillForm() {
  const settings = currentSettings;
  if (!settings) return;

  setRadio('intensity', settings.intensity || 'medium');
  setValue('customRate', settings.customRate ?? 12);
  setRadio('searchEngine', settings.searchEngine || 'google');
  setRadio('persona', settings.persona || 'none');
  setRadio('requestMode', pageModeSupported ? (settings.requestMode || 'page') : 'background');
  setChecked('followActivity', settings.followActivity !== false);
  setChecked('enableAutosuggest', settings.enableAutosuggest);
  setChecked('enableTrends', settings.enableTrends !== false);
  setChecked('enableResultClicks', settings.enableResultClicks);
  setChecked('debugMode', settings.debugMode);
  setChecked('scheduleEnabled', settings.schedule?.enabled);
  setValue('startHour', settings.schedule?.startHour ?? 9);
  setValue('endHour', settings.schedule?.endHour ?? 23);
  setValue('primaryLanguage', settings.languages?.primary || 'en');
  setValue('langMixPercentage', settings.languages?.mixPercentage || 15);

  const enabledLanguages = new Set(settings.languages?.enabled || []);
  for (const language of extraLanguages) {
    setChecked(`lang-${language.code}`, enabledLanguages.has(language.code));
  }
  for (const topic of topicCategories) {
    setChecked(`topic-${topic.id}`, settings.topics?.[topic.id] !== false);
  }

  renderDerived();
}

// everything on the page that depends on the current form values
function renderDerived() {
  const intensity = getRadio('intensity');
  document.getElementById('customRateRow').hidden = intensity !== 'custom';

  const pageInput = document.querySelector('input[name="requestMode"][value="page"]');
  pageInput.disabled = !pageModeSupported;
  pageInput.parentElement.classList.toggle('is-disabled', !pageModeSupported);
  document.getElementById('modeUnsupported').hidden = pageModeSupported;
  document.getElementById('customRateOut').textContent = `${getInt('customRate', 12)}/hr`;

  // the main language can't also be an extra one
  const primary = getValue('primaryLanguage');
  for (const language of extraLanguages) {
    const input = document.getElementById(`lang-${language.code}`);
    input.disabled = language.code === primary;
    if (input.disabled) input.checked = false;
    input.parentElement.classList.toggle('is-disabled', input.disabled);
  }

  const extraCount = extraLanguages.filter(language => isChecked(`lang-${language.code}`)).length;
  document.getElementById('mixRow').hidden = extraCount === 0;
  document.getElementById('langMixOut').textContent = `${getInt('langMixPercentage', 15)}%`;

  const topicCount = topicCategories.filter(topic => isChecked(`topic-${topic.id}`)).length;
  document.getElementById('topicCount').textContent = `${topicCount} of ${topicCategories.length}`;
  document.getElementById('topicWarning').hidden = topicCount >= 5 || getRadio('persona') !== 'none';

  renderSchedule();
  renderSummary(topicCount);
}

function renderSchedule() {
  const enabled = isChecked('scheduleEnabled');
  const start = getInt('startHour', 9);
  const end = getInt('endHour', 23);
  const row = document.getElementById('scheduleRow');
  row.classList.toggle('is-disabled', !enabled);
  for (const select of row.querySelectorAll('select')) select.disabled = !enabled;

  // active window is [start, end), wrapping past midnight when start > end
  const spans = start === end
    ? [[0, 24]]
    : start < end ? [[start, end]] : [[start, 24], [0, end]];
  const hours = spans.reduce((total, [from, to]) => total + to - from, 0);

  const bar = document.getElementById('dayBar');
  const pieces = spans.map(([from, to]) => {
    const piece = document.createElement('span');
    piece.style.left = `${(from / 24) * 100}%`;
    piece.style.width = `${((to - from) / 24) * 100}%`;
    return piece;
  });
  const now = new Date();
  const marker = document.createElement('span');
  marker.className = 'now';
  marker.style.left = `${((now.getHours() + now.getMinutes() / 60) / 24) * 100}%`;
  bar.replaceChildren(...pieces, marker);

  let note = `${hours} hours a day`;
  if (start === end) note = 'Same start and end runs all day';
  else if (start > end && end > 0) note += ', overnight';
  document.getElementById('hoursNote').textContent = note;
}

function renderSummary(topicCount) {
  const intensity = getRadio('intensity');
  const rate = intensity === 'custom' ? getInt('customRate', 12) : RATES[intensity];
  const personaId = getRadio('persona');
  const persona = personaList.find(item => item.id === personaId);
  const parts = [
    `About ${rate} searches an hour on ${ENGINES[getRadio('searchEngine')]}`,
    `${topicCount} topics`,
    persona ? `posing as ${persona.name.toLowerCase()}` : 'no persona'
  ];
  if (isChecked('scheduleEnabled')) {
    parts.push(`${pad(getInt('startHour', 9))}:00 to ${pad(getInt('endHour', 23))}:00`);
  }
  document.getElementById('summary').textContent = `${parts.join(', ')}.`;
}

function renderRunState(status) {
  if (!status) return;
  const state = !status.isActive ? 'inactive' : status.isPaused ? 'paused' : 'active';
  document.body.dataset.state = state;
  document.getElementById('runState').textContent = {
    active: 'Running',
    paused: 'Paused',
    inactive: 'Off'
  }[state];
  document.getElementById('panicBtn').hidden = state === 'inactive';
}

// form to settings

function collectSettings() {
  // enabled and paused are left out on purpose so this page never
  // overwrites a start or stop that happened in the popup
  return {
    intensity: getRadio('intensity'),
    customRate: getInt('customRate', 12),
    searchEngine: getRadio('searchEngine'),
    persona: getRadio('persona'),
    requestMode: getRadio('requestMode') || 'page',
    followActivity: isChecked('followActivity'),
    enableAutosuggest: isChecked('enableAutosuggest'),
    enableTrends: isChecked('enableTrends'),
    enableResultClicks: isChecked('enableResultClicks'),
    debugMode: isChecked('debugMode'),
    languages: {
      primary: getValue('primaryLanguage'),
      enabled: extraLanguages
        .filter(language => isChecked(`lang-${language.code}`))
        .map(language => language.code),
      mixPercentage: getInt('langMixPercentage', 15)
    },
    schedule: {
      enabled: isChecked('scheduleEnabled'),
      startHour: getInt('startHour', 9),
      endHour: getInt('endHour', 23)
    },
    topics: Object.fromEntries(topicCategories.map(topic => [topic.id, isChecked(`topic-${topic.id}`)]))
  };
}

function queueSave(delay = 350) {
  savePending = true;
  setSaveState('Saving…');
  clearTimeout(saveTimer);
  saveTimer = setTimeout(save, delay);
}

async function save() {
  const settings = collectSettings();
  try {
    await browser.runtime.sendMessage({ type: 'updateSettings', settings });
    currentSettings = { ...currentSettings, ...settings };
    setSaveState('Saved', 'is-saved');
  } catch (error) {
    console.error('error saving settings:', error);
    setSaveState('Couldn’t save, try again', 'is-error');
  } finally {
    savePending = false;
  }
}

function setSaveState(text, className = '') {
  const element = document.getElementById('saveState');
  element.textContent = text;
  element.className = `save-state ${className}`;
}

// events

function setupEventListeners() {
  const form = document.getElementById('settingsForm');
  form.addEventListener('submit', event => event.preventDefault());
  form.addEventListener('change', () => {
    renderDerived();
    queueSave();
  });
  // sliders update their readout live but only save once they settle
  form.addEventListener('input', event => {
    if (event.target.type !== 'range') return;
    renderDerived();
    queueSave(600);
  });

  document.getElementById('allTopicsBtn').addEventListener('click', () => {
    setTopics(() => true);
  });
  document.getElementById('recommendedTopicsBtn').addEventListener('click', () => {
    setTopics(id => recommendedTopics.has(id));
  });
  document.getElementById('panicBtn').addEventListener('click', panicStop);
  document.getElementById('themeToggle').addEventListener('click', toggleTheme);
}

function setTopics(predicate) {
  for (const topic of topicCategories) setChecked(`topic-${topic.id}`, predicate(topic.id));
  renderDerived();
  queueSave();
}

async function panicStop() {
  if (!confirm('Stop all searches now? Your settings and counters stay as they are.')) return;
  try {
    await browser.runtime.sendMessage({ type: 'panic' });
    renderRunState({ isActive: false });
  } catch (error) {
    console.error('error stopping queryveil:', error);
  }
}

function toggleTheme() {
  const root = document.documentElement;
  const current = root.dataset.theme ||
    (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  const next = current === 'dark' ? 'light' : 'dark';
  root.dataset.theme = next;
  try {
    localStorage.setItem('theme', next);
  } catch (e) {
    // not persisted, still applies for this view
  }
}

// highlight the section in view in the sidebar
function trackCurrentSection() {
  const links = new Map(
    [...document.querySelectorAll('.toc a')].map(link => [link.getAttribute('href').slice(1), link])
  );
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      for (const link of links.values()) link.classList.remove('is-current');
      links.get(entry.target.id)?.classList.add('is-current');
    }
  }, { rootMargin: '-20% 0px -70% 0px' });
  for (const id of links.keys()) {
    const section = document.getElementById(id);
    if (section) observer.observe(section);
  }
}

// small dom helpers

function pad(value) {
  return String(value).padStart(2, '0');
}

function getValue(id) {
  return document.getElementById(id).value;
}

function setValue(id, value) {
  document.getElementById(id).value = String(value);
}

function getInt(id, fallback) {
  const value = Number.parseInt(getValue(id), 10);
  return Number.isNaN(value) ? fallback : value;
}

function isChecked(id) {
  return document.getElementById(id).checked;
}

function setChecked(id, value) {
  document.getElementById(id).checked = Boolean(value);
}

function getRadio(name) {
  return document.querySelector(`input[name="${name}"]:checked`)?.value;
}

function setRadio(name, value) {
  const input = document.querySelector(`input[name="${name}"][value="${value}"]`);
  if (input) input.checked = true;
}
