// a small pool of real queries collected from the engines' own answers to
// cover searches: autosuggest completions and the related searches on the
// results page. follow-up searches inside a session are often picked from
// here, so the session moves the way the engine itself expects people to
// move, instead of following a template.
//
// everything here comes from responses to cover searches. the user's own
// searches are never read or stored. entries expire after a week

const browser = globalThis.browser || globalThis.chrome;

const POOL_KEY = 'realDataPool';
const MAX_ITEMS = 150;
const TTL = 7 * 24 * 3600000;

// skip anything sensitive or explicit. a cover profile that drifts into
// these topics would do the user more harm than good
const SENSITIVE = /\b(porn|sex|nude|naked|xxx|onlyfans|escort|suicide|self harm|kill|murder|bomb|weapon|gun|drug|cocaine|heroin|meth|overdose|abortion|hiv|std|rehab|bankrupt|divorce|arrest|lawsuit|deport|terror|hack|crack|torrent|casino|betting)\w*/i;

export class RealDataPool {
  constructor() {
    this.items = [];
    this.loaded = false;
  }

  async load() {
    if (this.loaded) return;
    try {
      const data = await browser.storage.local.get(POOL_KEY);
      this.items = (data[POOL_KEY] || []).filter(item => Date.now() - item.time < TTL);
    } catch (e) {
      this.items = [];
    }
    this.loaded = true;
  }

  async save() {
    try {
      await browser.storage.local.set({ [POOL_KEY]: this.items });
    } catch (e) {
      // pool is a nice-to-have
    }
  }

  // add candidates tied to the session that produced them
  async add(candidates, context) {
    await this.load();
    const now = Date.now();
    const existing = new Set(this.items.map(item => item.query));

    for (const raw of candidates) {
      const query = clean(raw);
      if (!query || existing.has(query)) continue;
      existing.add(query);
      this.items.push({
        query,
        topic: context.topic || null,
        language: context.language || 'en',
        sessionId: context.sessionId || null,
        time: now
      });
    }

    this.items = this.items.filter(item => now - item.time < TTL).slice(-MAX_ITEMS);
    await this.save();
  }

  // a follow-up for this session: prefer what the engine offered after the
  // last search in it, then anything on the same topic and language
  async pickFollowUp(session) {
    await this.load();
    if (!session) return null;

    const sameSession = this.items.filter(item => item.sessionId && item.sessionId === session.id);
    const sameTopic = this.items.filter(item => (
      item.topic === session.topic && item.language === (session.language || 'en')
    ));
    const pool = sameSession.length ? sameSession : sameTopic;
    if (!pool.length) return null;

    const pick = pool[Math.floor(Math.random() * pool.length)];
    // used once, then gone, so it isn't repeated
    this.items = this.items.filter(item => item !== pick);
    await this.save();
    return pick.query;
  }

  async clear() {
    this.items = [];
    await this.save();
  }
}

function clean(raw) {
  if (typeof raw !== 'string') return null;
  const query = raw.replace(/\s+/g, ' ').trim().toLowerCase();
  if (query.length < 3 || query.length > 90) return null;
  if (SENSITIVE.test(query)) return null;
  // urls, emails and long digit runs can identify someone
  if (/https?:|www\.|@|\d{5,}/.test(query)) return null;
  return query;
}
