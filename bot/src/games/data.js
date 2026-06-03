// Banques de questions étendues pour les jeux Ayumi.
// Format : { q, a:[réponses normalisées acceptées] }

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
  { q: "« Je veux voir le manager. »", a: ["wesh alors", "kev adams", "florence foresti", "blague carambar"], hint: "Réplique virale, FR" },
  { q: "« Houston, we have a problem. »", a: ["apollo 13"] },
  { q: "« May the Force be with you. »", a: ["star wars", "starwars"] },
  { q: "« Je suis ton père. »", a: ["star wars", "dark vador", "vador"] },
  { q: "« Hakuna matata. »", a: ["le roi lion", "roi lion", "lion king"] },
];

export const ACTION_VERITE = [
  "Vérité : ton plus gros mensonge à un prof ?",
  "Action : envoie le dernier emoji que tu as utilisé, sans contexte.",
  "Vérité : qui dans ce groupe te fait le plus rire ?",
  "Action : raconte ta pire honte en une phrase.",
  "Vérité : si tu pouvais effacer un souvenir, lequel ?",
  "Action : écris un message d'amour ridicule en moins de 10 mots.",
  "Vérité : dernière fois que t'as pleuré ?",
  "Action : décris ta journée en 3 emojis.",
];

export const ROLEPLAY_SCENES = [
  "Tu es un détective qui interroge un suspect. Pose ta première question.",
  "Tu es un client mécontent dans un resto étoilé. Vas-y.",
  "Tu es un alien découvrant la baguette de pain. Réagis.",
  "Tu es un coach sportif qui motive avant un match. Lance ton discours.",
  "Tu es un guide touristique pour une ville qui n'existe pas. Présente-la.",
];
