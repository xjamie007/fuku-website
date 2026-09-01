/* ==================================================================
   Übersetzung der Gerichtnamen

   Die Namen auf der Karte folgen wenigen wiederkehrenden Mustern
   („X aux légumes“, „X sur plat chauffant“, „Riz sauté au X“). Deshalb
   arbeitet dieses Modul nicht Wort für Wort, sondern mit einem gepflegten
   Wörterbuch aus Wendungen: Die längste passende Wendung gewinnt.

   Das hat zwei Vorteile gegenüber einer Maschinenübersetzung: Die
   Ergebnisse sind vorhersagbar und überprüfbar, und neue Gerichte aus
   WooCommerce werden automatisch mitübersetzt, solange sie dieselben
   Bausteine verwenden. Was das Wörterbuch nicht kennt, bleibt französisch
   stehen – sync-menu.mjs meldet solche Fälle.

   Fachbegriffe wie Sushi, Nigiri, Tempura oder Udon bleiben bewusst
   unübersetzt: So stehen sie international auf jeder Karte.
   ================================================================== */

/**
 * Wendungen, längere zuerst geprüft.
 * Schlüssel sind kleingeschrieben; Apostrophe sind bereits typografisch (’).
 */
const PHRASES = {
  /* --- ganze Gerichtgruppen ---------------------------------------- */
  'riz sauté': { de: 'Gebratener Reis', en: 'Fried rice', nl: 'Gebakken rijst' },
  'nouilles sautées': { de: 'Gebratene Nudeln', en: 'Fried noodles', nl: 'Gebakken noedels' },
  'nouilles sauté': { de: 'Gebratene Nudeln', en: 'Fried noodles', nl: 'Gebakken noedels' },
  'udon sautées': { de: 'Gebratene Udon', en: 'Fried udon', nl: 'Gebakken udon' },
  'udon sauté': { de: 'Gebratene Udon', en: 'Fried udon', nl: 'Gebakken udon' },
  'vermicelle sautées': { de: 'Gebratene Glasnudeln', en: 'Fried vermicelli', nl: 'Gebakken vermicelli' },
  'vermicelle sauté': { de: 'Gebratene Glasnudeln', en: 'Fried vermicelli', nl: 'Gebakken vermicelli' },
  'légumes sauté': { de: 'Gebratenes Gemüse', en: 'Fried vegetables', nl: 'Gebakken groenten' },

  /* --- Zubereitungen ------------------------------------------------ */
  'aux champignons chinois': { de: 'mit chinesischen Pilzen', en: 'with Chinese mushrooms', nl: 'met Chinese paddenstoelen' },
  'avec sauce korea': { de: 'in koreanischer Sauce', en: 'in Korean sauce', nl: 'in Koreaanse saus' },
  'aux curry rouge thäi': { de: 'in rotem Thai-Curry', en: 'in red Thai curry', nl: 'in rode Thaise curry' },
  'poulet curry rouge thäi': { de: 'Hähnchen in rotem Thai-Curry', en: 'Chicken in red Thai curry', nl: 'Kip in rode Thaise curry' },
  'bœuf curry rouge thäi': { de: 'Rind in rotem Thai-Curry', en: 'Beef in red Thai curry', nl: 'Rund in rode Thaise curry' },
  'scampis curry rouge thäi': { de: 'Scampi in rotem Thai-Curry', en: 'Prawns in red Thai curry', nl: 'Scampi in rode Thaise curry' },
  'canard curry rouge thäi': { de: 'Ente in rotem Thai-Curry', en: 'Duck in red Thai curry', nl: 'Eend in rode Thaise curry' },
  'tofu curry rouge thäi': { de: 'Tofu in rotem Thai-Curry', en: 'Tofu in red Thai curry', nl: 'Tofu in rode Thaise curry' },
  'poulet curry': { de: 'Hähnchen-Curry', en: 'Chicken curry', nl: 'Kipcurry' },
  'bœuf curry': { de: 'Rind-Curry', en: 'Beef curry', nl: 'Rundcurry' },
  'scampis curry': { de: 'Scampi-Curry', en: 'Prawn curry', nl: 'Scampicurry' },
  'sur plat chauffant': { de: 'auf heisser Platte', en: 'on a sizzling plate', nl: 'op een hete plaat' },
  'à la sauce aigre-douce piquant': { de: 'in scharfer süss-saurer Sauce', en: 'in spicy sweet & sour sauce', nl: 'in pittige zoetzure saus' },
  'à la sauce aigre-douce': { de: 'in süss-saurer Sauce', en: 'in sweet & sour sauce', nl: 'in zoetzure saus' },
  'avec sauce aigre-douce': { de: 'in süss-saurer Sauce', en: 'in sweet & sour sauce', nl: 'in zoetzure saus' },
  'sauce aigre-douce': { de: 'süss-saure Sauce', en: 'sweet & sour sauce', nl: 'zoetzure saus' },
  'à la sauce cacahuète': { de: 'in Erdnusssauce', en: 'in peanut sauce', nl: 'in pindasaus' },
  'a la sauce cacahuète': { de: 'in Erdnusssauce', en: 'in peanut sauce', nl: 'in pindasaus' },
  'à la sauce l’orange': { de: 'in Orangensauce', en: 'in orange sauce', nl: 'in sinaasappelsaus' },
  'sauce coréenne': { de: 'koreanische Sauce', en: 'Korean sauce', nl: 'Koreaanse saus' },
  'sauce korea': { de: 'koreanische Sauce', en: 'Korean sauce', nl: 'Koreaanse saus' },
  'à l’ail et au poivre': { de: 'mit Knoblauch und Pfeffer', en: 'with garlic and pepper', nl: 'met knoflook en peper' },
  'à l’ail et poivre': { de: 'mit Knoblauch und Pfeffer', en: 'with garlic and pepper', nl: 'met knoflook en peper' },
  'l’ail et poivre': { de: 'mit Knoblauch und Pfeffer', en: 'with garlic and pepper', nl: 'met knoflook en peper' },
  'à l’ail': { de: 'mit Knoblauch', en: 'with garlic', nl: 'met knoflook' },
  'épicé du sichuan': { de: 'scharf nach Sichuan-Art', en: 'Sichuan style, spicy', nl: 'pittig op Sichuan-wijze' },
  'à la cantonaise': { de: 'nach kantonesischer Art', en: 'Cantonese style', nl: 'op Kantonese wijze' },
  'curry rouge thäi': { de: 'in rotem Thai-Curry', en: 'in red Thai curry', nl: 'in rode Thaise curry' },
  'basilic thäi': { de: 'mit Thai-Basilikum', en: 'with Thai basil', nl: 'met Thaise basilicum' },
  'trois délices': { de: 'Drei Köstlichkeiten', en: 'Three delights', nl: 'Drie lekkernijen' },
  'impérial kung pao': { de: 'Kung Pao', en: 'Kung Pao', nl: 'Kung Pao' },
  'poivre noir': { de: 'schwarzer Pfeffer', en: 'black pepper', nl: 'zwarte peper' },
  'champignons chinois': { de: 'chinesische Pilze', en: 'Chinese mushrooms', nl: 'Chinese paddenstoelen' },
  'sauce champignon': { de: 'Pilzsauce', en: 'mushroom sauce', nl: 'paddenstoelensaus' },
  'anguille fumée': { de: 'Räucheraal', en: 'Smoked eel', nl: 'Gerookte paling' },
  'mi-cuit': { de: 'angebraten', en: 'seared', nl: 'aangebraden' },

  /* --- Vorspeisen und Beilagen ------------------------------------- */
  'croquette printemps': { de: 'Frühlingsrollen', en: 'Spring rolls', nl: 'Loempia’s' },
  'minis croquette': { de: 'Mini-Kroketten', en: 'Mini croquettes', nl: 'Mini-kroketten' },
  'assortiment d’entrée': { de: 'Vorspeisenplatte', en: 'Starter selection', nl: 'Voorgerechtenschotel' },
  'assortiment de vapeur': { de: 'Dim-Sum-Auswahl', en: 'Steamed selection', nl: 'Gestoomde selectie' },
  'cuisses de grenouilles': { de: 'Froschschenkel', en: 'Frog legs', nl: 'Kikkerbilletjes' },
  'cuisse de grenouilles': { de: 'Froschschenkel', en: 'Frog legs', nl: 'Kikkerbilletjes' },
  'brochettes de poulet': { de: 'Hähnchenspiesse', en: 'Chicken skewers', nl: 'Kipspiesjes' },
  'brochettes de scampis': { de: 'Scampi-Spiesse', en: 'Prawn skewers', nl: 'Scampispiesjes' },
  'beignet de poulet': { de: 'Hähnchen im Teigmantel', en: 'Battered chicken', nl: 'Kip in beslag' },
  'filet de dorade': { de: 'Doradenfilet', en: 'Sea bream fillet', nl: 'Doradefilet' },
  'nems au porc': { de: 'Frühlingsrollen mit Schweinefleisch', en: 'Pork spring rolls', nl: 'Loempia’s met varkensvlees' },
  'raviolis aux crevette': { de: 'Teigtaschen mit Garnelen', en: 'Prawn dumplings', nl: 'Dumplings met garnalen' },
  'soupe raviolis chinois': { de: 'Suppe mit chinesischen Teigtaschen', en: 'Chinese dumpling soup', nl: 'Chinese dumplingsoep' },
  'soupe thaïlandaise': { de: 'Thailändische Suppe', en: 'Thai soup', nl: 'Thaise soep' },
  'soupe pékinois': { de: 'Peking-Suppe', en: 'Peking soup', nl: 'Pekingsoep' },
  'soupe poulet': { de: 'Hähnchensuppe', en: 'Chicken soup', nl: 'Kippensoep' },
  'soupe mais et crabe': { de: 'Mais-Krabben-Suppe', en: 'Sweetcorn and crab soup', nl: 'Maïs-krabsoep' },
  'soupe miso': { de: 'Misosuppe', en: 'Miso soup', nl: 'Misosoep' },
  'salade de crevette': { de: 'Garnelensalat', en: 'Prawn salad', nl: 'Garnalensalade' },
  'salade de poulet': { de: 'Hähnchensalat', en: 'Chicken salad', nl: 'Kipsalade' },
  'salade de crabe': { de: 'Krabbensalat', en: 'Crab salad', nl: 'Krabsalade' },
  'salade de soja': { de: 'Sojasprossensalat', en: 'Soy bean salad', nl: 'Sojasalade' },
  'salade wakamé': { de: 'Wakame-Salat', en: 'Wakame salad', nl: 'Wakamesalade' },
  'marmite tofu et légumes': { de: 'Tofu-Gemüse-Topf', en: 'Tofu and vegetable pot', nl: 'Tofu-groentepot' },
  'gyoza chinois': { de: 'Chinesische Gyoza', en: 'Chinese gyoza', nl: 'Chinese gyoza' },
  'gyoza japonais': { de: 'Japanische Gyoza', en: 'Japanese gyoza', nl: 'Japanse gyoza' },

  /* --- Menü und Getränke -------------------------------------------- */
  'menu plats chaud midi': { de: 'Mittagsmenü warme Küche', en: 'Lunch menu, hot dishes', nl: 'Lunchmenu warme gerechten' },
  'menu sushi midi': { de: 'Mittagsmenü Sushi', en: 'Lunch menu, sushi', nl: 'Lunchmenu sushi' },
  'fondu fuku': { de: 'Fuku-Fondue', en: 'Fuku fondue', nl: 'Fuku-fondue' },
  'bière chinoise': { de: 'Chinesisches Bier', en: 'Chinese beer', nl: 'Chinees bier' },
  'bière japonaise': { de: 'Japanisches Bier', en: 'Japanese beer', nl: 'Japans bier' },

  /* --- Bindewörter --------------------------------------------------- */
  aux: { de: 'mit', en: 'with', nl: 'met' },
  au: { de: 'mit', en: 'with', nl: 'met' },
  avec: { de: 'mit', en: 'with', nl: 'met' },
  et: { de: 'und', en: 'and', nl: 'en' },
  'à la': { de: 'mit', en: 'with', nl: 'met' },
  'a la': { de: 'mit', en: 'with', nl: 'met' },
  de: { de: 'mit', en: 'with', nl: 'met' },

  /* --- Zutaten ------------------------------------------------------- */
  poulet: { de: 'Hähnchen', en: 'chicken', nl: 'kip' },
  bœuf: { de: 'Rind', en: 'beef', nl: 'rund' },
  canard: { de: 'Ente', en: 'duck', nl: 'eend' },
  porc: { de: 'Schweinefleisch', en: 'pork', nl: 'varkensvlees' },
  scampis: { de: 'Scampi', en: 'prawns', nl: 'scampi' },
  gambas: { de: 'Gambas', en: 'king prawns', nl: 'gamba’s' },
  crevettes: { de: 'Garnelen', en: 'prawns', nl: 'garnalen' },
  crevette: { de: 'Garnele', en: 'prawn', nl: 'garnaal' },
  crabe: { de: 'Krabbe', en: 'crab', nl: 'krab' },
  saumon: { de: 'Lachs', en: 'salmon', nl: 'zalm' },
  thon: { de: 'Thunfisch', en: 'tuna', nl: 'tonijn' },
  tuna: { de: 'Thunfisch', en: 'tuna', nl: 'tonijn' },
  anguille: { de: 'Aal', en: 'eel', nl: 'paling' },
  dorade: { de: 'Dorade', en: 'sea bream', nl: 'dorade' },
  calamars: { de: 'Tintenfisch', en: 'squid', nl: 'inktvis' },
  entrecote: { de: 'Entrecôte', en: 'Entrecôte', nl: 'Entrecote' },
  surimi: { de: 'Surimi', en: 'surimi', nl: 'surimi' },
  omelette: { de: 'Omelett', en: 'omelette', nl: 'omelet' },
  oeuf: { de: 'Ei', en: 'egg', nl: 'ei' },
  tofu: { de: 'Tofu', en: 'tofu', nl: 'tofu' },
  légumes: { de: 'Gemüse', en: 'vegetables', nl: 'groenten' },
  avocat: { de: 'Avocado', en: 'avocado', nl: 'avocado' },
  concombre: { de: 'Gurke', en: 'cucumber', nl: 'komkommer' },
  mangue: { de: 'Mango', en: 'mango', nl: 'mango' },
  ananas: { de: 'Ananas', en: 'pineapple', nl: 'ananas' },
  fraise: { de: 'Erdbeere', en: 'strawberry', nl: 'aardbei' },
  banane: { de: 'Banane', en: 'banana', nl: 'banaan' },
  pommes: { de: 'Apfel', en: 'apple', nl: 'appel' },
  oignons: { de: 'Zwiebeln', en: 'onions', nl: 'uien' },
  champignons: { de: 'Pilze', en: 'mushrooms', nl: 'paddenstoelen' },
  aubergines: { de: 'Auberginen', en: 'aubergines', nl: 'aubergines' },
  soja: { de: 'Soja', en: 'soy', nl: 'soja' },
  wakamé: { de: 'Wakame', en: 'Wakame', nl: 'Wakame' },
  cheese: { de: 'Frischkäse', en: 'cream cheese', nl: 'roomkaas' },
  fromage: { de: 'Frischkäse', en: 'cream cheese', nl: 'roomkaas' },
  cacahuète: { de: 'Erdnuss', en: 'Peanut', nl: 'Pinda' },
  riz: { de: 'Reis', en: 'rice', nl: 'rijst' },
  nouilles: { de: 'Nudeln', en: 'noodles', nl: 'noedels' },
  vermicelles: { de: 'Glasnudeln', en: 'vermicelli', nl: 'vermicelli' },
  vermicelle: { de: 'Glasnudeln', en: 'vermicelli', nl: 'vermicelli' },
  raviolis: { de: 'Teigtaschen', en: 'dumplings', nl: 'dumplings' },
  croquette: { de: 'Krokette', en: 'croquette', nl: 'kroket' },
  samosas: { de: 'Samosas', en: 'Samosas', nl: 'Samosa’s' },
  brochettes: { de: 'Spiesse', en: 'skewers', nl: 'spiesjes' },
  filet: { de: 'Filet', en: 'fillet', nl: 'filet' },
  marmite: { de: 'Topf', en: 'hot pot', nl: 'pot' },
  assortiment: { de: 'Auswahl', en: 'selection', nl: 'selectie' },
  soupe: { de: 'Suppe', en: 'soup', nl: 'soep' },
  salade: { de: 'Salat', en: 'salad', nl: 'salade' },
  plateau: { de: 'Platte', en: 'platter', nl: 'schotel' },
  pièces: { de: 'Stück', en: 'pieces', nl: 'stuks' },
  bière: { de: 'Bier', en: 'beer', nl: 'bier' },
  ail: { de: 'Knoblauch', en: 'garlic', nl: 'knoflook' },
  poivre: { de: 'Pfeffer', en: 'pepper', nl: 'peper' },
  sauce: { de: 'Sauce', en: 'sauce', nl: 'saus' },
  curry: { de: 'Curry', en: 'curry', nl: 'curry' },
  basilic: { de: 'Basilikum', en: 'basil', nl: 'basilicum' },
  mais: { de: 'Mais', en: 'sweetcorn', nl: 'maïs' },

  /* --- Eigenschaften -------------------------------------------------- */
  végétarien: { de: 'Vegetarisch', en: 'Vegetarian', nl: 'Vegetarisch' },
  vége: { de: 'Vegetarisch', en: 'Vegetarian', nl: 'Vegetarisch' },
  caramélisées: { de: 'karamellisiert', en: 'caramelised', nl: 'gekarameliseerd' },
  caramélisé: { de: 'karamellisiert', en: 'caramelised', nl: 'gekarameliseerd' },
  piquant: { de: 'scharf', en: 'spicy', nl: 'pittig' },
  spicy: { de: 'scharf', en: 'spicy', nl: 'pittig' },
  épicé: { de: 'scharf', en: 'spicy', nl: 'pittig' },
  fumée: { de: 'geräuchert', en: 'smoked', nl: 'gerookt' },
  frits: { de: 'frittiert', en: 'fried', nl: 'gefrituurd' },
  grille: { de: 'gegrillt', en: 'grilled', nl: 'gegrild' },
  cuit: { de: 'gegart', en: 'cooked', nl: 'gegaard' },
  sautées: { de: 'gebraten', en: 'fried', nl: 'gebakken' },
  sauté: { de: 'gebraten', en: 'fried', nl: 'gebakken' },
  vapeur: { de: 'gedämpft', en: 'steamed', nl: 'gestoomd' },
  chinois: { de: 'chinesisch', en: 'Chinese', nl: 'Chinees' },
  chinoise: { de: 'chinesisch', en: 'Chinese', nl: 'Chinees' },
  japonais: { de: 'japanisch', en: 'Japanese', nl: 'Japans' },
  japonaise: { de: 'japanisch', en: 'Japanese', nl: 'Japans' },
  pékinois: { de: 'Peking-Art', en: 'Peking style', nl: 'Pekingstijl' },
  spécial: { de: 'Spezial', en: 'Special', nl: 'Speciaal' },
  rouge: { de: 'rot', en: 'red', nl: 'rood' },
  noir: { de: 'schwarz', en: 'black', nl: 'zwart' },
  minis: { de: 'Mini', en: 'Mini', nl: 'Mini' },
  printemps: { de: 'Frühling', en: 'Spring', nl: 'Lente' },
  midi: { de: 'Mittag', en: 'Lunch', nl: 'Lunch' },
  menu: { de: 'Menü', en: 'Menu', nl: 'Menu' },
};

/**
 * Begriffe, die in allen Sprachen gleich heissen.
 * Sie werden übersprungen und unverändert übernommen.
 */
const KEEP = new Set([
  'sushi', 'nigiri', 'sashimi', 'tataki', 'tartare', 'chirashi', 'maki', 'uramaki', 'temaki',
  'california', 'spring', 'soya', 'big', 'hot', 'special', 'rolls', 'roll', 'rollen',
  'gyoza', 'yakitori', 'edamame', 'tempura', 'udon', 'miso', 'wasabi', 'xiao', 'long', 'bao',
  'shao', 'mai', 'tamago', 'rainbow', 'king', 'queen', 'kadif', 'kung', 'pao', 'mix',
  'coca-cola', 'fanta', 'sprite', 'spezi', 'qingdao', 'asahi', 'fuku', 'classic', 'zero',
  'thäi', 'sichuan', 'korea', 'impérial', 'fondu', 'entrée',
]);

/**
 * Namen, die eine Wendungsübersetzung zwar korrekt, aber holprig
 * wiedergibt. Hier steht die bessere Formulierung.
 */
const OVERRIDES = {
  'Filet de dorade caramélisé': {
    de: 'Karamellisiertes Doradenfilet',
    en: 'Caramelised sea bream fillet',
    nl: 'Gekarameliseerde doradefilet',
  },
  'Filet de dorade à l’ail et au poivre': {
    de: 'Doradenfilet mit Knoblauch und Pfeffer',
    en: 'Sea bream fillet with garlic and pepper',
    nl: 'Doradefilet met knoflook en peper',
  },
  'Beignet de poulet à la sauce aigre-douce': {
    de: 'Hähnchen im Teigmantel, süss-sauer',
    en: 'Battered chicken in sweet & sour sauce',
    nl: 'Kip in beslag, zoetzuur',
  },
  'Entrecote grille avec sauce champignon sur plat chauffant avec oeuf': {
    de: 'Gegrilltes Entrecôte mit Pilzsauce und Ei, auf heisser Platte',
    en: 'Grilled entrecôte with mushroom sauce and egg, on a sizzling plate',
    nl: 'Gegrilde entrecote met paddenstoelensaus en ei, op een hete plaat',
  },
  'Gambas à l’ail aux vermicelles': {
    de: 'Gambas mit Knoblauch auf Glasnudeln',
    en: 'King prawns with garlic on vermicelli',
    nl: 'Gamba’s met knoflook op vermicelli',
  },
  'Aubergines caramélisées, sauce aigre-douce': {
    de: 'Karamellisierte Auberginen in süss-saurer Sauce',
    en: 'Caramelised aubergines in sweet & sour sauce',
    nl: 'Gekarameliseerde aubergines in zoetzure saus',
  },
  'Poulet impérial Kung Pao': {
    de: 'Hähnchen Kung Pao',
    en: 'Kung Pao chicken',
    nl: 'Kung Pao kip',
  },
  'Bœuf aux poivre noir': {
    de: 'Rind mit schwarzem Pfeffer',
    en: 'Beef with black pepper',
    nl: 'Rund met zwarte peper',
  },
  'Thon cuit avec pommes': {
    de: 'Gegarter Thunfisch mit Apfel',
    en: 'Cooked tuna with apple',
    nl: 'Gegaarde tonijn met appel',
  },
  'Canard pékinois': { de: 'Peking-Ente', en: 'Peking duck', nl: 'Pekingeend' },
  'Special Rolls Mi-Cuit roll': { de: 'Special Rolls Mi-Cuit', en: 'Special Rolls Mi-Cuit', nl: 'Special Rolls Mi-Cuit' },
  'Special Rolls spicy tuna roll': {
    de: 'Special Rolls Spicy Tuna',
    en: 'Special Rolls Spicy Tuna',
    nl: 'Special Rolls Spicy Tuna',
  },
  'Special Rolls Vége King roll': {
    de: 'Special Rolls Vege King',
    en: 'Special Rolls Vege King',
    nl: 'Special Rolls Vege King',
  },
  'Special Rolls Bœuf kadif roll': {
    de: 'Special Rolls Rind Kadif',
    en: 'Special Rolls Beef Kadif',
    nl: 'Special Rolls Rund Kadif',
  },
  'Curry samosas': { de: 'Curry-Samosas', en: 'Curry samosas', nl: 'Currysamosa’s' },
  'Poulet caramélisé': { de: 'Karamellisiertes Hähnchen', en: 'Caramelised chicken', nl: 'Gekarameliseerde kip' },
  'Poulet caramélisé, sauce aigre-douce': {
    de: 'Karamellisiertes Hähnchen, süss-sauer',
    en: 'Caramelised chicken, sweet & sour',
    nl: 'Gekarameliseerde kip, zoetzuur',
  },
  'Bœuf caramélisé avec sauce aigre-douce': {
    de: 'Karamellisiertes Rind in süss-saurer Sauce',
    en: 'Caramelised beef in sweet & sour sauce',
    nl: 'Gekarameliseerd rund in zoetzure saus',
  },
  'Udon sauté aux légumes avec sauce korea': {
    de: 'Gebratene Udon mit Gemüse in koreanischer Sauce',
    en: 'Fried udon with vegetables in Korean sauce',
    nl: 'Gebakken udon met groenten in Koreaanse saus',
  },
  'Vermicelle sauté aux légumes, sauce coréenne': {
    de: 'Gebratene Glasnudeln mit Gemüse in koreanischer Sauce',
    en: 'Fried vermicelli with vegetables in Korean sauce',
    nl: 'Gebakken vermicelli met groenten in Koreaanse saus',
  },
  'Poulet, sauce coréenne': {
    de: 'Hähnchen in koreanischer Sauce',
    en: 'Chicken in Korean sauce',
    nl: 'Kip in Koreaanse saus',
  },
  'Udon sautées Canard': { de: 'Gebratene Udon mit Ente', en: 'Fried udon with duck', nl: 'Gebakken udon met eend' },
  'Vermicelle sautées Canard': {
    de: 'Gebratene Glasnudeln mit Ente',
    en: 'Fried vermicelli with duck',
    nl: 'Gebakken vermicelli met eend',
  },
  'Scampis frits': { de: 'Frittierte Scampi', en: 'Fried prawns', nl: 'Gefrituurde scampi' },
  'Légumes sauté': { de: 'Gebratenes Gemüse', en: 'Fried vegetables', nl: 'Gebakken groenten' },
};

/* Wendungen nach Länge sortiert – die längste Übereinstimmung gewinnt. */
const SORTED = Object.keys(PHRASES).sort((a, b) => b.length - a.length);

const LANGS = ['de', 'en', 'nl'];

/** Sammelt Wörter, die das Wörterbuch nicht kennt (für die Meldung im Sync). */
export const unknown = new Set();

/**
 * Übersetzt einen Gerichtnamen in alle Zielsprachen.
 *
 * @param {string} name Französischer Name, bereits bereinigt
 * @returns {{de: string, en: string, nl: string}}
 */
export function translateDish(name) {
  const direct = OVERRIDES[name];
  if (direct) return { ...direct };

  // Mengenangaben wie „5p“ oder „12p“ hängen wir unverändert wieder an.
  const portion = name.match(/\s(\d+\s?p)$/i);
  const core = portion ? name.slice(0, -portion[0].length) : name;

  // Überschreibungen sind ohne Mengenangabe notiert („Scampis frits“).
  const byCore = OVERRIDES[core];
  if (byCore) {
    const suffix = portion ? ` ${portion[1]}` : '';
    return Object.fromEntries(LANGS.map((l) => [l, byCore[l] + suffix]));
  }

  const out = {};
  for (const lang of LANGS) {
    out[lang] = translateTo(core, lang) + (portion ? ` ${portion[1]}` : '');
  }
  return out;
}

/** Greedy: an jeder Stelle die längste bekannte Wendung ersetzen. */
function translateTo(text, lang) {
  const words = text.split(/\s+/).filter(Boolean);
  const parts = [];
  let i = 0;

  while (i < words.length) {
    let hit = null;

    for (const phrase of SORTED) {
      const len = phrase.split(' ').length;
      if (i + len > words.length) continue;
      const candidate = words.slice(i, i + len).join(' ').toLowerCase().replace(/[,]$/, '');
      if (candidate === phrase) {
        hit = { phrase, len };
        break;
      }
    }

    if (hit) {
      const comma = words[i + hit.len - 1].endsWith(',') ? ',' : '';
      parts.push(PHRASES[hit.phrase][lang] + comma);
      i += hit.len;
      continue;
    }

    const word = words[i];
    const bare = word.toLowerCase().replace(/[,·]$/, '');
    if (!KEEP.has(bare) && /[a-zà-ÿœ]/i.test(bare) && !/^\d/.test(bare)) unknown.add(bare);
    parts.push(word);
    i += 1;
  }

  let out = parts.join(' ');

  // „Special Rolls Mango roll“ – das angehängte roll ist überflüssig.
  if (/rolls/i.test(out)) out = out.replace(/\sroll$/i, '');

  // Im Deutschen und Niederländischen sind Substantive gross.
  if (lang !== 'en') out = out.replace(/\broll(s?)\b/g, (m, s2) => `Roll${s2}`);

  return tidy(out);
}

/** Räumt doppelte Leerzeichen, Grossschreibung und Kommas auf. */
function tidy(s) {
  const out = s
    .replace(/\s+/g, ' ')
    .replace(/\s+,/g, ',')
    .replace(/\s+·\s+/g, ' · ')
    .trim();
  return out.charAt(0).toUpperCase() + out.slice(1);
}
