// Banque de questions pour les jeux d'Ayumi.
// Format : { q: question, a: [réponses acceptées en minuscule], hint?: indice }

export const QUIZ = [
  { q: "Quelle est la capitale de l'Australie ?", a: ["canberra"] },
  { q: "Combien de continents y a-t-il ?", a: ["7", "sept"] },
  { q: "Qui a peint La Joconde ?", a: ["léonard de vinci", "leonard de vinci", "da vinci"] },
  { q: "En quelle année est tombé le mur de Berlin ?", a: ["1989"] },
  { q: "Quel est le plus grand océan ?", a: ["pacifique", "océan pacifique"] },
  { q: "Combien de joueurs dans une équipe de foot sur le terrain ?", a: ["11", "onze"] },
  { q: "Quelle planète est la plus proche du Soleil ?", a: ["mercure"] },
  { q: "Quel pays a inventé les sushis ?", a: ["japon", "le japon"] },
  { q: "Combien de côtés a un hexagone ?", a: ["6", "six"] },
  { q: "Qui a écrit Les Misérables ?", a: ["victor hugo", "hugo"] },
  { q: "Quelle est la monnaie du Japon ?", a: ["yen", "le yen"] },
  { q: "Combien de touches sur un piano standard ?", a: ["88"] },
];

export const DEVINETTES = [
  { q: "Plus on en prend, plus on en laisse derrière soi. Qu'est-ce que c'est ?", a: ["des pas", "pas", "les pas"] },
  { q: "Je peux voler sans ailes, pleurer sans yeux. Qui suis-je ?", a: ["nuage", "le nuage", "un nuage"] },
  { q: "Qu'est-ce qui a des dents mais ne mord pas ?", a: ["peigne", "un peigne", "le peigne"] },
  { q: "Je tourne sans bouger. Qui suis-je ?", a: ["lait", "le lait"] },
  { q: "Qu'est-ce qui monte mais ne redescend jamais ?", a: ["age", "l'age", "l'âge", "âge"] },
  { q: "Je suis pris avant que tu me donnes. Qui suis-je ?", a: ["photo", "une photo", "la photo"] },
];

export const VRAI_FAUX = [
  { q: "Les pieuvres ont trois cœurs.", a: ["vrai", "v", "true"] },
  { q: "La Grande Muraille de Chine se voit depuis la Lune à l'œil nu.", a: ["faux", "f", "false"] },
  { q: "Le miel ne se périme jamais.", a: ["vrai", "v", "true"] },
  { q: "Les bananes poussent dans des arbres.", a: ["faux", "f", "false"] },
  { q: "Un éclair est plus chaud que la surface du soleil.", a: ["vrai", "v", "true"] },
  { q: "Le sang humain est bleu dans les veines.", a: ["faux", "f", "false"] },
];

export const MOTS_MYSTERES = [
  { q: "Animal à 8 pattes, fait de la soie.", a: ["araignée", "araignee"] },
  { q: "Fruit jaune, courbé, riche en potassium.", a: ["banane"] },
  { q: "Astre brillant qu'on voit la nuit.", a: ["étoile", "etoile", "lune"] },
  { q: "Sport avec un ballon rond, deux équipes, des buts.", a: ["football", "foot"] },
];
