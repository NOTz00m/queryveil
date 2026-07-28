// multilingual query data for generating noise in non-english languages.
// mixing languages into noise makes profiling significantly harder
// because classifiers trained on one language choke on multilingual input.
//
// ai (claude) was used to help generate translations and culturally
// appropriate phrases for these languages. native speaker review is
// welcome and encouraged, see the contribution guide for details.

export class QueryLanguages {
  constructor() {
    this.languages = this.buildLanguages();
  }

  buildLanguages() {
    return {
      en: {
        code: 'en',
        name: 'English',
        acceptLanguage: 'en-US,en;q=0.9',
        searchParams: {},
        // english uses the main query generator, no template needed
        templates: [],
        keywords: [],
        entities: []
      },

      es: {
        code: 'es',
        name: 'Spanish',
        acceptLanguage: 'es-ES,es;q=0.9,en;q=0.5',
        searchParams: { hl: 'es', lr: 'lang_es' },
        keywords: [
          'como', 'mejor', 'donde', 'que es', 'por que', 'cuando',
          'precio', 'gratis', 'receta', 'cerca de mi', 'opiniones',
          'barato', 'comprar', 'descargar', 'tutorial', 'consejos',
          'ofertas', 'horario', 'mapa', 'resultados', 'abierto ahora',
          'segunda mano', 'reservar', 'entrega'
        ],
        entities: [
          'restaurante', 'hotel', 'vuelos', 'trabajo', 'universidad',
          'receta de paella', 'clima hoy', 'futbol resultados',
          'pelicula estreno', 'noticias espana', 'supermercado',
          'medico cerca', 'alquiler piso', 'coche segunda mano',
          'curso online', 'tarjeta credito', 'seguro coche',
          'horario metro', 'farmacia guardia', 'dentista', 'gimnasio',
          'banco', 'abogado', 'fontanero', 'electricista',
          'entradas concierto', 'becas universitarias', 'movil barato',
          'ordenador portatil', 'vacaciones familia', 'transporte publico',
          'comida a domicilio'
        ],
        templates: [
          'como hacer {entity}',
          'mejor {entity} {year}',
          '{entity} cerca de mi',
          'donde comprar {entity}',
          '{entity} precio',
          'que es {entity}',
          '{entity} opiniones',
          '{entity} gratis',
          'receta de {entity} facil',
          '{entity} barato online',
          '{entity} abierto ahora',
          'como llegar a {entity}',
          '{entity} horario',
          'ofertas {entity} {year}',
          'reservar {entity} online',
          '{entity} segunda mano',
          '{keyword} {entity}',
          '{entity} {keyword} {year}'
        ]
      },

      fr: {
        code: 'fr',
        name: 'French',
        acceptLanguage: 'fr-FR,fr;q=0.9,en;q=0.5',
        searchParams: { hl: 'fr', lr: 'lang_fr' },
        keywords: [
          'comment', 'meilleur', 'ou', 'pourquoi', 'quand', 'prix',
          'gratuit', 'recette', 'pres de moi', 'avis', 'pas cher',
          'acheter', 'telecharger', 'tuto', 'conseils', 'comparatif',
          'horaires', 'ouvert maintenant', 'promo', 'reserver', 'plan',
          'resultats', 'occasion', 'livraison'
        ],
        entities: [
          'restaurant paris', 'meteo demain', 'billet train',
          'emploi', 'appartement location', 'recette gateau',
          'film sortie', 'actualites france', 'pharmacie garde',
          'medecin generaliste', 'assurance auto', 'credit immobilier',
          'cours en ligne', 'coiffeur', 'plombier', 'boulangerie',
          'supermarche horaires', 'demenagement', 'electricien',
          'salle de sport', 'banque', 'avocat', 'serrurier',
          'garage automobile', 'billets concert', 'ordinateur portable',
          'telephone mobile', 'vacances en famille', 'transports en commun',
          'livraison repas', 'borne de recharge'
        ],
        templates: [
          'comment faire {entity}',
          'meilleur {entity} {year}',
          '{entity} pres de moi',
          'ou acheter {entity}',
          '{entity} prix',
          'avis {entity}',
          '{entity} pas cher',
          'recette {entity} facile',
          '{entity} gratuit en ligne',
          'comparatif {entity} {year}',
          '{entity} horaires',
          '{entity} ouvert maintenant',
          'comment aller a {entity}',
          'reserver {entity} en ligne',
          'promo {entity} {year}',
          '{entity} occasion',
          '{keyword} {entity}',
          '{entity} {keyword} {year}'
        ]
      },

      de: {
        code: 'de',
        name: 'German',
        acceptLanguage: 'de-DE,de;q=0.9,en;q=0.5',
        searchParams: { hl: 'de', lr: 'lang_de' },
        keywords: [
          'wie', 'beste', 'wo', 'warum', 'wann', 'preis', 'kostenlos',
          'rezept', 'in der nahe', 'bewertung', 'gunstig', 'kaufen',
          'anleitung', 'tipps', 'vergleich', 'erfahrungen'
        ],
        entities: [
          'restaurant berlin', 'wetter morgen', 'bahnticket',
          'stellenangebote', 'wohnung mieten', 'rezept kuchen',
          'film kino', 'nachrichten deutschland', 'apotheke notdienst',
          'hausarzt', 'kfz versicherung', 'kredit vergleich',
          'online kurs', 'friseur', 'handwerker', 'supermarkt',
          'zahnarzt', 'umzug', 'steuerberater', 'rechtsanwalt'
        ],
        templates: [
          'wie macht man {entity}',
          'beste {entity} {year}',
          '{entity} in der nahe',
          'wo kaufen {entity}',
          '{entity} preis',
          '{entity} bewertung',
          '{entity} gunstig',
          '{entity} rezept einfach',
          '{entity} kostenlos',
          '{entity} vergleich {year}'
        ]
      },

      pt: {
        code: 'pt',
        name: 'Portuguese',
        acceptLanguage: 'pt-BR,pt;q=0.9,en;q=0.5',
        searchParams: { hl: 'pt', lr: 'lang_pt' },
        keywords: [
          'como', 'melhor', 'onde', 'por que', 'quando', 'preco',
          'gratis', 'receita', 'perto de mim', 'avaliacao', 'barato',
          'comprar', 'baixar', 'tutorial', 'dicas', 'comparar',
          'ofertas', 'horario', 'aberto agora', 'mapa', 'resultados',
          'reservar', 'entrega', 'usado'
        ],
        entities: [
          'restaurante', 'hotel', 'passagem aerea', 'emprego',
          'apartamento aluguel', 'receita bolo', 'filme lancamento',
          'noticias brasil', 'farmacia', 'medico', 'seguro auto',
          'curso online', 'cabeleireiro', 'supermercado', 'dentista',
          'academia', 'mecanico', 'advogado', 'contador', 'banco',
          'encanador', 'eletricista', 'passagem de onibus',
          'ingresso show', 'celular barato', 'notebook',
          'ferias em familia', 'transporte publico', 'comida delivery',
          'oficina mecanica', 'posto de gasolina'
        ],
        templates: [
          'como fazer {entity}',
          'melhor {entity} {year}',
          '{entity} perto de mim',
          'onde comprar {entity}',
          '{entity} preco',
          '{entity} avaliacao',
          '{entity} barato',
          'receita de {entity} facil',
          '{entity} gratis',
          '{entity} vale a pena',
          '{entity} aberto agora',
          'como chegar em {entity}',
          '{entity} horario',
          'ofertas {entity} {year}',
          'reservar {entity} online',
          '{entity} usado',
          '{keyword} {entity}',
          '{entity} {keyword} {year}'
        ]
      },

      ja: {
        code: 'ja',
        name: 'Japanese',
        acceptLanguage: 'ja,en;q=0.5',
        searchParams: { hl: 'ja', lr: 'lang_ja' },
        keywords: [
          'おすすめ', '方法', '比較', '口コミ', '安い', '無料',
          '人気', 'ランキング', 'やり方', '近く', '評判', '簡単',
          'レシピ', '使い方', '選び方', '最新'
        ],
        entities: [
          'レストラン', '天気予報', '電車 時刻表', '求人',
          'マンション 賃貸', 'レシピ 簡単', '映画 上映',
          'ニュース 速報', '薬局', '病院', '保険', 'ローン',
          'オンライン講座', '美容院', 'スーパー', '歯医者',
          'ジム', '引越し', '弁護士', '税理士'
        ],
        templates: [
          '{entity} おすすめ',
          '{entity} 方法',
          '{entity} 比較 {year}',
          '{entity} 口コミ',
          '{entity} 安い',
          '{entity} 人気 ランキング',
          '{entity} やり方',
          '{entity} 近く',
          '{entity} 無料',
          '{entity} 選び方 {year}'
        ]
      },

      ko: {
        code: 'ko',
        name: 'Korean',
        acceptLanguage: 'ko,en;q=0.5',
        searchParams: { hl: 'ko', lr: 'lang_ko' },
        keywords: [
          '추천', '방법', '비교', '후기', '싼', '무료',
          '인기', '순위', '하는법', '근처', '평가', '쉬운',
          '레시피', '사용법', '선택', '최신', '가격', '영업시간',
          '예약', '배송', '할인', '위치', '검색 결과', '중고'
        ],
        entities: [
          '맛집', '날씨', '지하철 시간표', '채용',
          '아파트 전세', '레시피 간단', '영화 개봉',
          '뉴스 속보', '약국', '병원', '보험', '대출',
          '온라인 강의', '미용실', '마트', '치과',
          '헬스장', '이사', '변호사', '세무사', '카페', '은행',
          '전기기사', '배관공', '콘서트 티켓', '노트북', '휴대폰',
          '가족 여행', '버스 시간표', '자동차 정비', '배달 음식',
          '전기차 충전소'
        ],
        templates: [
          '{entity} 추천',
          '{entity} 방법',
          '{entity} 비교 {year}',
          '{entity} 후기',
          '{entity} 싼 곳',
          '{entity} 인기 순위',
          '{entity} 하는법',
          '{entity} 근처',
          '{entity} 무료',
          '{entity} 선택 가이드 {year}',
          '{entity} 영업시간',
          '{entity} 예약 방법',
          '{entity} 할인 {year}',
          '{entity} 배송',
          '{entity} 중고 가격',
          '{entity} 위치',
          '{keyword} {entity}',
          '{entity} {keyword} {year}'
        ]
      },

      ar: {
        code: 'ar',
        name: 'Arabic',
        acceptLanguage: 'ar,en;q=0.5',
        searchParams: { hl: 'ar', lr: 'lang_ar' },
        keywords: [
          'كيف', 'افضل', 'اين', 'لماذا', 'متى', 'سعر',
          'مجاني', 'وصفة', 'قريب مني', 'تقييم', 'رخيص',
          'شراء', 'تحميل', 'شرح', 'نصائح', 'مقارنة'
        ],
        entities: [
          'مطعم', 'فندق', 'طيران', 'وظائف', 'شقة ايجار',
          'وصفة كيك', 'فيلم جديد', 'اخبار', 'صيدلية',
          'دكتور', 'تامين', 'قرض', 'دورة اونلاين',
          'حلاق', 'سوبرماركت', 'طبيب اسنان', 'نادي رياضي',
          'نقل عفش', 'محامي', 'محاسب'
        ],
        templates: [
          'كيف اعمل {entity}',
          'افضل {entity} {year}',
          '{entity} قريب مني',
          'اين اشتري {entity}',
          '{entity} سعر',
          '{entity} تقييم',
          '{entity} رخيص',
          'وصفة {entity} سهلة',
          '{entity} مجاني',
          'مقارنة {entity} {year}'
        ]
      },

      hi: {
        code: 'hi',
        name: 'Hindi',
        acceptLanguage: 'hi,en;q=0.5',
        searchParams: { hl: 'hi', lr: 'lang_hi' },
        keywords: [
          'कैसे', 'सबसे अच्छा', 'कहाँ', 'क्यों', 'कब', 'कीमत',
          'मुफ्त', 'रेसिपी', 'मेरे पास', 'रिव्यू', 'सस्ता',
          'खरीदें', 'डाउनलोड', 'तरीका', 'टिप्स', 'तुलना'
        ],
        entities: [
          'रेस्टोरेंट', 'होटल', 'फ्लाइट', 'नौकरी', 'किराये पर मकान',
          'केक रेसिपी', 'नई फिल्म', 'ताज़ा खबर', 'दवाखाना',
          'डॉक्टर', 'बीमा', 'लोन', 'ऑनलाइन कोर्स',
          'सैलून', 'सुपरमार्केट', 'दंत चिकित्सक', 'जिम',
          'पैकर्स एंड मूवर्स', 'वकील', 'अकाउंटेंट'
        ],
        templates: [
          '{entity} कैसे बनाएं',
          'सबसे अच्छा {entity} {year}',
          '{entity} मेरे पास',
          '{entity} कहाँ से खरीदें',
          '{entity} कीमत',
          '{entity} रिव्यू',
          '{entity} सस्ता',
          '{entity} रेसिपी आसान',
          '{entity} मुफ्त',
          '{entity} तुलना {year}'
        ]
      },

      it: {
        code: 'it',
        name: 'Italian',
        acceptLanguage: 'it-IT,it;q=0.9,en;q=0.5',
        searchParams: { hl: 'it', lr: 'lang_it' },
        keywords: [
          'come', 'migliore', 'dove', 'perche', 'quando', 'prezzo',
          'gratis', 'ricetta', 'vicino a me', 'recensioni', 'economico',
          'comprare', 'scaricare', 'guida', 'consigli', 'confronto'
        ],
        entities: [
          'ristorante', 'albergo', 'voli', 'lavoro', 'appartamento affitto',
          'ricetta torta', 'film uscita', 'notizie italia', 'farmacia',
          'medico', 'assicurazione auto', 'mutuo', 'corso online',
          'parrucchiere', 'supermercato', 'dentista', 'palestra',
          'trasloco', 'avvocato', 'commercialista'
        ],
        templates: [
          'come fare {entity}',
          'migliore {entity} {year}',
          '{entity} vicino a me',
          'dove comprare {entity}',
          '{entity} prezzo',
          '{entity} recensioni',
          '{entity} economico',
          'ricetta {entity} facile',
          '{entity} gratis',
          'confronto {entity} {year}'
        ]
      },

      nl: {
        code: 'nl',
        name: 'Dutch',
        acceptLanguage: 'nl-NL,nl;q=0.9,en;q=0.5',
        searchParams: { hl: 'nl', lr: 'lang_nl' },
        keywords: [
          'hoe', 'beste', 'waar', 'waarom', 'wanneer', 'prijs',
          'gratis', 'recept', 'bij mij in de buurt', 'review',
          'goedkoop', 'kopen', 'downloaden', 'handleiding', 'tips',
          'vergelijken'
        ],
        entities: [
          'restaurant', 'hotel', 'vliegticket', 'vacature',
          'appartement huur', 'recept taart', 'film bioscoop',
          'nieuws nederland', 'apotheek', 'huisarts', 'autoverzekering',
          'hypotheek', 'online cursus', 'kapper', 'supermarkt',
          'tandarts', 'sportschool', 'verhuizen', 'advocaat',
          'boekhouder'
        ],
        templates: [
          'hoe maak je {entity}',
          'beste {entity} {year}',
          '{entity} bij mij in de buurt',
          'waar kopen {entity}',
          '{entity} prijs',
          '{entity} review',
          '{entity} goedkoop',
          '{entity} recept makkelijk',
          '{entity} gratis',
          '{entity} vergelijken {year}'
        ]
      },

      tr: {
        code: 'tr',
        name: 'Turkish',
        acceptLanguage: 'tr-TR,tr;q=0.9,en;q=0.5',
        searchParams: { hl: 'tr', lr: 'lang_tr' },
        keywords: [
          'nasil', 'en iyi', 'nerede', 'neden', 'ne zaman', 'fiyat',
          'ucretsiz', 'tarif', 'yakinimda', 'yorum', 'ucuz',
          'satin al', 'indir', 'rehber', 'ipuclari', 'karsilastirma'
        ],
        entities: [
          'restoran', 'otel', 'ucak bileti', 'is ilanlari',
          'kiralik daire', 'pasta tarifi', 'film vizyonda',
          'haberler turkiye', 'eczane', 'doktor', 'sigorta',
          'kredi', 'online kurs', 'kuafor', 'market', 'dis hekimi',
          'spor salonu', 'nakliyat', 'avukat', 'muhasebeci'
        ],
        templates: [
          '{entity} nasil yapilir',
          'en iyi {entity} {year}',
          '{entity} yakinimda',
          '{entity} nereden alinir',
          '{entity} fiyat',
          '{entity} yorum',
          '{entity} ucuz',
          '{entity} tarifi kolay',
          '{entity} ucretsiz',
          '{entity} karsilastirma {year}'
        ]
      },

      pl: {
        code: 'pl',
        name: 'Polish',
        acceptLanguage: 'pl-PL,pl;q=0.9,en;q=0.5',
        searchParams: { hl: 'pl', lr: 'lang_pl' },
        keywords: [
          'jak', 'najlepszy', 'gdzie', 'dlaczego', 'kiedy', 'cena',
          'za darmo', 'przepis', 'w poblizu', 'opinie', 'tani',
          'kupic', 'pobrac', 'poradnik', 'porady', 'porownanie',
          'promocja', 'godziny otwarcia', 'otwarte teraz', 'mapa',
          'wyniki', 'rezerwacja', 'dostawa', 'uzywany'
        ],
        entities: [
          'restauracja', 'hotel', 'bilety lotnicze', 'praca',
          'mieszkanie wynajem', 'przepis ciasto', 'film kino',
          'wiadomosci polska', 'apteka', 'lekarz', 'ubezpieczenie',
          'kredyt', 'kurs online', 'fryzjer', 'sklep', 'dentysta',
          'silownia', 'przeprowadzka', 'prawnik', 'ksiegowy',
          'kawiarnia', 'bank', 'hydraulik', 'elektryk', 'bilety koncert',
          'laptop', 'telefon', 'wakacje rodzinne', 'rozklad autobusow',
          'warsztat samochodowy', 'jedzenie z dostawa', 'paczkomat'
        ],
        templates: [
          'jak zrobic {entity}',
          'najlepszy {entity} {year}',
          '{entity} w poblizu',
          'gdzie kupic {entity}',
          '{entity} cena',
          '{entity} opinie',
          '{entity} tani',
          'przepis na {entity} latwy',
          '{entity} za darmo',
          '{entity} porownanie {year}',
          '{entity} godziny otwarcia',
          '{entity} otwarte teraz',
          'jak dojechac do {entity}',
          'rezerwacja {entity} online',
          'promocja {entity} {year}',
          '{entity} uzywany',
          '{keyword} {entity}',
          '{entity} {keyword} {year}'
        ]
      },

      ru: {
        code: 'ru',
        name: 'Russian',
        acceptLanguage: 'ru-RU,ru;q=0.9,en;q=0.5',
        searchParams: { hl: 'ru', lr: 'lang_ru' },
        keywords: [
          'как', 'лучший', 'где', 'почему', 'когда', 'цена',
          'бесплатно', 'рецепт', 'рядом', 'отзывы', 'дешево',
          'купить', 'скачать', 'инструкция', 'советы', 'сравнение',
          'скидка', 'часы работы', 'открыто сейчас', 'карта',
          'результаты', 'бронирование', 'доставка', 'б у'
        ],
        entities: [
          'ресторан', 'гостиница', 'авиабилеты', 'работа',
          'квартира аренда', 'рецепт торт', 'фильм премьера',
          'новости россия', 'аптека', 'врач', 'страховка',
          'кредит', 'онлайн курс', 'парикмахерская', 'магазин',
          'стоматолог', 'спортзал', 'переезд', 'адвокат',
          'бухгалтер', 'кафе', 'банк', 'сантехник', 'электрик',
          'билеты на концерт', 'ноутбук', 'смартфон', 'семейный отдых',
          'расписание автобусов', 'автосервис', 'доставка еды',
          'пункт выдачи'
        ],
        templates: [
          'как сделать {entity}',
          'лучший {entity} {year}',
          '{entity} рядом со мной',
          'где купить {entity}',
          '{entity} цена',
          '{entity} отзывы',
          '{entity} дешево',
          'рецепт {entity} простой',
          '{entity} бесплатно',
          'сравнение {entity} {year}',
          '{entity} часы работы',
          '{entity} открыто сейчас',
          'адрес {entity}',
          'бронирование {entity} онлайн',
          'скидки на {entity} {year}',
          '{entity} с доставкой',
          '{keyword} {entity}',
          '{entity} {keyword} {year}'
        ]
      }
    };
  }

  // get a language config by code
  getLanguage(code) {
    return this.languages[code] || this.languages.en;
  }

  // returns all non-english languages
  getAvailableLanguages() {
    return Object.values(this.languages)
      .filter(l => l.code !== 'en')
      .map(l => ({ code: l.code, name: l.name }));
  }

  // pick a language based on user config.
  // primary language is the user's main language code
  // enabled languages is the list of additional language codes
  // mix percentage is the chance of picking a non-primary language
  selectLanguage(primaryLanguage, enabledLanguages, mixPercentage) {
    // if no extra languages enabled or mix is 0, always use primary
    if (!enabledLanguages || enabledLanguages.length === 0 || mixPercentage <= 0) {
      return primaryLanguage || 'en';
    }

    // roll for non-primary language
    if (Math.random() * 100 < mixPercentage) {
      // pick from enabled non-primary languages
      const others = enabledLanguages.filter(c => c !== primaryLanguage);
      if (others.length > 0) {
        return others[Math.floor(Math.random() * others.length)];
      }
    }

    return primaryLanguage || 'en';
  }

  // generate a query in the specified language using its templates
  generateLocalizedQuery(langCode, year) {
    const lang = this.languages[langCode];
    if (!lang || lang.code === 'en' || lang.templates.length === 0) {
      return null; // fall back to english generator
    }

    const template = lang.templates[Math.floor(Math.random() * lang.templates.length)];
    const entity = lang.entities[Math.floor(Math.random() * lang.entities.length)];
    const keyword = lang.keywords[Math.floor(Math.random() * lang.keywords.length)];

    return template
      .replace('{entity}', entity)
      .replace('{keyword}', keyword)
      .replace('{year}', year);
  }

  // keyboard layouts for multilingual typo generation
  getKeyboardLayout(langCode) {
    const layouts = {
      // french azerty
      fr: {
        'a': ['q', 'z', 's'],
        'z': ['a', 'e', 's'],
        'e': ['z', 'r', 'd'],
        'r': ['e', 't', 'f'],
        't': ['r', 'y', 'g'],
        'q': ['a', 'w', 's'],
        's': ['q', 'd', 'z', 'w'],
        'd': ['s', 'f', 'e'],
        'f': ['d', 'g', 'r'],
        'g': ['f', 'h', 't'],
        'w': ['q', 'x', 's'],
        'x': ['w', 'c', 'd'],
        'c': ['x', 'v', 'f'],
        'v': ['c', 'b', 'g'],
        'b': ['v', 'n', 'h']
      },
      // german qwertz
      de: {
        'y': ['x', 's', 'a'],
        'z': ['t', 'u', 'h', 'g'],
        'x': ['y', 's', 'd', 'c'],
        's': ['a', 'w', 'e', 'd', 'x', 'y'],
        'u': ['z', 'i', 'j', 'h'],
        'o': ['i', 'p', 'l', 'k']
      },
      // turkish qwerty (mostly same but some differences)
      tr: {
        'i': ['u', 'o', 'k', 'j'],
        's': ['a', 'w', 'e', 'd', 'x', 'z'],
        'c': ['x', 'd', 'f', 'v'],
        'g': ['f', 't', 'y', 'h', 'b', 'v']
      }
    };

    return layouts[langCode] || null;
  }
}
