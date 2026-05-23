// Normalisation simple (sans dépendance externe)
export function normalize(s = "") {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

export function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Extrait le numéro depuis un JID Baileys ("33612345678@s.whatsapp.net" -> "33612345678")
export function jidToNumber(jid = "") {
  return jid.split("@")[0].split(":")[0];
}
