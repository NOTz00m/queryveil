# Privacy Policy

**Last updated: July 27, 2026**

QueryVeil is built around a simple rule: it cannot collect data it never reads or records.

## Data QueryVeil does not collect

QueryVeil does not access or store:

- Your real search queries
- Your browsing history
- Generated query text
- Personal information
- Analytics or telemetry
- Device identifiers

The extension does not request Firefox history, tabs, cookies, geolocation, or identity permissions.

## Data stored locally

Firefox local extension storage contains:

- Extension settings, including intensity, topics, schedule, persona, languages, and feature switches
- Simulator state used to keep timing consistent across service-worker restarts
- Total and per-session generated-query counters
- Cached Google Trends titles and the cache timestamp
- Active, paused, or stopped state

The local obfuscation estimate is calculated from these settings and counters. It does not inspect real search history or retain generated query text.

## Network requests

QueryVeil communicates only with the services needed for enabled features:

- The selected search engine receives generated searches.
- Search-engine autosuggest endpoints receive partial query prefixes when autosuggest simulation is enabled.
- The public Google Trends RSS feed is fetched when trend injection is enabled and its local cache is stale.

Requests are made directly from the extension. There is no QueryVeil server, account, telemetry endpoint, or intermediary. Search providers can apply their own cookies, logging, and privacy policies to generated traffic.

## Query lifecycle

1. The extension generates a query in memory.
2. Optional autosuggest prefixes are sent to the selected search engine.
3. The full query is sent.
4. The query text is discarded.
5. A local numeric counter is incremented.

Debug mode can print generated query details to the local Firefox console. Nothing in that console is transmitted by QueryVeil.

## Trends and seasonal context

Google Trends titles are cached locally for up to three hours. The request uses no QueryVeil account or telemetry.

Seasonal weighting uses northern-hemisphere defaults. QueryVeil deliberately does not detect your location or hemisphere. Users in the southern hemisphere may see seasonally mismatched cover, but no location data is accessed.

## Your control

You can pause or stop generation at any time. Uninstalling the extension removes its Firefox extension storage. Firefox developer tools can also inspect that storage directly.

## Security and scope

All query generation, settings logic, timing simulation, and scoring run locally. The source is public and can be audited.

QueryVeil reduces the usefulness of a search profile. It does not hide your IP address, prevent browser fingerprinting, replace a VPN or Tor, or guarantee that generated traffic cannot be detected. See [BENCHMARK.md](BENCHMARK.md) for measured results and limitations.

## Questions

Open an issue on [GitHub](https://github.com/NOTz00m/queryveil/issues).
