// synthetic "real user" search profiles for benchmarking.
// these represent what an actual person's search history looks like:
// heavily clustered around a few topics with clear patterns.
// the benchmark measures how well queryveil's noise can mask these.
// note: these profiles contain complex, conversational
// queries, typos, and varying lengths to simulate real human syntax.

function getProfiles() {
  return {
    // someone who cooks a lot and hikes on weekends
    cookingHiker: {
      name: 'Cooking & Hiking Enthusiast',
      queries: [
        'what is the best sourdough bread recipe no knead',
        'how to clean cast iron skillet without ruining seasoning',
        'best hiking boots waterproof 2025',
        'chicken tikka masala from scratch step by step',
        'trail map appalachian near me',
        'easy dutch oven pot roast recipe',
        'merino wool hiking socks review reddit',
        'how do i sharpen kitchen knives with a whetstone',
        'best day hikes near asheville nc 2025',
        'homemade pasta dough recipe without machine',
        'osprey backpack 40l review',
        'how to make fermented hot sauce recipe',
        'hiking poles carbon fiber vs aluminum comparison',
        'cheap meal prep ideas weekly for one',
        'are bear canisters required on the pacific crest trail',
        'best chef knife under 100 dollars',
        'national park pass 2025 price',
        'slow cooker pulled pork recipe dr pepper',
        'waterproof jacket gore tex worth it',
        'how long to dehydrate fruit for trail mix',
        'farmers market near me saturday morning',
        'trekking pole tent setup for beginners',
        'easy weeknight dinner ideas healthy',
        'is alltrails premium worth it',
        'what is the difference between bread flour vs all purpose'
      ]
    },

    // someone deep into personal finance
    financeNerd: {
      name: 'Personal Finance Optimizer',
      queries: [
        'vanguard vtsax vs voo comparison 2025',
        'what is the roth ira contribution limit 2025',
        'high yield savings account best rate right now',
        'tax loss harvesting rules wash sale',
        'i bond rate current 2025',
        'how to do a backdoor roth ira step by step',
        'credit score check free no credit card',
        'mortgage rate today 30 year fixed average',
        'etf expense ratio comparison tool',
        '401k employer match calculator excel',
        'series i savings bonds vs tips which is better',
        'capital gains tax rate 2025 single',
        'how often should i rebalance my portfolio',
        'fidelity vs schwab brokerage reddit',
        'emergency fund how many months should i save',
        'hsa contribution limit 2025 family',
        'dividend aristocrats list 2025 pdf',
        'bogleheads three fund portfolio setup',
        'treasury bill auction schedule 2025',
        'first time home buyer programs near me',
        'how to calculate estimated quarterly tax payment',
        'what is the difference between index fund vs mutual fund',
        'debt avalanche vs snowball method',
        'fire retirement calculator early retirement',
        'social security benefits age 62 vs 67 calculator'
      ]
    },

    // parent with young kids
    busyParent: {
      name: 'Parent with Toddlers',
      queries: [
        'why is my toddler not sleeping through the night suddenly',
        'easy dinner ideas for picky eaters 3 year old',
        'potty training regression after new baby',
        'best convertible car seat 2025 crash test',
        'daycare cost per month average in my area',
        'how much screen time limits toddler AAP',
        'how to baby proof kitchen cabinets without drilling',
        'developmental milestones 2 year old checklist',
        'pediatrician near me accepting new patients',
        'healthy meal ideas for 18 month old',
        'is a fever of 101 normal for a toddler',
        'best lightweight stroller for travel airplane',
        'what is the difference between preschool vs pre k',
        'how to handle toddler tantrum in public',
        'baby monitor wifi security issues',
        'childrens museum near me open today',
        'when to switch from crib to toddler bed',
        'healthy snacks for toddlers on the go',
        'indoor playground near me open weekend',
        'sippy cup vs straw cup speech development',
        'how to get toddler to eat vegetables hidden',
        'what age to start swim lessons toddler',
        'baby proof outlet covers best kind',
        'pediatric dentist first visit when',
        'nap schedule 2 year old dropping nap'
      ]
    },

    // gamer who also follows tech news
    techGamer: {
      name: 'Tech News & Gaming',
      queries: [
        'rtx 5080 vs 5090 benchmark leaked',
        'elden ring dlc shadow of the erdtree build guide',
        'best custom mechanical keyboard 2025',
        'when is the next steam summer sale dates',
        'amd zen 5 review reddit',
        'baldurs gate 3 best open hand monk build',
        'is nvme gen5 ssd worth it for gaming',
        'game pass new games coming july 2025',
        'linux gaming proton compatibility list',
        'ultrawide monitor 34 vs 38 inch for programming',
        'helldivers 2 best loadout for automatons',
        'does ddr5 ram speed matter for gaming',
        'pc build 1500 dollar budget 2025',
        'cyberpunk 2077 phantom liberty best ending',
        'windows 11 gaming performance tweak guide',
        'best gaming mouse wireless lightweight 2025',
        'hollowknight silksong release date updates',
        'gpu comparison chart 2025 fps',
        'discord bot hosting free 24/7',
        'custom mechanical keyboard switches linear vs tactile',
        'steam deck oled vs rog ally battery life',
        'factorio space age expansion tips',
        'monitor arm dual setup heavy monitors',
        'best indie games 2025 switch',
        'how much cpu thermal paste to apply'
      ]
    },

    // someone going through a career change
    careerChanger: {
      name: 'Career Change to Tech',
      queries: [
        'how to learn python for beginners free',
        'is a coding bootcamp worth it in 2025',
        'software engineer salary entry level remote',
        'how to write a resume for a career change to tech',
        'best online cs degree programs part time',
        'what is the difference between data analyst vs data scientist',
        'javascript tutorial for beginners full course',
        'linkedin profile tips career change software developer',
        'portfolio website developer free hosting github pages',
        'behavioral interview questions practice star method',
        'where to find remote junior developer jobs',
        'what programming language should i learn first',
        'github portfolio examples for junior developers',
        'tech interview prep leetcode blind 75',
        'is aws certification worth it for beginners',
        'freelance web developer how to start',
        'best ux design bootcamp online',
        'salary negotiation tips for a new job offer',
        'networking events tech meetup near me',
        'cover letter template career change software engineer',
        'how to deal with imposter syndrome junior developer',
        'best laptop for programming 2025 mac vs windows',
        'web development roadmap 2025 front end',
        'side project ideas for developer portfolio',
        'how long does it take to learn coding for a job'
      ]
    }
  };
}

export { getProfiles };
