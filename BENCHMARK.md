# Benchmark and Effectiveness

**Last run:** 2026-11-09  
**Extension version:** 1.5.0  
**Benchmark seed:** `queryveil-v1.3`

## Summary

QueryVeil passed **775 real-engine settings configurations** with **0 failures**. The audit covers every user-selectable value, boundary values such as custom rates of 1 and 60 queries per hour, every topic and language, and every pair of settings at least once.

> The overall score is deliberately conservative. It combines resistance to a balanced text classifier, behavioral anomaly signals, and how much the original interest profile is diluted. It is not a promise that a search provider cannot detect generated traffic.

| Configuration | Effectiveness ↑ | Detector Resistance ↑ | Profile Dilution ↑ | Classifier Accuracy ↓ | Anomaly Risk ↓ |
|:---|---:|---:|---:|---:|---:|
| **Off** | 0.0/100 | 0.0/100 | 0.0% | N/A | N/A |
| **Low, 5 Topics** | 45.0/100 | 53.3/100 | 33.6% | 75.0% | 42.6/100 |
| **Default** | 45.9/100 | 52.8/100 | 36.3% | 76.6% | 40.1/100 |
| **Balanced** | 47.5/100 | 55.5/100 | 36.5% | 74.2% | 39.8/100 |
| **Aligned Persona** | **48.5/100** | **62.1/100** | 29.8% | **69.8%** | **35.5/100** |
| **Decoy Persona** | 46.6/100 | 51.0/100 | 40.6% | 77.4% | 41.7/100 |
| **Multilingual** | 48.3/100 | 53.1/100 | **41.7%** | 75.8% | 41.2/100 |
| **Custom 30/hr** | 47.3/100 | 53.4/100 | 38.8% | 75.2% | 41.8/100 |

_Bold values mark the strongest measured result in each column. Arrows show whether higher or lower is better._

### How to Read the Scores

- **Effectiveness** is the combined benchmark score. Higher is better.
- **Detector resistance** is the inverse of estimated detection risk. Higher is better.
- **Profile dilution** measures how much noise pushes the real user's strongest topic signals out of the combined stream. Higher is better.
- **Classifier accuracy** comes from balanced, stratified 5-fold validation. 50% is chance. Lower is better.
- **Anomaly risk** compares lexical, topic, timing, syntax, session, and repetition patterns. Lower is better.

## Test Coverage

The settings audit generated **3,168 queries** by calling the shipped `QueryGenerator`, `PersonaEngine`, `BehaviorSimulator`, and `AntiDetection` modules. No benchmark-only query generator is used.

| Area | Coverage |
|:---|:---|
| **Intensity** | Low, medium, high, custom 1/hr, custom 12/hr, and custom 60/hr |
| **Search engines** | Google, Bing, DuckDuckGo |
| **Personas** | None plus all 8 shipped personas |
| **Languages** | All 15 primary languages, every additional language at 50%, and the all-language mix |
| **Topics** | All 20 topics alone, each topic disabled once, all enabled, five-topic sets, and none enabled |
| **Feature switches** | Every on/off combination for trends, autosuggest, result clicks, and debug mode |
| **State and schedule** | Active, paused, off, daytime, overnight, disabled, and equal-hour all-day boundary |
| **Interactions** | 816 distinct pairwise value interactions |

The effectiveness trials use five synthetic but human-shaped search profiles, repeated deterministic runs, fixed trend fixtures, balanced class sizes, and a fixed clock. This keeps releases comparable and prevents live trends or the current time from moving the result around.

## Feature Checks

- All request URLs resolved to the selected search engine, in the shape the Firefox address bar uses, and were shaped as navigations.
- Autosuggest produced **28,557 incremental prefix requests** in enabled cases and none in disabled cases.
- The observed result-click decision rate was **40.2%** when that setting was enabled.
- All generated languages were recognized by the shipped language catalog.
- Paused, disabled, and out-of-schedule configurations produced no search events.

> **Result-click limitation:** the service worker now opens one real link from the returned results page, but the benchmark runs offline and only measures the click decision, not live result engagement. Enabling it does not change the effectiveness score.

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
