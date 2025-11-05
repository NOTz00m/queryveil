# QueryVeil 🛡️

**Privacy-focused search query noise generator for Firefox**

QueryVeil makes it expensive for search engines to build accurate profiles about you by generating realistic noise queries that blend seamlessly with your actual searches. Uses probability distributions and behavioral modeling to avoid detection.

## What It Does

Generates realistic search queries in the background while you browse. These noise queries are indistinguishable from real human searches, making it computationally expensive for trackers to separate signal from noise in your search history.

**Key features:**
- Human-like timing patterns (no fixed intervals)
- Natural query generation using Markov chains
- Topic diversity across 10 categories
- Realistic typos and search refinements
- Session-based clustering (like real research sessions)
- Anti-detection mechanisms (timing randomization, realistic headers)
- Zero logging - everything runs locally

## Installation

### From Firefox Add-ons (Recommended)

Install directly from the Firefox Add-ons store:
**[Get QueryVeil](https://addons.mozilla.org/en-US/firefox/addon/queryveil/)**

### Manual Installation (Development)

1. Clone this repo or download the source
2. Open Firefox and navigate to `about:debugging#/runtime/this-firefox`
3. Click "Load Temporary Add-on"
4. Select the `manifest.json` file

Note: Temporary add-ons are removed when Firefox restarts.

## Usage

### Quick Start

1. Click the QueryVeil icon in your toolbar
2. Click "Start" - badge turns green
3. That's it. The extension runs in the background.

**Controls:**
- Green badge = Active
- Orange badge = Paused
- Red badge = Inactive

### Settings

Click "Advanced Settings" to configure:

**Intensity levels:**
- Low: ~6 queries/hour
- Medium: ~12 queries/hour (default)
- High: ~20 queries/hour
- Custom: Set your own rate (1-30/hour)

**Topics:** Enable/disable categories like news, shopping, tech, health, etc. More diversity = better obfuscation.

**Schedule:** Limit generation to specific hours if needed.

**Result clicks:** Optionally simulate clicking on results (uses more bandwidth but more realistic).

## How It Works

### Timing Patterns

Real users don't search at fixed intervals. QueryVeil uses:
- Exponential distribution for within-session delays (~2-5 min)
- Gamma distribution for between-session gaps (~30-90 min)
- Time-of-day weighting (more active during waking hours)
- Random jitter to prevent any predictable patterns

### Query Generation

Generates natural-sounding queries using:
- Markov chains trained on realistic search patterns
- Session coherence (related queries clustered together)
- Realistic length distribution (30% short, 50% medium, 15% long, 5% very long)
- Occasional typos (~1.5%) based on keyboard layout
- Refinement searches (~10% of the time)

### Anti-Detection

- Uses browser's native fetch() API (identical fingerprint to normal browsing)
- Realistic referrer headers (60% direct, 25% previous search, 15% external)
- Rate limiting to stay within human-plausible bounds
- Exponential backoff if errors detected
- Cookie handling identical to normal browsing

## Privacy Guarantees

✅ **Zero logging** - Generated queries exist only in memory  
✅ **Local processing** - No external servers or APIs  
✅ **No telemetry** - No data collection whatsoever  
✅ **Open source** - Audit the code yourself  
✅ **No history access** - Never looks at your real searches  

The extension only stores:
- Your preferences (intensity, topics, schedule)
- Query counts (numbers only, not the actual queries)

## Performance

- Memory: <50MB typical
- CPU: <1% average
- Network: ~0.5-2MB/hour depending on intensity
- Battery: Minimal impact through efficient scheduling

## Tips for Maximum Privacy

1. Use at least Medium intensity (more noise = better obfuscation)
2. Enable diverse topics (5+ categories recommended)
3. Run continuously rather than on/off sporadically
4. Consider enabling result clicks for more realism
5. Use with a VPN for additional protection

## Contributing

Found a bug or want to improve something? Open an issue or submit a pull request. Make sure any changes maintain the privacy-first design principles.

## Acknowledgments & Research

QueryVeil is inspired by academic research on search query obfuscation and privacy-enhancing technologies:

- **TrackMeNot** (Howe & Nissenbaum, 2009) - Original concept of query obfuscation through noise generation
- **"Defeating search query privacy" studies** - Research on behavioral modeling and ML classifiers for user profiling
- **Differential Privacy** literature - Concepts of adding calibrated noise for privacy protection

This tool extends those ideas with modern anti-detection techniques including advanced timing distributions, session modeling, and fingerprint consistency.

## Known Limitations

- Search engines are constantly improving detection. No guarantees of permanent undetectability.
- Uses bandwidth (though minimal). Not ideal for metered connections at high intensity.
- More effective over longer time periods. Works best when left running.
- Currently Firefox only. Chrome/Edge support coming.

## Support

- **Issues**: [GitHub Issues](https://github.com/NOTz00m/queryveil/issues)
- **Firefox Store**: [Leave a review](https://addons.mozilla.org/en-US/firefox/addon/queryveil/)

---

*"Privacy is not about having something to hide. Privacy is about something to protect." - Anonymous*
