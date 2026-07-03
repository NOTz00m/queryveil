// query generation engine — builds realistic search queries using
// markov chains, topic modeling, persona biasing, and trend injection.
// the goal is noise that's indistinguishable from real human searches.

export class QueryGenerator {
  constructor() {
    this.topics = this.initializeTopics();
    this.markovChains = this.buildMarkovChains();
    this.currentSessionTopic = null;
  }

  // returns the current year as a string, used in templates
  // so queries don't say "2024" forever
  currentYear() {
    return new Date().getFullYear().toString();
  }

  // all topic categories with keywords, entities, and templates.
  // these are the building blocks for generated queries —
  // more variety here = higher entropy = harder to classify as noise
  initializeTopics() {
    return {
      news: {
        enabled: true,
        keywords: [
          'news', 'today', 'latest', 'breaking', 'update', 'report',
          'article', 'story', 'headline', 'coverage', 'analysis',
          'live updates', 'reaction', 'recap', 'explained'
        ],
        entities: [
          'politics', 'economy', 'technology', 'world', 'local', 'business',
          'sports', 'weather', 'climate change', 'election', 'congress',
          'supreme court', 'trade war', 'inflation', 'unemployment rate',
          'housing market', 'stock market crash', 'nato', 'united nations',
          'immigration policy', 'gun control debate', 'healthcare reform',
          'ai regulation', 'data privacy law', 'minimum wage'
        ],
        templates: [
          '{entity} {keyword}',
          '{keyword} {entity}',
          'latest {entity} {keyword}',
          '{entity} news today',
          'breaking {entity} news',
          '{entity} update this week',
          'what happened with {entity}',
          '{entity} {keyword} reddit',
          '{entity} explained simply'
        ]
      },
      shopping: {
        enabled: true,
        keywords: [
          'best', 'buy', 'cheap', 'review', 'price', 'deal', 'sale',
          'discount', 'compare', 'affordable', 'worth it', 'vs',
          'alternative', 'under $100', 'refurbished', 'black friday'
        ],
        entities: [
          'laptop', 'phone', 'headphones', 'camera', 'watch', 'shoes',
          'backpack', 'desk', 'chair', 'monitor', 'tablet', 'speaker',
          'robot vacuum', 'air purifier', 'electric toothbrush',
          'wireless earbuds', 'smart home hub', 'portable charger',
          'mechanical keyboard', 'webcam', 'microphone usb', 'e reader',
          'noise cancelling headphones', 'smart watch fitness',
          'projector home theater', 'wireless mouse ergonomic'
        ],
        templates: [
          'best {entity}',
          '{entity} {keyword}',
          '{keyword} {entity} {year}',
          '{entity} reviews',
          'where to {keyword} {entity}',
          '{entity} vs {entity} comparison',
          '{entity} {keyword} reddit',
          'is {entity} {keyword}',
          '{entity} buyer guide {year}'
        ]
      },
      entertainment: {
        enabled: true,
        keywords: [
          'watch', 'stream', 'download', 'review', 'rating', 'trailer',
          'episode', 'season', 'cast', 'ending explained', 'spoilers',
          'release date', 'where to watch', 'soundtrack', 'behind the scenes'
        ],
        entities: [
          'movie', 'show', 'series', 'documentary', 'anime', 'game',
          'music', 'podcast', 'book', 'concert', 'album', 'playlist',
          'marvel', 'netflix original', 'hbo max', 'disney plus',
          'true crime documentary', 'horror movie', 'comedy special',
          'sci fi series', 'k drama', 'reality show', 'audiobook',
          'vinyl record', 'music festival', 'broadway show'
        ],
        templates: [
          'best {entity} to {keyword}',
          '{entity} {keyword}',
          'new {entity} releases {year}',
          'top rated {entity}',
          'popular {entity}',
          '{entity} {keyword} {year}',
          '{entity} like {entity}',
          'underrated {entity} {year}',
          '{entity} recommendations reddit'
        ]
      },
      technology: {
        enabled: true,
        keywords: [
          'how to', 'tutorial', 'guide', 'tips', 'fix', 'install',
          'setup', 'configure', 'troubleshoot', 'not working',
          'best settings', 'update', 'vs', 'alternative', 'free'
        ],
        entities: [
          'windows', 'mac', 'linux', 'android', 'ios', 'software',
          'app', 'program', 'code', 'network', 'vpn', 'browser',
          'python', 'javascript', 'docker', 'raspberry pi', 'home server',
          'wifi router', 'smart home', 'automation', 'api',
          'chrome extension', 'firefox addon', 'password manager',
          'cloud storage', 'backup solution', 'linux distro',
          'terminal command', 'git'
        ],
        templates: [
          '{keyword} {entity}',
          '{entity} {keyword}',
          'best {entity} for',
          '{entity} tutorial {year}',
          'learn {entity}',
          '{entity} {keyword} step by step',
          '{entity} beginner to advanced',
          'why is {entity} {keyword}',
          '{entity} crash course'
        ]
      },
      health: {
        enabled: true,
        keywords: [
          'symptoms', 'treatment', 'causes', 'prevention', 'cure',
          'remedy', 'exercise', 'diet', 'healthy', 'natural',
          'at home', 'when to see doctor', 'recovery', 'chronic', 'acute'
        ],
        entities: [
          'headache', 'back pain', 'sleep', 'stress', 'nutrition',
          'fitness', 'wellness', 'mental health', 'anxiety', 'depression',
          'vitamin deficiency', 'blood pressure', 'cholesterol', 'diabetes',
          'allergies', 'gut health', 'immune system', 'posture correction',
          'carpal tunnel', 'eye strain', 'dehydration', 'inflammation',
          'joint pain', 'migraine', 'insomnia', 'acid reflux'
        ],
        templates: [
          '{entity} {keyword}',
          '{keyword} of {entity}',
          'how to treat {entity}',
          '{entity} remedies',
          'natural {entity} relief',
          '{entity} {keyword} at home',
          'is {entity} serious',
          'when to worry about {entity}',
          '{entity} vs {entity} difference'
        ]
      },
      travel: {
        enabled: true,
        keywords: [
          'visit', 'vacation', 'trip', 'hotel', 'flight', 'things to do',
          'places', 'guide', 'itinerary', 'cheap flights', 'all inclusive',
          'road trip', 'backpacking', 'weekend getaway', 'off season'
        ],
        entities: [
          'paris', 'tokyo', 'new york', 'london', 'beach', 'mountain',
          'europe', 'asia', 'restaurant', 'bali', 'iceland', 'portugal',
          'costa rica', 'greece islands', 'national park', 'patagonia',
          'safari africa', 'croatia coast', 'vietnam', 'morocco',
          'new zealand', 'scotland', 'swiss alps', 'maldives'
        ],
        templates: [
          'best {keyword} in {entity}',
          '{entity} travel {keyword}',
          '{keyword} to {entity}',
          '{entity} tourist attractions',
          'cheap {keyword} to {entity}',
          '{entity} {keyword} {year}',
          '{entity} hidden gems',
          'is {entity} safe to {keyword}',
          '{entity} vs {entity} vacation'
        ]
      },
      food: {
        enabled: true,
        keywords: [
          'recipe', 'how to make', 'restaurant', 'best', 'near me',
          'delivery', 'homemade', 'easy', 'quick', 'healthy',
          'meal prep', 'from scratch', 'authentic', 'copycat', 'vegan'
        ],
        entities: [
          'pizza', 'pasta', 'sushi', 'burger', 'salad', 'dessert',
          'breakfast', 'dinner', 'coffee', 'cake', 'tacos', 'curry',
          'ramen', 'steak', 'smoothie', 'bread', 'soup', 'stir fry',
          'bbq', 'fried chicken', 'mac and cheese', 'pancakes',
          'ice cream', 'brownies', 'pad thai', 'pho'
        ],
        templates: [
          '{keyword} {entity}',
          '{entity} {keyword}',
          'best {entity} near me',
          '{entity} recipe',
          'how to make {entity}',
          '{keyword} {entity} 30 minutes',
          '{entity} {keyword} for beginners',
          'world best {entity} {keyword}',
          '{entity} without oven'
        ]
      },
      education: {
        enabled: true,
        keywords: [
          'learn', 'course', 'tutorial', 'how to', 'guide', 'explained',
          'for beginners', 'step by step', 'certification', 'degree',
          'online class', 'free course', 'cheat sheet', 'textbook', 'practice'
        ],
        entities: [
          'python', 'math', 'history', 'science', 'language', 'photography',
          'guitar', 'drawing', 'writing', 'economics', 'philosophy',
          'psychology', 'statistics', 'machine learning', 'web development',
          'graphic design', 'music theory', 'public speaking', 'calculus',
          'spanish', 'data science', 'accounting basics', 'biology',
          'chemistry', 'creative writing', 'digital marketing'
        ],
        templates: [
          '{keyword} {entity}',
          '{entity} {keyword}',
          'online {entity} course',
          '{entity} for beginners',
          'free {entity} tutorial',
          '{entity} explained simply',
          'best way to {keyword} {entity}',
          '{entity} {keyword} {year}',
          '{entity} crash course youtube'
        ]
      },
      gaming: {
        enabled: true,
        keywords: [
          'walkthrough', 'guide', 'review', 'best', 'release date',
          'meta', 'tier list', 'builds', 'tips', 'patch notes',
          'easter eggs', 'secrets', 'speedrun', 'mods', 'strategy'
        ],
        entities: [
          'rpg', 'fps', 'mmo', 'console', 'pc', 'steam', 'controller',
          'esports', 'streamer', 'indie game', 'roguelike', 'souls like',
          'battle royale', 'open world', 'survival game', 'cozy game',
          'horror game', 'fighting game', 'racing game', 'puzzle game',
          'game pass', 'playstation plus', 'nintendo switch', 'vr game'
        ],
        templates: [
          'best {entity} games {year}',
          '{entity} {keyword}',
          'top rated {entity}',
          'how to play {entity}',
          '{entity} beginners guide',
          '{entity} {keyword} {year}',
          'upcoming {entity} {year}',
          '{entity} vs {entity} which is better',
          'most anticipated {entity} {year}'
        ]
      },
      finance: {
        enabled: true,
        keywords: [
          'invest', 'stock', 'price', 'market', 'crypto', 'savings',
          'budget', 'tax', 'retirement', 'compound interest', 'dividend',
          'portfolio', 'recession', 'inflation hedge', 'passive income'
        ],
        entities: [
          'bitcoin', 'etf', 'gold', 'real estate', 'insurance',
          'credit card', 'loan', 'bank', 'interest rate', 'sp500',
          'roth ira', '401k', 'high yield savings', 'treasury bonds',
          'index fund', 'emergency fund', 'debt payoff', 'credit score',
          'mortgage rate', 'refinance', 'vanguard', 'fidelity'
        ],
        templates: [
          '{entity} {keyword}',
          'how to {keyword} in {entity}',
          'current {entity} {keyword}',
          'best {entity} for {year}',
          '{entity} vs {entity}',
          'is {entity} worth it {year}',
          '{entity} for beginners',
          '{entity} {keyword} strategy',
          'how much {entity} should i have'
        ]
      },
      hobbies: {
        enabled: true,
        keywords: [
          'diy', 'how to', 'ideas', 'projects', 'beginners', 'supplies',
          'techniques', 'patterns', 'kits', 'community', 'classes near me',
          'inspiration', 'tools needed', 'advanced', 'cheap'
        ],
        entities: [
          'gardening', 'knitting', 'woodworking', 'painting', 'pottery',
          'origami', 'photography', 'cooking', 'yoga', 'hiking',
          'fishing', 'model building', 'calligraphy', 'embroidery',
          'candle making', 'soap making', 'leather crafting', 'bonsai',
          'aquarium', 'terrarium', 'drone', 'astronomy', 'bird watching'
        ],
        templates: [
          '{entity} {keyword}',
          'easy {entity} {keyword}',
          '{entity} for beginners',
          'best {entity} {keyword}',
          'start {entity} hobby',
          '{entity} {keyword} at home',
          '{entity} supplies {keyword}',
          '{entity} community online',
          '{entity} {keyword} youtube channel'
        ]
      },
      local: {
        enabled: true,
        keywords: [
          'near me', 'nearby', 'in', 'best', 'open now', 'hours',
          'directions', 'phone number', 'reviews', 'delivery',
          'appointment', 'walk in', 'drive through', 'curbside'
        ],
        entities: [
          'restaurant', 'coffee shop', 'gym', 'library', 'park',
          'hospital', 'pharmacy', 'gas station', 'mechanic', 'dentist',
          'barber shop', 'dry cleaner', 'pet store', 'hardware store',
          'urgent care', 'thrift store', 'post office', 'bank branch',
          'car wash', 'laundromat', 'veterinarian', 'optometrist'
        ],
        templates: [
          '{entity} {keyword}',
          'best {entity} near me',
          '{entity} nearby',
          '{entity} open now',
          'closest {entity}',
          '{entity} {keyword} today',
          'cheap {entity} near me',
          '{entity} with good {keyword}',
          '{entity} that takes walk ins'
        ]
      },
      general: {
        enabled: true,
        keywords: [
          'what is', 'how to', 'why', 'when', 'where', 'who', 'define',
          'meaning', 'explain', 'difference between', 'pros and cons',
          'history of', 'how does', 'is it true that', 'can you'
        ],
        entities: [
          'weather', 'time', 'calendar', 'calculator', 'translate',
          'convert', 'map', 'directions', 'sunrise sunset', 'tide chart',
          'exchange rate', 'word count', 'bmi calculator', 'speed test',
          'zip code', 'area code', 'time zone', 'unit converter',
          'periodic table', 'dictionary', 'thesaurus'
        ],
        templates: [
          '{keyword} {entity}',
          '{entity} today',
          'current {entity}',
          '{entity} near me',
          '{keyword} a {entity}',
          '{entity} free online',
          '{keyword} {entity} work',
          'best {entity} tool',
          '{entity} quick lookup'
        ]
      },

      // --- new categories below ---

      automotive: {
        enabled: true,
        keywords: [
          'review', 'price', 'mpg', 'reliability', 'maintenance',
          'best', 'used vs new', 'recall', 'comparison', 'lease vs buy',
          'insurance quote', 'trade in value', 'repair cost', 'specs'
        ],
        entities: [
          'toyota camry', 'honda civic', 'tesla model 3', 'ford f150',
          'hyundai tucson', 'mazda cx5', 'subaru outback', 'bmw 3 series',
          'electric car', 'hybrid suv', 'truck', 'minivan', 'sedan',
          'oil change', 'tire rotation', 'brake pads', 'car battery',
          'dashcam', 'car seat', 'roof rack', 'floor mats'
        ],
        templates: [
          '{entity} {keyword}',
          'best {entity} {year}',
          '{entity} vs {entity}',
          '{keyword} {entity}',
          '{entity} {keyword} reddit',
          'is {entity} {keyword}',
          '{entity} common problems',
          'how often {entity} {keyword}',
          '{entity} cost to own'
        ]
      },
      pets: {
        enabled: true,
        keywords: [
          'best food', 'training', 'health', 'breed', 'puppy', 'kitten',
          'behavior', 'grooming', 'vet near me', 'adoption', 'supplies',
          'hypoallergenic', 'lifespan', 'temperament', 'size'
        ],
        entities: [
          'dog', 'cat', 'golden retriever', 'labrador', 'german shepherd',
          'french bulldog', 'poodle', 'siamese cat', 'maine coon',
          'fish tank', 'hamster', 'rabbit', 'parrot', 'turtle',
          'dog park', 'cat tree', 'pet insurance', 'flea treatment',
          'heartworm prevention', 'raw diet dog', 'litter box'
        ],
        templates: [
          '{entity} {keyword}',
          'best {keyword} for {entity}',
          '{entity} {keyword} guide',
          'how to {keyword} {entity}',
          '{entity} {keyword} tips',
          '{entity} vs {entity} which is better pet',
          '{entity} for apartment',
          'first time {entity} owner',
          '{entity} not eating {keyword}'
        ]
      },
      realestate: {
        enabled: true,
        keywords: [
          'for sale', 'rent', 'price', 'mortgage', 'neighborhood',
          'school district', 'zillow', 'first time buyer', 'investment',
          'property tax', 'appraisal', 'inspection', 'closing costs'
        ],
        entities: [
          'house', 'apartment', 'condo', 'townhouse', 'studio',
          'home renovation', 'kitchen remodel', 'bathroom remodel',
          'hardwood floors', 'central air', 'smart thermostat',
          'home security system', 'solar panels', 'roof replacement',
          'property management', 'landlord tenant law', 'hoa fees'
        ],
        templates: [
          '{entity} {keyword}',
          '{entity} {keyword} near me',
          'best {entity} for {keyword}',
          '{entity} cost {year}',
          'how to {keyword} {entity}',
          '{entity} {keyword} checklist',
          'average {entity} {keyword}',
          '{entity} worth it {year}',
          'diy {entity} vs professional'
        ]
      },
      careers: {
        enabled: true,
        keywords: [
          'job', 'salary', 'resume', 'interview', 'remote', 'hiring',
          'career change', 'skills', 'certification', 'promotion',
          'work life balance', 'benefits', 'glassdoor', 'linkedin'
        ],
        entities: [
          'software engineer', 'nurse', 'teacher', 'data analyst',
          'project manager', 'graphic designer', 'marketing manager',
          'accountant', 'electrician', 'plumber', 'freelance writer',
          'ux designer', 'product manager', 'cybersecurity analyst',
          'real estate agent', 'dental hygienist', 'paralegal'
        ],
        templates: [
          '{entity} {keyword}',
          '{entity} {keyword} {year}',
          'how to become {entity}',
          '{entity} vs {entity} {keyword}',
          'best {keyword} for {entity}',
          '{entity} {keyword} entry level',
          'is {entity} a good {keyword}',
          '{entity} average {keyword}',
          '{entity} {keyword} no degree'
        ]
      },
      parenting: {
        enabled: true,
        keywords: [
          'tips', 'age appropriate', 'milestone', 'safety', 'development',
          'activities', 'schedule', 'behavior', 'education', 'screen time',
          'discipline', 'nutrition', 'sleep', 'potty training', 'daycare'
        ],
        entities: [
          'toddler', 'baby', 'preschooler', 'teenager', 'newborn',
          'school age', 'kindergarten readiness', 'reading level',
          'homework help', 'birthday party ideas', 'family vacation',
          'chores by age', 'allowance', 'bullying', 'social skills',
          'picky eater', 'bedtime routine', 'sibling rivalry'
        ],
        templates: [
          '{entity} {keyword}',
          '{keyword} for {entity}',
          'how to handle {entity} {keyword}',
          'best {keyword} {entity}',
          '{entity} {keyword} guide',
          'normal {entity} {keyword}',
          'when does {entity} start {keyword}',
          '{entity} not {keyword} what to do',
          '{entity} {keyword} by age'
        ]
      },
      science: {
        enabled: true,
        keywords: [
          'explained', 'how does', 'discovery', 'research', 'theory',
          'experiment', 'study', 'facts', 'nasa', 'breakthrough',
          'debate', 'evidence', 'peer reviewed', 'journal', 'paper'
        ],
        entities: [
          'black hole', 'climate change', 'evolution', 'quantum physics',
          'mars mission', 'dna', 'vaccine', 'earthquake', 'volcano',
          'ocean current', 'aurora borealis', 'dinosaur', 'exoplanet',
          'crispr gene editing', 'artificial intelligence', 'fusion energy',
          'microbiome', 'dark matter', 'james webb telescope', 'coral reef'
        ],
        templates: [
          '{keyword} {entity}',
          '{entity} {keyword}',
          'latest {entity} {keyword}',
          'is {entity} real',
          'how does {entity} work',
          '{entity} new {keyword} {year}',
          '{entity} for dummies',
          'why is {entity} important',
          '{entity} vs {entity} science'
        ]
      },
      sports: {
        enabled: true,
        keywords: [
          'score', 'schedule', 'roster', 'standings', 'highlights',
          'trade', 'draft', 'injury update', 'stats', 'predictions',
          'tickets', 'live stream', 'recap', 'mvp', 'playoffs'
        ],
        entities: [
          'nfl', 'nba', 'mlb', 'soccer', 'premier league', 'formula 1',
          'tennis', 'golf', 'olympics', 'ufc', 'boxing', 'cricket',
          'rugby', 'hockey nhl', 'college football', 'march madness',
          'world cup', 'super bowl', 'champions league', 'wimbledon'
        ],
        templates: [
          '{entity} {keyword}',
          '{entity} {keyword} today',
          '{entity} {keyword} {year}',
          'who won {entity}',
          '{entity} game {keyword}',
          '{entity} {keyword} this week',
          'next {entity} game',
          '{entity} power rankings',
          '{entity} free agent rumors'
        ]
      }
    };
  }

  // bigram model for natural search query starts.
  // these are the common ways people begin typing a search
  buildMarkovChains() {
    return {
      starts: [
        'how to', 'what is', 'best', 'why', 'where', 'when',
        'can i', 'should i', 'how do i', 'is it', 'does',
        'how much', 'what are', 'which', 'how long'
      ],
      transitions: {
        'how to': ['fix', 'make', 'create', 'learn', 'get', 'install', 'remove', 'use', 'start', 'stop'],
        'what is': ['the best', 'a good', 'the meaning of', 'the difference between', 'the point of', 'wrong with'],
        'best': ['way to', 'time to', 'place for', 'method for', 'tool for', 'app for'],
        'why': ['is', 'does', 'do', 'should', 'can', 'won\'t', 'isn\'t'],
        'where': ['to', 'is', 'can i', 'should i', 'do they sell'],
        'when': ['to', 'is', 'should i', 'can i', 'does', 'will'],
        'can i': ['get', 'use', 'make', 'learn', 'find', 'return', 'cancel'],
        'should i': ['buy', 'use', 'learn', 'get', 'try', 'switch to', 'upgrade'],
        'is it': ['safe to', 'worth', 'normal to', 'possible to', 'legal to', 'ok to'],
        'how much': ['does', 'is', 'should i', 'to', 'for a'],
        'how long': ['does', 'until', 'to', 'should i', 'before']
      }
    };
  }

  // generate a query, optionally biased by persona and/or trending topics.
  // persona can be null (random mode), trends is an array of strings
  generateQuery(complexity, settings, sessionInfo, persona = null, trends = []) {
    // pick topic — persona-weighted or random
    let topic;
    if (sessionInfo && sessionInfo.topic) {
      topic = sessionInfo.topic;
    } else {
      topic = this.selectTopic(settings, persona);
      if (sessionInfo) {
        sessionInfo.topic = topic;
      }
    }

    const topicData = this.topics[topic];
    if (!topicData) {
      // fallback if somehow we got a topic that doesn't exist
      return this.generateMediumQuery(this.topics.general, [], []);
    }

    // gather extra entities from persona and trends
    const personaEntities = persona?.entities?.[topic] || [];

    let query;
    switch (complexity) {
      case 'short':
        query = this.generateShortQuery(topicData, personaEntities);
        break;
      case 'medium':
        query = this.generateMediumQuery(topicData, personaEntities, trends);
        break;
      case 'long':
        query = this.generateLongQuery(topicData, personaEntities);
        break;
      case 'very_long':
        query = this.generateVeryLongQuery(topicData, personaEntities);
        break;
      default:
        query = this.generateMediumQuery(topicData, personaEntities, trends);
    }

    return query;
  }

  // select a topic — uses persona weights if available,
  // otherwise picks uniformly from enabled topics
  selectTopic(settings, persona) {
    const enabledTopics = Object.keys(this.topics).filter(
      topic => settings.topics?.[topic] !== false
    );

    if (enabledTopics.length === 0) return 'general';

    // if persona is active, use weighted selection
    if (persona) {
      return this.selectWeightedTopic(persona, enabledTopics);
    }

    return enabledTopics[Math.floor(Math.random() * enabledTopics.length)];
  }

  // weighted random topic selection for personas
  selectWeightedTopic(persona, enabledTopics) {
    const defaultWeight = 0.1;
    let totalWeight = 0;
    const weighted = [];

    for (const topic of enabledTopics) {
      const weight = persona.topicWeights?.[topic] ?? defaultWeight;
      totalWeight += weight;
      weighted.push({ topic, weight });
    }

    let roll = Math.random() * totalWeight;
    for (const entry of weighted) {
      roll -= entry.weight;
      if (roll <= 0) return entry.topic;
    }

    return weighted[weighted.length - 1]?.topic || enabledTopics[0];
  }

  // merge persona entities into the regular entity pool.
  // persona entities get mixed in with ~40% probability per query
  // so they're prominent but don't completely replace the base pool
  mergedEntities(topicData, personaEntities) {
    if (personaEntities.length > 0 && Math.random() < 0.4) {
      return personaEntities;
    }
    return topicData.entities;
  }

  // lazy search
  generateShortQuery(topicData, personaEntities) {
    const entities = this.mergedEntities(topicData, personaEntities);
    const useEntity = Math.random() < 0.7;
    if (useEntity) {
      return this.randomElement(entities);
    } else {
      const keyword = this.randomElement(topicData.keywords);
      const entity = this.randomElement(entities);
      return `${keyword} ${entity}`;
    }
  }

  // 3-5 word queries
  generateMediumQuery(topicData, personaEntities, trends) {
    // ~15% chance to use a trending topic as the entity
    // if trends are available makes the query timely
    let entity;
    if (trends.length > 0 && Math.random() < 0.15) {
      entity = this.randomElement(trends);
    } else {
      const entities = this.mergedEntities(topicData, personaEntities);
      entity = this.randomElement(entities);
    }

    const template = this.randomElement(topicData.templates);
    const keyword = this.randomElement(topicData.keywords);

    let query = template
      .replace('{keyword}', keyword)
      .replace(/{entity}/g, entity)
      .replace('{year}', this.currentYear());

    // sometimes add year or platform modifier
    if (Math.random() < 0.15) {
      query += ` ${this.currentYear()}`;
    } else if (Math.random() < 0.08) {
      query += ' reddit';
    } else if (Math.random() < 0.05) {
      query += ' youtube';
    }

    return query;
  }

  // 6-10 word queries more specific searches
  generateLongQuery(topicData, personaEntities) {
    const entities = this.mergedEntities(topicData, personaEntities);
    const start = this.randomElement(this.markovChains.starts);
    const keyword = this.randomElement(topicData.keywords);
    const entity = this.randomElement(entities);
    const entity2 = this.randomElement(entities);

    const patterns = [
      `${start} ${keyword} ${entity} ${entity2}`,
      `${start} ${entity} for ${keyword} ${entity2}`,
      `best ${keyword} ${entity} for ${entity2}`,
      `${start} ${keyword} ${entity} without ${entity2}`,
      `${keyword} ${entity} vs ${entity2} comparison`,
      `${start} ${entity} ${keyword} in ${this.currentYear()}`,
      `${entity} ${keyword} for ${entity2} reddit`
    ];

    return this.randomElement(patterns);
  }

  // full question/sentence queries how people actually ask things
  generateVeryLongQuery(topicData, personaEntities) {
    const entities = this.mergedEntities(topicData, personaEntities);
    const entity = this.randomElement(entities);
    const keyword = this.randomElement(topicData.keywords);

    const patterns = [
      `what is the best way to ${keyword} ${entity} for beginners`,
      `how do i ${keyword} ${entity} without spending too much money`,
      `why does ${entity} ${keyword} and what can i do about it`,
      `where can i find the best ${entity} ${keyword} in my area`,
      `what are the benefits of ${keyword} ${entity} every day`,
      `how long does it take to ${keyword} ${entity} properly`,
      `is it safe to ${keyword} ${entity} at home`,
      `what should i know before ${keyword} ${entity} for the first time`,
      `${entity} ${keyword} not working what am i doing wrong`,
      `can someone explain ${entity} ${keyword} in simple terms`
    ];

    return this.randomElement(patterns);
  }

  // simulate a realistic typo based on qwerty keyboard layout.
  // only triggers on words 4+ chars, never on the first word
  addTypo(query) {
    const words = query.split(' ');
    if (words.length < 3) return query;

    // pick a random word, skip the first one
    const wordIndex = Math.floor(Math.random() * (words.length - 1)) + 1;
    const word = words[wordIndex];
    if (word.length < 4) return query;

    const typoType = Math.random();

    if (typoType < 0.4) {
      // adjacent key swap most common real typo
      words[wordIndex] = this.adjacentKeyTypo(word);
    } else if (typoType < 0.7) {
      // double letter finger bounce
      const pos = Math.floor(Math.random() * word.length);
      words[wordIndex] = word.slice(0, pos) + word[pos] + word.slice(pos);
    } else if (typoType < 0.85) {
      // missing letter finger didn't register
      const pos = Math.floor(Math.random() * word.length);
      words[wordIndex] = word.slice(0, pos) + word.slice(pos + 1);
    } else {
      // transposed letters fingers out of sync
      const pos = Math.floor(Math.random() * (word.length - 1));
      words[wordIndex] = word.slice(0, pos) + word[pos + 1] + word[pos] + word.slice(pos + 2);
    }

    return words.join(' ');
  }

  // replace a character with an adjacent key on qwerty layout
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

  // generate a follow-up search that refines the original query
  // this is what real users do when the first result isn't good enough
  refineQuery(originalQuery) {
    const year = this.currentYear();
    const refinements = [
      `${originalQuery} reddit`,
      `${originalQuery} ${year}`,
      `best ${originalQuery}`,
      `${originalQuery} near me`,
      `${originalQuery} reviews`,
      `how to ${originalQuery}`,
      `${originalQuery} guide`,
      `${originalQuery} tutorial`,
      `cheap ${originalQuery}`,
      `${originalQuery} alternatives`,
      `${originalQuery} worth it`,
      `${originalQuery} vs`
    ];

    return this.randomElement(refinements);
  }

  // sync topic enabled/disabled state from settings
  updateTopicSettings(topicSettings) {
    Object.keys(topicSettings).forEach(topic => {
      if (this.topics[topic]) {
        this.topics[topic].enabled = topicSettings[topic];
      }
    });
  }

  randomElement(array) {
    return array[Math.floor(Math.random() * array.length)];
  }
}
