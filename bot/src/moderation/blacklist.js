import { normalize } from "../utils/text.js";

// Liste à adapter au groupe. MVP volontairement court et neutre.
const BLACKLIST = [
  // insultes lourdes / contenus interdits
  "putain de ta mere",
  "ntm",
  "fdp",
];

export function containsBlacklisted(text = "") {
  const n = normalize(text);
  return BLACKLIST.find((w) => n.includes(w)) || null;
}
