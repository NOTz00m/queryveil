/**
 * QueryVeil Popup UI Controller
 */

let currentStatus = null;

// Initialize popup
document.addEventListener('DOMContentLoaded', async () => {
  await loadStatus();
  setupEventListeners();
  startStatusRefresh();
});

/**
 * Load current status from background
 */
async function loadStatus() {
  try {
    const response = await browser.runtime.sendMessage({ type: 'getStatus' });
    currentStatus = response;
    updateUI();
  } catch (error) {
    console.error('Error loading status:', error);
  }
}

/**
 * Update UI elements based on current status
 */
function updateUI() {
  if (!currentStatus) return;

  // Update status indicator
  const statusDot = document.getElementById('statusDot');
  const statusText = document.getElementById('statusText');
  const toggleBtn = document.getElementById('toggleBtn');
  const pauseBtn = document.getElementById('pauseBtn');

  if (currentStatus.isActive && !currentStatus.isPaused) {
    statusDot.className = 'status-dot active';
    statusText.textContent = 'Active';
    toggleBtn.textContent = 'Stop';
    toggleBtn.className = '';
    pauseBtn.disabled = false;
    pauseBtn.textContent = 'Pause';
  } else if (currentStatus.isPaused) {
    statusDot.className = 'status-dot paused';
    statusText.textContent = 'Paused';
    toggleBtn.textContent = 'Stop';
    toggleBtn.className = '';
    pauseBtn.disabled = false;
    pauseBtn.textContent = 'Resume';
  } else {
    statusDot.className = 'status-dot inactive';
    statusText.textContent = 'Inactive';
    toggleBtn.textContent = 'Start';
    toggleBtn.className = 'inactive';
    pauseBtn.disabled = true;
    pauseBtn.textContent = 'Pause';
  }

  // Update settings
  document.getElementById('intensitySelect').value = currentStatus.settings.intensity;
  document.getElementById('engineSelect').value = currentStatus.settings.searchEngine;

  // Update statistics
  document.getElementById('totalQueries').textContent = currentStatus.statistics.totalQueries || 0;
  document.getElementById('sessionQueries').textContent = currentStatus.statistics.queriesThisSession || 0;
  
  const sessionTime = Math.floor((Date.now() - currentStatus.statistics.sessionStartTime) / 60000);
  document.getElementById('sessionTime').textContent = `${sessionTime}m`;
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
  // Toggle button
  document.getElementById('toggleBtn').addEventListener('click', async () => {
    try {
      const response = await browser.runtime.sendMessage({ type: 'toggle' });
      await loadStatus();
    } catch (error) {
      console.error('Error toggling:', error);
    }
  });

  // Pause button
  document.getElementById('pauseBtn').addEventListener('click', async () => {
    try {
      const newPausedState = !currentStatus.isPaused;
      await browser.runtime.sendMessage({ 
        type: 'pause',
        paused: newPausedState
      });
      await loadStatus();
    } catch (error) {
      console.error('Error pausing:', error);
    }
  });

  // Intensity select
  document.getElementById('intensitySelect').addEventListener('change', async (e) => {
    try {
      await browser.runtime.sendMessage({
        type: 'updateSettings',
        settings: { intensity: e.target.value }
      });
      await loadStatus();
    } catch (error) {
      console.error('Error updating intensity:', error);
    }
  });

  // Search engine select
  document.getElementById('engineSelect').addEventListener('change', async (e) => {
    try {
      await browser.runtime.sendMessage({
        type: 'updateSettings',
        settings: { searchEngine: e.target.value }
      });
      await loadStatus();
    } catch (error) {
      console.error('Error updating search engine:', error);
    }
  });

  // Options link
  document.getElementById('optionsLink').addEventListener('click', (e) => {
    e.preventDefault();
    browser.runtime.openOptionsPage();
  });
}

/**
 * Refresh status periodically
 */
function startStatusRefresh() {
  setInterval(loadStatus, 2000); // Refresh every 2 seconds
}
