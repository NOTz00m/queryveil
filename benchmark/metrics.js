// statistical metrics for measuring obfuscation quality

function shannonEntropy(distribution) {
  const total = distribution.reduce((sum, value) => sum + value, 0);
  if (total === 0) return 0;

  return distribution.reduce((entropy, count) => {
    if (count === 0) return entropy;
    const probability = count / total;
    return entropy - probability * Math.log2(probability);
  }, 0);
}

function maxEntropy(categoryCount) {
  return categoryCount > 1 ? Math.log2(categoryCount) : 0;
}

function normalizedEntropy(distribution) {
  const maximum = maxEntropy(distribution.length);
  return maximum === 0 ? 0 : shannonEntropy(distribution) / maximum;
}

function chiSquaredUniformity(observed) {
  const total = observed.reduce((sum, value) => sum + value, 0);
  const categoryCount = observed.length;
  if (total === 0 || categoryCount < 2) {
    return { chiSquared: 0, degreesOfFreedom: 0, pValue: 1 };
  }

  const expected = total / categoryCount;
  const chiSquared = observed.reduce(
    (sum, value) => sum + ((value - expected) ** 2) / expected,
    0
  );
  const degreesOfFreedom = categoryCount - 1;
  const transformed = (chiSquared / degreesOfFreedom) ** (1 / 3);
  const center = 1 - 2 / (9 * degreesOfFreedom);
  const scale = Math.sqrt(2 / (9 * degreesOfFreedom));
  const pValue = 1 - normalCDF((transformed - center) / scale);

  return { chiSquared, degreesOfFreedom, pValue };
}

function normalCDF(value) {
  const sign = value < 0 ? -1 : 1;
  const x = Math.abs(value);
  const t = 1 / (1 + 0.3275911 * x);
  const polynomial = (
    (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t) +
    0.254829592
  ) * t;
  const approximation = 1 - polynomial * Math.exp(-x * x);
  return 0.5 * (1 + sign * approximation);
}

function tokenize(query) {
  return String(query)
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .split(/\s+/u)
    .filter(Boolean);
}

function buildTF(queries) {
  const frequencies = {};
  let totalTerms = 0;

  for (const query of queries) {
    for (const token of tokenize(query)) {
      frequencies[token] = (frequencies[token] || 0) + 1;
      totalTerms++;
    }
  }

  if (totalTerms === 0) return frequencies;

  for (const term of Object.keys(frequencies)) {
    frequencies[term] /= totalTerms;
  }

  return frequencies;
}

function buildTFIDF(querySets) {
  const documents = [];
  const setIndices = [];

  querySets.forEach((queries, setIndex) => {
    for (const query of queries) {
      documents.push(tokenize(query));
      setIndices.push(setIndex);
    }
  });

  const documentFrequency = {};
  for (const document of documents) {
    for (const term of new Set(document)) {
      documentFrequency[term] = (documentFrequency[term] || 0) + 1;
    }
  }

  const vocabulary = Object.keys(documentFrequency);
  const documentCount = documents.length;
  const vectors = documents.map(document => {
    const termFrequency = {};
    for (const term of document) {
      termFrequency[term] = (termFrequency[term] || 0) + 1;
    }

    return vocabulary.map(term => {
      const tf = document.length === 0 ? 0 : (termFrequency[term] || 0) / document.length;
      const idf = Math.log((documentCount + 1) / ((documentFrequency[term] || 0) + 1)) + 1;
      return tf * idf;
    });
  });

  return { vocab: vocabulary, vectors, setIndices };
}

function cosineSimilarity(left, right) {
  let dot = 0;
  let leftNorm = 0;
  let rightNorm = 0;

  for (let index = 0; index < left.length; index++) {
    dot += left[index] * right[index];
    leftNorm += left[index] ** 2;
    rightNorm += right[index] ** 2;
  }

  const denominator = Math.sqrt(leftNorm) * Math.sqrt(rightNorm);
  return denominator === 0 ? 0 : dot / denominator;
}

function avgCrossSimilarity(vectors, setIndices, leftSet, rightSet) {
  let total = 0;
  let count = 0;

  for (let left = 0; left < vectors.length; left++) {
    if (setIndices[left] !== leftSet) continue;
    for (let right = 0; right < vectors.length; right++) {
      if (setIndices[right] !== rightSet) continue;
      total += cosineSimilarity(vectors[left], vectors[right]);
      count++;
    }
  }

  return count === 0 ? 0 : total / count;
}

function avgWithinSimilarity(vectors, setIndices, setId) {
  let total = 0;
  let count = 0;

  for (let left = 0; left < vectors.length; left++) {
    if (setIndices[left] !== setId) continue;
    for (let right = left + 1; right < vectors.length; right++) {
      if (setIndices[right] !== setId) continue;
      total += cosineSimilarity(vectors[left], vectors[right]);
      count++;
    }
  }

  return count === 0 ? 0 : total / count;
}

function extractNgrams(query, size = 2) {
  const tokens = tokenize(query);
  const ngrams = [];

  for (let index = 0; index <= tokens.length - size; index++) {
    ngrams.push(tokens.slice(index, index + size).join(' '));
  }

  return ngrams;
}

function ngramOverlap(leftQueries, rightQueries, size = 2) {
  const left = new Set(leftQueries.flatMap(query => extractNgrams(query, size)));
  const right = new Set(rightQueries.flatMap(query => extractNgrams(query, size)));
  const union = new Set([...left, ...right]);
  let shared = 0;

  for (const ngram of left) {
    if (right.has(ngram)) shared++;
  }

  return union.size === 0 ? 0 : shared / union.size;
}

function classifyTopics(queries, topicKeywords) {
  const counts = new Array(topicKeywords.length + 1).fill(0);
  const unknownIndex = counts.length - 1;

  for (const query of queries) {
    const lower = query.toLocaleLowerCase();
    let bestIndex = unknownIndex;
    let bestScore = 0;

    topicKeywords.forEach((keywords, topicIndex) => {
      const score = keywords.reduce(
        (sum, keyword) => sum + (lower.includes(keyword.toLocaleLowerCase()) ? 1 : 0),
        0
      );
      if (score > bestScore) {
        bestScore = score;
        bestIndex = topicIndex;
      }
    });

    counts[bestIndex]++;
  }

  return counts;
}

function normalizeDistribution(values, size = values.length) {
  const padded = Array.from({ length: size }, (_, index) => values[index] || 0);
  const total = padded.reduce((sum, value) => sum + value, 0);
  if (total === 0) return padded.map(() => 0);
  return padded.map(value => value / total);
}

function jensenShannonDivergence(leftValues, rightValues) {
  const size = Math.max(leftValues.length, rightValues.length);
  const left = normalizeDistribution(leftValues, size);
  const right = normalizeDistribution(rightValues, size);
  const midpoint = left.map((value, index) => (value + right[index]) / 2);

  const divergence = (
    kullbackLeibler(left, midpoint) +
    kullbackLeibler(right, midpoint)
  ) / 2;

  return Math.min(1, Math.max(0, divergence));
}

function kullbackLeibler(left, right) {
  return left.reduce((sum, value, index) => {
    if (value === 0 || right[index] === 0) return sum;
    return sum + value * Math.log2(value / right[index]);
  }, 0);
}

function termDistributionPair(leftQueries, rightQueries) {
  const leftTF = buildTF(leftQueries);
  const rightTF = buildTF(rightQueries);
  const vocabulary = [...new Set([...Object.keys(leftTF), ...Object.keys(rightTF)])];

  return {
    left: vocabulary.map(term => leftTF[term] || 0),
    right: vocabulary.map(term => rightTF[term] || 0)
  };
}

function calculateZipfsDeviation(termFrequencies) {
  const frequencies = Object.values(termFrequencies).sort((a, b) => b - a);
  if (frequencies.length === 0) return 0;

  const total = frequencies.reduce((sum, value) => sum + value, 0);
  const harmonic = frequencies.reduce((sum, _, index) => sum + 1 / (index + 1), 0);
  let empirical = 0;
  let ideal = 0;
  let maximumDeviation = 0;

  frequencies.forEach((frequency, index) => {
    empirical += frequency / total;
    ideal += (1 / (index + 1)) / harmonic;
    maximumDeviation = Math.max(maximumDeviation, Math.abs(empirical - ideal));
  });

  return maximumDeviation;
}

function buildTopicTransitionMatrix(queries, topicKeywords) {
  const topicCount = topicKeywords.length + 1;
  const matrix = Array.from(
    { length: topicCount },
    () => new Array(topicCount).fill(1)
  );
  let previous = null;

  for (const query of queries) {
    const counts = classifyTopics([query], topicKeywords);
    const topic = counts.indexOf(Math.max(...counts));
    if (previous !== null) matrix[previous][topic]++;
    previous = topic;
  }

  return matrix.map(row => normalizeDistribution(row));
}

function sequenceProbability(queries, topicKeywords, transitionMatrix) {
  if (queries.length < 2) return 0;

  let previous = null;
  let logProbability = 0;
  let transitions = 0;

  for (const query of queries) {
    const counts = classifyTopics([query], topicKeywords);
    const topic = counts.indexOf(Math.max(...counts));
    if (previous !== null) {
      logProbability += Math.log(Math.max(Number.EPSILON, transitionMatrix[previous][topic]));
      transitions++;
    }
    previous = topic;
  }

  return transitions === 0 ? 0 : logProbability / transitions;
}

function syntacticProfile(queries) {
  if (queries.length === 0) {
    return {
      avgLength: 0,
      lengthDeviation: 0,
      questionRatio: 0,
      digitRatio: 0,
      urlRatio: 0
    };
  }

  const lengths = queries.map(query => tokenize(query).length);
  const avgLength = average(lengths);
  const variance = average(lengths.map(length => (length - avgLength) ** 2));
  const questionWords = new Set(['who', 'what', 'where', 'when', 'why', 'how', 'is', 'can', 'does']);

  return {
    avgLength,
    lengthDeviation: Math.sqrt(variance),
    questionRatio: queries.filter(query => tokenize(query).some(token => questionWords.has(token))).length / queries.length,
    digitRatio: queries.filter(query => /\d/u.test(query)).length / queries.length,
    urlRatio: queries.filter(query => /\b(?:www\.|\.com|\.org|\.net)\b/iu.test(query)).length / queries.length
  };
}

function syntacticDistance(leftQueries, rightQueries) {
  const left = syntacticProfile(leftQueries);
  const right = syntacticProfile(rightQueries);
  const distances = [
    relativeDistance(left.avgLength, right.avgLength),
    relativeDistance(left.lengthDeviation, right.lengthDeviation),
    Math.abs(left.questionRatio - right.questionRatio),
    Math.abs(left.digitRatio - right.digitRatio),
    Math.abs(left.urlRatio - right.urlRatio)
  ];

  return average(distances);
}

function temporalBurstiness(timestamps) {
  const intervals = interArrivalTimes(timestamps);
  if (intervals.length === 0) return 0;
  const mean = average(intervals);
  if (mean === 0) return 0;
  const variance = average(intervals.map(interval => (interval - mean) ** 2));
  return Math.sqrt(variance) / mean;
}

function temporalDistance(leftTimestamps, rightTimestamps) {
  const leftIntervals = interArrivalTimes(leftTimestamps);
  const rightIntervals = interArrivalTimes(rightTimestamps);
  if (leftIntervals.length === 0 || rightIntervals.length === 0) return 1;

  const burstDistance = relativeDistance(
    temporalBurstiness(leftTimestamps),
    temporalBurstiness(rightTimestamps)
  );
  const medianDistance = relativeDistance(median(leftIntervals), median(rightIntervals));
  const distributionDistance = kolmogorovSmirnovDistance(
    leftIntervals.map(Math.log1p),
    rightIntervals.map(Math.log1p)
  );

  return average([burstDistance, medianDistance, distributionDistance]);
}

function kolmogorovSmirnovDistance(leftValues, rightValues) {
  if (leftValues.length === 0 || rightValues.length === 0) return 1;
  const points = [...new Set([...leftValues, ...rightValues])].sort((a, b) => a - b);
  const left = [...leftValues].sort((a, b) => a - b);
  const right = [...rightValues].sort((a, b) => a - b);
  let maximum = 0;
  let leftIndex = 0;
  let rightIndex = 0;

  for (const point of points) {
    while (leftIndex < left.length && left[leftIndex] <= point) leftIndex++;
    while (rightIndex < right.length && right[rightIndex] <= point) rightIndex++;
    maximum = Math.max(
      maximum,
      Math.abs(leftIndex / left.length - rightIndex / right.length)
    );
  }

  return maximum;
}

function repetitionRate(queries) {
  if (queries.length === 0) return 0;
  const normalized = queries.map(query => tokenize(query).join(' '));
  return 1 - new Set(normalized).size / normalized.length;
}

function profileDilution(realQueries, noiseQueries, topicKeywords) {
  if (noiseQueries.length === 0) return 0;

  const real = classifyTopics(realQueries, topicKeywords);
  const combined = classifyTopics([...realQueries, ...noiseQueries], topicKeywords);
  const realTotal = real.reduce((sum, count) => sum + count, 0) || 1;
  const combinedTotal = combined.reduce((sum, count) => sum + count, 0) || 1;
  const ranked = real
    .map((count, index) => ({ count, index }))
    .sort((left, right) => right.count - left.count);
  const topIndices = ranked
    .slice(0, Math.min(3, ranked.length))
    .filter(item => item.count > 0)
    .map(item => item.index);
  const realExposure = topIndices.reduce((sum, index) => sum + real[index], 0) / realTotal;
  const mixedExposure = topIndices.reduce((sum, index) => sum + combined[index], 0) / combinedTotal;
  const exposureReduction = realExposure === 0
    ? 0
    : Math.max(0, 1 - mixedExposure / realExposure);
  const topicShift = jensenShannonDivergence(real, combined);

  return Math.min(1, exposureReduction * 0.75 + topicShift * 0.25);
}

function interArrivalTimes(timestamps) {
  const sorted = [...timestamps].sort((a, b) => a - b);
  const intervals = [];

  for (let index = 1; index < sorted.length; index++) {
    intervals.push(sorted[index] - sorted[index - 1]);
  }

  return intervals;
}

function relativeDistance(left, right) {
  const scale = Math.max(Math.abs(left), Math.abs(right), Number.EPSILON);
  return Math.min(1, Math.abs(left - right) / scale);
}

function average(values) {
  return values.length === 0
    ? 0
    : values.reduce((sum, value) => sum + value, 0) / values.length;
}

function median(values) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
}

export {
  average,
  avgCrossSimilarity,
  avgWithinSimilarity,
  buildTF,
  buildTFIDF,
  buildTopicTransitionMatrix,
  calculateZipfsDeviation,
  chiSquaredUniformity,
  classifyTopics,
  cosineSimilarity,
  extractNgrams,
  jensenShannonDivergence,
  kolmogorovSmirnovDistance,
  maxEntropy,
  ngramOverlap,
  normalizedEntropy,
  profileDilution,
  repetitionRate,
  sequenceProbability,
  shannonEntropy,
  syntacticDistance,
  syntacticProfile,
  temporalBurstiness,
  temporalDistance,
  termDistributionPair,
  tokenize
};
