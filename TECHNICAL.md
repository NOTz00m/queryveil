# Technical guide

## How QueryVeil works

The Firefox service worker schedules a query, asks the behavior simulator for query length and session context, and passes the active settings into the query generator. The generator selects a topic, applies optional persona and trend bias, chooses a language, and builds a query. The request layer then creates the selected search-engine URL, language headers, referrer, and optional autosuggest prefixes.

Only settings, counters, simulator state, and cached trend titles persist. Query text does not.

## Timing model

Standard intensity modes use search sessions rather than a fixed interval. Shorter gaps appear inside a session, while gamma-distributed gaps separate sessions. Time-of-day weighting slows activity during typical sleeping hours. Custom intensity uses an evenly targeted rate with 20 percent jitter and a five-second floor.

| Setting | Target |
| --- | ---: |
| Low | about 6 queries/hour |
| Medium | about 12 queries/hour |
| High | about 20 queries/hour |
| Custom | 1 to 60 queries/hour |

Schedules can reduce the actual daily total. Network errors and provider rate limits can reduce it further.

## Query model

The generator currently includes:

- 20 topic catalogs with keywords, entities, and query templates
- Eight weighted ghost personas
- Four query-length classes
- Session topic coherence
- Voice-style and URL-style queries
- Temporal modifiers and current-year substitution
- 13 additional language catalogs
- Optional fixed-duration caching of current Google Trends titles

The multilingual templates were initially created with AI assistance. Several have native-speaker review and several still need it. The current status is tracked in [CONTRIBUTING.md](CONTRIBUTING.md).

## Practical tuning

For a coherent decoy profile, pick a persona close enough to normal search behavior to avoid looking random but different enough from your real interests to pull the profile away. The benchmark reports aligned and deliberately different personas separately so the resistance and dilution tradeoff is visible.

For broad dilution, leave more topics enabled and use sustained medium or high intensity. Multilingual mixing increases topic dilution but can also create an obvious split when the real account history is entirely one language.

Autosuggest adds realistic prefix traffic but also adds requests and latency. Live trends improve timeliness but contact the Google Trends RSS feed every few hours. Custom rates near 60 per hour are a stress-test boundary, not a general recommendation.

## Performance and network use

The extension has no framework, remote script, analytics library, or long-running page. Firefox wakes the service worker for alarms, and the popup and settings page use plain HTML, CSS, and JavaScript.

Resource use is mostly driven by network settings:

- Higher intensity sends more search requests.
- Autosuggest adds three to six prefix requests per query.
- Trend injection makes one cached RSS request at most every three hours when needed.
- Debug mode adds local console output.

Exact memory, CPU, battery, and bandwidth vary by Firefox version, platform, provider response size, and settings. QueryVeil does not publish fixed footprint claims without a repeatable browser-level measurement.

## Known limitations

- A search provider's private detector cannot be reproduced exactly.
- Query obfuscation does not hide an IP address or browser fingerprint.
- Search providers can rate-limit or block automated-looking traffic.
- Seasonal topic weighting assumes the northern hemisphere.
- Translation quality varies by language.
- Result-click mode currently makes the click decision but does not issue a result-page request.
- Equal schedule start and end hours are treated as active all day.
- QueryVeil currently targets Firefox.

See [BENCHMARK.md](BENCHMARK.md) for the current adversarial test, scores, and methodology.
