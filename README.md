# QueryVeil

**Privacy-focused search query noise generator for Firefox**

QueryVeil makes it computationally expensive for search engines and trackers to build accurate profiles about you. It does this by generating highly realistic noise queries that blend seamlessly with your actual searches. Instead of just spamming random keywords, QueryVeil uses probability distributions, behavioral modeling, and ghost profiles to act exactly like a real human browsing the web.

## What It Does

Generates realistic search queries in the background while you browse. By perfectly mimicking human behavior, these noise queries become indistinguishable from your actual searches, meaning trackers waste resources analyzing a stream of data that is fundamentally useless for profiling you.

**Key features:**
- **Personas (Ghost Profiles):** Select a fake identity (like "Remote Tech Worker" or "Fitness Enthusiast") to generate tightly clustered noise. Instead of scattering random queries, tracking algorithms end up building a highly detailed profile of a ghost that doesn't exist.
- **Real-Time Trend Injection:** Pulls live Google Trends locally to your machine and mixes current events into your noise stream. This ensures the generated queries reflect what the world is actually searching *right now*.
- **Autosuggest Simulation:** Real people don't magically drop full search queries into a browser. QueryVeil sends incremental typing requests before the actual search to mimic real keyboard input, making the queries indistinguishable from a real user typing.
- **Local Privacy Score:** A visual gauge (0-100) estimating how effectively your profile is being buried. This is calculated locally based on your search volume, active persona, enabled features, and topic diversity.
- **Massive Entropy:** 20 distinct topic categories with deep entity and keyword pools for virtually infinite query combinations.
- **Human-like Timing:** Uses complex statistical distributions for delays (no easily-detectable fixed intervals) and simulates real session clustering and reading times.
- **State persistence:** Resumes progress across browser restarts to maintain long-term behavioral consistency.
- **Zero logging:** Everything runs locally on your machine. No telemetry whatsoever.

## Installation

### From Firefox Add-ons (Recommended)

Install directly from the Firefox Add-ons store:
**[Get QueryVeil](https://addons.mozilla.org/en-US/firefox/addon/queryveil/)**

### Manual Installation (Development)

1. Clone this repo or download the source
2. Open Firefox and navigate to `about:debugging#/runtime/this-firefox`
3. Click "Load Temporary Add-on"
4. Select the `manifest.json` file

*Note: Temporary add-ons are removed when Firefox restarts.*

## Usage

### Quick Start

1. Click the QueryVeil icon in your toolbar
2. Click "Start" - the status badge turns green
3. That's it. The extension runs completely in the background.

**Controls:**
- Green badge = Active
- Orange badge = Paused
- Red badge = Inactive

### Settings

Click "Advanced Settings" to dial in your setup:

**Intensity levels:**
- Low: ~6 queries/hour
- Medium: ~12 queries/hour (default)
- High: ~20-25 queries/hour
- Custom: Set your own exact rate (1-60/hour)

**Persona:** Pick an identity to focus the noise. The algorithm will heavily weight topics and keywords that match this persona, forcing trackers to profile the wrong person.

**Features:** Enable Autosuggest Simulation (typing mimicry) and Real-Time Trend Injection (pulling live trends) for maximum realism.

**Topics:** Enable or disable 20 different categories (tech, real estate, health, parenting, etc.). More checked boxes = more entropy.

**Schedule:** Limit background generation to specific waking hours to look like a normal human schedule.

**Result clicks:** Optionally simulate clicking on the actual search results and dwelling on the page (uses more bandwidth but is much harder to detect as fake).

## How It Works

### Timing Patterns

Real users don't search exactly every 5 minutes. QueryVeil uses:
- Exponential distribution for within-session delays (~2-5 min between searches in a burst)
- Gamma distribution for between-session gaps, scaled by intensity (longer breaks between research sessions)
- Persistent state tracking to maintain realistic patterns after your PC wakes from sleep
- Time-of-day weighting (searches far less during typical sleeping hours)
- Random jitter to prevent any predictable metronome patterns

### Query Generation

Generates natural-sounding queries using:
- Markov chains trained on realistic search patterns ("how to", "what is the best", etc.)
- Session coherence (related queries are clustered together in time)
- Realistic length distribution (30% short, 50% medium, 15% long, 5% full sentences)
- Occasional realistic typos (~1.5%) based on adjacent keys on a QWERTY layout
- Refinement searches (~10% of the time, simulating someone adding "reddit" or a year to their query)

### Anti-Detection

- Uses your browser's native fetch() API so the fingerprint is literally your browser
- Sends incremental autosuggest keystroke requests before queries
- Realistic referrer headers (60% direct, 25% from a previous search, 15% clicking a link)
- Rate limiting to stay well within human-plausible bounds
- Exponential backoff if it hits a 429 or network error
- Cookie handling is identical to your normal browsing

## Privacy Guarantees

✅ **Zero logging** - Generated queries exist only in memory  
✅ **Local processing** - No external servers, APIs, or middle-men  
✅ **No telemetry** - No data collection whatsoever  
✅ **Open source** - Audit every line of code yourself  
✅ **No history access** - It never looks at your real searches  

The extension only stores your preferences (intensity, topics, schedule, persona) and some raw counts for the UI (numbers only, never text).

## Performance

- Memory: <50MB typical
- CPU: <1% average
- Network: ~0.5-2MB/hour depending on intensity and features
- Battery: Minimal impact through efficient scheduling

## Tips for Maximum Privacy

1. **Pick a Persona:** Having a tightly focused ghost profile is often more disruptive to tracking algorithms than pure random noise.
2. **Turn on Autosuggest:** Trackers can detect when full sentences are dropped into a search bar instantly. Autosuggest simulation solves this.
3. **Leave it running:** The extension is designed to run continuously. Turning it on and off manually defeats the behavioral timing logic.
4. **Enable 5+ Topics:** If you don't use a Persona, make sure you have plenty of topics enabled to keep entropy high.
5. **Use a VPN:** Combine QueryVeil with a VPN to completely decouple your identity from your IP.

## Contributing

Found a bug or want to improve something? Open an issue or submit a pull request. Make sure any changes maintain the privacy-first design principles.

## Acknowledgments & Research

QueryVeil is inspired by academic research on search query obfuscation and privacy-enhancing technologies:

- **TrackMeNot** (Howe & Nissenbaum, 2009) - Original concept of query obfuscation through noise generation
- **"Defeating search query privacy" studies** - Research on behavioral modeling and ML classifiers for user profiling
- **Differential Privacy** literature - Concepts of adding calibrated noise for privacy protection

This tool extends those ideas with modern anti-detection techniques including advanced timing distributions, session modeling, typing mimicry, and fingerprint consistency.

## Known Limitations

- Search engines are constantly improving detection. No guarantees of permanent undetectability.
- Uses bandwidth (though minimal). Not ideal for metered connections at high intensity with result clicks enabled.
- More effective over longer time periods. Works best when left running.
- Currently Firefox only. Chrome/Edge support coming.

## Support

- **Issues**: [GitHub Issues](https://github.com/NOTz00m/queryveil/issues)
- **Firefox Store**: [Leave a review](https://addons.mozilla.org/en-US/firefox/addon/queryveil/)

---

*"Privacy is not about having something to hide. Privacy is about something to protect." - Anonymous*
