/**
 * Query Generation Engine
 * Generates realistic, diverse search queries using Markov chains and topic modeling
 */

export class QueryGenerator {
  constructor() {
    this.topics = this.initializeTopics();
    this.markovChains = this.buildMarkovChains();
    this.currentSessionTopic = null;
  }

  /**
   * Initialize topic categories with seed queries
   * @returns {Object}
   */
  initializeTopics() {
    return {
      news: {
        enabled: true,
        keywords: ['news', 'today', 'latest', 'breaking', 'update', 'report', 'article', 'story', 'headline'],
        entities: ['politics', 'economy', 'technology', 'world', 'local', 'business', 'sports', 'weather'],
        templates: [
          '{entity} {keyword}',
          '{keyword} {entity}',
          'latest {entity} {keyword}',
          '{entity} news today',
          'breaking {entity} news'
        ]
      },
      shopping: {
        enabled: true,
        keywords: ['best', 'buy', 'cheap', 'review', 'price', 'deal', 'sale', 'discount', 'compare', 'affordable'],
        entities: ['laptop', 'phone', 'headphones', 'camera', 'watch', 'shoes', 'backpack', 'desk', 'chair', 'monitor'],
        templates: [
          'best {entity}',
          '{entity} {keyword}',
          '{keyword} {entity} 2024',
          '{entity} reviews',
          'where to {keyword} {entity}'
        ]
      },
      entertainment: {
        enabled: true,
        keywords: ['watch', 'stream', 'download', 'review', 'rating', 'trailer', 'episode', 'season', 'cast'],
        entities: ['movie', 'show', 'series', 'documentary', 'anime', 'game', 'music', 'podcast', 'book'],
        templates: [
          'best {entity} to {keyword}',
          '{entity} {keyword}',
          'new {entity} releases',
          'top rated {entity}',
          'popular {entity}'
        ]
      },
      technology: {
        enabled: true,
        keywords: ['how to', 'tutorial', 'guide', 'tips', 'fix', 'install', 'setup', 'configure', 'troubleshoot'],
        entities: ['windows', 'mac', 'linux', 'android', 'ios', 'software', 'app', 'program', 'code', 'network'],
        templates: [
          '{keyword} {entity}',
          '{entity} {keyword}',
          'best {entity} for',
          '{entity} tutorial',
          'learn {entity}'
        ]
      },
      health: {
        enabled: true,
        keywords: ['symptoms', 'treatment', 'causes', 'prevention', 'cure', 'remedy', 'exercise', 'diet', 'healthy'],
        entities: ['headache', 'back pain', 'sleep', 'stress', 'nutrition', 'fitness', 'wellness', 'mental health'],
        templates: [
          '{entity} {keyword}',
          '{keyword} of {entity}',
          'how to treat {entity}',
          '{entity} remedies',
          'natural {entity} relief'
        ]
      },
      travel: {
        enabled: true,
        keywords: ['visit', 'vacation', 'trip', 'hotel', 'flight', 'things to do', 'places', 'guide', 'itinerary'],
        entities: ['paris', 'tokyo', 'new york', 'london', 'beach', 'mountain', 'europe', 'asia', 'restaurant'],
        templates: [
          'best {keyword} in {entity}',
          '{entity} travel {keyword}',
          '{keyword} to {entity}',
          '{entity} tourist attractions',
          'cheap {keyword} to {entity}'
        ]
      },
      food: {
        enabled: true,
        keywords: ['recipe', 'how to make', 'restaurant', 'best', 'near me', 'delivery', 'homemade', 'easy'],
        entities: ['pizza', 'pasta', 'sushi', 'burger', 'salad', 'dessert', 'breakfast', 'dinner', 'coffee', 'cake'],
        templates: [
          '{keyword} {entity}',
          '{entity} {keyword}',
          'best {entity} near me',
          '{entity} recipe',
          'how to make {entity}'
        ]
      },
      education: {
        enabled: true,
        keywords: ['learn', 'course', 'tutorial', 'how to', 'guide', 'explained', 'for beginners', 'step by step'],
        entities: ['python', 'math', 'history', 'science', 'language', 'photography', 'guitar', 'drawing', 'writing'],
        templates: [
          '{keyword} {entity}',
          '{entity} {keyword}',
          'online {entity} course',
          '{entity} for beginners',
          'free {entity} tutorial'
        ]
      },
      local: {
        enabled: true,
        keywords: ['near me', 'nearby', 'in', 'best', 'open now', 'hours', 'directions', 'phone number'],
        entities: ['restaurant', 'coffee shop', 'gym', 'library', 'park', 'hospital', 'pharmacy', 'gas station'],
        templates: [
          '{entity} {keyword}',
          'best {entity} near me',
          '{entity} nearby',
          '{entity} open now',
          'closest {entity}'
        ]
      },
      general: {
        enabled: true,
        keywords: ['what is', 'how to', 'why', 'when', 'where', 'who', 'define', 'meaning', 'explain'],
        entities: ['weather', 'time', 'calendar', 'calculator', 'translate', 'convert', 'map', 'directions'],
        templates: [
          '{keyword} {entity}',
          '{entity} today',
          'current {entity}',
          '{entity} near me',
          '{keyword} a {entity}'
        ]
      }
    };
  }

  /**
   * Build simple Markov chains for more natural query generation
   * @returns {Object}
   */
  buildMarkovChains() {
    // Simple bigram model for common search patterns
    return {
      starts: ['how to', 'what is', 'best', 'why', 'where', 'when', 'can i', 'should i', 'how do i'],
      transitions: {
        'how to': ['fix', 'make', 'create', 'learn', 'get', 'install', 'remove', 'use'],
        'what is': ['the best', 'a good', 'the meaning of', 'the difference between'],
        'best': ['way to', 'time to', 'place for', 'method for'],
        'why': ['is', 'does', 'do', 'should', 'can'],
        'where': ['to', 'is', 'can i', 'should i'],
        'when': ['to', 'is', 'should i', 'can i'],
        'can i': ['get', 'use', 'make', 'learn', 'find'],
        'should i': ['buy', 'use', 'learn', 'get', 'try']
      }
    };
  }

  /**
   * Generate a realistic search query
   * @param {string} complexity - Query complexity level
   * @param {Object} settings - User settings
   * @param {Object} sessionInfo - Current session information
   * @returns {string}
   */
  generateQuery(complexity, settings, sessionInfo) {
    // Maintain topic coherence within session
    let topic;
    if (sessionInfo && sessionInfo.topic) {
      topic = sessionInfo.topic;
    } else {
      topic = this.selectRandomTopic(settings);
      if (sessionInfo) {
        sessionInfo.topic = topic;
      }
    }

    const topicData = this.topics[topic];
    let query;

    switch (complexity) {
      case 'short':
        query = this.generateShortQuery(topicData);
        break;
      case 'medium':
        query = this.generateMediumQuery(topicData);
        break;
      case 'long':
        query = this.generateLongQuery(topicData);
        break;
      case 'very_long':
        query = this.generateVeryLongQuery(topicData);
        break;
      default:
        query = this.generateMediumQuery(topicData);
    }

    return query;
  }

  /**
   * Select random topic based on enabled categories
   * @param {Object} settings
   * @returns {string}
   */
  selectRandomTopic(settings) {
    const enabledTopics = Object.keys(this.topics).filter(
      topic => settings.topics?.[topic] !== false
    );
    return enabledTopics[Math.floor(Math.random() * enabledTopics.length)];
  }

  /**
   * Generate short query (1-2 words)
   * @param {Object} topicData
   * @returns {string}
   */
  generateShortQuery(topicData) {
    const useEntity = Math.random() < 0.7;
    if (useEntity) {
      return this.randomElement(topicData.entities);
    } else {
      const keyword = this.randomElement(topicData.keywords);
      const entity = this.randomElement(topicData.entities);
      return `${keyword} ${entity}`;
    }
  }

  /**
   * Generate medium query (3-5 words)
   * @param {Object} topicData
   * @returns {string}
   */
  generateMediumQuery(topicData) {
    const template = this.randomElement(topicData.templates);
    const keyword = this.randomElement(topicData.keywords);
    const entity = this.randomElement(topicData.entities);
    
    let query = template
      .replace('{keyword}', keyword)
      .replace('{entity}', entity);
    
    // Sometimes add year or modifier
    if (Math.random() < 0.2) {
      query += ' 2024';
    } else if (Math.random() < 0.1) {
      query += ' reddit';
    }
    
    return query;
  }

  /**
   * Generate long query (6-10 words)
   * @param {Object} topicData
   * @returns {string}
   */
  generateLongQuery(topicData) {
    const start = this.randomElement(this.markovChains.starts);
    const keyword = this.randomElement(topicData.keywords);
    const entity = this.randomElement(topicData.entities);
    const entity2 = this.randomElement(topicData.entities);
    
    const patterns = [
      `${start} ${keyword} ${entity} ${entity2}`,
      `${start} ${entity} for ${keyword} ${entity2}`,
      `best ${keyword} ${entity} for ${entity2}`,
      `${start} ${keyword} ${entity} without ${entity2}`,
      `${keyword} ${entity} vs ${entity2} comparison`
    ];
    
    return this.randomElement(patterns);
  }

  /**
   * Generate very long query (question/sentence)
   * @param {Object} topicData
   * @returns {string}
   */
  generateVeryLongQuery(topicData) {
    const entity = this.randomElement(topicData.entities);
    const keyword = this.randomElement(topicData.keywords);
    
    const patterns = [
      `what is the best way to ${keyword} ${entity} for beginners`,
      `how do i ${keyword} ${entity} without spending too much money`,
      `why does ${entity} ${keyword} and what can i do about it`,
      `where can i find the best ${entity} ${keyword} in my area`,
      `what are the benefits of ${keyword} ${entity} every day`,
      `how long does it take to ${keyword} ${entity} properly`,
      `is it safe to ${keyword} ${entity} at home`,
      `what should i know before ${keyword} ${entity} for the first time`
    ];
    
    return this.randomElement(patterns);
  }

  /**
   * Add realistic typo to query
   * @param {string} query
   * @returns {string}
   */
  addTypo(query) {
    const words = query.split(' ');
    
    // Don't add typos to very short queries
    if (words.length < 3) return query;
    
    // Pick a random word (not the first word, users are careful there)
    const wordIndex = Math.floor(Math.random() * (words.length - 1)) + 1;
    const word = words[wordIndex];
    
    // Don't add typos to very short words
    if (word.length < 4) return query;
    
    const typoType = Math.random();
    
    if (typoType < 0.4) {
      // Adjacent key typo (simulate keyboard layout)
      words[wordIndex] = this.adjacentKeyTypo(word);
    } else if (typoType < 0.7) {
      // Double letter
      const pos = Math.floor(Math.random() * word.length);
      words[wordIndex] = word.slice(0, pos) + word[pos] + word.slice(pos);
    } else if (typoType < 0.85) {
      // Missing letter
      const pos = Math.floor(Math.random() * word.length);
      words[wordIndex] = word.slice(0, pos) + word.slice(pos + 1);
    } else {
      // Transposed letters
      const pos = Math.floor(Math.random() * (word.length - 1));
      words[wordIndex] = word.slice(0, pos) + word[pos + 1] + word[pos] + word.slice(pos + 2);
    }
    
    return words.join(' ');
  }

  /**
   * Simulate adjacent key typo based on QWERTY layout
   * @param {string} word
   * @returns {string}
   */
  adjacentKeyTypo(word) {
    const keyboard = {
      'a': ['q', 's', 'w', 'z'],
      'b': ['v', 'g', 'h', 'n'],
      'c': ['x', 'd', 'f', 'v'],
      'd': ['s', 'e', 'r', 'f', 'c', 'x'],
      'e': ['w', 'r', 'd', 's'],
      'f': ['d', 'r', 't', 'g', 'v', 'c'],
      'g': ['f', 't', 'y', 'h', 'b', 'v'],
      'h': ['g', 'y', 'u', 'j', 'n', 'b'],
      'i': ['u', 'o', 'k', 'j'],
      'j': ['h', 'u', 'i', 'k', 'm', 'n'],
      'k': ['j', 'i', 'o', 'l', 'm'],
      'l': ['k', 'o', 'p'],
      'm': ['n', 'j', 'k'],
      'n': ['b', 'h', 'j', 'm'],
      'o': ['i', 'p', 'l', 'k'],
      'p': ['o', 'l'],
      'q': ['w', 'a'],
      'r': ['e', 't', 'f', 'd'],
      's': ['a', 'w', 'e', 'd', 'x', 'z'],
      't': ['r', 'y', 'g', 'f'],
      'u': ['y', 'i', 'j', 'h'],
      'v': ['c', 'f', 'g', 'b'],
      'w': ['q', 'e', 's', 'a'],
      'x': ['z', 's', 'd', 'c'],
      'y': ['t', 'u', 'h', 'g'],
      'z': ['a', 's', 'x']
    };
    
    const pos = Math.floor(Math.random() * word.length);
    const char = word[pos].toLowerCase();
    
    if (keyboard[char]) {
      const replacement = this.randomElement(keyboard[char]);
      return word.slice(0, pos) + replacement + word.slice(pos + 1);
    }
    
    return word;
  }

  /**
   * Generate a refinement of a previous query
   * @param {string} originalQuery
   * @returns {string}
   */
  refineQuery(originalQuery) {
    const refinements = [
      `${originalQuery} reddit`,
      `${originalQuery} 2024`,
      `best ${originalQuery}`,
      `${originalQuery} near me`,
      `${originalQuery} reviews`,
      `how to ${originalQuery}`,
      `${originalQuery} guide`,
      `${originalQuery} tutorial`,
      `cheap ${originalQuery}`,
      `${originalQuery} alternatives`
    ];
    
    return this.randomElement(refinements);
  }

  /**
   * Update topic settings
   * @param {Object} topicSettings
   */
  updateTopicSettings(topicSettings) {
    Object.keys(topicSettings).forEach(topic => {
      if (this.topics[topic]) {
        this.topics[topic].enabled = topicSettings[topic];
      }
    });
  }

  /**
   * Helper: Get random element from array
   * @param {Array} array
   * @returns {*}
   */
  randomElement(array) {
    return array[Math.floor(Math.random() * array.length)];
  }
}
