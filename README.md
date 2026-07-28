# QueryVeil

**Privacy-focused search query noise for Firefox.**

QueryVeil generates realistic background searches to make a search profile less representative of the person behind it. It uses varied timing, topic-aware query generation, optional ghost personas, multilingual templates, and current trends without reading your real searches.

## What it does

- Generates search cover across 20 topic categories.
- Supports Google, Bing, and DuckDuckGo.
- Offers eight focused ghost personas or broad random noise.
- Can mix 13 additional languages and locally fetched Google Trends.
- Keeps settings, counters, and simulator state on your device with no telemetry.

QueryVeil is a privacy aid, not an anonymity guarantee. Search providers can change their detection systems, and generated traffic still comes from your browser and network connection.

## Install

### Firefox Add-ons

[Install QueryVeil from Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/queryveil/)

### Temporary development install

1. Clone or download this repository.
2. Open `about:debugging#/runtime/this-firefox` in Firefox.
3. Select **Load Temporary Add-on**.
4. Choose `manifest.json`.

Temporary add-ons are removed when Firefox restarts. See [INSTALL.md](INSTALL.md) for the complete setup and troubleshooting guide.

## Use it

1. Open QueryVeil from the Firefox toolbar.
2. Choose an intensity, search engine, and optional ghost persona.
3. Select **start veil**.

The popup shows current state, local query counts, pace, and a local obfuscation estimate. Advanced settings control languages, topics, schedules, autosuggest, trends, and debug logging.

The current benchmark shows a real tradeoff, a persona close to normal interests is harder to separate, while a deliberately different decoy can dilute the original profile more aggressively. The default remains broad because it is a neutral starting point.

## Evidence and privacy

The reproducible benchmark calls the same query, persona, timing, language, and request-building modules shipped in the extension. The latest run covers every selectable setting value and every pairwise setting interaction.

- [Benchmark results and settings comparison](BENCHMARK.md)
- [Privacy policy and data flow](PRIVACY.md)
- [Technical details, tuning, and limitations](TECHNICAL.md)
- [Contribution and translation guide](CONTRIBUTING.md)

Run the checks locally:

```bash
npm install
npm test
npm run benchmark
npm run lint
```

## Support

- [GitHub issues](https://github.com/NOTz00m/queryveil/issues)
- [Firefox Add-ons listing](https://addons.mozilla.org/en-US/firefox/addon/queryveil/)

QueryVeil is released under the [MIT License](LICENSE).
