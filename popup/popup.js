const browser = globalThis.browser || globalThis.chrome;

let currentStatus = null;
let currentTheme = localStorage.getItem('theme') || 'light';

document.addEventListener('DOMContentLoaded', async () => {
  applyTheme(currentTheme);
  await loadStatus();
  await loadPersonas();
  setupEventListeners();

  // listen for live updates from background
  browser.runtime.onMessage.addListener((message) => {
    if (message.type === 'statusUpdated') {
      currentStatus = message;
      updateUI();
    }
  });

  // fallback polling in case broadcast is missed
  setInterval(loadStatus, 2000);
});

// --- theme ---

function toggleTheme() {
  currentTheme = currentTheme === 'light' ? 'dark' : 'light';
  localStorage.setItem('theme', currentTheme);
  applyTheme(currentTheme);
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const sunIcon = document.getElementById('sunIcon');
  const moonIcon = document.getElementById('moonIcon');

  if (theme === 'dark') {
    sunIcon.style.display = 'block';
    moonIcon.style.display = 'none';
  } else {
    sunIcon.style.display = 'none';
    moonIcon.style.display = 'block';
  }
}

// --- data loading ---

async function loadStatus() {
  try {
    const response = await browser.runtime.sendMessage({ type: 'getStatus' });
    currentStatus = response;
    updateUI();
  } catch (error) {
    console.error('error loading status:', error);
  }
}

// fetch persona list from background and populate the dropdown
async function loadPersonas() {
  try {
    const response = await browser.runtime.sendMessage({ type: 'getPersonas' });
    const select = document.getElementById('personaSelect');
    if (!response?.personas || !select) return;

    // keep the "None" option, add the rest
    response.personas.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = p.name;
      opt.title = p.description;
      select.appendChild(opt);
    });
  } catch (e) {
    console.error('error loading personas:', e);
  }
}

// --- ui update ---

function updateUI() {
  if (!currentStatus) return;

  const statusCard = document.getElementById('statusCard');
  const statusText = document.getElementById('statusText');
  const toggleBtn = document.getElementById('toggleBtn');
  const pauseBtn = document.getElementById('pauseBtn');

  const { isActive, isPaused, settings, statistics, privacyScore } = currentStatus;

  // status card styling
  statusCard.className = 'status-card';
  if (isActive && !isPaused) {
    statusCard.classList.add('status-active');
    statusText.textContent = 'Active';
    toggleBtn.textContent = 'Stop';
    toggleBtn.className = 'btn btn-danger';
    pauseBtn.textContent = 'Pause';
    pauseBtn.disabled = false;
  } else if (isPaused) {
    statusCard.classList.add('status-paused');
    statusText.textContent = 'Paused';
    toggleBtn.textContent = 'Stop';
    toggleBtn.className = 'btn btn-danger';
    pauseBtn.textContent = 'Resume';
    pauseBtn.disabled = false;
  } else {
    statusCard.classList.add('status-inactive');
    statusText.textContent = 'Inactive';
    toggleBtn.textContent = 'Start';
    toggleBtn.className = 'btn btn-primary';
    pauseBtn.textContent = 'Pause';
    pauseBtn.disabled = true;
  }

  // stats
  document.getElementById('totalQueries').textContent = statistics?.totalQueries || 0;
  document.getElementById('sessionQueries').textContent = statistics?.queriesThisSession || 0;

  // privacy score ring
  updateScoreRing(privacyScore);

  // sync dropdowns (only if not actively being changed)
  if (document.activeElement.id !== 'intensitySelect') {
    document.getElementById('intensitySelect').value = settings.intensity;
  }
  if (document.activeElement.id !== 'engineSelect') {
    document.getElementById('engineSelect').value = settings.searchEngine;
  }
  if (document.activeElement.id !== 'personaSelect') {
    document.getElementById('personaSelect').value = settings.persona || 'none';
  }
}

// animate the svg ring and update the grade/score text
function updateScoreRing(scoreData) {
  const ringFill = document.getElementById('scoreRingFill');
  const gradeEl = document.getElementById('scoreGrade');
  const valueEl = document.getElementById('scoreValue');

  if (!scoreData || !ringFill) return;

  const { score, grade } = scoreData;

  // svg circle math: circumference = 2πr, r=52
  const circumference = 2 * Math.PI * 52;
  const offset = circumference - (score / 100) * circumference;

  ringFill.style.strokeDasharray = `${circumference}`;
  ringFill.style.strokeDashoffset = `${offset}`;

  // color the ring based on score
  let color;
  if (score >= 80) color = 'var(--score-excellent)';
  else if (score >= 60) color = 'var(--score-good)';
  else if (score >= 40) color = 'var(--score-fair)';
  else color = 'var(--score-poor)';

  ringFill.style.stroke = color;

  gradeEl.textContent = grade;
  gradeEl.style.color = color;
  valueEl.textContent = score;
}

// --- events ---

function setupEventListeners() {
  document.getElementById('themeToggle').addEventListener('click', toggleTheme);

  document.getElementById('toggleBtn').addEventListener('click', async () => {
    try {
      await browser.runtime.sendMessage({ type: 'toggle' });
      await loadStatus();
    } catch (e) { console.error(e); }
  });

  document.getElementById('pauseBtn').addEventListener('click', async () => {
    try {
      await browser.runtime.sendMessage({ type: 'pause' });
      await loadStatus();
    } catch (e) { console.error(e); }
  });

  document.getElementById('settingsBtn').addEventListener('click', () => {
    if (browser.runtime.openOptionsPage) {
      browser.runtime.openOptionsPage();
    } else {
      window.open(browser.runtime.getURL('options/options.html'));
    }
  });

  // quick settings save immediately on change
  document.getElementById('intensitySelect').addEventListener('change', async (e) => {
    try {
      await browser.runtime.sendMessage({
        type: 'updateSettings',
        settings: { intensity: e.target.value }
      });
    } catch (e) { console.error(e); }
  });

  document.getElementById('engineSelect').addEventListener('change', async (e) => {
    try {
      await browser.runtime.sendMessage({
        type: 'updateSettings',
        settings: { searchEngine: e.target.value }
      });
    } catch (e) { console.error(e); }
  });

  document.getElementById('personaSelect').addEventListener('change', async (e) => {
    try {
      await browser.runtime.sendMessage({
        type: 'updateSettings',
        settings: { persona: e.target.value }
      });
    } catch (e) { console.error(e); }
  });
}
