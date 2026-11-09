# Technical guide

## How QueryVeil works

The background script (an event page on Firefox) schedules a search, asks the behavior simulator for query length and session context, and picks a query. Within a session, later searches usually follow on from the last one: a completion the engine suggested, a related search from the results page, or a refinement. Otherwise the generator selects a topic, applies this install's own vocabulary subset, optional persona and trend bias, and builds a new query.

The search then runs in one of two modes:

- **Real pages (default on Firefox).** A hidden tab is opened and `browser.search.search()` runs the query in it, so Firefox builds the URL itself with the same partner code your own searches carry. The results page loads fully with first-party cookies. The page is scrolled, and one result may be clicked inside the page. The history it created is removed, and the tab waits on `about:blank` for the next search in the session. When the session ends, or after ten minutes with no search, it is closed and removed from Recently Closed.
- **Background.** A single request for the results page, shaped to look like a navigation. Lighter, but nothing the page would load after it ever happens.

## Making cover requests look like real ones

Everything below was checked on Firefox 159.0.1 against a local server that logs request headers, and against Mozilla's live search configuration (`search-config-v2`).

| Signal | Real search typed in the address bar | Old QueryVeil (background `fetch`) | Now |
| --- | --- | --- | --- |
| Search URL | `google.com/search?client=firefox-b-d&q=…` (`firefox-b-1-d` in the US), `bing.com/search?pc=MOZI&form=MOZLBR&q=…`, `duckduckgo.com/?t=ffab&q=…` | bare `?q=…` | Firefox builds it (real pages), or the partner code learned from your own searches (background) |
| `Sec-Fetch-Site` / `-Mode` / `-Dest` | `none` / `navigate` / `document` | `same-origin` / `cors` / `empty` | matches, rewritten with blocking webRequest |
| `Sec-Fetch-User` | `?1` | absent | `?1` |
| `Accept`, `Priority`, `Upgrade-Insecure-Requests` | navigation values | `*/*`, `u=4`, absent | navigation values |
| `Accept-Language` | from your Firefox language prefs | rewritten per query language | left to Firefox |
| `DNT`, `Cache-Control: max-age=0` | not sent by default | always sent | never set |
| Page subresources, scripts, engine telemetry | load | none | load (real pages) |
| Suggest requests | one per keystroke, no cookies, no `Sec-Fetch-*` (Firefox sends them with `LOAD_ANONYMOUS` as a system request) | 3 to 6 prefixes with cookies | one per keystroke at typing speed, no cookies, no `Sec-Fetch-*`, Firefox's own suggest endpoints |
| Result click | inside the page, `Referer: https://www.google.com/`, `Sec-Fetch-Site: cross-site` | separate fetch, no referer | clicked inside the page (real pages): same referer and site, and the page's own mousedown and click handlers run |

Extension-opened tabs are marked `Sec-Fetch-Site: same-origin` with no `Sec-Fetch-User` by Firefox, because the extension started the navigation. The request shaper corrects only QueryVeil's own tabs and requests, and leaves every other request in the browser alone.

### What still can't be made identical

- The cover tab is hidden, so `document.visibilityState` is `hidden` while the results page runs. Real searches are almost always in a visible tab.
- Clicks dispatched by a script have `isTrusted: false` inside the page.
- The site behind a clicked result receives no `Sec-Fetch-User`, because changing headers there would need access to every website.
- In background mode, `Upgrade-Insecure-Requests` sits one position away from where Firefox puts it on a real navigation. webRequest can change header values but not reorder existing headers.
- Firefox can't open a tab already hidden, so a new cover tab can show at the far end of the tab strip for an instant before it's hidden. This happens once per search session, not once per search. It never becomes the active tab, and your current tab never changes. The first time, Firefox shows a notice that an extension hid a tab.
- Result links to downloadable files are skipped so the download panel never opens.

## Timing model

Standard intensity modes use search sessions rather than a fixed interval. Shorter gaps appear inside a session, while gamma-distributed gaps separate sessions. Time-of-day weighting slows activity during typical sleeping hours. Custom intensity uses an evenly targeted rate with 20 percent jitter and a five-second floor.

| Setting | Target |
| --- | ---: |
| Low | about 6 queries/hour |
| Medium | about 12 queries/hour |
| High | about 20 queries/hour |
| Custom | 1 to 60 queries/hour |

With **Follow my activity** on (the default):

- No searches while the screen is locked, and only about 1 in 10 scheduled searches go ahead while the computer has been idle for two minutes. Cover traffic that runs while nobody is at the computer is easy to separate out.
- After you search on the same engine yourself, there's about a 55 percent chance of one cover search 30 seconds to a few minutes later, so real searches don't stand alone in the timeline.

Captchas and rate limits double the spacing between searches, up to 8 times, and ease back after successful searches. After more than ten failures within an hour, QueryVeil stops for an hour. This state survives Firefox stopping the background script. An hourly cap per intensity also applies.

Firefox stops an idle MV3 event page after about 30 seconds, even with a timer pending. Without a keep-alive, a run with a long dwell on a result was stopped partway through, and with one it completed. While a cover tab is open, QueryVeil writes to `storage.session` every 10 seconds to stay alive, and it closes any tagged leftover cover tab at startup.

## Query model

The generator includes:

- 20 topic catalogs with keywords, entities, and query templates
- Eight weighted ghost personas
- Four query-length classes
- Session topic and language coherence (a session stays in one language)
- Follow-ups taken from the engines' own suggestions and related searches
- Refinements and occasional keyboard typos (about 1.5 percent)
- Voice-style and URL-style queries
- Temporal modifiers and current-year substitution, including persona entries
- 13 additional language catalogs
- Optional Google Trends titles for your region, cached for three hours

### Per-install variety

Every copy of QueryVeil ships the same word lists, so drawing evenly from all of them would give every install the same recognisable distribution. On first run each install picks a random seed and then permanently keeps:

- 60 to 85 percent of each topic's entities, keywords and templates
- its own leaning toward each topic (0.5x to 1.7x) when no persona is set

### Persona stability

With a persona set, the install gets its own version of it. About 65 percent of the persona's interests form a fixed core. A further set rotates month to month, so a few interests come and go the way a real person's do. Topic weights are nudged by up to 25 percent per install. The point is to look like one consistent second person using the browser for months, rather than a fresh random persona that changes every time.

The multilingual templates were initially created with AI assistance. Several have native-speaker review and several still need it. The current status is tracked in [CONTRIBUTING.md](CONTRIBUTING.md).

## Practical tuning

- **Engine.** Pick the engine you actually search with. Cover only helps where your real searches go, and activity echoes only follow searches on that engine.
- **Persona.** For a coherent decoy profile, pick one close enough to normal search behavior not to look random, but different enough from your real interests to pull the profile away. The benchmark reports aligned and deliberately different personas separately, so the tradeoff between resistance and dilution is visible.
- **Topics.** For broad dilution, leave more topics enabled and use sustained medium or high intensity.
- **Languages.** Multilingual mixing increases topic dilution, but it can create an obvious split if your real history is entirely in one language.

## Performance and network use

Real page mode loads a full results page, and sometimes a result site, in a hidden tab for each search. That costs about as much as opening those pages yourself. Background mode is much lighter. Autosuggest sends one small request per typed character, capped at 60 characters.

Exact memory, CPU, battery, and bandwidth vary by Firefox version, platform, provider response size, and settings.

## Known limitations

- A search provider's private detector cannot be reproduced exactly.
- Query obfuscation does not hide an IP address or browser fingerprint.
- Search providers can rate-limit or block automated-looking traffic.
- Seasonal topic weighting assumes the northern hemisphere.
- Translation quality varies by language.
- Real page mode needs Firefox: `tabs.hide`, `search.search` into a tab, and blocking webRequest. Other browsers fall back to background mode.
- Equal schedule start and end hours are treated as active all day.

See [BENCHMARK.md](BENCHMARK.md) for the current adversarial test, scores, and methodology. The benchmark scores the query and timing model. It doesn't exercise the browser transport, which was checked separately in Firefox as described above.
