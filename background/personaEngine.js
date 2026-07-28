// persona engine generates tightly clustered fake search identities
// that force profiling algorithms to waste resources on a ghost.
// each persona biases topic selection and injects domain-specific
// entities so the noise reads as a coherent person, not random scatter.

export class PersonaEngine {
  constructor() {
    this.personas = this.buildPersonas();
  }

  // all available persona definitions
  buildPersonas() {
    return {
      student: {
        id: 'student',
        name: 'College Student',
        description: 'Lectures, deadlines, cheap food, campus life',
        // topic weights are higher = more likely to be selected.
        // topics not listed default to 0.1 (rare but not zero,
        // because real people still search outside their lane)
        topicWeights: {
          education: 5.0,
          technology: 3.0,
          food: 2.5,
          entertainment: 3.0,
          gaming: 2.0,
          finance: 1.5,
          shopping: 1.5,
          general: 1.0
        },
        // extra entities that get mixed into the topic pools
        // when this persona is active
        entities: {
          education: [
            'calculus homework help', 'apa citation generator', 'quizlet flashcards',
            'rate my professor', 'scholarship application', 'study group tips',
            'gpa calculator', 'internship resume template', 'cramming techniques',
            'free textbook pdf', 'khan academy linear algebra', 'essay outline example',
            'dorm room organization', 'student loan calculator', 'campus map'
          ],
          food: [
            'cheap meals under $5', 'instant ramen hacks', 'meal prep for students',
            'best microwave recipes', 'dining hall hours', 'late night snacks easy',
            'coffee shop near campus', 'grocery budget weekly'
          ],
          entertainment: [
            'spotify student discount', 'free movies streaming', 'party playlist 2025',
            'board games for groups', 'netflix student deals', 'youtube study music',
            'weekend plans ideas college', 'campus events this week'
          ],
          technology: [
            'best laptop for college', 'google docs offline', 'notion templates students',
            'wifi slow dorm fix', 'free software student email', 'overleaf latex tutorial',
            'zoom recording download', 'discord study server'
          ],
          gaming: [
            'free games steam', 'best co-op games', 'gaming laptop budget',
            'valorant rank distribution', 'minecraft server hosting cheap'
          ],
          finance: [
            'student credit card no fee', 'part time jobs near me', 'fafsa deadline',
            'work study program', 'budgeting app free', 'textbook buyback price'
          ]
        }
      },

      techpro: {
        id: 'techpro',
        name: 'Remote Tech Worker',
        description: 'Code, SaaS tools, standups, ergonomic setups',
        topicWeights: {
          technology: 5.0,
          shopping: 2.5,
          finance: 2.0,
          food: 1.5,
          health: 2.0,
          education: 2.0,
          careers: 1.5,
          general: 1.0
        },
        entities: {
          technology: [
            'vscode extensions productivity', 'docker compose tutorial', 'react vs svelte 2025',
            'github copilot worth it', 'typescript generics explained', 'aws lambda cold start',
            'tailwind css cheat sheet', 'postgres vs mysql performance', 'ci cd pipeline setup',
            'cursor ide review', 'linear app project management', 'vercel deployment guide',
            'redis caching patterns', 'graphql vs rest api', 'homebrew mac update'
          ],
          shopping: [
            'best standing desk', 'ergonomic keyboard mechanical', 'ultrawide monitor 34 inch',
            'noise cancelling headphones office', 'webcam 4k streaming', 'desk mat large',
            'monitor arm dual', 'usb c hub thunderbolt'
          ],
          health: [
            'desk stretches back pain', 'blue light glasses worth it', 'wrist rest ergonomic',
            'pomodoro technique timer', 'eye strain computer fix', 'standing desk schedule'
          ],
          finance: [
            'stock options startup', 'roth ira contribution limit', '401k employer match',
            'freelance tax deductions', 'crypto portfolio tracker'
          ],
          food: [
            'lunch delivery service', 'meal prep sunday', 'best coffee beans online',
            'soylent review', 'snacks for desk work'
          ]
        }
      },

      fitness: {
        id: 'fitness',
        name: 'Fitness Enthusiast',
        description: 'Gym routines, macros, recovery, gear reviews',
        topicWeights: {
          health: 5.0,
          food: 4.0,
          shopping: 2.5,
          sports: 2.0,
          science: 1.5,
          general: 1.0
        },
        entities: {
          health: [
            'push pull legs split', 'creatine loading phase', 'foam roller exercises',
            'best protein powder 2025', 'stretching routine morning', 'sleep quality tips',
            'overtraining symptoms', 'progressive overload explained', 'heart rate zones running',
            'ice bath benefits recovery', 'mobility warm up routine', 'deload week schedule',
            'vo2 max improvement', 'body recomposition guide', 'cortisol and muscle growth'
          ],
          food: [
            'high protein meals easy', 'macro calculator tdee', 'chicken breast recipes bulk',
            'overnight oats recipe', 'pre workout meal timing', 'post workout shake recipe',
            'greek yogurt protein content', 'meal prep containers glass', 'creatine in food sources'
          ],
          shopping: [
            'best running shoes 2025', 'gym bag with shoe compartment', 'resistance bands set',
            'whey protein isolate deal', 'fitness tracker heart rate', 'weightlifting belt leather',
            'wireless earbuds gym sweat', 'compression shorts review'
          ],
          sports: [
            'marathon training plan 16 weeks', 'crossfit open workouts', 'powerlifting meet prep',
            'rock climbing beginner', 'swimming technique freestyle'
          ]
        }
      },

      parent: {
        id: 'parent',
        name: 'New Parent',
        description: 'Baby milestones, sleep schedules, product reviews',
        topicWeights: {
          parenting: 5.0,
          health: 3.5,
          shopping: 3.0,
          food: 2.0,
          education: 1.5,
          local: 2.0,
          general: 1.0
        },
        entities: {
          parenting: [
            'baby sleep schedule 6 months', 'teething symptoms timeline', 'best stroller 2025',
            'diaper rash treatment', 'baby food introduction chart', 'sleep training methods',
            'car seat installation guide', 'baby proofing checklist', 'tummy time activities',
            'developmental milestones 1 year', 'toddler tantrums tips', 'breastfeeding positions',
            'baby monitor wifi vs radio', 'nursery room temperature', 'postpartum recovery timeline'
          ],
          health: [
            'pediatrician near me', 'baby vaccination schedule', 'infant cpr guide',
            'baby fever when to worry', 'colic remedies newborn', 'postpartum exercises safe'
          ],
          shopping: [
            'best baby carrier ergonomic', 'cloth diapers vs disposable cost', 'high chair convertible',
            'baby swing portable', 'nursing pillow review', 'baby bottles anti colic',
            'baby clothes organic cotton', 'white noise machine nursery'
          ],
          food: [
            'easy one hand meals', 'freezer meals postpartum', 'baby led weaning recipes',
            'lactation cookies recipe', 'meal delivery family plan'
          ],
          local: [
            'mommy and me classes near me', 'pediatric dentist nearby', 'baby friendly restaurants',
            'playground toddler near me', 'family photo studio local'
          ]
        }
      },

      retiree: {
        id: 'retiree',
        name: 'Retiree / Traveler',
        description: 'Travel planning, gardening, health management, hobbies',
        topicWeights: {
          travel: 5.0,
          health: 3.0,
          hobbies: 3.5,
          food: 2.0,
          finance: 2.5,
          local: 2.0,
          news: 2.0,
          general: 1.0
        },
        entities: {
          travel: [
            'best time to visit italy', 'river cruise europe reviews', 'senior travel insurance',
            'all inclusive resorts caribbean', 'national parks road trip', 'travel packing list',
            'airport wheelchair assistance', 'cruise ship comparison', 'train travel europe pass',
            'best travel credit card no foreign fees', 'guided tours small group',
            'vacation rental vs hotel', 'travel photography tips beginner'
          ],
          health: [
            'arthritis exercises gentle', 'blood pressure monitor home', 'medicare supplement plans',
            'walking routine seniors', 'vitamin d deficiency symptoms', 'knee replacement recovery',
            'hearing aid reviews consumer reports', 'sleep apnea cpap alternatives'
          ],
          hobbies: [
            'watercolor painting beginner', 'bird watching guide local', 'book club recommendations',
            'crossword puzzle daily', 'genealogy research free', 'container gardening vegetables',
            'bridge card game online', 'quilting patterns free'
          ],
          finance: [
            'social security benefits calculator', 'required minimum distribution', 'estate planning checklist',
            'reverse mortgage pros cons', 'retirement income strategy', 'annuity vs bonds'
          ]
        }
      },

      foodie: {
        id: 'foodie',
        name: 'Foodie / Home Cook',
        description: 'Recipes, restaurant reviews, kitchen gear, techniques',
        topicWeights: {
          food: 5.0,
          shopping: 2.5,
          travel: 2.0,
          health: 1.5,
          hobbies: 1.5,
          entertainment: 1.5,
          local: 2.5,
          general: 1.0
        },
        entities: {
          food: [
            'sourdough starter recipe', 'beef wellington gordon ramsay', 'homemade pasta dough',
            'best cast iron skillet seasoning', 'sous vide temperature chart', 'fermented vegetables guide',
            'thai green curry authentic', 'smash burger technique', 'croissant lamination tips',
            'kombucha brewing first batch', 'knife sharpening whetstone', 'ramen broth from scratch',
            'tiramisu no raw eggs', 'bbq brisket texas style', 'ice cream no churn recipe'
          ],
          shopping: [
            'dutch oven enameled best', 'chef knife japanese', 'instant pot vs slow cooker',
            'kitchen scale digital grams', 'mandoline slicer safe', 'spice grinder electric',
            'baking sheet half size', 'food processor comparison'
          ],
          local: [
            'michelin star restaurants near me', 'farmers market saturday', 'wine tasting nearby',
            'cooking class beginner local', 'best brunch spots', 'food truck festival'
          ],
          travel: [
            'food tours tokyo', 'best street food bangkok', 'wine regions france map',
            'culinary vacation italy', 'food markets barcelona'
          ]
        }
      },

      gamer: {
        id: 'gamer',
        name: 'Gamer',
        description: 'Game guides, builds, hardware, streams, esports',
        topicWeights: {
          gaming: 5.0,
          technology: 3.5,
          entertainment: 2.5,
          shopping: 2.0,
          food: 1.0,
          general: 1.0
        },
        entities: {
          gaming: [
            'elden ring best build', 'baldurs gate 3 companion guide', 'steam sale dates 2025',
            'palworld server setup', 'gta 6 release date confirmed', 'helldivers 2 stratagems list',
            'factorio belt ratios', 'valorant crosshair settings pro', 'minecraft farm designs',
            'cyberpunk 2077 phantom liberty endings', 'best roguelike games 2025',
            'league of legends patch notes', 'game pass new releases', 'indie games hidden gems',
            'dark souls boss order', 'stardew valley sprinkler layout'
          ],
          technology: [
            'rtx 5090 benchmark', 'best gaming monitor 1440p 240hz', 'mechanical keyboard switches',
            'pc build guide 2025 budget', 'ryzen 9000 vs intel', 'ssd nvme gen5 speed',
            'gpu comparison chart', 'ram speed gaming difference', 'windows game mode settings'
          ],
          entertainment: [
            'twitch streamers to watch', 'game awards nominees', 'gaming podcast recommendations',
            'speedrun world records', 'retro game emulator legal'
          ],
          shopping: [
            'gaming chair ergonomic', 'controller ps5 vs xbox', 'gaming headset wireless',
            'mouse pad desk size', 'capture card 4k streaming', 'gaming desk cable management'
          ]
        }
      },

      business: {
        id: 'business',
        name: 'Small Business Owner',
        description: 'Marketing, accounting, local SEO, hiring, logistics',
        topicWeights: {
          finance: 4.0,
          technology: 3.0,
          careers: 3.5,
          shopping: 2.0,
          local: 2.5,
          news: 2.0,
          general: 1.0
        },
        entities: {
          finance: [
            'small business tax deductions', 'quickbooks vs freshbooks', 'invoice template free',
            'business credit card rewards', 'quarterly tax payment deadline', 'profit margin calculator',
            'cash flow forecast template', 'payroll software small business', 'business loan sba rates'
          ],
          technology: [
            'best pos system small business', 'square vs stripe fees', 'google my business setup',
            'website builder small business', 'email marketing mailchimp', 'crm free small business',
            'social media scheduling tool', 'inventory management software'
          ],
          careers: [
            'how to hire first employee', 'job posting indeed cost', 'employee handbook template',
            'workers comp insurance quote', 'interview questions to ask', 'onboarding checklist new hire'
          ],
          local: [
            'commercial lease near me', 'business insurance quote', 'coworking space monthly',
            'local advertising options', 'networking events business'
          ],
          news: [
            'small business grants 2025', 'minimum wage update', 'supply chain news',
            'economic forecast small business', 'new tax law changes'
          ]
        }
      }
    };
  }

  // returns the full persona config, or null if persona is disabled / set to 'none'
  getActivePersona(settings) {
    const personaId = settings?.persona;
    if (!personaId || personaId === 'none') return null;
    return this.personas[personaId] || null;
  }

  // get the list of all personas for the ui dropdown
  getPersonaList() {
    return Object.values(this.personas).map(p => ({
      id: p.id,
      name: p.name,
      description: p.description
    }));
  }

  // returns a topic selection weighted by persona preferences.
  // topics not in the persona's weight map get a small default weight
  // so the profile isn't suspiciously narrow
  selectWeightedTopic(persona, enabledTopics) {
    if (!persona) return null;

    const defaultWeight = 0.1;
    let totalWeight = 0;
    const weighted = [];

    for (const topic of enabledTopics) {
      const weight = persona.topicWeights[topic] ?? defaultWeight;
      totalWeight += weight;
      weighted.push({ topic, weight });
    }

    // weighted random selection
    let roll = Math.random() * totalWeight;
    for (const entry of weighted) {
      roll -= entry.weight;
      if (roll <= 0) return entry.topic;
    }

    // fallback (shouldn't hit this but just in case)
    return weighted[weighted.length - 1]?.topic || enabledTopics[0];
  }

  // returns persona-specific entities for a topic, or empty array if none defined.
  // these get mixed into the regular entity pool during query generation
  getPersonaEntities(persona, topic) {
    if (!persona || !persona.entities) return [];
    return persona.entities[topic] || [];
  }
}
