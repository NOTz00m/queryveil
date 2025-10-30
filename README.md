# QueryVeil 🛡️

**Privacy-Focused Search Query Noise Generator for Firefox**

QueryVeil is a sophisticated browser extension that protects your privacy by generating realistic search query noise, making it computationally expensive for search engines to build accurate user profiles while evading automated bot detection systems.

## Core Objective

Create indistinguishable noise queries that blend seamlessly with genuine human search behavior, obfuscating your real search patterns without compromising usability or creating new tracking vectors.

## Key Features

### Human-Like Behavioral Simulation
- **Variable Timing**: Uses probability distributions (Poisson, Normal, Gamma) that match real human search patterns
- **Query Complexity**: Mixes 2-word, 3-5 word, and long-tail queries with realistic distribution
- **Realistic Imperfections**: Includes occasional typos (1-2%), autocorrect patterns, and refinement searches
- **Session-Based Patterns**: Clusters of related queries followed by pauses, mimicking real research sessions
- **Time-of-Day Weighting**: More activity during waking hours, less at night

### Intelligent Query Generation
- **Markov Chain Generation**: Creates natural-sounding queries using learned patterns
- **Topic Diversity**: Generates queries across 10 categories (news, shopping, tech, health, etc.)
- **Trending Topics**: Optional integration with current trends for contextually relevant queries
- **Thematic Coherence**: Maintains consistency within sessions but diversity across sessions
- **No Bot Patterns**: Avoids repetitive structures, random word salad, or suspicious clustering

### Anti-Detection Mechanisms
- **Timing Randomization**: Normal distributions, never fixed intervals
- **Rate Limiting**: Human-plausible query rates (6-20 per hour based on intensity)
- **Browser Fingerprint Consistency**: Identical headers and request patterns as normal browsing
- **Natural Traffic Mixing**: Generates queries during active browsing periods
- **Cookie/Session Handling**: Maintains consistent session behavior
- **Referrer Simulation**: Realistic referrer headers (direct navigation, previous searches, news sites, social media)
- **Exponential Backoff**: Automatically reduces rate if errors detected

### User Interface & Control
- **Simple Popup**: Quick start/stop/pause controls with live statistics
- **Comprehensive Settings**: Full control over intensity, topics, schedules, and features
- **Statistics Dashboard**: See total queries generated (without storing actual query content)
- **One-Click Pause**: Temporarily disable for clean search results
- **Visual Status**: Badge indicator shows active/paused/inactive state

### Privacy Safeguards
- **Zero Logging**: Generated queries exist only in memory, never stored
- **No Telemetry**: Fully local operation, no phone-home functionality
- **No History Access**: Never accesses your real search history
- **Open Source**: Fully auditable code
- **Minimal Permissions**: Only requests what's absolutely necessary

## Installation

### Firefox (Primary)
1. Download the latest release or clone this repository
2. Open Firefox and navigate to `about:debugging#/runtime/this-firefox`
3. Click "Load Temporary Add-on"
4. Select the `manifest.json` file from the extension directory
5. Click the QueryVeil icon in your toolbar to configure

### Building from Source
```bash
git clone https://github.com/NOTz00m/queryveil.git
cd queryveil
# No build step required - pure JS extension
```

## Usage

### Quick Start
1. Click the QueryVeil icon in your toolbar
2. Click "Start" to begin generating noise queries
3. Adjust intensity (Low/Medium/High) based on your preference
4. Click "Advanced Settings" for detailed configuration

### Configuration Options

#### Intensity Levels
- **Low**: ~6 queries per hour (minimal bandwidth usage)
- **Medium**: ~12 queries per hour (recommended balance)
- **High**: ~20 queries per hour (maximum obfuscation)

#### Topic Categories
Enable/disable specific categories to control query diversity:
- News & Current Events
- Shopping & Products
- Entertainment (movies, shows, music)
- Technology & Tutorials
- Health & Wellness
- Travel & Destinations
- Food & Restaurants
- Education & Learning
- Local Places & Services
- General Knowledge

#### Advanced Features
- **Result Click Simulation**: Occasionally fetches result pages for more realistic behavior (uses more bandwidth)
- **Schedule**: Limit noise generation to specific hours
- **Debug Mode**: Log generated queries to console for inspection

### Anti-Detection Strategy

QueryVeil employs multiple layers of anti-detection:

1. **Timing Patterns**
   - Macro: Daily activity curves (higher during day, lower at night)
   - Meso: Session clustering (2-8 related queries, then long pause)
   - Micro: Individual query jitter (truncated normal distribution)

2. **Query Authenticity**
   - Real query structures from Markov chains
   - Topic coherence within sessions
   - Realistic typo patterns based on keyboard layout
   - Natural length distribution (30% short, 50% medium, 15% long, 5% very long)

3. **Network Behavior**
   - Identical headers to normal browser requests
   - Realistic referrer headers (60% direct, 25% same engine, 10% news, 5% social)
   - Native fetch() API for automatic browser fingerprint consistency
   - Cookie jar shared with normal browsing

4. **Rate Management**
   - Never exceeds human-plausible rates
   - Exponential backoff on errors
   - Automatic pause after repeated failures
   - Activity-based scheduling (more queries during active browsing)

## Technical Details

### Human Behavior Modeling

**Query Timing Formula:**
```
Next Query Time = SessionStart + Σ(ExponentialRV(λ=180s) + NormalJitter(μ=0, σ=30s))
Session Start = LastSession + GammaRV(shape=2, scale=1800s)
```

**Query Complexity Distribution:**
- 30% short (1-2 words)
- 50% medium (3-5 words)
- 15% long (6-10 words)
- 5% very long (full questions)

**Typo Simulation:**
- 1.5% of queries contain one typo
- Adjacent key errors based on QWERTY layout
- Only applied to queries >3 words

### Privacy Guarantees

**What We Don't Do:**
- ❌ Store generated queries
- ❌ Access your real search history
- ❌ Send telemetry or analytics
- ❌ Create unique fingerprints
- ❌ Track your actual searches

**What We Do:**
- ✅ Generate queries entirely in memory
- ✅ Use browser's native networking (no custom fingerprint)
- ✅ Store only user preferences (encrypted if possible)
- ✅ Operate fully locally
- ✅ Provide open source code for auditing

## Contributing

Contributions are welcome! This is a privacy tool, so all contributions will be carefully reviewed.

### Development Setup
```bash
git clone https://github.com/NOTz00m/queryveil.git
cd queryveil
# Open in Firefox for testing
```

### Testing
1. Load extension in Firefox (`about:debugging`)
2. Enable debug mode in settings
3. Check browser console for query logs
4. Verify queries appear human-like
5. Monitor network tab for proper headers

### Code Style
- Use modern JavaScript (ES6+)
- Comment complex algorithms
- Prioritize privacy and security
- Keep dependencies minimal (currently zero!)

## Roadmap

- [ ] Chrome/Edge support (Manifest V3 compatible)
- [ ] GPT-2 level query generation (local, privacy-preserving)
- [ ] Machine learning classifier evasion testing
- [ ] User behavior learning (opt-in, privacy-preserving)
- [ ] Multi-language query support
- [ ] Tor integration for maximum privacy
- [ ] Advanced result interaction simulation

## Acknowledgments

- Inspired by privacy research on search query obfuscation
- Built with respect for user autonomy and digital privacy

## Support

- **Issues**: [GitHub Issues](https://github.com/NOTz00m/queryveil/issues)
- **Documentation**: [Wiki](https://github.com/NOTz00m/queryveil/wiki)

## Disclaimer

This extension is provided as-is for privacy research and protection. While we've designed it to be undetectable, search engines may update their detection systems. Use at your own discretion. The authors are not responsible for any consequences of using this software.

---

*"The right to privacy is the right to be left alone." - Warren & Brandeis*
