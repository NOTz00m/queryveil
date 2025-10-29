# QueryVeil Architecture & Anti-Detection Strategies

## Core Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     QueryVeil Extension                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌───────────────┐      ┌──────────────────────┐            │
│  │  Popup UI     │◄────►│  Settings Manager    │            │
│  │  (Control)    │      │  (Local Storage)     │            │
│  └───────────────┘      └──────────────────────┘            │
│         │                         │                          │
│         ▼                         ▼                          │
│  ┌─────────────────────────────────────────────┐            │
│  │         Background Service Worker            │            │
│  │  ┌────────────────────────────────────────┐ │            │
│  │  │    Behavioral Simulation Engine        │ │            │
│  │  │  • Timing Distribution (Poisson/Normal)│ │            │
│  │  │  • Session Pattern Generator           │ │            │
│  │  │  • Activity-Based Scheduling           │ │            │
│  │  └────────────────────────────────────────┘ │            │
│  │  ┌────────────────────────────────────────┐ │            │
│  │  │    Query Generation Engine             │ │            │
│  │  │  • Markov Chain Generator              │ │            │
│  │  │  • Topic Diversification               │ │            │
│  │  │  • Trending Topics Integration         │ │            │
│  │  │  • Typo Simulation (1-2%)              │ │            │
│  │  └────────────────────────────────────────┘ │            │
│  │  ┌────────────────────────────────────────┐ │            │
│  │  │    Anti-Detection Layer                │ │            │
│  │  │  • Fingerprint Consistency             │ │            │
│  │  │  • Rate Limiting & Backoff             │ │            │
│  │  │  • Natural Traffic Mixing              │ │            │
│  │  │  • Session Management                  │ │            │
│  │  └────────────────────────────────────────┘ │            │
│  │  ┌────────────────────────────────────────┐ │            │
│  │  │    Query Executor                      │ │            │
│  │  │  • Fetch with realistic headers        │ │            │
│  │  │  • Referrer simulation                 │ │            │
│  │  │  • Result page interaction (optional)  │ │            │
│  │  └────────────────────────────────────────┘ │            │
│  └─────────────────────────────────────────────┘            │
└─────────────────────────────────────────────────────────────┘
```

## Human Behavior Modeling

### Timing Patterns

**Problem**: Uniform random intervals are easily detected by ML classifiers.

**Solution**: Multi-layered timing strategy:

1. **Macro Pattern (Daily Activity)**
   - Use time-of-day weighting: higher activity 9am-11pm, lower 12am-6am
   - Weekend vs weekday patterns
   - Simulate "work hours" vs "leisure hours" query differences

2. **Meso Pattern (Session Clustering)**
   - Queries cluster into sessions (2-8 queries on related topics)
   - Sessions separated by longer pauses (Gamma distribution, mean ~30-90 min)
   - Within-session gaps shorter (Exponential distribution, mean ~2-5 min)

3. **Micro Pattern (Individual Query Timing)**
   - Add jitter using truncated normal distribution
   - Vary by query complexity (longer queries → slightly longer think time)
   - Never use exact intervals or predictable patterns

**Implementation**:
```
Next Query Time = SessionStart + Σ(ExponentialRV(λ=180s) + NormalJitter(μ=0, σ=30s))
Session Start = LastSession + GammaRV(shape=2, scale=1800s)
```

### Query Complexity Distribution

Real users don't search uniformly:
- 30% short queries (1-2 words): "weather", "facebook"
- 50% medium queries (3-5 words): "best italian restaurant near me"
- 15% long queries (6-10 words): "how to fix leaking faucet under kitchen sink"
- 5% very long queries (questions/sentences): "what are the symptoms of vitamin d deficiency in adults"

### Typo Simulation

Realistic typo patterns based on keyboard layout:
- 1.5% of queries contain one typo
- Adjacent key errors: "teh" instead of "the"
- Double letter errors: "bookk" instead of "book"
- Missing/extra spaces: "face book" or "newwork"
- Only apply to queries >3 words (users careful with short queries)

### Session Thematic Coherence

**Problem**: Random unrelated queries → obvious bot pattern
**Solution**: Topic sessions

Example session progression:
1. "italian restaurants downtown"
2. "best pasta in [city]"
3. "italian restaurant reviews"
4. "reservation for dinner tonight"

Then switch topics after session ends.

## Anti-Detection Mechanisms

### 1. Fingerprint Consistency

**Threat**: Extension creates unique fingerprint through request patterns

**Mitigation**:
- Use identical User-Agent as normal browser tabs
- Match Accept headers, Accept-Language, Accept-Encoding exactly
- Maintain same DNT, Sec-Fetch-* headers
- Use browser's native fetch() API to inherit all browser configs
- Never add custom headers that don't appear in normal searches

### 2. Rate Limiting Intelligence

**Threat**: Exceeding human-plausible search rates triggers detection

**Mitigation**:
- Track queries per hour (max: 6 on "low", 12 on "medium", 20 on "high")
- Implement exponential backoff if HTTP 429 detected
- Reduce rate if multiple searches fail
- Never search while user is idle/machine is locked (on desktop)
- Pause during video playback or high CPU usage (respect user resources)

### 3. Natural Traffic Mixing

**Threat**: Noise queries have different timing signature than real queries

**Mitigation**:
- Detect user's natural browsing activity (page loads, tab switches)
- Increase noise query probability during active browsing periods
- Decrease when idle (but don't stop completely - humans search when "idle" too)
- Randomize whether noise comes before/during/after user activity bursts

### 4. Referrer & Navigation Simulation

**Threat**: Queries without realistic navigation path are suspicious

**Mitigation**:
- 60% direct navigation: referrer = search engine homepage
- 25% from same search engine: referrer = previous search result page
- 10% from news sites: referrer = realistic news domain
- 5% from social media: referrer = twitter.com, reddit.com, etc.

### 5. Session Cookie Handling

**Threat**: Consistent session anomalies across queries

**Mitigation**:
- Let browser handle cookies naturally (don't clear, don't isolate)
- Queries use same cookie jar as if user searched normally
- Benefits: Maintains consistent session ID, preferences, A/B test buckets

### 6. Result Interaction (Advanced)

**Optional feature** - Simulate clicks on results:
- After search, 40% probability of "clicking" a result
- If clicking: wait random dwell time (truncated normal, μ=8s, σ=4s, min=2s, max=30s)
- Fetch result page URL with proper referrer header
- "Dwell" on page: 70% quick exit (5-15s), 25% medium (15-60s), 5% long (60-180s)
- Occasionally (10%) perform a follow-up refinement search

**Trade-off**: More realistic but uses more bandwidth. Make it opt-in.

## Privacy Safeguards

### Data Minimization
- **ZERO query logging**: Generated queries exist only in memory during execution
- No local storage of query history
- Settings stored: only user preferences (intensity, topics, schedule)
- Statistics: Only counts (total queries generated), never content

### No External Dependencies
- All query generation happens locally
- Trending topics: optional feature, only if user enables
- If trending enabled: cache topics locally, refresh max once per day
- No telemetry, no phone-home, no update checks to external servers

### Isolation
- Don't access user's real search history (no permissions requested)
- Don't access browsing history
- Don't track user's actual searches to avoid contamination

### Transparency
- Open source: All code auditable
- Clear permission explanations
- Privacy policy in plain language
- User can inspect generated queries in debug mode (console logs when dev mode enabled)

## Ethical Considerations

### What We Don't Do
1. **No harm to user**: Never generate queries that could:
   - Get user on watchlists (no violent, illegal content)
   - Compromise user's reputation if exposed
   - Trigger unwanted ads (avoid shopping queries if user prefers)

2. **No harm to platforms**: 
   - Rate limiting prevents DDoS-like behavior
   - Respect robots.txt (though search engines don't use it for searches)
   - Exponential backoff if errors detected

3. **No market manipulation**:
   - Don't artificially boost specific topics/products
   - Ensure topic distribution is genuinely diverse
   - No sponsored queries, no hidden agendas

### Topic Filtering
Built-in topic categories user can disable:
- News/Current Events
- Shopping/Products
- Entertainment/Media
- Technology
- Health/Wellness
- Travel
- Food/Dining
- Education/How-to
- Local/Places
- General Knowledge

## Detection Evasion - The Arms Race

### Current Detection Vectors
ML classifiers likely look for:
1. **Timing regularity**: Fixed intervals, predictable patterns
2. **Topic incoherence**: Random unrelated searches
3. **Linguistic patterns**: Unnatural query construction
4. **Behavioral gaps**: Missing elements of normal browsing (no clicks, no refinements)
5. **Statistical outliers**: Query rate, session length, vocabulary diversity
6. **Fingerprinting**: Unique request patterns, headers, or timing signatures

### Our Counter-Strategies
1. **Timing**: Multiple layers of stochasticity, session-based clustering
2. **Topic**: Markov chains + session coherence + trending topics
3. **Linguistic**: Real query patterns, realistic typos, natural length distribution
4. **Behavioral**: Optional result interaction, refinement searches
5. **Statistical**: Carefully tuned distributions matching real user studies
6. **Fingerprinting**: Zero distinguishable features from normal browsing

### Future-Proofing
As detection improves, we can:
- Add more sophisticated language models (GPT-2 level, local)
- Learn from user's real patterns (opt-in, privacy-preserving)
- Implement adversarial training against known classifiers
- Add more behavioral elements (scrolling simulation, copy-paste patterns)

## Performance Considerations

### Resource Usage
- **Memory**: <50MB typical (all in-memory processing)
- **CPU**: <1% average (burst during query generation)
- **Network**: ~0.5-2MB/hour depending on intensity (queries only, or +result pages if enabled)
- **Battery**: Minimal impact through efficient scheduling

### Optimization Strategies
- Lazy loading: Don't generate next query until needed
- Efficient data structures: Topic trees pre-computed
- Debouncing: Batch preference updates
- Smart scheduling: Align with browser idle times
- Conditional features: Disable result interaction on mobile/metered connections

## Technical Stack

- **Manifest V3**: Future-proof for Firefox/Chrome
- **Background Service Worker**: Persistent query scheduling
- **Web Storage API**: User preferences only
- **Fetch API**: Network requests with proper headers
- **Web Crypto API**: Random number generation (window.crypto)
- **No external libraries**: Keep size minimal, reduce supply chain risk

## Success Metrics

How do we know it works?

1. **Indistinguishability**: Generated queries should have same statistical properties as real queries
2. **Diversity**: Topic distribution should prevent "interested in everything" profile
3. **Efficiency**: Should meet noise rate targets without excessive resource use
4. **Usability**: User can control it without technical knowledge
5. **Privacy**: Zero data leakage, zero new tracking vectors
