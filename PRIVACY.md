# Privacy Policy

**Last updated: November 9, 2026**

QueryVeil is built around a simple rule: it cannot collect data it never reads or records.

## Data QueryVeil does not collect

QueryVeil does not access or store:

- Your real search queries
- Your browsing history, beyond removing the entries its own cover searches create
- Personal information
- Analytics or telemetry
- Device identifiers

QueryVeil sends nothing to its developers. There is no QueryVeil server.

## Why it asks for each permission

| Permission | What it is used for |
| --- | --- |
| Google, Bing, DuckDuckGo, Google Trends | Sending cover searches and suggestion requests, and fetching the trends feed |
| `search` | Running cover searches through Firefox's own search service, so they use the exact URL your Firefox uses |
| `tabHide` | Keeping the tab a cover search loads in out of your tab strip. The first time, Firefox tells you a tab was hidden |
| `scripting` | Scrolling the cover results page, reading its result links and related searches, and clicking one result. Only inside the cover tab |
| `webRequest`, `webRequestBlocking` | Correcting headers on QueryVeil's own requests to match real ones. Also noticing that you searched on a supported engine (only the engine and Firefox's partner code are used, never the query) |
| `history` | Deleting the history entries cover searches create. Only URLs whose every visit came from a cover search are deleted |
| `sessions` | Removing cover tabs from Recently Closed Tabs, and tagging cover tabs so a leftover one can be closed after a restart |
| `idle` | Holding off while your computer is idle or locked |
| `storage`, `alarms` | Settings and scheduling |

## Data stored locally

Firefox local extension storage contains:

- Extension settings, including intensity, topics, schedule, persona, languages, and feature switches
- Simulator and backoff state used to keep timing consistent when Firefox stops and restarts the background script
- A random per-install seed that gives this install its own subset of the word lists and its own version of a persona. It never leaves the device
- The partner code your Firefox puts on searches for each engine (for example `client=firefox-b-d`), learned from your own address bar searches so background-mode cover searches carry the same one. No query text is kept
- Up to 150 queries the search engines suggested in reply to cover searches (autosuggest completions and related searches), used for follow-up cover searches. They expire after 7 days. They come only from cover traffic, never from your searches, and sensitive topics are filtered out
- Total and per-session generated-query counters, plus result-click counts
- Timestamps of generated searches and clicks from the last 24 hours (no query text), used for the popup activity strip
- Cached Google Trends titles and the cache timestamp
- Active, paused, or stopped state

The local obfuscation estimate is calculated from these settings and counters. It does not inspect real search history.

## Network requests

QueryVeil communicates only with the services needed for enabled features:

- The selected search engine receives cover searches. In real page mode (the default on Firefox) the results page loads in a hidden tab with your normal cookies for that engine, including its scripts, images and the engine's own telemetry, exactly as a page you opened would. In background mode only the results page request is sent.
- When autosuggest is on, the engine's suggestion endpoint receives the query one keystroke at a time. These requests carry no cookies, the same as Firefox's own address bar suggestions.
- When result clicks are on, the site behind one result is opened. In real page mode it loads fully in the hidden tab for a few seconds to a minute, then the tab is closed. In background mode it gets a single page request whose response is never read. Links that look like they perform an action (sign-out, unsubscribe, delete, downloads) are skipped.
- The public Google Trends RSS feed for your region is fetched when trend injection is on and its local cache is stale. The region comes from your browser's language setting, for example `en-GB` gives the UK feed.

Requests are made directly from your browser. There is no QueryVeil server, account, telemetry endpoint, or intermediary. Search providers and the sites behind results apply their own cookies, logging, and privacy policies to cover traffic, the same as for any page you visit.

## Query lifecycle

1. The extension picks a query: generated in memory, or a follow-up the engine suggested after an earlier cover search in the same session.
2. Optional autosuggest requests are sent as the query is typed.
3. The search runs in a hidden tab, or in the background.
4. If result clicks are on, one result may be opened.
5. The history entries it created are removed. The hidden tab is reused for the rest of the session, then closed and removed from Recently Closed Tabs.
6. Related searches from the results page may be kept for follow-ups, and a local counter and timestamp are recorded.

Debug mode can print generated query details to the local Firefox console. Nothing in that console is transmitted by QueryVeil.

## Trends and seasonal context

Google Trends titles are cached locally for up to three hours. The request carries no cookies and no QueryVeil account or telemetry.

Seasonal weighting uses northern-hemisphere defaults. QueryVeil deliberately does not detect your location or hemisphere.

## Your control

You can pause or stop generation at any time. The stop button also closes any cover tab still open. Uninstalling the extension removes its Firefox extension storage. Firefox developer tools can also inspect that storage directly.

## Security and scope

All query generation, settings logic, timing simulation, and scoring run locally. The source is public and can be audited.

QueryVeil reduces the usefulness of a search profile. It does not hide your IP address, prevent browser fingerprinting, replace a VPN or Tor, or guarantee that generated traffic cannot be detected. See [TECHNICAL.md](TECHNICAL.md) for what can and can't be made to look real, and [BENCHMARK.md](BENCHMARK.md) for measured results.

## Questions

Open an issue on [GitHub](https://github.com/NOTz00m/queryveil/issues).
