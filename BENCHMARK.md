# Benchmark and Effectiveness

**Last run:** 2026-07-28  
**Extension version:** 1.3.0  
**Benchmark seed:** `queryveil-v1.3`

## Summary

QueryVeil passed **773 real-engine settings configurations** with **0 failures**. The audit covers every user-selectable value, boundary values such as custom rates of 1 and 60 queries per hour, every topic and language, and every pair of settings at least once.

> The overall score is deliberately conservative. It combines resistance to a balanced text classifier, behavioral anomaly signals, and how much the original interest profile is diluted. It is not a promise that a search provider cannot detect generated traffic.

| Configuration | Effectiveness ↑ | Detector Resistance ↑ | Profile Dilution ↑ | Classifier Accuracy ↓ | Anomaly Risk ↓ |
|:---|---:|---:|---:|---:|---:|
| **Off** | 0.0/100 | 0.0/100 | 0.0% | N/A | N/A |
| **Low, 5 Topics** | 44.8/100 | 53.7/100 | 32.5% | 74.8% | 42.3/100 |
| **Default** | 46.5/100 | 54.1/100 | 35.9% | 75.4% | 39.7/100 |
| **Balanced** | 46.1/100 | 53.8/100 | 35.6% | 75.7% | 40.0/100 |
| **Aligned Persona** | 50.0/100 | **65.5/100** | 28.7% | **66.8%** | **35.5/100** |
| **Decoy Persona** | 47.1/100 | 52.5/100 | 39.5% | 76.0% | 42.0/100 |
| **Multilingual** | **50.1/100** | 56.4/100 | **41.5%** | 72.9% | 41.0/100 |
| **Custom 30/hr** | 47.2/100 | 52.3/100 | 40.1% | 76.2% | 42.0/100 |

_Bold values mark the strongest measured result in each column. Arrows show whether higher or lower is better._

### How to Read the Scores

- **Effectiveness** is the combined benchmark score. Higher is better.
- **Detector resistance** is the inverse of estimated detection risk. Higher is better.
- **Profile dilution** measures how much noise pushes the real user's strongest topic signals out of the combined stream. Higher is better.
- **Classifier accuracy** comes from balanced, stratified 5-fold validation. 50% is chance. Lower is better.
- **Anomaly risk** compares lexical, topic, timing, syntax, session, and repetition patterns. Lower is better.

## Test Coverage

The settings audit generated **3,144 queries** by calling the shipped `QueryGenerator`, `PersonaEngine`, `BehaviorSimulator`, and `AntiDetection` modules. No benchmark-only query generator is used.

| Area | Coverage |
|:---|:---|
| **Intensity** | Low, medium, high, custom 1/hr, custom 12/hr, and custom 60/hr |
| **Search engines** | Google, Bing, DuckDuckGo |
| **Personas** | None plus all 8 shipped personas |
| **Languages** | All 14 primary languages, every additional language at 50%, and the all-language mix |
| **Topics** | All 20 topics alone, each topic disabled once, all enabled, five-topic sets, and none enabled |
| **Feature switches** | Every on/off combination for trends, autosuggest, result clicks, and debug mode |
| **State and schedule** | Active, paused, off, daytime, overnight, disabled, and equal-hour all-day boundary |
| **Interactions** | 816 distinct pairwise value interactions |

The effectiveness trials use five synthetic but human-shaped search profiles, repeated deterministic runs, fixed trend fixtures, balanced class sizes, and a fixed clock. This keeps releases comparable and prevents live trends or the current time from moving the result around.

## Feature Checks

- All request URLs resolved to the selected search engine and used matching language headers.
- Autosuggest produced **6,714 incremental prefix requests** in enabled cases and none in disabled cases.
- The observed result-click decision rate was **39.4%** when that setting was enabled.
- All generated languages were recognized by the shipped language catalog.
- Paused, disabled, and out-of-schedule configurations produced no search events.

> **Result-click limitation:** the current service worker makes a realistic click decision but does not issue a result-page request. The benchmark measures the decision path, not live result engagement. Enabling it currently does not improve the effectiveness score.

## Methodology

The simulated detector uses:

- A multinomial Naive Bayes text classifier with balanced, stratified 5-fold validation
- TF-IDF centroid separation
- Lexical and topic distribution divergence
- Inter-arrival burstiness and timing distribution distance
- Query length, question shape, digits, URLs, and repeated-query signals
- Topic transition likelihood across sessions

The benchmark never contacts Google, Bing, DuckDuckGo, or Google Trends. Transport URLs, headers, and autosuggest traces are constructed locally, and fixed trend fixtures stand in for the live feed.

## Limitations

- This is a reproducible adversarial simulation, not access to a search provider's private detection model.
- The real-profile fixtures are intentionally small so the suite can run locally and in CI.
- Multilingual noise can increase profile dilution while also being easy to separate from an English-only history. The combined score reflects both effects.
- Effectiveness depends on time, volume, account history, provider behavior, and settings. No score is a guarantee of anonymity.

Run `npm run benchmark` to regenerate this file and `benchmark/results.json`.
