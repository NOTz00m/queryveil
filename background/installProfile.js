// per-install variety.
//
// every copy of queryveil ships the same word lists. if every install drew
// from all of them evenly, an engine could learn one "queryveil
// distribution" from the public source and filter it out for everyone.
// so each install picks a random seed on first run and keeps its own stable
// subset of the vocabulary, its own topic leanings and, with a persona on,
// its own version of that persona. the seed stays on this device.
//
// personas also drift slowly: a few interests rotate each month, the way a
// real person's searches do, while the core stays the same for months

const PROFILE_KEY = 'installProfile';

export async function loadInstallProfile(storageArea) {
  try {
    const data = await storageArea.get(PROFILE_KEY);
    if (data[PROFILE_KEY]?.seed) return data[PROFILE_KEY];
  } catch (e) {
    // fall through and make one
  }

  const seed = crypto.getRandomValues(new Uint32Array(1))[0];
  const profile = { seed, createdAt: Date.now() };
  try {
    await storageArea.set({ [PROFILE_KEY]: profile });
  } catch (e) {
    // still usable for this session
  }
  return profile;
}

// month index used for slow persona drift
export function driftPeriod(date) {
  return date.getFullYear() * 12 + date.getMonth();
}

// stable value in [0, 1) for (seed, salt, item)
export function seededUnit(seed, salt, item) {
  let hash = (2166136261 ^ seed) >>> 0;
  const text = `${salt}|${item}`;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  // finalize so neighbouring strings spread out
  hash ^= hash >>> 15;
  hash = Math.imul(hash, 0x2c1b3c6d);
  hash ^= hash >>> 12;
  return (hash >>> 0) / 4294967296;
}

// keep a stable share of a list, never fewer than `min` items
export function stableSubset(list, seed, salt, share, min = 4) {
  if (list.length <= min) return [...list];
  const ranked = list
    .map(item => ({ item, score: seededUnit(seed, salt, item) }))
    .sort((a, b) => a.score - b.score);
  const keep = Math.max(min, Math.round(list.length * share));
  const kept = new Set(ranked.slice(0, keep).map(entry => entry.item));
  // keep the original order so templates stay readable
  return list.filter(item => kept.has(item));
}

// each install keeps 60-85% of every topic's entities, keywords and templates
export function personalizeTopics(topics, profile) {
  const out = {};
  for (const [id, topic] of Object.entries(topics)) {
    const share = 0.6 + seededUnit(profile.seed, 'share', id) * 0.25;
    out[id] = {
      ...topic,
      entities: stableSubset(topic.entities, profile.seed, `${id}:entities`, share, 6),
      keywords: stableSubset(topic.keywords, profile.seed, `${id}:keywords`, share, 5),
      templates: stableSubset(topic.templates, profile.seed, `${id}:templates`, share, 4)
    };
  }
  return out;
}

// how much this install leans toward each topic when no persona is set,
// between 0.5x and 1.7x. a flat spread over every topic is itself a tell,
// real people have favourites
export function topicLeanings(topicIds, profile) {
  const out = {};
  for (const id of topicIds) {
    out[id] = 0.5 + seededUnit(profile.seed, 'lean', id) * 1.2;
  }
  return out;
}

// this install's version of a persona: a stable core of its interests
// (about 65%), plus a rotating handful that changes month to month, and
// topic weights nudged by up to 25% either way
export function personalizePersona(persona, profile, date) {
  if (!persona) return null;
  if (!profile?.seed) return persona;
  const period = driftPeriod(date);
  const entities = {};

  for (const [topic, list] of Object.entries(persona.entities || {})) {
    const picked = list.filter(item => {
      const core = seededUnit(profile.seed, `${persona.id}:core`, item);
      if (core < 0.65) return true;
      if (core > 0.9) return false;
      return seededUnit(profile.seed, `${persona.id}:${period}`, item) < 0.4;
    });
    entities[topic] = picked.length >= 3 ? picked : list.slice(0, 3);
  }

  const topicWeights = {};
  for (const [topic, weight] of Object.entries(persona.topicWeights || {})) {
    const nudge = 0.8 + seededUnit(profile.seed, `${persona.id}:weight`, topic) * 0.45;
    topicWeights[topic] = weight * nudge;
  }

  return { ...persona, entities, topicWeights };
}
