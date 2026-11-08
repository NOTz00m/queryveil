const browser = globalThis.browser || globalThis.chrome;

const RATES = { low: 6, medium: 12, high: 20 };
const ENGINES = { google: 'Google', bing: 'Bing', duckduckgo: 'DuckDuckGo' };
const FACTORS = [
  { key: 'volume', label: 'Volume', hint: 'Builds up the longer it runs' },
  { key: 'diversity', label: 'Topic spread', hint: 'Turn on more topics in settings' },
  { key: 'consistency', label: 'Uptime', hint: 'Leave it running for a few hours' },
  { key: 'persona', label: 'Persona', hint: 'Pick a persona below' },
  { key: 'features', label: 'Realism', hint: 'Enable autosuggest and trends in settings' }
];

let status = null;
let saveTimer = null;

document.addEventListener('DOMContentLoaded', async () => {
  showVersion();
  await Promise.all([loadStatus(), loadPersonas()]);
  setupEventListeners();

  browser.runtime.onMessage.addListener(message => {
    if (message.type !== 'statusUpdated') return;
    status = message;
    render();
  });

  // status from the background every few seconds, countdown text every second
  setInterval(() => {
    if (!document.hidden) loadStatus();
  }, 5000);
  setInterval(renderDetail, 1000);
});

function showVersion() {
  const version = browser.runtime.getManifest?.()?.version;
  if (version) document.getElementById('versionLabel').textContent = version;
}

async function loadStatus() {
  try {
    status = await browser.runtime.sendMessage({ type: 'getStatus' });
    render();
  } catch (error) {
    console.error('error loading status:', error);
  }
}

async function loadPersonas() {
  try {
    const response = await browser.runtime.sendMessage({ type: 'getPersonas' });
    const select = document.getElementById('personaSelect');
    for (const persona of response?.personas || []) {
      const option = new Option(persona.name, persona.id);
      option.title = persona.description;
      select.add(option);
    }
    if (status?.settings) select.value = status.settings.persona || 'none';
  } catch (error) {
    console.error('error loading personas:', error);
  }
}

function getState() {
  if (!status?.isActive) return 'inactive';
  return status.isPaused ? 'paused' : 'active';
}

function render() {
  if (!status?.settings) return;

  const state = getState();
  const { settings, statistics } = status;
  document.body.dataset.state = state;

  const label = { active: 'Running', paused: 'Paused', inactive: 'Off' }[state];
  document.getElementById('stateLabel').textContent = label;

  const toggle = document.getElementById('toggleBtn');
  const pause = document.getElementById('pauseBtn');
  if (state === 'inactive') {
    toggle.textContent = 'Start';
    toggle.className = 'btn btn-primary';
    pause.hidden = true;
  } else {
    toggle.textContent = 'Stop';
    toggle.className = 'btn btn-stop';
    pause.hidden = false;
    pause.textContent = state === 'paused' ? 'Resume' : 'Pause';
    pause.className = state === 'paused' ? 'btn btn-primary' : 'btn';
  }

  renderDetail();
  renderStrip(statistics);
  renderEstimate(status.privacyScore);

  document.getElementById('totalQueries').textContent = formatCount(statistics?.totalQueries);
  document.getElementById('sessionQueries').textContent = formatCount(statistics?.queriesThisSession);
  document.getElementById('clickCount').textContent = settings.enableResultClicks
    ? formatCount(statistics?.resultClicks)
    : 'off';

  syncRadio('intensity', settings.intensity);
  syncSelect('engineSelect', settings.searchEngine);
  syncSelect('personaSelect', settings.persona || 'none');
}

// one line under the state: what happens next, where, and how fast
function renderDetail() {
  if (!status?.settings) return;
  const { settings } = status;
  const state = getState();
  const pace = `~${getRate(settings)}/hr on ${ENGINES[settings.searchEngine] || 'Google'}`;
  let text;

  if (state === 'inactive') {
    text = `Nothing is being sent. Will run ${pace}`;
  } else if (state === 'paused') {
    text = `On hold. ${pace} when resumed`;
  } else {
    text = `${describeNextRun(status.nextRunAt)} · ${pace}`;
  }

  document.getElementById('stateDetail').textContent = text;
}

function describeNextRun(nextRunAt) {
  if (!nextRunAt) return 'Waiting for the next slot';
  const seconds = Math.round((nextRunAt - Date.now()) / 1000);
  if (seconds <= 5) return 'Next search any moment';
  if (seconds < 60) return `Next search in ${seconds}s`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `Next search in ${minutes} min`;
  // long gaps usually mean the schedule is holding things back
  return `Next search at ${new Date(nextRunAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
}

// one tick per search over the last 60 minutes, a dot above it when a result was opened
function renderStrip(statistics) {
  const svg = document.getElementById('strip');
  const now = Date.now();
  const windowMs = 3600000;
  const ns = 'http://www.w3.org/2000/svg';
  const nodes = [];

  for (const fraction of [0.25, 0.5, 0.75]) {
    const line = document.createElementNS(ns, 'line');
    line.setAttribute('class', 'grid');
    line.setAttribute('x1', 300 * fraction);
    line.setAttribute('x2', 300 * fraction);
    line.setAttribute('y1', 0);
    line.setAttribute('y2', 36);
    nodes.push(line);
  }

  const toX = time => Math.max(1, Math.min(299, 300 - ((now - time) / windowMs) * 300));
  const recent = (statistics?.recentQueries || []).filter(time => now - time < windowMs);
  const clicks = (statistics?.recentClicks || []).filter(time => now - time < windowMs);

  for (const time of recent) {
    const line = document.createElementNS(ns, 'line');
    const x = toX(time);
    line.setAttribute('class', 'tick');
    line.setAttribute('x1', x);
    line.setAttribute('x2', x);
    line.setAttribute('y1', 14);
    line.setAttribute('y2', 36);
    nodes.push(line);
  }

  for (const time of clicks) {
    const rect = document.createElementNS(ns, 'rect');
    rect.setAttribute('class', 'tick-click');
    rect.setAttribute('x', toX(time) - 1.5);
    rect.setAttribute('y', 6);
    rect.setAttribute('width', 3);
    rect.setAttribute('height', 4);
    nodes.push(rect);
  }

  svg.replaceChildren(...nodes);
  svg.setAttribute('aria-label', `${recent.length} searches and ${clicks.length} opened results in the last hour`);
  document.getElementById('hourCount').textContent =
    `${recent.length} ${recent.length === 1 ? 'search' : 'searches'}` +
    (clicks.length ? `, ${clicks.length} opened` : '');
}

function renderEstimate(scoreData) {
  if (!scoreData) return;
  const score = Math.max(0, Math.min(100, scoreData.score || 0));
  document.getElementById('scoreGrade').textContent = getState() === 'inactive' ? '–' : scoreData.grade;
  document.getElementById('scoreValue').textContent = `${score}/100`;
  document.getElementById('scoreBar').style.width = `${score}%`;

  const list = document.getElementById('factorList');
  list.replaceChildren(...FACTORS.map(factor => {
    const value = Math.round(scoreData.factors?.[factor.key] ?? 0);
    const item = document.createElement('li');
    const name = document.createElement('span');
    const meter = document.createElement('span');
    const fill = document.createElement('span');
    const number = document.createElement('span');

    name.textContent = factor.label;
    meter.className = 'meter';
    fill.style.width = `${value}%`;
    meter.append(fill);
    number.className = 'num';
    number.textContent = value;
    item.append(name, meter, number);

    // only nudge where there's something the user can actually change
    if (value < 60 && getState() !== 'inactive') {
      const hint = document.createElement('span');
      hint.className = 'hint';
      hint.textContent = factor.hint;
      item.append(hint);
    }
    return item;
  }));
}

function getRate(settings) {
  return settings.intensity === 'custom' ? settings.customRate || 12 : RATES[settings.intensity] || 12;
}

function syncSelect(id, value) {
  const select = document.getElementById(id);
  if (document.activeElement !== select) select.value = value;
}

function syncRadio(name, value) {
  const input = document.querySelector(`input[name="${name}"][value="${value}"]`);
  if (input) input.checked = true;
}

function formatCount(value) {
  return new Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: 1 }).format(value || 0);
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

function openSettings() {
  if (browser.runtime.openOptionsPage) {
    browser.runtime.openOptionsPage();
  } else {
    window.open(browser.runtime.getURL('options/options.html'));
  }
  window.close();
}

function setupEventListeners() {
  document.getElementById('themeToggle').addEventListener('click', toggleTheme);
  document.getElementById('settingsBtn').addEventListener('click', openSettings);
  document.getElementById('settingsLink').addEventListener('click', openSettings);
  document.getElementById('toggleBtn').addEventListener('click', () => sendAction({ type: 'toggle' }));
  document.getElementById('pauseBtn').addEventListener('click', () => sendAction({ type: 'pause' }));

  for (const input of document.querySelectorAll('input[name="intensity"]')) {
    input.addEventListener('change', () => saveSetting('intensity', input.value));
  }
  document.getElementById('engineSelect').addEventListener('change', event => {
    saveSetting('searchEngine', event.target.value);
  });
  document.getElementById('personaSelect').addEventListener('change', event => {
    saveSetting('persona', event.target.value);
  });
}

function saveSetting(name, value) {
  return sendAction({ type: 'updateSettings', settings: { [name]: value } }, true);
}

async function sendAction(message, showSaved = false) {
  try {
    await browser.runtime.sendMessage(message);
    if (showSaved) flashSaved();
    await loadStatus();
  } catch (error) {
    console.error('error updating queryveil:', error);
  }
}

function flashSaved() {
  const element = document.getElementById('saveState');
  element.textContent = 'Saved';
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    element.textContent = '';
  }, 1400);
}
