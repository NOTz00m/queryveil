# addons.mozilla.org listing for QueryVeil 1.4.0

Copy each block into the matching field on AMO. The Description block uses
Markdown.

Screenshots live in `store/screenshots/` (1280x800). Regenerate them after UI
changes with `npm run screenshots`.

---

## Name

```
QueryVeil
```

## Summary (250 characters max)

```
Buries your real searches under believable background searches. Human-like timing, optional decoy personas, 15 languages, live trends. Runs locally with no account, no server, and no telemetry.
```

## Description

```
Search engines build a profile from what you search. QueryVeil makes that profile less accurate by sending believable searches in the background, so your real interests get lost among the decoys.

It never reads your real searches or history. Everything runs in Firefox, and there is no QueryVeil server, account, or telemetry.

**How it works**

- Searches go out at a human pace (6, 12, or 20 an hour, or your own rate) with irregular gaps, not on a fixed timer.
- Queries come from 20 topics, and you choose which ones.
- Pick a persona, like a college student, a new parent, or a gamer, and the searches start to look like one consistent person instead of random noise.
- Optional extras make the traffic look more real. QueryVeil can type queries out through autosuggest, mix in what's trending on Google Trends, and open a result now and then.
- Mix in up to 14 other languages. Spanish, French, German, Portuguese, Korean, Polish, and Romanian have been reviewed by native speakers.
- Set active hours so it only runs when you'd normally be online.

**Works with** Google, Bing, and DuckDuckGo. Pick the one you actually use.

**What you see**

The popup shows whether it's running, when the next search goes out, a strip of the last hour's activity, and a rough cover estimate with tips for improving it. Settings save as you change them.

**Be realistic about what it does**

QueryVeil reduces how useful your search profile is. It does not hide your IP address, stop browser fingerprinting, or replace a VPN or Tor, and search engines may still detect or rate-limit generated traffic. The benchmark and its limits are published in the repository.

Open source under the MIT license. [View the source on GitHub](https://github.com/NOTz00m/queryveil).
```

## Categories

- Privacy & Security
- Search Tools

## Tags

```
privacy, search, obfuscation, tracking, anti-tracking, profiling
```

## Screenshot captions

| File | Caption |
| --- | --- |
| `01-popup-dark.png` | Status, countdown to the next search, and the last hour of activity |
| `02-popup-light-estimate.png` | The cover estimate broken down, with tips for what to improve |
| `03-settings-dark.png` | Pace, search engine, and decoy personas |
| `04-settings-behavior-light.png` | Typing simulation, trends, result clicks, and active hours |
| `05-settings-languages-dark.png` | Language mix and topic coverage |

## Links

- Homepage: `https://github.com/NOTz00m/queryveil`
- Support site: `https://github.com/NOTz00m/queryveil/issues`

---

## Privacy policy

```
QueryVeil privacy policy
Last updated: November 8, 2026

QueryVeil is built around one rule: it can't collect data it never reads or records.

<b>What QueryVeil does not collect</b>
QueryVeil does not access or store your real search queries, your browsing history, the text of the searches it generates, personal information, analytics, or device identifiers. It does not request Firefox's history, tabs, cookies, location, or identity permissions.

<b>What is stored on your device</b>
Firefox's extension storage holds:
<ul>
<li>Your settings, such as pace, topics, schedule, persona, languages, and feature switches</li>
<li>Timing state, so pacing stays consistent across restarts</li>
<li>Counters for generated searches and opened results</li>
<li>Timestamps of generated searches and opened results from the last 24 hours, with no query text. These draw the activity strip in the popup.</li>
<li>Cached Google Trends headlines and when they were fetched</li>
<li>Whether QueryVeil is running, paused, or stopped</li>
</ul>
The cover estimate is calculated from these settings and counters. It never looks at your real searches.

<b>Network requests</b>
QueryVeil only contacts the services needed for the features you turn on:
<ul>
<li>Your chosen search engine receives the generated searches.</li>
<li>If autosuggest simulation is on, that engine's autosuggest service receives partial versions of the query.</li>
<li>If trends are on, the public Google Trends RSS feed is fetched, at most every three hours.</li>
<li>If result clicks are on, the website behind one link on a returned results page receives a single page request. The response is never read or shown, and nothing on that page runs.</li>
</ul>
Requests go directly from your browser. There is no QueryVeil server, account, telemetry endpoint, or middleman. Search engines and websites apply their own cookies, logging, and privacy policies to this traffic.

<b>What happens to each search</b>
1. The query is generated in memory.
2. Autosuggest prefixes are sent, if enabled.
3. The full search is sent.
4. One result link may be opened, if enabled.
5. The query text and results page are discarded.
6. A counter and a timestamp are saved locally.

Debug mode can print generated searches to the local Firefox console. QueryVeil never sends that console output anywhere.

<b>Location</b>
Seasonal topics assume the northern hemisphere. QueryVeil does not detect your location.

<b>Your control</b>
You can pause or stop QueryVeil at any time. Removing the extension deletes its stored data. You can inspect that storage yourself in Firefox's developer tools.

<b>Limits</b>
QueryVeil makes a search profile less useful. It does not hide your IP address, prevent fingerprinting, replace a VPN or Tor, or guarantee that generated traffic goes undetected.

Questions: https://github.com/NOTz00m/queryveil/issues
```

---

## Version notes (release notes, shown to users)

```
New look
- Redesigned popup and settings page. Cleaner layout, proper light and dark themes, and plain explanations of what each setting does.
- The popup shows a live "last hour" activity strip and a countdown to the next search.
- The cover estimate now breaks down into its parts and tells you what would improve it.
- Settings save automatically, so there's no Save button anymore.
- Personas are listed with their descriptions, and the schedule shows your active hours on a 24-hour bar.

Result clicks now work
- With "Open results" on, about 4 in 10 searches open one real link from the results page, usually near the top.
- Only that page is requested. It is never displayed and none of its scripts, images or trackers load.
- If the search engine returns no usable links, the click is skipped.

Languages
- German has a larger query set, reviewed by pateu.
- New: Romanian, reviewed by a native speaker.
- Languages reviewed by native speakers are marked in settings.

Other
- Privacy policy and docs updated to cover result clicks and the activity timestamps the popup uses. Only times are stored, never query text.
```

## Notes to reviewer (only Mozilla sees these)

```
Changes in 1.4.0:

1. UI rewrite of popup/ and options/. Plain HTML/CSS/JS, no frameworks, no remote resources. Added shared/theme.js, a small script that applies the saved light/dark choice from localStorage before first paint.

2. Result clicks (off by default, toggle "Open results" in settings). When enabled, the background script reads the search results page it already fetched, extracts organic result links (unwrapping Google /url?q=, Bing /ck/a?u=, DuckDuckGo uddg= redirects), and sends one fetch() to a chosen link with mode: 'no-cors'. The response is opaque and never read, rendered or executed. No new permissions were added. Code: background/antiDetection.js (extractResultLinks, simulateResultClick) and background/service-worker.js (clickResult).

3. Statistics now store timestamps (no query text) of searches and clicks from the last 24 hours, capped at 200 entries, in storage.local. They power the activity strip in the popup.

4. Expanded German query templates and added Romanian (background/queryLanguages.js).

No telemetry, no remote code, no new host permissions. Nothing is minified or bundled, so the uploaded files are the source.
Source: https://github.com/NOTz00m/queryveil
```
