// privacy score — calculates a local obfuscation effectiveness estimate
// based entirely on data we already have in storage. nothing leaves the
// browser, this is pure math on local stats and settings.
//
// the score is meant to give users a rough sense of how effectively
// their real search profile is being buried under noise. it's not
// a guarantee — we label it as an estimate in the UI.

export class PrivacyScore {

  // compute the full score breakdown.
  // returns { score: 0-100, grade: 'A+'-'F', factors: {...} }
  calculate(settings, statistics) {
    const factors = {
      volume: this.volumeFactor(settings, statistics),
      diversity: this.diversityFactor(settings),
      consistency: this.consistencyFactor(statistics),
      persona: this.personaFactor(settings),
      features: this.featuresFactor(settings)
    };

    // weighted average — volume and diversity matter most,
    // consistency rewards sustained use, persona and features are bonuses
    const weights = {
      volume: 0.30,
      diversity: 0.25,
      consistency: 0.20,
      persona: 0.15,
      features: 0.10
    };

    let score = 0;
    for (const [key, weight] of Object.entries(weights)) {
      score += factors[key] * weight;
    }

    // clamp 0-100
    score = Math.max(0, Math.min(100, Math.round(score)));

    return {
      score,
      grade: this.toGrade(score),
      factors
    };
  }

  // how much noise volume relative to a typical human's search rate.
  // a real person does maybe 3-8 searches per day. if queryveil is
  // doing 12/hr for 8 hours, that's ~96 noise queries burying ~5 real ones.
  // that's a 19:1 noise ratio which is excellent.
  volumeFactor(settings, statistics) {
    if (!settings?.enabled) return 0;
    if (settings.paused) return 10;

    const total = statistics?.totalQueries || 0;

    // rough estimate: assume user does ~5 real searches per day.
    // more noise queries = higher score
    if (total < 10) return 15;      // just started, barely any cover
    if (total < 50) return 30;
    if (total < 200) return 50;
    if (total < 500) return 65;
    if (total < 1000) return 75;
    if (total < 5000) return 85;
    return 95;                      // substantial noise history built up
  }

  // how many topic categories are enabled.
  // more diversity = harder for classifiers to filter noise from signal
  diversityFactor(settings) {
    const topics = settings?.topics || {};
    const enabled = Object.values(topics).filter(v => v === true).length;
    const total = Object.keys(topics).length || 1;

    const ratio = enabled / total;

    // scoring: 1-3 topics is pretty weak, 8+ is solid, all is ideal
    if (ratio >= 0.9) return 100;
    if (ratio >= 0.7) return 85;
    if (ratio >= 0.5) return 65;
    if (ratio >= 0.3) return 40;
    return 20;
  }

  // how long the extension has been running.
  // profiling algorithms need sustained noise to be confused —
  // sporadic on/off usage is much less effective
  consistencyFactor(statistics) {
    const sessionStart = statistics?.sessionStartTime;
    if (!sessionStart) return 10;

    const uptimeMs = Date.now() - sessionStart;
    const uptimeHours = uptimeMs / (1000 * 60 * 60);

    if (uptimeHours < 0.5) return 15;
    if (uptimeHours < 2) return 35;
    if (uptimeHours < 8) return 55;
    if (uptimeHours < 24) return 70;
    if (uptimeHours < 72) return 85;
    return 95;
  }

  // having an active persona means the noise forms a coherent fake identity
  // instead of random scatter — much harder for ML to filter out
  personaFactor(settings) {
    if (settings?.persona && settings.persona !== 'none') return 100;
    return 35; // random noise still has value, just less
  }

  // bonus points for enabling extra features that improve realism
  featuresFactor(settings) {
    let score = 30; // base score for having the extension at all

    if (settings?.enableAutosuggest) score += 35;
    if (settings?.enableTrends) score += 35;

    return Math.min(100, score);
  }

  // convert numeric score to letter grade
  toGrade(score) {
    if (score >= 95) return 'A+';
    if (score >= 90) return 'A';
    if (score >= 85) return 'A-';
    if (score >= 80) return 'B+';
    if (score >= 75) return 'B';
    if (score >= 70) return 'B-';
    if (score >= 65) return 'C+';
    if (score >= 60) return 'C';
    if (score >= 55) return 'C-';
    if (score >= 50) return 'D+';
    if (score >= 45) return 'D';
    if (score >= 40) return 'D-';
    return 'F';
  }
}
