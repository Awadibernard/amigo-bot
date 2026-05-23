// Détection de liens (hors whitelist). MVP : bloque tous les liens externes.
const URL_RE = /\b((https?:\/\/|www\.)\S+|\S+\.(com|net|org|fr|io|gg|me|app|dev|co|tv)(\/\S*)?)\b/i;
const WHITELIST = [/(^|\.)youtube\.com$/i, /(^|\.)youtu\.be$/i, /(^|\.)spotify\.com$/i];

function hostFromMatch(m) {
  try {
    const url = m.startsWith("http") ? m : `http://${m}`;
    return new URL(url).hostname;
  } catch {
    return "";
  }
}

export function detectLink(text = "") {
  const m = text.match(URL_RE);
  if (!m) return null;
  const host = hostFromMatch(m[0]);
  if (host && WHITELIST.some((re) => re.test(host))) return null;
  return m[0];
}
