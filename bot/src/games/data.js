// Banques de questions étendues pour les jeux Ayumi.
// Format quiz : { q, a:[réponses normalisées acceptées] }
// Format social : juste des strings (pas de bonne réponse).

export const QUIZ = [
  { q: "Quelle est la capitale de l'Australie ?", a: ["canberra"] },
  { q: "Combien de continents y a-t-il ?", a: ["7", "sept"] },
  { q: "Qui a peint La Joconde ?", a: ["leonard de vinci", "da vinci", "vinci"] },
  { q: "En quelle année est tombé le mur de Berlin ?", a: ["1989"] },
  { q: "Quel est le plus grand océan ?", a: ["pacifique", "ocean pacifique"] },
  { q: "Combien de joueurs sur le terrain dans une équipe de foot ?", a: ["11", "onze"] },
  { q: "Quelle planète est la plus proche du Soleil ?", a: ["mercure"] },
  { q: "Quel pays a inventé les sushis ?", a: ["japon", "le japon"] },
  { q: "Combien de côtés a un hexagone ?", a: ["6", "six"] },
  { q: "Qui a écrit Les Misérables ?", a: ["victor hugo", "hugo"] },
  { q: "Quelle est la monnaie du Japon ?", a: ["yen", "le yen"] },
  { q: "Combien de touches sur un piano standard ?", a: ["88"] },
  { q: "Quel élément a pour symbole Au ?", a: ["or", "l or"] },
  { q: "Plus haute montagne du monde ?", a: ["everest", "l everest", "mont everest"] },
  { q: "Capitale du Canada ?", a: ["ottawa"] },
  { q: "Année de la révolution française ?", a: ["1789"] },
];

export const DEVINETTES = [
  { q: "Plus on en prend, plus on en laisse derrière soi.", a: ["des pas", "pas", "les pas"] },
  { q: "Je peux voler sans ailes, pleurer sans yeux. Qui suis-je ?", a: ["nuage", "le nuage", "un nuage"] },
  { q: "Qu'est-ce qui a des dents mais ne mord pas ?", a: ["peigne", "un peigne", "le peigne"] },
  { q: "Je tourne sans bouger. Qui suis-je ?", a: ["lait", "le lait"] },
  { q: "Qu'est-ce qui monte mais ne redescend jamais ?", a: ["age", "l age"] },
  { q: "Je suis pris avant que tu me donnes. Qui suis-je ?", a: ["photo", "une photo"] },
  { q: "J'ai des villes sans maisons, des forêts sans arbres. Qui suis-je ?", a: ["carte", "une carte", "la carte"] },
  { q: "Plus je suis chaud, plus je suis frais. Qui suis-je ?", a: ["pain", "le pain"] },
];

export const VRAI_FAUX = [
  { q: "Les pieuvres ont trois cœurs.", a: ["vrai", "v", "true"] },
  { q: "La Grande Muraille de Chine se voit depuis la Lune à l'œil nu.", a: ["faux", "f", "false"] },
  { q: "Le miel ne se périme jamais.", a: ["vrai", "v"] },
  { q: "Les bananes poussent dans des arbres.", a: ["faux", "f"] },
  { q: "Un éclair est plus chaud que la surface du soleil.", a: ["vrai", "v"] },
  { q: "Le sang humain est bleu dans les veines.", a: ["faux", "f"] },
  { q: "Les requins existent depuis plus longtemps que les arbres.", a: ["vrai", "v"] },
  { q: "Napoléon était très petit pour son époque.", a: ["faux", "f"] },
];

export const MOTS_MYSTERES = [
  { q: "Animal à 8 pattes, fait de la soie.", a: ["araignee", "araignée"] },
  { q: "Fruit jaune courbé, riche en potassium.", a: ["banane"] },
  { q: "Astre brillant qu'on voit la nuit.", a: ["etoile", "lune"] },
  { q: "Sport avec un ballon rond et des buts.", a: ["football", "foot"] },
  { q: "Boisson noire et amère du matin.", a: ["cafe", "café"] },
  { q: "Outil pour écrire à la main.", a: ["stylo", "crayon"] },
];

export const CULTURE = [
  { q: "Qui a peint la chapelle Sixtine ?", a: ["michel ange", "michelangelo"] },
  { q: "Quel philosophe a dit 'je pense donc je suis' ?", a: ["descartes", "rene descartes"] },
  { q: "Quel pays a offert la statue de la Liberté aux USA ?", a: ["france", "la france"] },
  { q: "Quel compositeur est devenu sourd ?", a: ["beethoven"] },
  { q: "Quelle est la plus longue rivière du monde ?", a: ["amazone", "l amazone"] },
];

export const QUI_SUIS_JE = [
  { q: "Je suis né en 1879, j'ai révolutionné la physique, ma langue dépasse souvent.", a: ["einstein", "albert einstein"] },
  { q: "Reine d'Égypte, j'ai aimé deux Romains très puissants.", a: ["cleopatre", "cléopâtre"] },
  { q: "Je suis le 'roi de la pop', célèbre pour mon moonwalk.", a: ["michael jackson", "jackson"] },
  { q: "J'ai dirigé l'Inde vers l'indépendance sans violence.", a: ["gandhi", "mahatma gandhi"] },
  { q: "Je suis une physicienne, prix Nobel deux fois, en physique et chimie.", a: ["marie curie", "curie"] },
];

export const BLINDTEXT = [
  { q: "« Houston, we have a problem. »", a: ["apollo 13"] },
  { q: "« May the Force be with you. »", a: ["star wars", "starwars"] },
  { q: "« Je suis ton père. »", a: ["star wars", "dark vador", "vador"] },
  { q: "« Hakuna matata. »", a: ["le roi lion", "roi lion", "lion king"] },
];

// ===== JEUX SOCIAUX (pas de bonne réponse, on enchaîne avec /next) =====

export const ACTION_QUESTIONS = [
  "Envoie le dernier emoji que tu as utilisé, sans contexte.",
  "Raconte ta pire honte de la semaine, en une phrase.",
  "Écris un message d'amour ridicule en moins de 10 mots.",
  "Décris ta journée en 3 emojis.",
  "Imite un perso du groupe en une phrase.",
  "Envoie une capture random de ta galerie (description si pas possible).",
  "Invente un slogan ridicule pour ce groupe.",
  "Écris ton autobiographie en 1 phrase.",
];

export const VERITE_QUESTIONS = [
  "Ton plus gros mensonge à un prof ?",
  "Qui dans ce groupe te fait le plus rire ?",
  "Si tu pouvais effacer un souvenir, lequel ?",
  "Dernière fois que t'as pleuré ?",
  "Ton pire date ?",
  "Une chose que personne ne sait sur toi ?",
  "Si t'étais invisible 24h, tu fais quoi ?",
  "Crush actuel : oui ou non ?",
];

export const JE_N_AI_JAMAIS = [
  "Je n'ai jamais menti à mes parents pour sortir.",
  "Je n'ai jamais embrassé quelqu'un en cachette.",
  "Je n'ai jamais séché un cours.",
  "Je n'ai jamais pleuré devant un film Disney.",
  "Je n'ai jamais envoyé un message d'amour au mauvais destinataire.",
  "Je n'ai jamais fait semblant d'aimer un cadeau.",
  "Je n'ai jamais stalké quelqu'un sur Insta plus de 1h.",
  "Je n'ai jamais cru au Père Noël après 10 ans.",
];

export const PREFERES_TU = [
  "Préfères-tu : ne plus jamais avoir internet, OU ne plus jamais sortir de chez toi ?",
  "Préfères-tu : être célèbre mais pauvre, OU riche mais inconnu ?",
  "Préfères-tu : parler toutes les langues, OU savoir jouer de tous les instruments ?",
  "Préfères-tu : être en retard partout, OU 1h en avance partout ?",
  "Préfères-tu : un été éternel, OU un hiver éternel ?",
  "Préfères-tu : lire les pensées des autres, OU être invisible ?",
  "Préfères-tu : pizza tous les jours, OU sushis tous les jours ?",
];

export const QUI_EST_LE_PLUS_SUSCEPTIBLE = [
  "Qui est le plus susceptible de devenir célèbre ?",
  "Qui est le plus susceptible de pleurer devant un film ?",
  "Qui est le plus susceptible de répondre à 4h du mat ?",
  "Qui est le plus susceptible de faire un truc complètement con sur un pari ?",
  "Qui est le plus susceptible d'oublier l'anniversaire d'un pote ?",
  "Qui est le plus susceptible de partir vivre à l'étranger ?",
  "Qui est le plus susceptible de gagner au loto et tout dépenser en 1 mois ?",
];

export const DEFIS_DU_JOUR = [
  "Envoie un message vocal de 5 sec en chantant ton refrain préféré.",
  "Décris ton humeur du jour avec une météo bizarre.",
  "Raconte la chose la plus stupide que tu as faite cette semaine.",
  "Partage la dernière photo de ta galerie (description si trop perso).",
  "Invente une excuse pour rater l'école/le boulot demain.",
  "Compose un haiku sur le groupe.",
];

export const QUESTIONS_RAPIDES = [
  "Plage ou montagne ?",
  "Chien ou chat ?",
  "Film ou série ?",
  "Salé ou sucré ?",
  "Matin ou soir ?",
  "Tatouage ou piercing ?",
  "Manga ou comics ?",
  "Café ou thé ?",
];

export const DEBATS = [
  "L'ananas sur la pizza : crime ou génie ?",
  "Est-ce qu'on devrait noter ses amis comme sur Uber ?",
  "Le ghosting : parfois OK, ou jamais OK ?",
  "Est-ce qu'on peut être amis avec son/sa ex ?",
  "Faut-il interdire les réseaux sociaux aux -16 ?",
  "Vacances en groupe : super idée ou catastrophe assurée ?",
];

// Conservés pour rétrocompat (utilisés par roleplay)
export const ROLEPLAY_SCENES = [
  "Tu es un détective qui interroge un suspect. Pose ta première question.",
  "Tu es un client mécontent dans un resto étoilé. Vas-y.",
  "Tu es un alien découvrant la baguette de pain. Réagis.",
  "Tu es un coach sportif qui motive avant un match. Lance ton discours.",
  "Tu es un guide touristique pour une ville qui n'existe pas. Présente-la.",
];

// Ancien alias (rétro-compat)
export const ACTION_VERITE = [...ACTION_QUESTIONS, ...VERITE_QUESTIONS];
