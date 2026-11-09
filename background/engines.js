// search engine definitions, matched to what firefox itself sends.
//
// the urls and parameters below come from mozilla's live search config
// (remote settings collection "search-config-v2", checked november 2026)
// and were confirmed against firefox 159 with browser.search.search():
//   google      https://www.google.com/search?client=firefox-b-d&q=...
//               (firefox-b-1-d in the us, plus a channel param in some builds)
//   bing        https://www.bing.com/search?pc=MOZI&form=MOZLBR&q=...
//   duckduckgo  https://duckduckgo.com/?t=ffab&q=...
// suggestions use the address bar endpoints firefox uses, which firefox
// sends anonymously (LOAD_ANONYMOUS, so no cookies)
//
// in real page mode none of this url building is needed because
// browser.search.search() builds the exact url the user's own firefox
// would, partner codes included. the builders here are for background
// mode and for the benchmark

export const ENGINES = {
  google: {
    id: 'google',
    // name as it appears in browser.search.get(), used by search.search()
    name: 'Google',
    host: 'www.google.com',
    searchPath: '/search',
    queryParam: 'q',
    defaultParams: [['client', 'firefox-b-d']],
    // parameters that identify the browser build, never the query.
    // these are the only ones we learn from the user's own searches
    learnableParams: ['client', 'channel'],
    suggestURL: q => `https://www.google.com/complete/search?client=firefox&channel=fen&q=${formEncode(q)}`,
    blockedPaths: ['/sorry/']
  },
  bing: {
    id: 'bing',
    name: 'Bing',
    host: 'www.bing.com',
    searchPath: '/search',
    queryParam: 'q',
    defaultParams: [['pc', 'MOZI'], ['form', 'MOZLBR']],
    learnableParams: ['pc', 'form'],
    suggestURL: q => `https://www.bing.com/osjson.aspx?form=OSDJAS&query=${formEncode(q)}`,
    blockedPaths: ['/turing/', '/challenge']
  },
  duckduckgo: {
    id: 'duckduckgo',
    name: 'DuckDuckGo',
    host: 'duckduckgo.com',
    searchPath: '/',
    queryParam: 'q',
    defaultParams: [['t', 'ffab']],
    learnableParams: ['t'],
    suggestURL: q => `https://ac.duckduckgo.com/ac/?q=${formEncode(q)}&type=list`,
    blockedPaths: []
  }
};

// firefox escapes search terms form style, spaces become '+'
function formEncode(text) {
  return new URLSearchParams({ q: text }).toString().slice(2);
}

export function getEngine(id) {
  return ENGINES[id] || ENGINES.google;
}

// url patterns for webRequest filters
export const SEARCH_URL_PATTERNS = [
  'https://www.google.com/*',
  'https://www.bing.com/*',
  'https://duckduckgo.com/*'
];

export const SUGGEST_URL_PATTERNS = [
  'https://www.google.com/complete/*',
  'https://www.bing.com/osjson.aspx*',
  'https://ac.duckduckgo.com/*'
];

// build the url firefox's address bar would produce. learned params are
// the build-identifying params seen on the user's own searches, so cover
// searches carry the same partner code as the real ones. firefox puts the
// search term last and encodes spaces as '+', which URLSearchParams matches
export function buildSearchURL(engineId, query, learnedParams = null) {
  const engine = getEngine(engineId);
  const params = new URLSearchParams();
  const base = learnedParams?.length ? learnedParams : engine.defaultParams;
  for (const [name, value] of base) params.append(name, value);
  params.append(engine.queryParam, query);
  return `https://${engine.host}${engine.searchPath}?${params.toString()}`;
}

// which engine a url belongs to, if it's a results page
export function matchSearchURL(url) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch (e) {
    return null;
  }
  for (const engine of Object.values(ENGINES)) {
    if (parsed.hostname !== engine.host) continue;
    if (parsed.pathname !== engine.searchPath) continue;
    const query = parsed.searchParams.get(engine.queryParam);
    if (!query) continue;
    return { engine, query, params: parsed.searchParams };
  }
  return null;
}

// pull only the whitelisted build params out of a real search url.
// anything that could carry query text (q, oq, gs_lp...) is never kept
export function learnParams(engine, searchParams) {
  const learned = [];
  for (const name of engine.learnableParams) {
    const value = searchParams.get(name);
    if (value && /^[\w.-]{1,40}$/.test(value)) learned.push([name, value]);
  }
  return learned;
}

export function isBlockedURL(engineId, url) {
  const engine = getEngine(engineId);
  try {
    const parsed = new URL(url);
    if (parsed.hostname === 'consent.google.com') return false;
    return engine.blockedPaths.some(path => parsed.pathname.startsWith(path));
  } catch (e) {
    return false;
  }
}
