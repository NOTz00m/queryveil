const browser = globalThis.browser || globalThis.chrome;

let currentStatus = null;
let currentTheme = getInitialTheme();
let saveTimer = null;

document.addEventListener('DOMContentLoaded', async () => {
  applyTheme(currentTheme);
  showVersion();
  await Promise.all([loadStatus(), loadPersonas()]);
  setupEventListeners();

  browser.runtime.onMessage.addListener(message => {
    if (message.type !== 'statusUpdated') return;
    currentStatus = message;
    updateUI();
  });

  setInterval(() => {
    if (!document.hidden) loadStatus();
  }, 5000);
});

function getInitialTheme() {
  const stored = localStorage.getItem('theme');
  if (stored === 'light' || stored === 'dark') return stored;
  return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function toggleTheme() {
  currentTheme = currentTheme === 'light' ? 'dark' : 'light';
  localStorage.setItem('theme', currentTheme);
  applyTheme(currentTheme);
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  document.getElementById('sunIcon').style.display = theme === 'dark' ? 'block' : 'none';
  document.getElementById('moonIcon').style.display = theme === 'dark' ? 'none' : 'block';
  document.getElementById('themeToggle').setAttribute(
    'aria-label',
    theme === 'dark' ? 'Use light theme' : 'Use dark theme'
  );
}

function showVersion() {
  const manifest = browser.runtime.getManifest?.();
  if (manifest?.version) {
    document.getElementById('versionLabel').textContent = `Version ${manifest.version}`;
  }
}

async function loadStatus() {
  try {
    currentStatus = await browser.runtime.sendMessage({ type: 'getStatus' });
    updateUI();
  } catch (error) {
    console.error('error loading status:', error);
  }
}

async function loadPersonas() {
  try {
    const response = await browser.runtime.sendMessage({ type: 'getPersonas' });
    const select = document.getElementById('personaSelect');
    if (!response?.personas || !select) return;

    for (const persona of response.personas) {
      const option = document.createElement('option');
      option.value = persona.id;
      option.textContent = persona.name;
      option.title = persona.description;
      select.appendChild(option);
    }

    if (currentStatus?.settings) {
      select.value = currentStatus.settings.persona || 'none';
    }
  } catch (error) {
    console.error('error loading personas:', error);
  }
}

function updateUI() {
  if (!currentStatus?.settings) return;

  const { isActive, isPaused, settings, statistics, privacyScore } = currentStatus;
  const statusCard = document.getElementById('statusCard');
  const statusText = document.getElementById('statusText');
  const statusHeading = document.getElementById('statusHeading');
  const toggleButton = document.getElementById('toggleBtn');
  const pauseButton = document.getElementById('pauseBtn');

  statusCard.className = 'status-card';
  if (isActive && !isPaused) {
    statusCard.classList.add('status-active');
    document.body.dataset.state = 'active';
    statusText.textContent = 'Active';
    statusHeading.textContent = 'Your veil is running';
    toggleButton.textContent = 'Stop Veil';
    toggleButton.className = 'button button-danger';
    pauseButton.textContent = 'Pause';
    pauseButton.className = 'button button-muted';
    pauseButton.disabled = false;
  } else if (isPaused) {
    statusCard.classList.add('status-paused');
    document.body.dataset.state = 'paused';
    statusText.textContent = 'Paused';
    statusHeading.textContent = 'Cover is on hold';
    toggleButton.textContent = 'Stop Veil';
    toggleButton.className = 'button button-danger';
    pauseButton.textContent = 'Resume';
    pauseButton.className = 'button button-warning';
    pauseButton.disabled = false;
  } else {
    statusCard.classList.add('status-inactive');
    document.body.dataset.state = 'inactive';
    statusText.textContent = 'Inactive';
    statusHeading.textContent = 'Ready when you are';
    toggleButton.textContent = 'Start Veil';
    toggleButton.className = 'button button-primary';
    pauseButton.textContent = 'Pause';
    pauseButton.className = 'button button-muted';
    pauseButton.disabled = true;
  }

  document.getElementById('totalQueries').textContent = formatCount(statistics?.totalQueries);
  document.getElementById('sessionQueries').textContent = formatCount(statistics?.queriesThisSession);
  document.getElementById('paceValue').textContent = getPace(settings);
  document.getElementById('settingsSummary').textContent = getSettingsSummary(settings);

  updateScoreRing(privacyScore);
  syncSelect('intensitySelect', settings.intensity);
  syncSelect('engineSelect', settings.searchEngine);
  syncSelect('personaSelect', settings.persona || 'none');
}

function updateScoreRing(scoreData) {
  if (!scoreData) return;

  const score = Math.max(0, Math.min(100, scoreData.score || 0));
  const circumference = 2 * Math.PI * 46;
  const ring = document.getElementById('scoreRingFill');
  const grade = document.getElementById('scoreGrade');
  const color = score >= 80
    ? 'var(--accent)'
    : score >= 55
      ? '#4d86c6'
      : score >= 35
        ? 'var(--warning)'
        : 'var(--danger)';

  ring.style.strokeDasharray = String(circumference);
  ring.style.strokeDashoffset = String(circumference - (score / 100) * circumference);
  ring.style.stroke = color;
  grade.style.color = color;
  grade.textContent = scoreData.grade;
  document.getElementById('scoreValue').textContent = `${score}/100`;
}

function syncSelect(id, value) {
  const select = document.getElementById(id);
  if (document.activeElement !== select) select.value = value;
}

function getPace(settings) {
  const rates = { low: 6, medium: 12, high: 20 };
  const rate = settings.intensity === 'custom'
    ? settings.customRate
    : rates[settings.intensity];
  return `${rate || 12}/hr`;
}

function getSettingsSummary(settings) {
  const topicCount = Object.values(settings.topics || {}).filter(Boolean).length;
  const persona = settings.persona && settings.persona !== 'none'
    ? 'persona on'
    : 'random profile';
  const trends = settings.enableTrends ? 'trends on' : 'trends off';
  return `${topicCount} topics, ${persona}, ${trends}`.replace(/^./, letter => letter.toUpperCase());
}

function formatCount(value) {
  return new Intl.NumberFormat(undefined, { notation: 'compact' }).format(value || 0);
}

function setupEventListeners() {
  document.getElementById('themeToggle').addEventListener('click', toggleTheme);
  document.getElementById('toggleBtn').addEventListener('click', async () => {
    await sendAction({ type: 'toggle' });
  });
  document.getElementById('pauseBtn').addEventListener('click', async () => {
    await sendAction({ type: 'pause' });
  });
  document.getElementById('settingsBtn').addEventListener('click', () => {
    if (browser.runtime.openOptionsPage) {
      browser.runtime.openOptionsPage();
    } else {
      window.open(browser.runtime.getURL('options/options.html'));
    }
  });

  bindQuickSetting('intensitySelect', 'intensity');
  bindQuickSetting('engineSelect', 'searchEngine');
  bindQuickSetting('personaSelect', 'persona');
}

function bindQuickSetting(elementId, settingName) {
  document.getElementById(elementId).addEventListener('change', async event => {
    await sendAction({
      type: 'updateSettings',
      settings: { [settingName]: event.target.value }
    }, true);
  });
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
  const state = document.getElementById('saveState');
  state.textContent = 'Saved';
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    state.textContent = '';
  }, 1200);
}
