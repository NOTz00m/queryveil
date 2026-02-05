const browser = globalThis.browser || globalThis.chrome;

// State
let currentStatus = null;
let currentTheme = localStorage.getItem('theme') || 'light';

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  applyTheme(currentTheme);
  await loadStatus();
  setupEventListeners();
  
  // Listen for broadcast updates from options/background
  browser.runtime.onMessage.addListener((message) => {
    if (message.type === 'statusUpdated') {
      currentStatus = message;
      updateUI();
    }
  });

  // Auto-refresh stats fallback
  setInterval(loadStatus, 2000);
});

// --- Theme Logic ---
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

// --- Data Logic ---
async function loadStatus() {
  try {
    const response = await browser.runtime.sendMessage({ type: 'getStatus' });
    currentStatus = response;
    updateUI();
  } catch (error) {
    console.error('Error loading status:', error);
  }
}

function updateUI() {
  if (!currentStatus) return;

  const statusCard = document.getElementById('statusCard');
  const statusText = document.getElementById('statusText');
  const toggleBtn = document.getElementById('toggleBtn');
  const pauseBtn = document.getElementById('pauseBtn');
  
  const { isActive, isPaused, settings, statistics } = currentStatus;

  // Status Styling
  statusCard.className = 'status-card'; // reset
  if (isActive && !isPaused) {
    statusCard.classList.add('status-active');
    statusText.textContent = 'Active Running';
    
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
    
    toggleBtn.textContent = 'Start Consumer';
    toggleBtn.className = 'btn btn-primary';
    
    pauseBtn.textContent = 'Pause';
    pauseBtn.disabled = true;
  }

  // Stats
  document.getElementById('totalQueries').textContent = statistics.totalQueries || 0;
  document.getElementById('sessionQueries').textContent = statistics.queriesThisSession || 0;

  // Validating Inputs
  // Only update if not focused to avoid overwriting user input
  if (document.activeElement.id !== 'intensitySelect') {
    document.getElementById('intensitySelect').value = settings.intensity;
  }
  if (document.activeElement.id !== 'engineSelect') {
    document.getElementById('engineSelect').value = settings.searchEngine;
  }
}

function setupEventListeners() {
  // Theme
  document.getElementById('themeToggle').addEventListener('click', toggleTheme);

  // Toggle Start/Stop
  document.getElementById('toggleBtn').addEventListener('click', async () => {
    try {
      await browser.runtime.sendMessage({ type: 'toggle' });
      await loadStatus();
    } catch (e) { console.error(e); }
  });

  // Pause/Resume
  document.getElementById('pauseBtn').addEventListener('click', async () => {
    try {
      await browser.runtime.sendMessage({ type: 'pause' });
      await loadStatus();
    } catch (e) { console.error(e); }
  });

  // Open Settings
  document.getElementById('settingsBtn').addEventListener('click', () => {
    if (browser.runtime.openOptionsPage) {
      browser.runtime.openOptionsPage();
    } else {
      window.open(browser.runtime.getURL('options/options.html'));
    }
  });

  // Quick Settings Change
  document.getElementById('intensitySelect').addEventListener('change', async (e) => {
    try {
      await browser.runtime.sendMessage({ 
        type: 'updateSettings', 
        settings: { intensity: e.target.value } 
      });
      // Don't need explicit loadStatus() as broadcast will trigger it
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
}
