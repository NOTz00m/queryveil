// behavior simulation engine generates human-like timing patterns
// and session structures using statistical distributions instead of
// fixed intervals so the query schedule looks organic

export class BehaviorSimulator {
  constructor() {
    this.currentSession = null;
    this.lastQueryTime = null;
    this.queriesThisHour = 0;
    this.hourResetTime = Date.now() + 3600000;
  }

  getState() {
    return {
      currentSession: this.currentSession,
      lastQueryTime: this.lastQueryTime,
      queriesThisHour: this.queriesThisHour,
      hourResetTime: this.hourResetTime
    };
  }

  setState(state) {
    if (!state) return;
    this.currentSession = state.currentSession;
    this.lastQueryTime = state.lastQueryTime;
    this.queriesThisHour = state.queriesThisHour || 0;
    this.hourResetTime = state.hourResetTime || (Date.now() + 3600000);
  }

  // figure out when to fire the next query.
  // custom rate mode uses even spacing with jitter,
  // standard modes (low/medium/high) use session-based timing
  getNextQueryDelay(settings) {
    const now = Date.now();

    // custom rate user specified exact queries/hour
    // spread evenly with 20% jitter so it's not a perfect metronome
    if (settings.intensity === 'custom' && settings.customRate) {
      const targetRatePerHour = Math.max(1, Math.min(60, settings.customRate));
      const intervalMs = 3600000 / targetRatePerHour;
      const jitter = intervalMs * 0.2;
      const actualDelay = intervalMs + this.normalRandom(-jitter, jitter);
      return Math.max(5000, actualDelay);
    }

    // reset hourly counter if the window has elapsed
    if (now > this.hourResetTime) {
      this.queriesThisHour = 0;
      this.hourResetTime = now + 3600000;
    }

    // start a new session if the current one is done
    if (!this.currentSession || this.currentSession.queriesRemaining <= 0) {
      return this.startNewSession(settings);
    }

    // within an active session shorter, more focused delays
    return this.getWithinSessionDelay(settings);
  }

  // start a new search session with a realistic gap before it begins
  // real users don't search constantly they have bursts of
  // 2-8 related searches separated by longer idle periods
  startNewSession(settings) {
    const multiplier = this.getIntensityMultiplier(settings.intensity, settings.customRate);

    // base gap is 30 minutes, scaled down by intensity squared
    // so high intensity gets much more frequent sessions
    const baseScale = 1800000;
    const adjustedScale = baseScale / (multiplier * multiplier);
    const sessionGap = this.gammaRandom(2, adjustedScale);

    // sessions have 2-8 related queries, centered around 4
    const sessionLength = Math.floor(this.normalRandom(4, 2));
    const queriesInSession = Math.max(2, Math.min(8, sessionLength));

    this.currentSession = {
      queriesRemaining: queriesInSession,
      topic: null, // set by query generator when the first query fires
      startTime: Date.now() + sessionGap
    };

    return sessionGap;
  }

  // delay between queries within the same session.
  // these are shorter (1-5 min) because it simulates someone
  // actively researching a topic and refining their searches
  getWithinSessionDelay(settings) {
    // exponential distribution with 3 minute mean
    const baseDelay = this.exponentialRandom(180000);

    // gaussian jitter ±30s
    const jitter = this.normalRandom(0, 30000);

    // time-of-day weighting — search less during sleep hours
    const timeWeight = this.getTimeOfDayWeight();

    const intensityMultiplier = this.getIntensityMultiplier(settings.intensity, settings.customRate);

    const totalDelay = Math.max(
      60000, // hard floor: 1 minute between queries minimum
      (baseDelay + jitter) * timeWeight / intensityMultiplier
    );

    this.currentSession.queriesRemaining--;
    return totalDelay;
  }

  // returns a multiplier for delay based on time of day.
  // higher value = longer delay = fewer queries.
  // models the fact that humans don't search at 3am (usually)
  getTimeOfDayWeight() {
    const hour = new Date().getHours();

    if (hour >= 0 && hour < 6) return 4.0;   // 12am-6am: sleep
    if (hour >= 6 && hour < 9) return 1.5;   // 6am-9am: waking up
    if (hour >= 9 && hour < 23) return 1.0;  // 9am-11pm: peak activity
    return 2.0;                               // 11pm-12am: winding down
  }

  // convert intensity setting to a numeric multiplier.
  // medium is the baseline (1.0), low is half, high is nearly double
  getIntensityMultiplier(intensity, customRate = null) {
    if (intensity === 'custom' && customRate) {
      return customRate / 12.0;
    }

    const multipliers = {
      'low': 0.5,     // ~6 queries/hour
      'medium': 1.0,  // ~12 queries/hour
      'high': 1.8,    // ~20 queries/hour
      'custom': 1.0
    };
    return multipliers[intensity] || 1.0;
  }

  // rate limiter prevents exceeding the max queries per hour
  // for the current intensity level
  canExecuteQuery(intensity, customRate = null) {
    if (intensity === 'custom' && customRate) {
      return this.queriesThisHour < customRate;
    }

    const maxQueries = {
      'low': 6,
      'medium': 12,
      'high': 20,
      'custom': 12
    };

    return this.queriesThisHour < (maxQueries[intensity] || 12);
  }

  recordQuery() {
    this.queriesThisHour++;
    this.lastQueryTime = Date.now();
  }

  // decide whether to fire during active vs idle browsing.
  // real humans search during both states, but more during active
  shouldMixWithActivity(userState) {
    if (userState === 'locked') return false;
    const threshold = userState === 'active' ? 0.7 : 0.3;
    return Math.random() < threshold;
  }

  // --- statistical distributions ---
  // these are the core of making timing look human.
  // fixed intervals are trivially detectable; proper distributions aren't.

  // exponential distribution memoryless wait times
  exponentialRandom(mean) {
    return -Math.log(1 - Math.random()) * mean;
  }

  // normal (gaussian) distribution via box-muller transform
  // used for jitter and session length randomization
  normalRandom(mean, stdDev) {
    const u1 = Math.random();
    const u2 = Math.random();
    const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    return z0 * stdDev + mean;
  }

  // gamma distribution marsaglia and tsang's method
  // used for inter-session gaps gives a natural "bursty" pattern
  // where most gaps are moderate but occasionally there's a long one
  gammaRandom(shape, scale) {
    if (shape === 2) {
      // erlang-2: sum of two exponentials (exact)
      return -scale * (Math.log(Math.random()) + Math.log(Math.random()));
    }

    let sum = 0;
    for (let i = 0; i < shape; i++) {
      sum += this.exponentialRandom(1);
    }
    return sum * scale;
  }

  // pick query complexity based on how real search queries are distributed.
  // most searches are 3-5 words (medium), very few are full sentences
  getQueryComplexity() {
    const rand = Math.random();
    if (rand < 0.30) return 'short';      // 30%: 1-2 words
    if (rand < 0.80) return 'medium';     // 50%: 3-5 words
    if (rand < 0.95) return 'long';       // 15%: 6-10 words
    return 'very_long';                    // 5%: questions/sentences
  }

  // ~1.5% of queries get a typo matches real human error rate
  shouldAddTypo() {
    return Math.random() < 0.015;
  }

  // ~40% of searches result in clicking a result
  shouldClickResult() {
    return Math.random() < 0.40;
  }

  // how long someone stays on a result page before bouncing.
  // most visits are quick scans (5-15s), some are medium reads,
  // rare ones are deep dives
  getResultDwellTime() {
    const rand = Math.random();
    if (rand < 0.70) return this.normalRandom(10000, 3000);     // quick: 5-15s
    if (rand < 0.95) return this.normalRandom(37500, 15000);    // medium: 15-60s
    return this.normalRandom(120000, 40000);                     // deep: 60-180s
  }

  // ~10% of searches get refined (adding "reddit", year, etc.)
  shouldRefineSearch() {
    return Math.random() < 0.10;
  }

  getSessionInfo() {
    return this.currentSession;
  }
}
