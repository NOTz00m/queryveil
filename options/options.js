/**
 * QueryVeil Options Page Controller
 */

const topicCategories = [
  { id: 'news', label: 'News', description: 'Current events and breaking news' },
  { id: 'shopping', label: 'Shopping', description: 'Products and reviews' },
  { id: 'entertainment', label: 'Entertainment', description: 'Movies, shows, music' },
  { id: 'technology', label: 'Technology', description: 'Tech tutorials and guides' },
  { id: 'health', label: 'Health', description: 'Health and wellness' },
  { id: 'travel', label: 'Travel', description: 'Destinations and hotels' },
  { id: 'food', label: 'Food', description: 'Recipes and restaurants' },
  { id: 'education', label: 'Education', description: 'Learning and courses' },
  { id: 'local', label: 'Local', description: 'Nearby places and services' },
  { id: 'general', label: 'General', description: 'General knowledge queries' }
];

let currentSettings = null;

// Initialize options page
document.addEventListener('DOMContentLoaded', async () => {
  await loadSettings();
  populateTopicGrid();
  updateUI();
  setupEventListeners();
});

/**
 * Load settings from background
 */
async function loadSettings() {
  try {
    const response = await browser.runtime.sendMessage({ type: 'getStatus' });
    currentSettings = response.settings;
  } catch (error) {
    console.error('Error loading settings:', error);
    currentSettings = getDefaultSettings();
  }
}

/**
 * Get default settings
 */
function getDefaultSettings() {
  return {
    enabled: false,
    intensity: 'medium',
    searchEngine: 'google',
    enableResultClicks: false,
    debugMode: false,
    schedule: {
      enabled: false,
      startHour: 9,
      endHour: 23
    },
    topics: {
      news: true,
      shopping: true,
      entertainment: true,
      technology: true,
      health: true,
      travel: true,
      food: true,
      education: true,
      local: true,
      general: true
    }
  };
}

/**
 * Populate topic grid
 */
function populateTopicGrid() {
  const grid = document.getElementById('topicGrid');
  grid.innerHTML = '';

  topicCategories.forEach(topic => {
    const item = document.createElement('div');
    item.className = 'topic-item';
    
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'topic-checkbox';
    checkbox.id = `topic-${topic.id}`;
    checkbox.checked = currentSettings?.topics?.[topic.id] !== false;
    
    const label = document.createElement('label');
    label.className = 'topic-label';
    label.htmlFor = `topic-${topic.id}`;
    label.textContent = topic.label;
    
    item.appendChild(checkbox);
    item.appendChild(label);
    grid.appendChild(item);

    // Make entire item clickable
    item.addEventListener('click', (e) => {
      if (e.target !== checkbox) {
        checkbox.checked = !checkbox.checked;
      }
    });
  });
}

/**
 * Update UI from current settings
 */
function updateUI() {
  if (!currentSettings) return;

  // General settings
  document.getElementById('intensity').value = currentSettings.intensity;
  document.getElementById('searchEngine').value = currentSettings.searchEngine;
  
  // Toggle switches
  updateToggle('enableResultClicks', currentSettings.enableResultClicks);
  updateToggle('scheduleEnabled', currentSettings.schedule?.enabled || false);
  updateToggle('debugMode', currentSettings.debugMode || false);

  // Schedule
  document.getElementById('startHour').value = currentSettings.schedule?.startHour || 9;
  document.getElementById('endHour').value = currentSettings.schedule?.endHour || 23;
  updateScheduleVisibility();

  // Topics - already handled in populateTopicGrid
}

/**
 * Update toggle switch state
 */
function updateToggle(id, active) {
  const toggle = document.getElementById(id);
  if (active) {
    toggle.classList.add('active');
  } else {
    toggle.classList.remove('active');
  }
}

/**
 * Update schedule hours visibility
 */
function updateScheduleVisibility() {
  const scheduleHours = document.getElementById('scheduleHours');
  const scheduleEnabled = document.getElementById('scheduleEnabled').classList.contains('active');
  scheduleHours.style.opacity = scheduleEnabled ? '1' : '0.5';
  document.getElementById('startHour').disabled = !scheduleEnabled;
  document.getElementById('endHour').disabled = !scheduleEnabled;
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
  // Toggle switches
  document.getElementById('enableResultClicks').addEventListener('click', function() {
    this.classList.toggle('active');
  });

  document.getElementById('scheduleEnabled').addEventListener('click', function() {
    this.classList.toggle('active');
    updateScheduleVisibility();
  });

  document.getElementById('debugMode').addEventListener('click', function() {
    this.classList.toggle('active');
  });

  // Save button
  document.getElementById('saveButton').addEventListener('click', saveSettings);

  // Save on Enter in number inputs
  document.querySelectorAll('input[type="number"]').forEach(input => {
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        saveSettings();
      }
    });
  });
}

/**
 * Save settings
 */
async function saveSettings() {
  try {
    // Gather all settings
    const settings = {
      intensity: document.getElementById('intensity').value,
      searchEngine: document.getElementById('searchEngine').value,
      enableResultClicks: document.getElementById('enableResultClicks').classList.contains('active'),
      debugMode: document.getElementById('debugMode').classList.contains('active'),
      schedule: {
        enabled: document.getElementById('scheduleEnabled').classList.contains('active'),
        startHour: parseInt(document.getElementById('startHour').value),
        endHour: parseInt(document.getElementById('endHour').value)
      },
      topics: {}
    };

    // Gather topic settings
    topicCategories.forEach(topic => {
      const checkbox = document.getElementById(`topic-${topic.id}`);
      settings.topics[topic.id] = checkbox.checked;
    });

    // Send to background
    await browser.runtime.sendMessage({
      type: 'updateSettings',
      settings: settings
    });

    // Show notification
    showSaveNotification();

    // Update current settings
    currentSettings = { ...currentSettings, ...settings };

  } catch (error) {
    console.error('Error saving settings:', error);
    alert('Error saving settings. Please try again.');
  }
}

/**
 * Show save notification
 */
function showSaveNotification() {
  const notification = document.getElementById('saveNotification');
  notification.classList.add('show');
  
  setTimeout(() => {
    notification.classList.remove('show');
  }, 2000);
}
