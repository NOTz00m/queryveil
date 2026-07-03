const browser = globalThis.browser || globalThis.chrome;

// all topic categories — updated with new ones
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
  { id: 'finance', label: 'Finance', description: 'Stocks and investing' },
  { id: 'hobbies', label: 'Hobbies', description: 'DIY and crafts' },
  { id: 'local', label: 'Local', description: 'Nearby places and services' },
  { id: 'general', label: 'General', description: 'General knowledge queries' },
  { id: 'automotive', label: 'Automotive', description: 'Cars, maintenance, reviews' },
  { id: 'pets', label: 'Pets', description: 'Pet care and breeds' },
  { id: 'realestate', label: 'Real Estate', description: 'Housing, renting, renovation' },
  { id: 'careers', label: 'Careers', description: 'Jobs, salaries, resumes' },
  { id: 'parenting', label: 'Parenting', description: 'Kids, milestones, activities' },
  { id: 'science', label: 'Science', description: 'Discoveries and research' },
  { id: 'sports', label: 'Sports', description: 'Scores, schedules, teams' }
];

let currentSettings = null;
let personaList = [];

document.addEventListener('DOMContentLoaded', async () => {
  await loadSettings();
  await loadPersonas();
  populateTopicGrid();
  updateUI();
  setupEventListeners();

  // listen for live broadcast updates
  browser.runtime.onMessage.addListener((message) => {
    if (message.type === 'statusUpdated') {
      currentSettings = message.settings;
      updateUI();
    }
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
    if (!select) return;

    personaList.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = p.name;
      select.appendChild(opt);
    });
  } catch (e) {
    console.error('error loading personas:', e);
  }
}

function getDefaultSettings() {
  return {
    enabled: false,
    intensity: 'medium',
    customRate: 12,
    searchEngine: 'google',
    enableResultClicks: false,
    enableAutosuggest: false,
    enableTrends: true,
    persona: 'none',
    debugMode: false,
    schedule: {
      enabled: false,
      startHour: 9,
      endHour: 23
    },
    topics: {
      news: true, shopping: true, entertainment: true, technology: true,
      health: true, travel: true, food: true, education: true,
      gaming: true, finance: true, hobbies: true, local: true,
      general: true, automotive: true, pets: true, realestate: true,
      careers: true, parenting: true, science: true, sports: true
    }
  };
}

function populateTopicGrid() {
  const grid = document.getElementById('topicGrid');
  if (!grid) return;
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

    // make the whole item clickable
    item.addEventListener('click', (e) => {
      if (e.target !== checkbox && e.target !== label) {
        checkbox.checked = !checkbox.checked;
      }
    });
  });
}

function updateUI() {
  if (!currentSettings) return;

  const intensitySelect = document.getElementById('intensity');
  if (intensitySelect) intensitySelect.value = currentSettings.intensity;

  const searchEngine = document.getElementById('searchEngine');
  if (searchEngine) searchEngine.value = currentSettings.searchEngine;

  const customRate = document.getElementById('customRate');
  if (customRate) customRate.value = currentSettings.customRate || 12;

  const enableResultClicks = document.getElementById('enableResultClicks');
  if (enableResultClicks) enableResultClicks.checked = currentSettings.enableResultClicks;

  const enableAutosuggest = document.getElementById('enableAutosuggest');
  if (enableAutosuggest) enableAutosuggest.checked = currentSettings.enableAutosuggest || false;

  const enableTrends = document.getElementById('enableTrends');
  if (enableTrends) enableTrends.checked = currentSettings.enableTrends !== false;

  const persona = document.getElementById('persona');
  if (persona) persona.value = currentSettings.persona || 'none';

  const debugMode = document.getElementById('debugMode');
  if (debugMode) debugMode.checked = currentSettings.debugMode;

  const scheduleEnabled = document.getElementById('scheduleEnabled');
  if (scheduleEnabled) scheduleEnabled.checked = currentSettings.schedule?.enabled || false;

  const startHour = document.getElementById('startHour');
  if (startHour) startHour.value = currentSettings.schedule?.startHour || 9;

  const endHour = document.getElementById('endHour');
  if (endHour) endHour.value = currentSettings.schedule?.endHour || 23;

  updateScheduleVisibility();
  updateCustomRateVisibility();
  updatePersonaDescription();

  // resync topic checkboxes
  topicCategories.forEach(topic => {
    const cb = document.getElementById(`topic-${topic.id}`);
    if (cb) cb.checked = currentSettings.topics?.[topic.id] !== false;
  });
}

function updateScheduleVisibility() {
  const scheduleHours = document.getElementById('scheduleHours');
  const scheduleEnabled = document.getElementById('scheduleEnabled');

  if (scheduleHours && scheduleEnabled) {
    scheduleHours.style.opacity = scheduleEnabled.checked ? '1' : '0.5';
    const inputs = scheduleHours.querySelectorAll('input');
    inputs.forEach(input => input.disabled = !scheduleEnabled.checked);
  }
}

function updateCustomRateVisibility() {
  const customRateGroup = document.getElementById('customRateGroup');
  const intensity = document.getElementById('intensity');

  if (customRateGroup && intensity) {
    customRateGroup.style.display = intensity.value === 'custom' ? 'flex' : 'none';
  }
}

// show the description of the currently selected persona
function updatePersonaDescription() {
  const descEl = document.getElementById('personaDescription');
  const personaSelect = document.getElementById('persona');
  if (!descEl || !personaSelect) return;

  const selectedId = personaSelect.value;
  if (selectedId === 'none') {
    descEl.textContent = '';
    descEl.style.display = 'none';
    return;
  }

  const persona = personaList.find(p => p.id === selectedId);
  if (persona) {
    descEl.textContent = persona.description;
    descEl.style.display = 'block';
  } else {
    descEl.textContent = '';
    descEl.style.display = 'none';
  }
}

function setupEventListeners() {
  const scheduleEnabled = document.getElementById('scheduleEnabled');
  if (scheduleEnabled) {
    scheduleEnabled.addEventListener('change', updateScheduleVisibility);
  }

  const intensity = document.getElementById('intensity');
  if (intensity) {
    intensity.addEventListener('change', updateCustomRateVisibility);
  }

  const persona = document.getElementById('persona');
  if (persona) {
    persona.addEventListener('change', updatePersonaDescription);
  }

  const customRate = document.getElementById('customRate');
  if (customRate) {
    customRate.addEventListener('input', function() {
      const value = parseInt(this.value);
      if (value < 1) this.value = 1;
      if (value > 60) this.value = 60;
    });
  }

  const saveBtn = document.getElementById('saveBtn');
  if (saveBtn) saveBtn.addEventListener('click', saveSettings);

  const panicBtn = document.getElementById('panicBtn');
  if (panicBtn) panicBtn.addEventListener('click', panicStop);
}

async function saveSettings() {
  try {
    const saveBtn = document.getElementById('saveBtn');
    const originalText = saveBtn.textContent;
    const originalBg = saveBtn.style.backgroundColor;

    saveBtn.textContent = 'Saving...';
    saveBtn.disabled = true;

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

    const settings = {
      enabled: currentSettings.enabled,
      paused: currentSettings.paused,
      intensity: intensity,
      customRate: customRate,
      searchEngine: document.getElementById('searchEngine').value,
      enableResultClicks: document.getElementById('enableResultClicks').checked,
      enableAutosuggest: document.getElementById('enableAutosuggest').checked,
      enableTrends: document.getElementById('enableTrends').checked,
      persona: document.getElementById('persona').value,
      debugMode: document.getElementById('debugMode').checked,
      schedule: {
        enabled: document.getElementById('scheduleEnabled').checked,
        startHour: parseInt(document.getElementById('startHour').value),
        endHour: parseInt(document.getElementById('endHour').value)
      },
      topics: {}
    };

    topicCategories.forEach(topic => {
      const checkbox = document.getElementById(`topic-${topic.id}`);
      if (checkbox) settings.topics[topic.id] = checkbox.checked;
    });

    await browser.runtime.sendMessage({
      type: 'updateSettings',
      settings: settings
    });

    currentSettings = { ...currentSettings, ...settings };

    saveBtn.textContent = 'Saved!';
    saveBtn.style.backgroundColor = 'var(--success-color)';

    setTimeout(() => {
      saveBtn.textContent = originalText;
      saveBtn.style.backgroundColor = originalBg;
      saveBtn.disabled = false;
    }, 1500);

  } catch (error) {
    console.error('error saving settings:', error);
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
