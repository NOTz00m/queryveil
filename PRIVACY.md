# Privacy Policy

**Last Updated: November 4, 2025**

QueryVeil is built on a simple principle: we can't collect what we don't capture.

## What We DON'T Collect

- ❌ Your real search queries
- ❌ Your browsing history
- ❌ Generated noise queries
- ❌ Personal information
- ❌ Analytics or telemetry
- ❌ IP addresses or device identifiers

## What We DO Store (Locally Only)

Everything stays on your device:

- ✅ Your settings (intensity, topics, schedule)
- ✅ Query counts (just numbers, not the actual queries)
- ✅ Extension state (on/paused/off)

None of this data leaves your computer.

## How It Works

1. Extension generates a realistic search query in memory
2. Sends it to your chosen search engine (Google, Bing, or DuckDuckGo)
3. Query is immediately discarded from memory
4. Only a counter increments (e.g., "total: 158")

The actual query text is never stored anywhere.

## Third-Party Services

The only external communication is with search engines - and only to send the generated noise queries. No other APIs, servers, or services are contacted.

Search engines see these queries as normal searches from your browser. They may set cookies like they would for any search. QueryVeil doesn't control search engine privacy policies.

## Your Data, Your Control

All QueryVeil data is in your browser's local storage. You can:
- View it in Firefox DevTools (F12 → Storage)
- Delete it by uninstalling the extension
- Control what runs with on/off/pause controls

## Security

- All processing happens on your device
- Debug mode logs only go to your local console (never transmitted)
- Open source code - audit it yourself
- No tracking, no phone-home, no telemetry

## Changes to This Policy

Updates will be posted here with a new "Last Updated" date and announced in extension release notes.

## Questions?

Open an issue on [GitHub](https://github.com/NOTz00m/queryveil/issues)

---

**Bottom line:** QueryVeil doesn't collect your data because it doesn't need to. Everything runs locally, nothing is tracked, and you're in complete control.
