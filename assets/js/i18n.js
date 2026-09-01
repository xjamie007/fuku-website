/* ==================================================================
   Mehrsprachigkeit – Deutsch, Französisch, Englisch, Niederländisch
   ------------------------------------------------------------------
   Verwendung im HTML:
     <span data-i18n="nav.order"></span>            → textContent
     <h1  data-i18n-html="hero.title"></h1>         → innerHTML (erlaubt <em>)
     <input data-i18n-attr="placeholder:order.searchPlaceholder">
   Gerichtnamen bleiben bewusst französisch – so stehen sie auf der
   Karte, im Restaurant und auf der Rechnung.
   ================================================================== */

const FALLBACK = 'de';
const SUPPORTED = ['de', 'fr', 'en', 'nl'];

export const LANGUAGES = [
  { code: 'de', label: 'Deutsch', native: 'Deutsch' },
  { code: 'fr', label: 'Français', native: 'Français' },
  { code: 'en', label: 'English', native: 'English' },
  { code: 'nl', label: 'Nederlands', native: 'Nederlands' },
];

const DICT = {
  de: {
    'meta.title.home': 'Restaurant Fuku · Sushi, Wok & Thai in Vianden',
    'meta.title.order': 'Bestellen · Restaurant Fuku Vianden',
    'meta.title.contact': 'Kontakt & Anfahrt · Restaurant Fuku Vianden',
    'meta.desc.home':
      'Sushi, chinesische Wok-Klassiker und thailändische Currys in Vianden. Über 220 Gerichte – online bestellen, abholen oder bei uns essen.',
    'meta.desc.order': 'Die komplette Speisekarte des Restaurant Fuku in Vianden – bequem online bestellen.',
    'meta.desc.contact': 'Adresse, Öffnungszeiten und Anfahrt zum Restaurant Fuku, 9 Rue de la Gare, L-9420 Vianden.',

    'nav.home': 'Startseite',
    'nav.order': 'Karte & Bestellen',
    'nav.contact': 'Kontakt',
    'nav.menuShort': 'Karte',
    'nav.open': 'Menü öffnen',
    'nav.close': 'Menü schliessen',
    'nav.language': 'Sprache',
    'nav.chooseLanguage': 'Sprache wählen',
    'nav.cart': 'Warenkorb',
    'nav.skip': 'Zum Inhalt springen',

    'status.open': 'Jetzt geöffnet',
    'status.closed': 'Aktuell geschlossen',
    'status.opensAt': 'Öffnet {time}',
    'status.opensDay': 'Öffnet {day} {time}',
    'status.closesAt': 'bis {time}',
    'status.today': 'Heute',

    'hero.badge': 'Vianden · Luxemburg',
    'hero.title': 
      'Frisch gerollt, scharf gewokt — <em>mitten in Vianden</em>',
    'hero.text':
      
      'Sushi, chinesische Wok-Gerichte und thailändische Currys. Alles wird zubereitet, wenn Sie bestellen — zum Abholen oder bei uns am Tisch.',
    'hero.cta': 'Jetzt bestellen',
    'hero.cta2': 'Karte ansehen',
    'hero.fact1': 'Öffnungszeiten heute',
    'hero.fact2': 'Wo wir sind',
    'hero.fact3': 'Auf der Karte',
    'hero.dishes': '{n} Gerichte',
    'hero.chipLabel': 'Empfehlung des Hauses',

    'home.popular.eyebrow': 'Beliebt',
    'home.popular.title': 
      'Womit die meisten anfangen',
    'home.popular.text': 
      'Vier von 222. Den Rest finden Sie auf der Karte.',
    'home.popular.all': 'Alle Gerichte ansehen',

    'home.cats.eyebrow': 'Die Karte',
    'home.cats.title': 
      'Wo möchten Sie anfangen?',
    'home.cats.text': 
      'Vom Sashimi bis zum scharfen Curry — springen Sie direkt in die Rubrik, die Sie suchen.',
    'home.cats.count': '{n} Gerichte',
    'cat.sushi': 'Sushi',
    'cat.boissons': 'Getränke',
    'cat.chauds': 'Wok & Chinesisch',
    'cat.thai': 'Thai',
    'cat.entrees': 'Vorspeisen',
    'cat.riz': 'Reis & Nudeln',
    'cat.soupes': 'Suppen & Salate',

    'home.story.eyebrow': 
      'Über uns',
    'home.story.title': 
      'Warum unsere Karte so lang ist',
    'home.story.text':
      
      'Sushi aus Japan, Wok-Gerichte aus China, Currys aus Thailand: Das sind drei Küchen unter einem Dach — und der Grund für 222 Gerichte. Jedes davon kochen wir frisch, wenn Sie bestellen. Manchmal dauert es deshalb ein paar Minuten länger. Wir finden, es lohnt sich.',
    'home.story.stat1': 'Gerichte auf der Karte',
    'home.story.stat2': 'Küchen unter einem Dach',
    'home.story.stat3': 'Empfohlen von Restaurant Guru',

    'home.info.eyebrow': 'Gut zu wissen',
    'home.info.title': 'Öffnungszeiten & Anfahrt',
    'home.info.hours': 'Öffnungszeiten',
    'home.info.hoursNote': 'Montags Ruhetag.',
    'home.info.address': 'Adresse',
    'home.info.addressNote': 'Im Zentrum von Vianden, wenige Schritte von der Our.',
    'home.info.route': 'Route planen',
    'home.info.contact': 'Kontakt',
    'home.info.contactNote': 
      'Fragen zu einem Gericht, zu Allergien oder zu Ihrer Bestellung? Schreiben Sie uns einfach.',
    'home.info.write': 'E-Mail schreiben',

    'home.cta.title': 
      'Hunger?',
    'home.cta.text': 
      '222 Gerichte, ein Warenkorb. Lassen Sie sich Zeit.',
    'home.cta.primary': 'Zur Bestellung',
    'home.cta.secondary': 'Kontakt aufnehmen',

    'order.eyebrow': 'Speisekarte',
    'order.title': 
      'Worauf haben Sie Lust?',
    'order.text':
      
      'Alle {n} Gerichte auf einer Seite. Suchen, filtern, antippen — fertig.',
    'order.searchPlaceholder': 'Gericht, Nummer oder Zutat suchen …',
    'order.searchClear': 'Suche zurücksetzen',
    'order.categories': 'Kategorien',
    'order.filterAll': 'Alle',
    'order.filterPopular': 'Beliebt',
    'order.filterVeg': 'Vegetarisch',
    'order.filterSpicy': 'Scharf',
    'order.results': '{n} Treffer',
    'order.noResults': 'Nichts gefunden',
    'order.noResultsText': 'Versuchen Sie es mit einem anderen Suchbegriff oder setzen Sie die Filter zurück.',
    'order.reset': 'Filter zurücksetzen',
    'order.add': 'Hinzufügen',
    'order.addTo': '{name} hinzufügen',
    'order.remove': 'Entfernen',
    'order.details': 'Details anzeigen',
    'order.added': '{name} hinzugefügt',
    'order.dishCount': '{n} Gerichte',
    'order.choose': 'Wählen',
    'order.notOrderable': 'Nur im Restaurant',
    'order.variants': 'Auswahl',
    'order.notOrderableHint': 'Dieses Menü stellen wir gern direkt im Restaurant für Sie zusammen.',

    'meta.title.reserve':
      'Tisch reservieren · Restaurant Fuku Vianden',
    'meta.desc.reserve':
      'Reservieren Sie online einen Tisch im Restaurant Fuku in Vianden – Datum, Uhrzeit und Personenzahl in einem Schritt.',
    'nav.reserve':
      'Reservieren',
    'reserve.eyebrow':
      'Reservierung',
    'reserve.title':
      'Einen Tisch reservieren',
    'reserve.text':
      'Sagen Sie uns Datum, Uhrzeit und Personenzahl – wir bestätigen Ihre Reservierung kurzfristig per E-Mail.',
    'reserve.when':
      'Wann möchten Sie kommen?',
    'reserve.who':
      'Wie erreichen wir Sie?',
    'reserve.date':
      'Datum',
    'reserve.time':
      'Uhrzeit',
    'reserve.guests':
      'Personen',
    'reserve.name':
      'Name',
    'reserve.email':
      'E-Mail',
    'reserve.phone':
      'Telefon',
    'reserve.notes':
      'Anmerkung',
    'reserve.notesHint':
      'Allergien, Kinderstuhl, besonderer Anlass – gern hier notieren.',
    'reserve.notesPlaceholder':
      'Optional',
    'reserve.lunch':
      'Mittag',
    'reserve.dinner':
      'Abend',
    'reserve.pickTime':
      'Bitte wählen',
    'reserve.person':
      '{n} Person',
    'reserve.persons':
      '{n} Personen',
    'reserve.moreGuests':
      'Mehr als {n}',
    'reserve.moreGuestsHint':
      'Für grössere Gruppen schreiben Sie uns bitte direkt – wir finden eine Lösung.',
    'reserve.noSlots':
      'An diesem Tag sind keine Zeiten mehr frei. Bitte wählen Sie einen anderen Tag.',
    'reserve.submit':
      'Reservierung anfragen',
    'reserve.submitting':
      'Wird gesendet …',
    'reserve.required':
      'Pflichtfeld',
    'reserve.summary':
      'Ihre Anfrage',
    'reserve.legal':
      'Ihre Angaben verwenden wir ausschliesslich für diese Reservierung.',
    'reserve.successTitle':
      'Anfrage ist bei uns eingegangen',
    'reserve.successText':
      'Wir haben Ihnen eine Eingangsbestätigung geschickt. Den Tisch bestätigen wir kurzfristig persönlich – das ist noch keine feste Zusage.',
    'reserve.successRef':
      'Referenz',
    'reserve.again':
      'Weitere Reservierung',
    'reserve.errorTitle':
      'Das hat nicht geklappt',
    'reserve.errorGeneric':
      'Die Anfrage konnte nicht übermittelt werden. Bitte versuchen Sie es erneut.',
    'reserve.errorFields':
      'Bitte prüfen Sie die markierten Felder.',
    'reserve.errorClosed':
      'Zu dieser Zeit haben wir geschlossen. Bitte wählen Sie eine andere Uhrzeit.',
    'reserve.errorTooSoon':
      'Bitte reservieren Sie mindestens eine Stunde im Voraus. Kurzfristig erreichen Sie uns am besten per E-Mail.',
    'reserve.errorRate':
      'Es wurden zu viele Anfragen gesendet. Bitte versuchen Sie es später erneut.',
    'reserve.errorEmail':
      'Bitte geben Sie eine gültige E-Mail-Adresse an.',
    'reserve.errorPhone':
      'Bitte geben Sie eine Telefonnummer an, unter der wir Sie erreichen.',
    'reserve.fallback':
      'Stattdessen per E-Mail senden',
    'reserve.ctaHome':
      'Tisch reservieren',

    'cart.title': 'Ihre Bestellung',
    'cart.empty': 'Noch nichts ausgewählt',
    'cart.emptyText': 'Tippen Sie bei einem Gericht auf das Plus – es landet direkt hier.',
    'cart.clear': 'Leeren',
    'cart.clearConfirm': 'Warenkorb wirklich leeren?',
    'cart.subtotal': 'Zwischensumme',
    'cart.items': '{n} Artikel',
    'cart.total': 'Gesamt',
    'cart.checkout': 'Zur Kasse',
    'cart.checkoutBusy': 'Wird übertragen …',
    'cart.view': 'Bestellung ansehen',
    'cart.close': 'Schliessen',
    'cart.note': 'Lieferung, Abholzeit und Zahlung wählen Sie im nächsten Schritt.',
    'cart.error': 'Die Bestellung konnte nicht übertragen werden. Bitte erneut versuchen.',
    'cart.errorOffline': 'Keine Verbindung zum Bestellsystem. Bitte Internetverbindung prüfen.',

    'allergens.title': 'Allergene',
    'allergens.legend': 'Allergen-Legende',
    'allergens.note':
      'Die Nummern folgen der EU-Kennzeichnung. Bei Allergien sprechen Sie uns bitte vor der Bestellung an – wir beraten Sie gern.',
    'allergens.none': 'Keine Angabe',

    'contact.eyebrow': 'Kontakt',
    'contact.title': 'Besuchen Sie uns in Vianden',
    'contact.text': 
      'Kommen Sie vorbei oder holen Sie Ihre Bestellung ab. Wir freuen uns auf Sie.',
    'contact.mapOpen': 'In Google Maps öffnen',
    'contact.mapCredit': 'Kartendaten © OpenStreetMap-Mitwirkende',
    'contact.mapTitle': 
      'So finden Sie uns',
    'contact.mapNote': 
      'Mitten in Vianden, wenige Schritte von der Our. Tippen Sie auf die Karte, dann öffnet sich die Route.',
    'contact.mapLoad': 'Karte laden',
    'contact.openMaps': 'In Karten-App öffnen',
    'contact.phone': 'Telefon',
    'contact.email': 'E-Mail',
    'contact.social': 'Social Media',
    'contact.reserve': 'Reservierung',
    'contact.reserveText': 'Für Tischreservierungen schreiben Sie uns bitte eine E-Mail mit Datum, Uhrzeit und Personenzahl.',

    'legal.privacy1':
      'Diese Website lädt Schriften und Gestaltungsdateien ausschliesslich vom eigenen Server. Es werden keine Analyse- oder Werbedienste eingebunden und keine Cookies zu Werbezwecken gesetzt.',
    'legal.privacy2':
      'Ihre Warenkorbauswahl wird nur lokal in Ihrem Browser gespeichert. Erst beim Klick auf „Zur Kasse“ werden die gewählten Gerichte an unser Bestellsystem übertragen. Die Karte von OpenStreetMap wird erst geladen, wenn Sie sie ausdrücklich anfordern.',
    'legal.privacy3':
      'Für Bestellung und Zahlung gelten zusätzlich die Datenschutzhinweise unseres Shop-Systems.',

    'footer.tagline': 
      'Drei Küchen unter einem Dach — mitten in Vianden.',
    'footer.explore': 
      'Die Karte',
    'footer.visit': 
      'Schnell zu',
    'footer.legal': 'Rechtliches',
    'footer.imprint': 'Impressum',
    'footer.privacy': 'Datenschutz',
    'footer.terms': 'AGB',
    'footer.rights': 'Alle Rechte vorbehalten.',
    'footer.hours': 'Di – So · 10:30–14:30 & 17:30–23:00',

    'days.1': 'Montag',
    'days.2': 'Dienstag',
    'days.3': 'Mittwoch',
    'days.4': 'Donnerstag',
    'days.5': 'Freitag',
    'days.6': 'Samstag',
    'days.0': 'Sonntag',
    'days.closed': 'Geschlossen',
    'days.tueSun': 'Dienstag – Sonntag',
    'days.mon': 'Montag',
  },

  fr: {
    'meta.title.home': 'Restaurant Fuku · Sushi, wok & thaï à Vianden',
    'meta.title.order': 'Commander · Restaurant Fuku Vianden',
    'meta.title.contact': 'Contact & accès · Restaurant Fuku Vianden',
    'meta.desc.home':
      'Sushis, classiques chinois au wok et currys thaïlandais à Vianden. Plus de 220 plats – à commander en ligne, à emporter ou sur place.',
    'meta.desc.order': 'Toute la carte du Restaurant Fuku à Vianden – à commander en ligne en quelques clics.',
    'meta.desc.contact': 'Adresse, horaires et accès au Restaurant Fuku, 9 rue de la Gare, L-9420 Vianden.',

    'nav.home': 'Accueil',
    'nav.order': 'Carte & commande',
    'nav.contact': 'Contact',
    'nav.menuShort': 'Carte',
    'nav.open': 'Ouvrir le menu',
    'nav.close': 'Fermer le menu',
    'nav.language': 'Langue',
    'nav.chooseLanguage': 'Choisir la langue',
    'nav.cart': 'Panier',
    'nav.skip': 'Aller au contenu',

    'status.open': 'Ouvert maintenant',
    'status.closed': 'Actuellement fermé',
    'status.opensAt': 'Ouvre à {time}',
    'status.opensDay': 'Ouvre {day} à {time}',
    'status.closesAt': "jusqu'à {time}",
    'status.today': "Aujourd'hui",

    'hero.badge': 'Vianden · Luxembourg',
    'hero.title': 
      'Roulés à la main, saisis au wok — <em>en plein cœur de Vianden</em>',
    'hero.text':
      
      'Sushis, plats chinois au wok et currys thaïlandais. Tout est préparé au moment de la commande — à emporter ou à table chez nous.',
    'hero.cta': 'Commander',
    'hero.cta2': 'Voir la carte',
    'hero.fact1': "Horaires d'aujourd'hui",
    'hero.fact2': 'Où nous trouver',
    'hero.fact3': 'Sur la carte',
    'hero.dishes': '{n} plats',
    'hero.chipLabel': 'La suggestion du chef',

    'home.popular.eyebrow': 'Les favoris',
    'home.popular.title': 
      'Par où commencent la plupart',
    'home.popular.text': 
      'Quatre plats sur 222. Le reste vous attend sur la carte.',
    'home.popular.all': 'Voir tous les plats',

    'home.cats.eyebrow': 'La carte',
    'home.cats.title': 
      'Par où voulez-vous commencer ?',
    'home.cats.text': 
      'Du sashimi au curry relevé — allez directement à la rubrique qui vous intéresse.',
    'home.cats.count': '{n} plats',
    'cat.sushi': 'Sushi',
    'cat.boissons': 'Boissons',
    'cat.chauds': 'Wok & chinois',
    'cat.thai': 'Thaï',
    'cat.entrees': 'Entrées',
    'cat.riz': 'Riz & nouilles',
    'cat.soupes': 'Soupes & salades',

    'home.story.eyebrow': 
      'À propos',
    'home.story.title': 
      'Pourquoi notre carte est si longue',
    'home.story.text':
      
      'Des sushis du Japon, des plats au wok de Chine, des currys de Thaïlande : trois cuisines sous un même toit, et la raison de nos 222 plats. Chacun est préparé au moment de la commande. Cela prend parfois quelques minutes de plus. Nous trouvons que cela en vaut la peine.',
    'home.story.stat1': 'plats à la carte',
    'home.story.stat2': 'cuisines sous un même toit',
    'home.story.stat3': 'Recommandé par Restaurant Guru',

    'home.info.eyebrow': 'Bon à savoir',
    'home.info.title': 'Horaires & accès',
    'home.info.hours': "Heures d'ouverture",
    'home.info.hoursNote': 'Fermé le lundi.',
    'home.info.address': 'Adresse',
    'home.info.addressNote': "Au centre de Vianden, à quelques pas de l'Our.",
    'home.info.route': "Calculer l'itinéraire",
    'home.info.contact': 'Contact',
    'home.info.contactNote': 
      'Une question sur un plat, une allergie ou votre commande ? Écrivez-nous.',
    'home.info.write': 'Nous écrire',

    'home.cta.title': 
      'Un petit creux ?',
    'home.cta.text': 
      '222 plats, un seul panier. Prenez votre temps.',
    'home.cta.primary': 'Passer commande',
    'home.cta.secondary': 'Nous contacter',

    'order.eyebrow': 'La carte',
    'order.title': 
      'Que voulez-vous manger ?',
    'order.text':
      
      'Les {n} plats sur une seule page. Cherchez, filtrez, ajoutez — c’est tout.',
    'order.searchPlaceholder': 'Chercher un plat, un numéro, un ingrédient …',
    'order.searchClear': 'Effacer la recherche',
    'order.categories': 'Catégories',
    'order.filterAll': 'Tout',
    'order.filterPopular': 'Populaires',
    'order.filterVeg': 'Végétarien',
    'order.filterSpicy': 'Épicé',
    'order.results': '{n} résultats',
    'order.noResults': 'Aucun résultat',
    'order.noResultsText': 'Essayez un autre terme de recherche ou réinitialisez les filtres.',
    'order.reset': 'Réinitialiser les filtres',
    'order.add': 'Ajouter',
    'order.addTo': 'Ajouter {name}',
    'order.remove': 'Retirer',
    'order.details': 'Voir le détail',
    'order.added': '{name} ajouté',
    'order.dishCount': '{n} plats',
    'order.choose': 'Choisir',
    'order.notOrderable': 'Au restaurant',
    'order.variants': 'Votre choix',
    'order.notOrderableHint': 'Nous composons ce menu volontiers pour vous directement au restaurant.',

    'meta.title.reserve':
      'Réserver une table · Restaurant Fuku Vianden',
    'meta.desc.reserve':
      'Réservez une table en ligne au Restaurant Fuku à Vianden – date, heure et nombre de personnes en une étape.',
    'nav.reserve':
      'Réserver',
    'reserve.eyebrow':
      'Réservation',
    'reserve.title':
      'Réserver une table',
    'reserve.text':
      'Indiquez-nous la date, l’heure et le nombre de personnes – nous confirmons votre réservation par e-mail dans les meilleurs délais.',
    'reserve.when':
      'Quand souhaitez-vous venir ?',
    'reserve.who':
      'Comment vous joindre ?',
    'reserve.date':
      'Date',
    'reserve.time':
      'Heure',
    'reserve.guests':
      'Personnes',
    'reserve.name':
      'Nom',
    'reserve.email':
      'E-mail',
    'reserve.phone':
      'Téléphone',
    'reserve.notes':
      'Remarque',
    'reserve.notesHint':
      'Allergies, chaise haute, occasion particulière – précisez-le ici.',
    'reserve.notesPlaceholder':
      'Facultatif',
    'reserve.lunch':
      'Midi',
    'reserve.dinner':
      'Soir',
    'reserve.pickTime':
      'Choisir',
    'reserve.person':
      '{n} personne',
    'reserve.persons':
      '{n} personnes',
    'reserve.moreGuests':
      'Plus de {n}',
    'reserve.moreGuestsHint':
      'Pour les grands groupes, écrivez-nous directement – nous trouverons une solution.',
    'reserve.noSlots':
      'Plus aucun horaire disponible ce jour-là. Merci de choisir un autre jour.',
    'reserve.submit':
      'Demander la réservation',
    'reserve.submitting':
      'Envoi …',
    'reserve.required':
      'Champ obligatoire',
    'reserve.summary':
      'Votre demande',
    'reserve.legal':
      'Vos informations servent uniquement à cette réservation.',
    'reserve.successTitle':
      'Nous avons bien reçu votre demande',
    'reserve.successText':
      'Un accusé de réception vous a été envoyé. Nous confirmons la table personnellement sous peu – ce n’est pas encore une confirmation ferme.',
    'reserve.successRef':
      'Référence',
    'reserve.again':
      'Nouvelle réservation',
    'reserve.errorTitle':
      'Cela n’a pas fonctionné',
    'reserve.errorGeneric':
      'La demande n’a pas pu être transmise. Merci de réessayer.',
    'reserve.errorFields':
      'Merci de vérifier les champs signalés.',
    'reserve.errorClosed':
      'Nous sommes fermés à cette heure-là. Merci de choisir un autre horaire.',
    'reserve.errorTooSoon':
      'Merci de réserver au moins une heure à l’avance. Pour le dernier moment, écrivez-nous.',
    'reserve.errorRate':
      'Trop de demandes ont été envoyées. Merci de réessayer plus tard.',
    'reserve.errorEmail':
      'Merci d’indiquer une adresse e-mail valide.',
    'reserve.errorPhone':
      'Merci d’indiquer un numéro où nous pouvons vous joindre.',
    'reserve.fallback':
      'Envoyer par e-mail à la place',
    'reserve.ctaHome':
      'Réserver une table',

    'cart.title': 'Votre commande',
    'cart.empty': 'Panier vide',
    'cart.emptyText': 'Appuyez sur le plus à côté d’un plat – il arrive directement ici.',
    'cart.clear': 'Vider',
    'cart.clearConfirm': 'Vider le panier ?',
    'cart.subtotal': 'Sous-total',
    'cart.items': '{n} articles',
    'cart.total': 'Total',
    'cart.checkout': 'Commander',
    'cart.checkoutBusy': 'Transmission …',
    'cart.view': 'Voir la commande',
    'cart.close': 'Fermer',
    'cart.note': "La livraison, l'heure de retrait et le paiement se choisissent à l'étape suivante.",
    'cart.error': "La commande n'a pas pu être transmise. Merci de réessayer.",
    'cart.errorOffline': 'Pas de connexion au système de commande. Vérifiez votre connexion internet.',

    'allergens.title': 'Allergènes',
    'allergens.legend': 'Légende des allergènes',
    'allergens.note':
      "Les numéros suivent l'étiquetage européen. En cas d'allergie, parlez-nous-en avant de commander – nous vous conseillons volontiers.",
    'allergens.none': 'Non renseigné',

    'contact.eyebrow': 'Contact',
    'contact.title': 'Rendez-nous visite à Vianden',
    'contact.text': 
      'Passez nous voir ou venez chercher votre commande. Au plaisir de vous accueillir.',
    'contact.mapOpen': 'Ouvrir dans Google Maps',
    'contact.mapCredit': 'Données cartographiques © les contributeurs OpenStreetMap',
    'contact.mapTitle': 
      'Nous trouver',
    'contact.mapNote': 
      'En plein cœur de Vianden, à deux pas de l’Our. Touchez la carte pour ouvrir l’itinéraire.',
    'contact.mapLoad': 'Charger la carte',
    'contact.openMaps': "Ouvrir dans l'app Plans",
    'contact.phone': 'Téléphone',
    'contact.email': 'E-mail',
    'contact.social': 'Réseaux sociaux',
    'contact.reserve': 'Réservation',
    'contact.reserveText':
      'Pour réserver une table, écrivez-nous un e-mail en précisant la date, l’heure et le nombre de personnes.',

    'legal.privacy1':
      'Ce site charge les polices et les fichiers de mise en page uniquement depuis son propre serveur. Aucun service d’analyse ou de publicité n’est intégré et aucun cookie publicitaire n’est déposé.',
    'legal.privacy2':
      'Votre panier est enregistré uniquement en local dans votre navigateur. Les plats choisis ne sont transmis à notre système de commande qu’au moment où vous cliquez sur « Commander ». La carte OpenStreetMap n’est chargée que si vous la demandez explicitement.',
    'legal.privacy3':
      'Pour la commande et le paiement s’appliquent en outre les informations de confidentialité de notre système de boutique.',

    'footer.tagline': 
      'Trois cuisines sous un même toit — en plein cœur de Vianden.',
    'footer.explore': 
      'La carte',
    'footer.visit': 
      'Accès rapide',
    'footer.legal': 'Mentions légales',
    'footer.imprint': 'Mentions légales',
    'footer.privacy': 'Confidentialité',
    'footer.terms': 'CGV',
    'footer.rights': 'Tous droits réservés.',
    'footer.hours': 'Mar – Dim · 10:30–14:30 & 17:30–23:00',

    'days.1': 'Lundi',
    'days.2': 'Mardi',
    'days.3': 'Mercredi',
    'days.4': 'Jeudi',
    'days.5': 'Vendredi',
    'days.6': 'Samedi',
    'days.0': 'Dimanche',
    'days.closed': 'Fermé',
    'days.tueSun': 'Mardi – Dimanche',
    'days.mon': 'Lundi',
  },

  en: {
    'meta.title.home': 'Restaurant Fuku · Sushi, wok & Thai in Vianden',
    'meta.title.order': 'Order online · Restaurant Fuku Vianden',
    'meta.title.contact': 'Contact & directions · Restaurant Fuku Vianden',
    'meta.desc.home':
      'Sushi, Chinese wok classics and Thai curries in Vianden. Over 220 dishes – order online, collect or dine in.',
    'meta.desc.order': 'The complete menu of Restaurant Fuku in Vianden – order online in a few taps.',
    'meta.desc.contact': 'Address, opening hours and directions to Restaurant Fuku, 9 Rue de la Gare, L-9420 Vianden.',

    'nav.home': 'Home',
    'nav.order': 'Menu & ordering',
    'nav.contact': 'Contact',
    'nav.menuShort': 'Menu',
    'nav.open': 'Open menu',
    'nav.close': 'Close menu',
    'nav.language': 'Language',
    'nav.chooseLanguage': 'Choose language',
    'nav.cart': 'Cart',
    'nav.skip': 'Skip to content',

    'status.open': 'Open now',
    'status.closed': 'Currently closed',
    'status.opensAt': 'Opens {time}',
    'status.opensDay': 'Opens {day} {time}',
    'status.closesAt': 'until {time}',
    'status.today': 'Today',

    'hero.badge': 'Vianden · Luxembourg',
    'hero.title': 
      'Rolled by hand, seared in the wok — <em>right in Vianden</em>',
    'hero.text':
      
      'Sushi, Chinese wok dishes and Thai curries. Everything is cooked once you order — to take away or at our table.',
    'hero.cta': 'Order now',
    'hero.cta2': 'View the menu',
    'hero.fact1': "Today's hours",
    'hero.fact2': 'Where to find us',
    'hero.fact3': 'On the menu',
    'hero.dishes': '{n} dishes',
    'hero.chipLabel': "The chef's suggestion",

    'home.popular.eyebrow': 'Favourites',
    'home.popular.title': 
      'Where most people start',
    'home.popular.text': 
      'Four out of 222. The rest is waiting on the menu.',
    'home.popular.all': 'See all dishes',

    'home.cats.eyebrow': 'The menu',
    'home.cats.title': 
      'Where would you like to start?',
    'home.cats.text': 
      'From sashimi to a fiery curry — jump straight to the section you want.',
    'home.cats.count': '{n} dishes',
    'cat.sushi': 'Sushi',
    'cat.boissons': 'Drinks',
    'cat.chauds': 'Wok & Chinese',
    'cat.thai': 'Thai',
    'cat.entrees': 'Starters',
    'cat.riz': 'Rice & noodles',
    'cat.soupes': 'Soups & salads',

    'home.story.eyebrow': 
      'About us',
    'home.story.title': 
      'Why our menu is so long',
    'home.story.text':
      
      'Sushi from Japan, wok dishes from China, curries from Thailand: three kitchens under one roof, and the reason for 222 dishes. Every one of them is cooked once you order. Sometimes that takes a few minutes longer. We think it is worth it.',
    'home.story.stat1': 'dishes on the menu',
    'home.story.stat2': 'kitchens under one roof',
    'home.story.stat3': 'Recommended by Restaurant Guru',

    'home.info.eyebrow': 'Good to know',
    'home.info.title': 'Opening hours & directions',
    'home.info.hours': 'Opening hours',
    'home.info.hoursNote': 'Closed on Mondays.',
    'home.info.address': 'Address',
    'home.info.addressNote': 'In the centre of Vianden, a few steps from the Our.',
    'home.info.route': 'Get directions',
    'home.info.contact': 'Contact',
    'home.info.contactNote': 
      'Questions about a dish, an allergy or your order? Just write to us.',
    'home.info.write': 'Send an email',

    'home.cta.title': 
      'Hungry?',
    'home.cta.text': 
      '222 dishes, one basket. Take your time.',
    'home.cta.primary': 'Start ordering',
    'home.cta.secondary': 'Get in touch',

    'order.eyebrow': 'Menu',
    'order.title': 
      'What are you in the mood for?',
    'order.text':
      
      'All {n} dishes on one page. Search, filter, tap — done.',
    'order.searchPlaceholder': 'Search a dish, number or ingredient …',
    'order.searchClear': 'Clear search',
    'order.categories': 'Categories',
    'order.filterAll': 'All',
    'order.filterPopular': 'Popular',
    'order.filterVeg': 'Vegetarian',
    'order.filterSpicy': 'Spicy',
    'order.results': '{n} results',
    'order.noResults': 'Nothing found',
    'order.noResultsText': 'Try another search term or reset the filters.',
    'order.reset': 'Reset filters',
    'order.add': 'Add',
    'order.addTo': 'Add {name}',
    'order.remove': 'Remove',
    'order.details': 'Show details',
    'order.added': '{name} added',
    'order.dishCount': '{n} dishes',
    'order.choose': 'Choose',
    'order.notOrderable': 'In restaurant only',
    'order.variants': 'Your choice',
    'order.notOrderableHint': 'We are happy to put this menu together for you at the restaurant.',

    'meta.title.reserve':
      'Book a table · Restaurant Fuku Vianden',
    'meta.desc.reserve':
      'Book a table online at Restaurant Fuku in Vianden – date, time and party size in one step.',
    'nav.reserve':
      'Book a table',
    'reserve.eyebrow':
      'Reservation',
    'reserve.title':
      'Book a table',
    'reserve.text':
      'Tell us the date, time and how many of you there are – we confirm your booking by email shortly.',
    'reserve.when':
      'When would you like to come?',
    'reserve.who':
      'How can we reach you?',
    'reserve.date':
      'Date',
    'reserve.time':
      'Time',
    'reserve.guests':
      'Guests',
    'reserve.name':
      'Name',
    'reserve.email':
      'Email',
    'reserve.phone':
      'Phone',
    'reserve.notes':
      'Note',
    'reserve.notesHint':
      'Allergies, high chair, special occasion – just let us know here.',
    'reserve.notesPlaceholder':
      'Optional',
    'reserve.lunch':
      'Lunch',
    'reserve.dinner':
      'Dinner',
    'reserve.pickTime':
      'Please choose',
    'reserve.person':
      '{n} guest',
    'reserve.persons':
      '{n} guests',
    'reserve.moreGuests':
      'More than {n}',
    'reserve.moreGuestsHint':
      'For larger groups please write to us directly – we will find a way.',
    'reserve.noSlots':
      'No times left on that day. Please pick another day.',
    'reserve.submit':
      'Request booking',
    'reserve.submitting':
      'Sending …',
    'reserve.required':
      'Required',
    'reserve.summary':
      'Your request',
    'reserve.legal':
      'We use your details for this booking only.',
    'reserve.successTitle':
      'We have received your request',
    'reserve.successText':
      'We sent you a confirmation of receipt. We will confirm the table personally very soon – this is not a firm booking yet.',
    'reserve.successRef':
      'Reference',
    'reserve.again':
      'Another booking',
    'reserve.errorTitle':
      'That did not work',
    'reserve.errorGeneric':
      'The request could not be sent. Please try again.',
    'reserve.errorFields':
      'Please check the highlighted fields.',
    'reserve.errorClosed':
      'We are closed at that time. Please choose another time.',
    'reserve.errorTooSoon':
      'Please book at least one hour ahead. For last-minute tables, email us.',
    'reserve.errorRate':
      'Too many requests were sent. Please try again later.',
    'reserve.errorEmail':
      'Please enter a valid email address.',
    'reserve.errorPhone':
      'Please enter a phone number where we can reach you.',
    'reserve.fallback':
      'Send by email instead',
    'reserve.ctaHome':
      'Book a table',

    'cart.title': 'Your order',
    'cart.empty': 'Nothing selected yet',
    'cart.emptyText': 'Tap the plus next to a dish – it lands right here.',
    'cart.clear': 'Clear',
    'cart.clearConfirm': 'Empty the cart?',
    'cart.subtotal': 'Subtotal',
    'cart.items': '{n} items',
    'cart.total': 'Total',
    'cart.checkout': 'Checkout',
    'cart.checkoutBusy': 'Sending …',
    'cart.view': 'View order',
    'cart.close': 'Close',
    'cart.note': 'Delivery, collection time and payment are chosen in the next step.',
    'cart.error': 'The order could not be sent. Please try again.',
    'cart.errorOffline': 'No connection to the ordering system. Please check your internet connection.',

    'allergens.title': 'Allergens',
    'allergens.legend': 'Allergen key',
    'allergens.note':
      'Numbers follow the EU allergen labelling. If you have an allergy, please tell us before ordering – we are happy to advise.',
    'allergens.none': 'Not specified',

    'contact.eyebrow': 'Contact',
    'contact.title': 'Come and see us in Vianden',
    'contact.text': 
      'Come and see us, or pick up your order. We look forward to it.',
    'contact.mapOpen': 'Open in Google Maps',
    'contact.mapCredit': 'Map data © OpenStreetMap contributors',
    'contact.mapTitle': 
      'How to find us',
    'contact.mapNote': 
      'Right in Vianden, a few steps from the Our. Tap the map to open directions.',
    'contact.mapLoad': 'Load map',
    'contact.openMaps': 'Open in maps app',
    'contact.phone': 'Phone',
    'contact.email': 'Email',
    'contact.social': 'Social media',
    'contact.reserve': 'Reservations',
    'contact.reserveText': 'To reserve a table, send us an email with the date, time and number of guests.',

    'legal.privacy1':
      'This website loads fonts and layout files exclusively from its own server. No analytics or advertising services are embedded and no advertising cookies are set.',
    'legal.privacy2':
      'Your cart is stored locally in your browser only. The dishes you chose are transmitted to our ordering system only when you click “Checkout”. The OpenStreetMap map is loaded only if you explicitly request it.',
    'legal.privacy3':
      'The privacy notices of our shop system additionally apply to ordering and payment.',

    'footer.tagline': 
      'Three kitchens under one roof — right in Vianden.',
    'footer.explore': 
      'The menu',
    'footer.visit': 
      'Quick links',
    'footer.legal': 'Legal',
    'footer.imprint': 'Legal notice',
    'footer.privacy': 'Privacy',
    'footer.terms': 'Terms',
    'footer.rights': 'All rights reserved.',
    'footer.hours': 'Tue – Sun · 10:30–14:30 & 17:30–23:00',

    'days.1': 'Monday',
    'days.2': 'Tuesday',
    'days.3': 'Wednesday',
    'days.4': 'Thursday',
    'days.5': 'Friday',
    'days.6': 'Saturday',
    'days.0': 'Sunday',
    'days.closed': 'Closed',
    'days.tueSun': 'Tuesday – Sunday',
    'days.mon': 'Monday',
  },

  nl: {
    'meta.title.home': 'Restaurant Fuku · Sushi, wok & Thais in Vianden',
    'meta.title.order': 'Bestellen · Restaurant Fuku Vianden',
    'meta.title.contact': 'Contact & route · Restaurant Fuku Vianden',
    'meta.desc.home':
      'Sushi, Chinese wokklassiekers en Thaise curry’s in Vianden. Meer dan 220 gerechten – online bestellen, afhalen of bij ons eten.',
    'meta.desc.order': 'De volledige kaart van Restaurant Fuku in Vianden – eenvoudig online bestellen.',
    'meta.desc.contact': 'Adres, openingstijden en route naar Restaurant Fuku, 9 Rue de la Gare, L-9420 Vianden.',

    'nav.home': 'Home',
    'nav.order': 'Kaart & bestellen',
    'nav.contact': 'Contact',
    'nav.menuShort': 'Kaart',
    'nav.open': 'Menu openen',
    'nav.close': 'Menu sluiten',
    'nav.language': 'Taal',
    'nav.chooseLanguage': 'Taal kiezen',
    'nav.cart': 'Winkelmandje',
    'nav.skip': 'Naar de inhoud',

    'status.open': 'Nu geopend',
    'status.closed': 'Momenteel gesloten',
    'status.opensAt': 'Opent om {time}',
    'status.opensDay': 'Opent {day} om {time}',
    'status.closesAt': 'tot {time}',
    'status.today': 'Vandaag',

    'hero.badge': 'Vianden · Luxemburg',
    'hero.title': 
      'Met de hand gerold, in de wok gebakken — <em>midden in Vianden</em>',
    'hero.text':
      
      'Sushi, Chinese wokgerechten en Thaise curry’s. Alles wordt bereid zodra u bestelt — om af te halen of bij ons aan tafel.',
    'hero.cta': 'Nu bestellen',
    'hero.cta2': 'Bekijk de kaart',
    'hero.fact1': 'Openingstijden vandaag',
    'hero.fact2': 'Waar u ons vindt',
    'hero.fact3': 'Op de kaart',
    'hero.dishes': '{n} gerechten',
    'hero.chipLabel': 'Aanrader van het huis',

    'home.popular.eyebrow': 'Favorieten',
    'home.popular.title': 
      'Waar de meesten mee beginnen',
    'home.popular.text': 
      'Vier van de 222. De rest staat op de kaart.',
    'home.popular.all': 'Alle gerechten bekijken',

    'home.cats.eyebrow': 'De kaart',
    'home.cats.title': 
      'Waar wilt u beginnen?',
    'home.cats.text': 
      'Van sashimi tot pittige curry — ga direct naar de rubriek die u zoekt.',
    'home.cats.count': '{n} gerechten',
    'cat.sushi': 'Sushi',
    'cat.boissons': 'Dranken',
    'cat.chauds': 'Wok & Chinees',
    'cat.thai': 'Thais',
    'cat.entrees': 'Voorgerechten',
    'cat.riz': 'Rijst & noedels',
    'cat.soupes': 'Soepen & salades',

    'home.story.eyebrow': 
      'Over ons',
    'home.story.title': 
      'Waarom onze kaart zo lang is',
    'home.story.text':
      
      'Sushi uit Japan, wokgerechten uit China, curry’s uit Thailand: drie keukens onder één dak, en de reden voor 222 gerechten. Elk gerecht wordt bereid zodra u bestelt. Soms duurt dat een paar minuten langer. Wij vinden dat het dat waard is.',
    'home.story.stat1': 'gerechten op de kaart',
    'home.story.stat2': 'keukens onder één dak',
    'home.story.stat3': 'Aanbevolen door Restaurant Guru',

    'home.info.eyebrow': 'Goed om te weten',
    'home.info.title': 'Openingstijden & route',
    'home.info.hours': 'Openingstijden',
    'home.info.hoursNote': 'Maandag gesloten.',
    'home.info.address': 'Adres',
    'home.info.addressNote': 'In het centrum van Vianden, op een paar passen van de Our.',
    'home.info.route': 'Route plannen',
    'home.info.contact': 'Contact',
    'home.info.contactNote': 
      'Vragen over een gerecht, een allergie of uw bestelling? Schrijf ons gerust.',
    'home.info.write': 'E-mail sturen',

    'home.cta.title': 
      'Honger?',
    'home.cta.text': 
      '222 gerechten, één mandje. Neem rustig de tijd.',
    'home.cta.primary': 'Naar de bestelling',
    'home.cta.secondary': 'Contact opnemen',

    'order.eyebrow': 'Menukaart',
    'order.title': 
      'Waar heeft u zin in?',
    'order.text':
      
      'Alle {n} gerechten op één pagina. Zoeken, filteren, tikken — klaar.',
    'order.searchPlaceholder': 'Zoek een gerecht, nummer of ingrediënt …',
    'order.searchClear': 'Zoekopdracht wissen',
    'order.categories': 'Categorieën',
    'order.filterAll': 'Alles',
    'order.filterPopular': 'Populair',
    'order.filterVeg': 'Vegetarisch',
    'order.filterSpicy': 'Pittig',
    'order.results': '{n} resultaten',
    'order.noResults': 'Niets gevonden',
    'order.noResultsText': 'Probeer een andere zoekterm of zet de filters terug.',
    'order.reset': 'Filters wissen',
    'order.add': 'Toevoegen',
    'order.addTo': '{name} toevoegen',
    'order.remove': 'Verwijderen',
    'order.details': 'Details bekijken',
    'order.added': '{name} toegevoegd',
    'order.dishCount': '{n} gerechten',
    'order.choose': 'Kiezen',
    'order.notOrderable': 'Alleen in het restaurant',
    'order.variants': 'Uw keuze',
    'order.notOrderableHint': 'Dit menu stellen we graag in het restaurant voor u samen.',

    'meta.title.reserve':
      'Tafel reserveren · Restaurant Fuku Vianden',
    'meta.desc.reserve':
      'Reserveer online een tafel bij Restaurant Fuku in Vianden – datum, tijd en aantal personen in één stap.',
    'nav.reserve':
      'Reserveren',
    'reserve.eyebrow':
      'Reservering',
    'reserve.title':
      'Een tafel reserveren',
    'reserve.text':
      'Geef datum, tijd en het aantal personen door – we bevestigen uw reservering zo snel mogelijk per e-mail.',
    'reserve.when':
      'Wanneer wilt u komen?',
    'reserve.who':
      'Hoe kunnen we u bereiken?',
    'reserve.date':
      'Datum',
    'reserve.time':
      'Tijd',
    'reserve.guests':
      'Personen',
    'reserve.name':
      'Naam',
    'reserve.email':
      'E-mail',
    'reserve.phone':
      'Telefoon',
    'reserve.notes':
      'Opmerking',
    'reserve.notesHint':
      'Allergieën, kinderstoel, bijzondere gelegenheid – laat het hier weten.',
    'reserve.notesPlaceholder':
      'Optioneel',
    'reserve.lunch':
      'Middag',
    'reserve.dinner':
      'Avond',
    'reserve.pickTime':
      'Kies een tijd',
    'reserve.person':
      '{n} persoon',
    'reserve.persons':
      '{n} personen',
    'reserve.moreGuests':
      'Meer dan {n}',
    'reserve.moreGuestsHint':
      'Voor grotere groepen kunt u ons rechtstreeks schrijven – we vinden een oplossing.',
    'reserve.noSlots':
      'Op die dag zijn er geen tijden meer vrij. Kies een andere dag.',
    'reserve.submit':
      'Reservering aanvragen',
    'reserve.submitting':
      'Wordt verzonden …',
    'reserve.required':
      'Verplicht veld',
    'reserve.summary':
      'Uw aanvraag',
    'reserve.legal':
      'We gebruiken uw gegevens uitsluitend voor deze reservering.',
    'reserve.successTitle':
      'Uw aanvraag is bij ons binnen',
    'reserve.successText':
      'We hebben u een ontvangstbevestiging gestuurd. De tafel bevestigen we binnenkort persoonlijk – dit is nog geen vaste toezegging.',
    'reserve.successRef':
      'Referentie',
    'reserve.again':
      'Nieuwe reservering',
    'reserve.errorTitle':
      'Dat is niet gelukt',
    'reserve.errorGeneric':
      'De aanvraag kon niet worden verzonden. Probeer het opnieuw.',
    'reserve.errorFields':
      'Controleer de gemarkeerde velden.',
    'reserve.errorClosed':
      'Op dat tijdstip zijn we gesloten. Kies een andere tijd.',
    'reserve.errorTooSoon':
      'Reserveer minstens een uur van tevoren. Voor last-minute kunt u ons mailen.',
    'reserve.errorRate':
      'Er zijn te veel aanvragen verstuurd. Probeer het later opnieuw.',
    'reserve.errorEmail':
      'Voer een geldig e-mailadres in.',
    'reserve.errorPhone':
      'Voer een telefoonnummer in waarop we u kunnen bereiken.',
    'reserve.fallback':
      'In plaats daarvan e-mailen',
    'reserve.ctaHome':
      'Tafel reserveren',

    'cart.title': 'Uw bestelling',
    'cart.empty': 'Nog niets gekozen',
    'cart.emptyText': 'Tik op de plus bij een gerecht – het komt hier direct terecht.',
    'cart.clear': 'Legen',
    'cart.clearConfirm': 'Winkelmandje legen?',
    'cart.subtotal': 'Subtotaal',
    'cart.items': '{n} artikelen',
    'cart.total': 'Totaal',
    'cart.checkout': 'Afrekenen',
    'cart.checkoutBusy': 'Wordt verstuurd …',
    'cart.view': 'Bestelling bekijken',
    'cart.close': 'Sluiten',
    'cart.note': 'Bezorging, afhaaltijd en betaling kiest u in de volgende stap.',
    'cart.error': 'De bestelling kon niet worden verstuurd. Probeer het opnieuw.',
    'cart.errorOffline': 'Geen verbinding met het bestelsysteem. Controleer uw internetverbinding.',

    'allergens.title': 'Allergenen',
    'allergens.legend': 'Allergenenlijst',
    'allergens.note':
      'De nummers volgen de EU-etikettering. Heeft u een allergie, laat het ons weten vóór het bestellen – we adviseren u graag.',
    'allergens.none': 'Niet vermeld',

    'contact.eyebrow': 'Contact',
    'contact.title': 'Bezoek ons in Vianden',
    'contact.text': 
      'Kom langs of haal uw bestelling op. We zien u graag.',
    'contact.mapOpen': 'Openen in Google Maps',
    'contact.mapCredit': 'Kaartgegevens © OpenStreetMap-bijdragers',
    'contact.mapTitle': 
      'Ons vinden',
    'contact.mapNote': 
      'Midden in Vianden, op een paar passen van de Our. Tik op de kaart voor de route.',
    'contact.mapLoad': 'Kaart laden',
    'contact.openMaps': 'Openen in kaarten-app',
    'contact.phone': 'Telefoon',
    'contact.email': 'E-mail',
    'contact.social': 'Sociale media',
    'contact.reserve': 'Reserveren',
    'contact.reserveText': 'Stuur ons een e-mail met datum, tijd en aantal personen om een tafel te reserveren.',

    'legal.privacy1':
      'Deze website laadt lettertypen en opmaakbestanden uitsluitend van de eigen server. Er zijn geen analyse- of advertentiediensten ingebouwd en er worden geen advertentiecookies geplaatst.',
    'legal.privacy2':
      'Uw winkelmandje wordt alleen lokaal in uw browser bewaard. Pas wanneer u op „Afrekenen“ klikt, worden de gekozen gerechten naar ons bestelsysteem verstuurd. De kaart van OpenStreetMap wordt pas geladen als u daar uitdrukkelijk om vraagt.',
    'legal.privacy3':
      'Voor bestelling en betaling gelden aanvullend de privacyverklaringen van ons shopsysteem.',

    'footer.tagline': 
      'Drie keukens onder één dak — midden in Vianden.',
    'footer.explore': 
      'De kaart',
    'footer.visit': 
      'Snel naar',
    'footer.legal': 'Juridisch',
    'footer.imprint': 'Colofon',
    'footer.privacy': 'Privacy',
    'footer.terms': 'Voorwaarden',
    'footer.rights': 'Alle rechten voorbehouden.',
    'footer.hours': 'Di – Zo · 10:30–14:30 & 17:30–23:00',

    'days.1': 'Maandag',
    'days.2': 'Dinsdag',
    'days.3': 'Woensdag',
    'days.4': 'Donderdag',
    'days.5': 'Vrijdag',
    'days.6': 'Zaterdag',
    'days.0': 'Zondag',
    'days.closed': 'Gesloten',
    'days.tueSun': 'Dinsdag – Zondag',
    'days.mon': 'Maandag',
  },
};

/* Allergene nach EU-Kennzeichnung (LMIV Anhang II). ------------------ */
export const ALLERGENS = {
  1: {
    de: 'Glutenhaltiges Getreide',
    fr: 'Céréales contenant du gluten',
    en: 'Cereals containing gluten',
    nl: 'Glutenbevattende granen',
  },
  2: { de: 'Krebstiere', fr: 'Crustacés', en: 'Crustaceans', nl: 'Schaaldieren' },
  3: { de: 'Eier', fr: 'Œufs', en: 'Eggs', nl: 'Eieren' },
  4: { de: 'Fisch', fr: 'Poissons', en: 'Fish', nl: 'Vis' },
  5: { de: 'Erdnüsse', fr: 'Arachides', en: 'Peanuts', nl: 'Pinda’s' },
  6: { de: 'Soja', fr: 'Soja', en: 'Soybeans', nl: 'Soja' },
  7: { de: 'Milch & Laktose', fr: 'Lait', en: 'Milk', nl: 'Melk' },
  8: { de: 'Schalenfrüchte', fr: 'Fruits à coque', en: 'Nuts', nl: 'Noten' },
  9: { de: 'Sellerie', fr: 'Céleri', en: 'Celery', nl: 'Selderij' },
  10: { de: 'Senf', fr: 'Moutarde', en: 'Mustard', nl: 'Mosterd' },
  11: { de: 'Sesam', fr: 'Sésame', en: 'Sesame', nl: 'Sesam' },
  12: { de: 'Sulfite', fr: 'Sulfites', en: 'Sulphites', nl: 'Sulfiet' },
  13: { de: 'Lupinen', fr: 'Lupin', en: 'Lupin', nl: 'Lupine' },
  14: { de: 'Weichtiere', fr: 'Mollusques', en: 'Molluscs', nl: 'Weekdieren' },
};

/* ------------------------------------------------------------------
   Laufzeit
   ------------------------------------------------------------------ */
let current = FALLBACK;
const listeners = new Set();

function detect() {
  try {
    const saved = localStorage.getItem('fuku:lang');
    if (saved && SUPPORTED.includes(saved)) return saved;
  } catch {
    /* localStorage kann blockiert sein */
  }
  for (const tag of navigator.languages || [navigator.language || '']) {
    const code = String(tag).slice(0, 2).toLowerCase();
    if (SUPPORTED.includes(code)) return code;
  }
  return FALLBACK;
}

/** Übersetzt einen Schlüssel und ersetzt {platzhalter}. */
export function t(key, vars) {
  const table = DICT[current] || DICT[FALLBACK];
  let value = table[key] ?? DICT[FALLBACK][key] ?? key;
  if (vars) {
    for (const [name, replacement] of Object.entries(vars)) {
      value = value.replaceAll(`{${name}}`, replacement);
    }
  }
  return value;
}

export const getLang = () => current;

/** Sprachcode für Intl-Formatierungen (Preise, Daten). */
export const getLocale = () => ({ de: 'de-LU', fr: 'fr-LU', en: 'en-GB', nl: 'nl-BE' }[current] || 'de-LU');

export function onLangChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Übersetzt alle markierten Knoten innerhalb von `root`. */
export function apply(root = document) {
  root.querySelectorAll('[data-i18n]').forEach((el) => {
    el.textContent = t(el.dataset.i18n, readVars(el));
  });

  root.querySelectorAll('[data-i18n-html]').forEach((el) => {
    el.innerHTML = t(el.dataset.i18nHtml, readVars(el));
  });

  root.querySelectorAll('[data-i18n-attr]').forEach((el) => {
    for (const pair of el.dataset.i18nAttr.split(',')) {
      const [attr, key] = pair.split(':').map((s) => s.trim());
      if (attr && key) el.setAttribute(attr, t(key, readVars(el)));
    }
  });
}

function readVars(el) {
  if (!el.dataset.i18nVars) return null;
  try {
    return JSON.parse(el.dataset.i18nVars);
  } catch {
    return null;
  }
}

export function setLang(code, { persist = true } = {}) {
  if (!SUPPORTED.includes(code)) return;
  current = code;
  document.documentElement.lang = code;
  if (persist) {
    try {
      localStorage.setItem('fuku:lang', code);
    } catch {
      /* ignorieren */
    }
  }
  apply();
  listeners.forEach((fn) => fn(code));
}

/** Beim Laden aufrufen – setzt die erkannte Sprache ohne sie zu speichern. */
export function initLang() {
  setLang(detect(), { persist: false });
  return current;
}
