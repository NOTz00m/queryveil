# Privacy Policy

**Last Updated: July 3, 2026**

QueryVeil is built on a simple, hardcoded principle: we can't collect what we don't capture.

## What We DON'T Collect

- ❌ Your real search queries
- ❌ Your browsing history
- ❌ Generated noise queries
- ❌ Personal information
- ❌ Analytics or telemetry
- ❌ IP addresses or device identifiers

## What We DO Store (Locally Only)

Everything stays strictly on your device:

- ✅ Your settings (intensity, topics, schedule, active persona, enabled features)
- ✅ Simulation state (to ensure timing consistency across browser restarts)
- ✅ Query counts and privacy score metrics (just raw numbers, not actual query text)
- ✅ Cached Google Trends data (for real-time trend injection, pulled directly to your machine)
- ✅ Extension state (on/paused/off)

None of this data ever leaves your computer.

## How It Works

1. The extension generates a highly realistic search query in memory. This query is potentially heavily biased by your chosen Persona and any locally-cached trending topics.
2. If Autosuggest Simulation is enabled, it mimics keystrokes locally by sending partial query prefixes to the search engine, just like a real keyboard user.
3. It sends the full query to your chosen search engine (Google, Bing, or DuckDuckGo).
4. The query is immediately discarded from memory.
5. Only a local counter increments, and your local Obfuscation Estimate (privacy score) updates.

The actual text of the generated noise is never saved anywhere.

## Third-Party Services

The only external communication the extension makes is with:
- **Search engines**: to send the generated noise queries and autosuggest typing prefixes.
- **Google Trends RSS feed**: to securely fetch current trending topics locally to your browser (ensuring the noise queries reflect timely world events).

No other APIs, servers, or services are ever contacted. Search engines see these noise queries as completely normal searches coming from your browser. They may set tracking cookies like they would for any normal search. QueryVeil doesn't control search engine privacy policies.

## Your Data, Your Control

All QueryVeil data sits in your browser's local storage. You can:
- View it anytime in Firefox DevTools (F12 → Storage)
- Nuke it permanently by uninstalling the extension
- Control exactly what runs with the on/off/pause controls

## Security

- All processing, logic, and scoring happens on your device.
- Debug mode logs only print to your local browser console (they are never transmitted anywhere).
- Open source code - you can audit every line yourself.
- No tracking, no phone-home mechanisms, no analytics.

## Changes to This Policy

Updates will be posted here with a new "Last Updated" date and announced in extension release notes.

## Questions?

Open an issue on [GitHub](https://github.com/NOTz00m/queryveil/issues)

---

**Bottom line:** QueryVeil doesn't collect your data because it simply has no mechanism to do so. Everything runs locally, nothing is tracked, and you're in complete control.
