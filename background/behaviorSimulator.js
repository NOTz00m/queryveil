/**
 * Behavioral Simulation Engine
 * Generates human-like timing patterns and session structures
 */

export class BehaviorSimulator {
  constructor() {
    this.currentSession = null;
    this.lastQueryTime = null;
    this.queriesThisHour = 0;
    this.hourResetTime = Date.now() + 3600000;
  }

  /**
   * Get next query time based on realistic human patterns
   * @param {Object} settings - User settings
   * @returns {number} Milliseconds until next query
   */
  getNextQueryDelay(settings) {
    const now = Date.now();
    
    // Reset hourly counter
    if (now > this.hourResetTime) {
      this.queriesThisHour = 0;
      this.hourResetTime = now + 3600000;
    }

    // Check if we need to start a new session
    if (!this.currentSession || this.currentSession.queriesRemaining <= 0) {
      return this.startNewSession(settings);
    }

    // Within-session delay (shorter, more focused)
    return this.getWithinSessionDelay(settings);
  }

  /**
   * Start a new search session with realistic inter-session gap
   * @param {Object} settings
   * @returns {number} Milliseconds until session starts
   */
  startNewSession(settings) {
    // Inter-session gap: 30-90 minutes using Gamma distribution
    const sessionGap = this.gammaRandom(2, 1800000); // shape=2, scale=30min
    
    // Session will have 2-8 related queries
    const sessionLength = Math.floor(this.normalRandom(4, 2));
    const queriesInSession = Math.max(2, Math.min(8, sessionLength));
    
    this.currentSession = {
      queriesRemaining: queriesInSession,
      topic: null, // Will be set by query generator
      startTime: Date.now() + sessionGap
    };

    return sessionGap;
  }

  /**
   * Get delay between queries within the same session
   * @param {Object} settings
   * @returns {number} Milliseconds until next query
   */
  getWithinSessionDelay(settings) {
    // Within-session: 1-5 minutes using Exponential distribution
    const baseDelay = this.exponentialRandom(180000); // mean = 3 minutes
    
    // Add jitter using normal distribution
    const jitter = this.normalRandom(0, 30000); // ±30 seconds
    
    // Time-of-day weighting
    const timeWeight = this.getTimeOfDayWeight();
    
    // Adjust based on intensity setting
    const intensityMultiplier = this.getIntensityMultiplier(settings.intensity, settings.customRate);
    
    const totalDelay = Math.max(
      60000, // Minimum 1 minute between queries
      (baseDelay + jitter) * timeWeight / intensityMultiplier
    );

    this.currentSession.queriesRemaining--;
    return totalDelay;
  }

  /**
   * Weight queries based on time of day (humans search more during waking hours)
   * @returns {number} Multiplier for delay (higher = longer delay = fewer queries)
   */
  getTimeOfDayWeight() {
    const hour = new Date().getHours();
    
    // Very low activity 12am-6am (sleep hours)
    if (hour >= 0 && hour < 6) return 4.0;
    
    // Morning ramp-up 6am-9am
    if (hour >= 6 && hour < 9) return 1.5;
    
    // Peak hours 9am-11pm
    if (hour >= 9 && hour < 23) return 1.0;
    
    // Evening wind-down 11pm-12am
    return 2.0;
  }

  /**
   * Convert intensity setting to multiplier
   * @param {string} intensity - 'low', 'medium', 'high', 'custom'
   * @param {number} customRate - Custom queries per hour (if intensity is 'custom')
   * @returns {number}
   */
  getIntensityMultiplier(intensity, customRate = null) {
    // If custom intensity with a rate, calculate multiplier based on medium (12/hour)
    if (intensity === 'custom' && customRate) {
      return customRate / 12.0;
    }
    
    const multipliers = {
      'low': 0.5,    // 6 queries/hour max
      'medium': 1.0,  // 12 queries/hour max
      'high': 1.8,    // 20 queries/hour max
      'custom': 1.0   // Default if no custom rate specified
    };
    return multipliers[intensity] || 1.0;
  }

  /**
   * Check if we should execute a query now based on rate limiting
   * @param {string} intensity
   * @param {number} customRate - Custom queries per hour (if intensity is 'custom')
   * @returns {boolean}
   */
  canExecuteQuery(intensity, customRate = null) {
    // If custom intensity, use the custom rate
    if (intensity === 'custom' && customRate) {
      return this.queriesThisHour < customRate;
    }
    
    const maxQueries = {
      'low': 6,
      'medium': 12,
      'high': 20,
      'custom': 12  // Default if no custom rate specified
    };
    
    return this.queriesThisHour < (maxQueries[intensity] || 12);
  }

  /**
   * Record that a query was executed
   */
  recordQuery() {
    this.queriesThisHour++;
    this.lastQueryTime = Date.now();
  }

  /**
   * Should we mix query with user's active browsing?
   * @param {string} userState - 'active', 'idle', 'locked'
   * @returns {boolean}
   */
  shouldMixWithActivity(userState) {
    if (userState === 'locked') return false;
    
    // 70% chance to execute during active browsing
    // 30% chance to execute during idle (humans search when "idle" too)
    const threshold = userState === 'active' ? 0.7 : 0.3;
    return Math.random() < threshold;
  }

  // Statistical distribution helpers

  /**
   * Generate random number from exponential distribution
   * @param {number} mean
   * @returns {number}
   */
  exponentialRandom(mean) {
    return -Math.log(1 - Math.random()) * mean;
  }

  /**
   * Generate random number from normal (Gaussian) distribution
   * Using Box-Muller transform
   * @param {number} mean
   * @param {number} stdDev
   * @returns {number}
   */
  normalRandom(mean, stdDev) {
    const u1 = Math.random();
    const u2 = Math.random();
    const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    return z0 * stdDev + mean;
  }

  /**
   * Generate random number from Gamma distribution
   * Using Marsaglia and Tsang's method
   * @param {number} shape - Shape parameter (α)
   * @param {number} scale - Scale parameter (β)
   * @returns {number}
   */
  gammaRandom(shape, scale) {
    // Simplified gamma for shape=2 (Erlang distribution)
    if (shape === 2) {
      return -scale * (Math.log(Math.random()) + Math.log(Math.random()));
    }
    
    // For other shapes, use simpler approximation
    let sum = 0;
    for (let i = 0; i < shape; i++) {
      sum += this.exponentialRandom(1);
    }
    return sum * scale;
  }

  /**
   * Get query complexity based on realistic distribution
   * @returns {string} 'short', 'medium', 'long', 'very_long'
   */
  getQueryComplexity() {
    const rand = Math.random();
    
    if (rand < 0.30) return 'short';      // 30%: 1-2 words
    if (rand < 0.80) return 'medium';     // 50%: 3-5 words
    if (rand < 0.95) return 'long';       // 15%: 6-10 words
    return 'very_long';                    // 5%: questions/sentences
  }

  /**
   * Should we simulate a typo in this query?
   * @returns {boolean}
   */
  shouldAddTypo() {
    return Math.random() < 0.015; // 1.5% of queries
  }

  /**
   * Should we simulate clicking on a result?
   * @returns {boolean}
   */
  shouldClickResult() {
    return Math.random() < 0.40; // 40% of queries
  }

  /**
   * Get realistic dwell time on result page (milliseconds)
   * @returns {number}
   */
  getResultDwellTime() {
    const rand = Math.random();
    
    if (rand < 0.70) {
      // Quick exit: 5-15 seconds
      return this.normalRandom(10000, 3000);
    } else if (rand < 0.95) {
      // Medium stay: 15-60 seconds
      return this.normalRandom(37500, 15000);
    } else {
      // Long stay: 60-180 seconds
      return this.normalRandom(120000, 40000);
    }
  }

  /**
   * Should we do a follow-up refinement search?
   * @returns {boolean}
   */
  shouldRefineSearch() {
    return Math.random() < 0.10; // 10% of searches get refined
  }

  /**
   * Get current session info
   * @returns {Object}
   */
  getSessionInfo() {
    return this.currentSession;
  }
}
