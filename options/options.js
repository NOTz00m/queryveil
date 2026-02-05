const browser = globalThis.browser || globalThis.chrome;

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
  { id: 'gaming', label: 'Gaming', description: 'Games and esports' },
  { id: 'finance', label: 'Finance', description: 'Stocks and crypto' },
  { id: 'hobbies', label: 'Hobbies', description: 'DIY and crafts' },
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
  
  // Listen for broadcast updates
  browser.runtime.onMessage.addListener((message) => {
    if (message.type === 'statusUpdated') {
      currentSettings = message.settings;
      updateUI();
    }
  });
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
    customRate: 12,
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
      gaming: true,
      finance: true,
      hobbies: true,
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
  if (!grid) {
      console.error('Topic grid element not found!');
      return;
  }
  grid.innerHTML = '';

  topicCategories.forEach(topic => {
    const item = document.createElement('div');
    item.className = 'topic-item';
    
    // Checkbox
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'topic-checkbox';
    checkbox.id = `topic-${topic.id}`;
    // Default to true if somehow settings are missing topics
    checkbox.checked = currentSettings?.topics?.[topic.id] !== false; 
    
    // Label
    const label = document.createElement('label');
    label.className = 'topic-label';
    label.htmlFor = `topic-${topic.id}`;
    label.textContent = topic.label;
    
    item.appendChild(checkbox);
    item.appendChild(label);
    grid.appendChild(item);

    // Make entire item clickable (except when clicking label directly as that handles itself)
    item.addEventListener('click', (e) => {
      if (e.target !== checkbox && e.target !== label) {
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
  const intensitySelect = document.getElementById('intensity');
  if (intensitySelect) intensitySelect.value = currentSettings.intensity;
  
  const searchEngine = document.getElementById('searchEngine');
  if (searchEngine) searchEngine.value = currentSettings.searchEngine;
  
  const customRate = document.getElementById('customRate');
  if (customRate) customRate.value = currentSettings.customRate || 12;
  
  // Toggle switches (Checkboxes)
  const enableResultClicks = document.getElementById('enableResultClicks');
  if (enableResultClicks) enableResultClicks.checked = currentSettings.enableResultClicks;
  
  const debugMode = document.getElementById('debugMode');
  if (debugMode) debugMode.checked = currentSettings.debugMode;

  const scheduleEnabled = document.getElementById('scheduleEnabled');
  if (scheduleEnabled) scheduleEnabled.checked = currentSettings.schedule?.enabled || false;

  // Schedule
  const startHour = document.getElementById('startHour');
  if (startHour) startHour.value = currentSettings.schedule?.startHour || 9;
  
  const endHour = document.getElementById('endHour');
  if (endHour) endHour.value = currentSettings.schedule?.endHour || 23;

  updateScheduleVisibility();
  updateCustomRateVisibility();
  
  // Re-sync topics if they changed externally
  topicCategories.forEach(topic => {
      const cb = document.getElementById(`topic-${topic.id}`);
      if (cb) cb.checked = currentSettings.topics?.[topic.id] !== false;
  });
}

/**
 * Update schedule hours visibility
 */
function updateScheduleVisibility() {
  const scheduleHours = document.getElementById('scheduleHours');
  const scheduleEnabled = document.getElementById('scheduleEnabled');
  
  if (scheduleHours && scheduleEnabled) {
      scheduleHours.style.opacity = scheduleEnabled.checked ? '1' : '0.5';
      const inputs = scheduleHours.querySelectorAll('input');
      inputs.forEach(input => input.disabled = !scheduleEnabled.checked);
  }
}

/**
 * Update custom rate input visibility
 */
function updateCustomRateVisibility() {
  const customRateGroup = document.getElementById('customRateGroup');
  const intensity = document.getElementById('intensity');
  
  if (customRateGroup && intensity) {
      customRateGroup.style.display = intensity.value === 'custom' ? 'flex' : 'none';
  }
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
  // Schedule toggle
  const scheduleEnabled = document.getElementById('scheduleEnabled');
  if (scheduleEnabled) {
      scheduleEnabled.addEventListener('change', updateScheduleVisibility);
  }

  // Intensity change
  const intensity = document.getElementById('intensity');
  if (intensity) {
      intensity.addEventListener('change', updateCustomRateVisibility);
  }

  // Custom rate validation
  const customRate = document.getElementById('customRate');
  if (customRate) {
      customRate.addEventListener('input', function() {
        const value = parseInt(this.value);
        if (value < 1) this.value = 1;
        if (value > 60) this.value = 60;
      });
  }

  // Buttons
  const saveBtn = document.getElementById('saveBtn');
  if (saveBtn) saveBtn.addEventListener('click', saveSettings);
  
  const panicBtn = document.getElementById('panicBtn');
  if (panicBtn) panicBtn.addEventListener('click', panicStop);
}

/**
 * Save settings
 */
async function saveSettings() {
  try {
    const saveBtn = document.getElementById('saveBtn');
    const originalText = saveBtn.textContent;
    const originalColor = saveBtn.style.backgroundColor;
    
    saveBtn.textContent = 'Saving...';
    saveBtn.disabled = true;

    // Validate custom rate if custom intensity selected
    const intensity = document.getElementById('intensity').value;
    let customRate = parseInt(document.getElementById('customRate').value);
    
    if (intensity === 'custom') {
      if (isNaN(customRate) || customRate < 1 || customRate > 60) {
        alert('Custom rate must be between 1 and 60 queries per hour.');
        saveBtn.textContent = originalText;
        saveBtn.disabled = false;
        return;
      }
    }

    // Gather settings
    const settings = {
      enabled: currentSettings.enabled, // Preserve enabled state
      paused: currentSettings.paused,   // Preserve paused state
      intensity: intensity,
      customRate: customRate,
      searchEngine: document.getElementById('searchEngine').value,
      enableResultClicks: document.getElementById('enableResultClicks').checked,
      debugMode: document.getElementById('debugMode').checked,
      schedule: {
        enabled: document.getElementById('scheduleEnabled').checked,
        startHour: parseInt(document.getElementById('startHour').value),
        endHour: parseInt(document.getElementById('endHour').value)
      },
      topics: {}
    };

    // Gather topic settings
    topicCategories.forEach(topic => {
      const checkbox = document.getElementById(`topic-${topic.id}`);
      if (checkbox) settings.topics[topic.id] = checkbox.checked;
    });

    // Send to broadcast channel (so popup and service worker update)
    await browser.runtime.sendMessage({ 
        type: 'updateSettings', 
        settings: settings 
    });

    // Update local state
    currentSettings = { ...currentSettings, ...settings };

    // Feedback
    saveBtn.textContent = 'Saved!';
    saveBtn.style.backgroundColor = 'var(--success-color)';
    
    setTimeout(() => {
      saveBtn.textContent = originalText;
      saveBtn.style.backgroundColor = originalColor;
      saveBtn.disabled = false;
    }, 1500);

  } catch (error) {
    console.error('Error saving settings:', error);
    alert('Error saving settings.');
    document.getElementById('saveBtn').disabled = false;
  }
}

async function panicStop() {
  if (confirm('Are you sure you want to stop all activity and clear logs?')) {
    await browser.runtime.sendMessage({ type: 'panic' });
    window.close();
  }
}
