import { normalize } from "../utils/text.js";

// Liste à adapter au groupe. Termes injurieux + à caractère sexuel explicite.
// `normalize` enlève les accents et met en minuscules.
const BLACKLIST = [
  // insultes lourdes
  "putain de ta mere",
  "nique ta mere",
  "ntm",
  "fdp",
  "fils de pute",
  "enculé",
  "encule",
  "connard",
  "salope",
  "pute",
  "batard",

  // sexuel explicite (FR)
  "bite",
  "chatte",
  "queue molle",
  "suce",
  "sucer",
  "sucez",
  "branle",
  "branler",
  "branlette",
  "baise",
  "baiser",
  "baisée",
  "baisee",
  "porno",
  "pornographie",
  "xxx",
  "sexe",
  "sexto",
  "nudes",
  "nude",
  "bander",
  "bandante",
  "ejac",
  "éjac",
  "ejaculation",
  "orgasme",
  "fellation",
  "sodomie",
  "sodomiser",
  "cunnilingus",
  "pipe",
  "gangbang",
  "hentai",
  "hentaï",

  // sexuel explicite (EN, classique sur WA)
  "fuck",
  "fucker",
  "fucking",
  "blowjob",
  "boobs",
  "tits",
  "pussy",
  "dick",
  "cum",
  "cumshot",
  "nsfw",
];

export function containsBlacklisted(text = "") {
  const n = normalize(text);
  // match sur mot/segment normalisé
  return BLACKLIST.find((w) => n.includes(w)) || null;
}
