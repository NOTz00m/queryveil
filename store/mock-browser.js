// fake extension api with realistic data so the real popup and settings
// pages can be rendered outside firefox for store screenshots.
// query params: theme=light|dark, state=active|paused|off, open=estimate
(() => {
  const params = new URLSearchParams(location.search);
  try {
    localStorage.setItem('theme', params.get('theme') || 'dark');
  } catch (e) {
    // ignore, falls back to system theme
  }

  // fixed spacing so every regenerated screenshot looks the same
  const now = Date.now();
  const gaps = [1.2, 3.1, 2.4, 4.8, 2.2, 3.9, 1.7, 5.2, 2.8, 3.3, 2.1, 4.4, 2.6, 3.7, 1.9, 4.1, 3.0];
  const recentQueries = [];
  let minutesAgo = 0.6;
  for (const gap of gaps) {
    recentQueries.push(now - minutesAgo * 60000);
    minutesAgo += gap;
  }
  const recentClicks = recentQueries.filter((_, index) => [1, 4, 6, 10, 13].includes(index))
    .map(time => time + 6000);

  const settings = {
    enabled: params.get('state') !== 'off',
    paused: params.get('state') === 'paused',
    intensity: 'high',
    customRate: 12,
    searchEngine: 'google',
    enableResultClicks: true,
    enableAutosuggest: true,
    enableTrends: true,
    persona: 'fitness',
    debugMode: false,
    languages: { primary: 'en', enabled: ['de', 'es', 'ro'], mixPercentage: 15 },
    schedule: { enabled: true, startHour: 8, endHour: 0 },
    topics: Object.fromEntries(
      'news shopping entertainment technology health travel food education gaming finance hobbies local general automotive pets realestate careers parenting science sports'
        .split(' ').map(topic => [topic, !['parenting', 'realestate'].includes(topic)])
    )
  };

  const statistics = {
    totalQueries: 9812,
    queriesThisSession: 46,
    resultClicks: 3127,
    sessionStartTime: now - 5 * 3600000,
    recentQueries,
    recentClicks
  };

  const personas = [
    ['student', 'College Student', 'Lectures, deadlines, cheap food, campus life'],
    ['techpro', 'Remote Tech Worker', 'Code, SaaS tools, standups, ergonomic setups'],
    ['fitness', 'Fitness Enthusiast', 'Gym routines, macros, recovery, gear reviews'],
    ['parent', 'New Parent', 'Baby milestones, sleep schedules, product reviews'],
    ['retiree', 'Retiree / Traveler', 'Travel planning, gardening, health management, hobbies'],
    ['foodie', 'Foodie / Home Cook', 'Recipes, restaurant reviews, kitchen gear, techniques'],
    ['gamer', 'Gamer', 'Game guides, builds, hardware, streams, esports'],
    ['business', 'Small Business Owner', 'Marketing, accounting, local SEO, hiring, logistics']
  ].map(([id, name, description]) => ({ id, name, description }));

  globalThis.browser = {
    runtime: {
      getManifest: () => ({ version: params.get('version') || '' }),
      onMessage: { addListener() {} },
      openOptionsPage() {},
      getURL: path => path,
      async sendMessage(message) {
        switch (message.type) {
          case 'getStatus':
            return {
              isActive: settings.enabled,
              isPaused: settings.paused,
              settings,
              statistics,
              nextRunAt: now + 134000,
              privacyScore: {
                score: 86,
                grade: 'A-',
                factors: { volume: 85, diversity: 90, consistency: 55, persona: 100, features: 100 }
              }
            };
          case 'getPersonas':
            return { personas };
          default:
            return { success: true };
        }
      }
    }
  };

  // show a settings section at the top of the shot. headless screenshots
  // don't capture scrolled pages reliably, so hide what comes before it
  const section = params.get('section');
  if (section) {
    document.addEventListener('DOMContentLoaded', () => {
      const target = document.getElementById(section);
      if (!target) return;
      document.querySelector('.page-head')?.setAttribute('hidden', '');
      for (const group of document.querySelectorAll('.group')) {
        if (group === target) break;
        group.hidden = true;
      }
      target.style.paddingTop = '8px';
      for (const link of document.querySelectorAll('.toc a')) {
        link.classList.toggle('is-current', link.getAttribute('href') === `#${section}`);
      }
    });
  }

  if (params.get('open') === 'estimate') {
    document.addEventListener('DOMContentLoaded', () => {
      document.getElementById('estimate')?.setAttribute('open', '');
    });
  }
})();
