// balanced text classification and behavior analysis for attacker simulation

import {
  average,
  buildTFIDF,
  buildTopicTransitionMatrix,
  classifyTopics,
  cosineSimilarity,
  jensenShannonDivergence,
  profileDilution,
  repetitionRate,
  sequenceProbability,
  syntacticDistance,
  temporalDistance,
  termDistributionPair,
  tokenize
} from './metrics.js';
import { createRandom, hashSeed } from './random.js';

class NaiveBayes {
  constructor() {
    this.classes = {};
    this.vocabulary = new Set();
    this.totalDocuments = 0;
  }

  train(documents, labels) {
    for (const label of new Set(labels)) {
      this.classes[label] = {
        documentCount: 0,
        wordCounts: {},
        totalWords: 0
      };
    }

    documents.forEach((document, index) => {
      const label = labels[index];
      const target = this.classes[label];
      target.documentCount++;
      this.totalDocuments++;

      for (const token of tokenize(document)) {
        this.vocabulary.add(token);
        target.wordCounts[token] = (target.wordCounts[token] || 0) + 1;
        target.totalWords++;
      }
    });
  }

  scores(document) {
    const tokens = tokenize(document);
    const vocabularySize = Math.max(1, this.vocabulary.size);
    const scores = {};

    for (const [label, target] of Object.entries(this.classes)) {
      let score = Math.log(target.documentCount / this.totalDocuments);
      for (const token of tokens) {
        const count = target.wordCounts[token] || 0;
        score += Math.log((count + 1) / (target.totalWords + vocabularySize));
      }
      scores[label] = score;
    }

    return scores;
  }

  predict(document) {
    const scores = this.scores(document);
    const labels = Object.keys(scores);
    const label = labels.reduce(
      (best, candidate) => scores[candidate] > scores[best] ? candidate : best,
      labels[0]
    );
    const maximum = Math.max(...Object.values(scores));
    const probabilities = Object.fromEntries(
      labels.map(current => [current, Math.exp(scores[current] - maximum)])
    );
    const total = Object.values(probabilities).reduce((sum, value) => sum + value, 0);

    for (const current of labels) {
      probabilities[current] /= total;
    }

    return { label, probabilities };
  }
}

function clusterAnalysis(realQueries, noiseQueries) {
  const { vectors, setIndices } = buildTFIDF([realQueries, noiseQueries]);
  const realCentroid = computeCentroid(vectors, setIndices, 0);
  const noiseCentroid = computeCentroid(vectors, setIndices, 1);
  const withinReal = averageDistance(vectors, setIndices, 0, realCentroid);
  const withinNoise = averageDistance(vectors, setIndices, 1, noiseCentroid);
  const realToNoise = averageDistance(vectors, setIndices, 0, noiseCentroid);
  const noiseToReal = averageDistance(vectors, setIndices, 1, realCentroid);
  const within = average([withinReal, withinNoise]);
  const between = average([realToNoise, noiseToReal]);
  const separability = between === 0
    ? 0
    : Math.max(0, Math.min(1, (between - within) / Math.max(between, within)));

  return {
    centroidDistance: 1 - cosineSimilarity(realCentroid, noiseCentroid),
    withinClusterReal: withinReal,
    withinClusterNoise: withinNoise,
    separability,
    confusionScore: 1 - separability
  };
}

function crossValidatedClassification(realQueries, noiseQueries, options = {}) {
  const folds = Math.max(2, Math.min(options.folds || 5, realQueries.length, noiseQueries.length));
  const random = createRandom(hashSeed(options.seed || 'classifier'));
  const sampleSize = Math.min(realQueries.length, noiseQueries.length);
  const real = shuffle(realQueries, random).slice(0, sampleSize);
  const noise = shuffle(noiseQueries, random).slice(0, sampleSize);
  const realFolds = partition(real, folds);
  const noiseFolds = partition(noise, folds);
  const foldMetrics = [];
  const scored = [];

  for (let foldIndex = 0; foldIndex < folds; foldIndex++) {
    const testReal = realFolds[foldIndex];
    const testNoise = noiseFolds[foldIndex];
    const trainReal = realFolds.flatMap((items, index) => index === foldIndex ? [] : items);
    const trainNoise = noiseFolds.flatMap((items, index) => index === foldIndex ? [] : items);
    const classifier = new NaiveBayes();
    classifier.train(
      [...trainReal, ...trainNoise],
      [...trainReal.map(() => 'real'), ...trainNoise.map(() => 'noise')]
    );

    const predictions = [
      ...testReal.map(query => evaluateQuery(classifier, query, 'real')),
      ...testNoise.map(query => evaluateQuery(classifier, query, 'noise'))
    ];
    scored.push(...predictions);

    const truePositive = predictions.filter(item => item.actual === 'noise' && item.predicted === 'noise').length;
    const trueNegative = predictions.filter(item => item.actual === 'real' && item.predicted === 'real').length;
    const falsePositive = predictions.filter(item => item.actual === 'real' && item.predicted === 'noise').length;
    const falseNegative = predictions.filter(item => item.actual === 'noise' && item.predicted === 'real').length;
    const noiseRecall = safeDivide(truePositive, truePositive + falseNegative);
    const realRecall = safeDivide(trueNegative, trueNegative + falsePositive);

    foldMetrics.push({
      accuracy: safeDivide(truePositive + trueNegative, predictions.length),
      balancedAccuracy: average([noiseRecall, realRecall]),
      precision: safeDivide(truePositive, truePositive + falsePositive),
      recall: noiseRecall
    });
  }

  return {
    accuracy: average(foldMetrics.map(metric => metric.accuracy)),
    balancedAccuracy: average(foldMetrics.map(metric => metric.balancedAccuracy)),
    precision: average(foldMetrics.map(metric => metric.precision)),
    recall: average(foldMetrics.map(metric => metric.recall)),
    auc: areaUnderCurve(scored),
    folds,
    samplesPerClass: sampleSize
  };
}

function advancedAnomalyScore(realQueries, noiseQueries, realTimestamps, noiseTimestamps, topicKeywords) {
  const clusters = clusterAnalysis(realQueries, noiseQueries);
  const topicDistance = jensenShannonDivergence(
    classifyTopics(realQueries, topicKeywords),
    classifyTopics(noiseQueries, topicKeywords)
  );
  const terms = termDistributionPair(realQueries, noiseQueries);
  const lexicalDistance = jensenShannonDivergence(terms.left, terms.right);
  const syntaxDistance = syntacticDistance(realQueries, noiseQueries);
  const timingDistance = temporalDistance(realTimestamps, noiseTimestamps);
  const transitionMatrix = buildTopicTransitionMatrix(realQueries, topicKeywords);
  const realSequence = sequenceProbability(realQueries, topicKeywords, transitionMatrix);
  const noiseSequence = sequenceProbability(noiseQueries, topicKeywords, transitionMatrix);
  const sequenceDistance = Math.min(1, Math.abs(realSequence - noiseSequence) / Math.max(1, Math.abs(realSequence)));
  const duplicateDistance = Math.min(
    1,
    Math.abs(repetitionRate(realQueries) - repetitionRate(noiseQueries)) * 4
  );
  const breakdown = {
    lexical: lexicalDistance,
    semantic: clusters.separability,
    topics: topicDistance,
    timing: timingDistance,
    syntax: syntaxDistance,
    sequence: sequenceDistance,
    repetition: duplicateDistance
  };
  const weights = {
    lexical: 0.22,
    semantic: 0.16,
    topics: 0.15,
    timing: 0.20,
    syntax: 0.12,
    sequence: 0.10,
    repetition: 0.05
  };
  const score = Object.entries(weights).reduce(
    (sum, [key, weight]) => sum + breakdown[key] * weight,
    0
  ) * 100;

  return {
    score: Math.max(0, Math.min(100, score)),
    breakdown,
    raw: {
      realSequence,
      noiseSequence
    }
  };
}

function assessSearchEngine(realQueries, noiseQueries, realTimestamps, noiseTimestamps, topicKeywords, options = {}) {
  if (noiseQueries.length === 0) {
    return {
      classifier: null,
      anomaly: null,
      cluster: null,
      profileDilution: 0,
      detectionRisk: 100,
      resistance: 0,
      effectiveness: 0
    };
  }

  const classifier = crossValidatedClassification(realQueries, noiseQueries, options);
  const anomaly = advancedAnomalyScore(
    realQueries,
    noiseQueries,
    realTimestamps,
    noiseTimestamps,
    topicKeywords
  );
  const cluster = clusterAnalysis(realQueries, noiseQueries);
  const dilution = profileDilution(realQueries, noiseQueries, topicKeywords);
  const classifierAdvantage = Math.max(
    0,
    Math.min(1, (classifier.balancedAccuracy - 0.5) / 0.5)
  );
  const detectionRisk = (
    classifierAdvantage * 0.55 +
    (anomaly.score / 100) * 0.45
  ) * 100;
  const resistance = 100 - detectionRisk;
  const effectiveness = Math.max(
    0,
    Math.min(100, resistance * 0.58 + dilution * 100 * 0.42)
  );

  return {
    classifier,
    anomaly,
    cluster,
    profileDilution: dilution,
    detectionRisk,
    resistance,
    effectiveness
  };
}

function computeCentroid(vectors, setIndices, setId) {
  const dimensions = vectors[0]?.length || 0;
  const centroid = new Array(dimensions).fill(0);
  let count = 0;

  vectors.forEach((vector, index) => {
    if (setIndices[index] !== setId) return;
    vector.forEach((value, dimension) => {
      centroid[dimension] += value;
    });
    count++;
  });

  if (count > 0) {
    for (let dimension = 0; dimension < dimensions; dimension++) {
      centroid[dimension] /= count;
    }
  }

  return centroid;
}

function averageDistance(vectors, setIndices, setId, centroid) {
  const distances = vectors
    .filter((_, index) => setIndices[index] === setId)
    .map(vector => 1 - cosineSimilarity(vector, centroid));
  return average(distances);
}

function evaluateQuery(classifier, query, actual) {
  const prediction = classifier.predict(query);
  return {
    actual,
    predicted: prediction.label,
    score: prediction.probabilities.noise || 0
  };
}

function partition(items, count) {
  const partitions = Array.from({ length: count }, () => []);
  items.forEach((item, index) => partitions[index % count].push(item));
  return partitions;
}

function shuffle(items, random) {
  const output = [...items];
  for (let index = output.length - 1; index > 0; index--) {
    const swapIndex = Math.floor(random() * (index + 1));
    [output[index], output[swapIndex]] = [output[swapIndex], output[index]];
  }
  return output;
}

function areaUnderCurve(scored) {
  const positives = scored.filter(item => item.actual === 'noise');
  const negatives = scored.filter(item => item.actual === 'real');
  if (positives.length === 0 || negatives.length === 0) return 0.5;

  let wins = 0;
  for (const positive of positives) {
    for (const negative of negatives) {
      if (positive.score > negative.score) wins++;
      else if (positive.score === negative.score) wins += 0.5;
    }
  }

  return wins / (positives.length * negatives.length);
}

function safeDivide(numerator, denominator) {
  return denominator === 0 ? 0 : numerator / denominator;
}

export {
  NaiveBayes,
  advancedAnomalyScore,
  assessSearchEngine,
  clusterAnalysis,
  crossValidatedClassification
};
