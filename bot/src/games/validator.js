// ============================================================
// VALIDATOR — heuristiques pures (pas d'IA) pour qualifier la
// réponse d'un joueur à un prompt de jeu.
// Retourne: { ok: bool, kind: "valid"|"weak"|"empty"|"spam"|"troll", reason }
// ============================================================

const TROLL_WORDS = [
  "ntm", "fdp", "pute", "salope", "tg", "ta gueule", "connard",
  "enculé", "encule", "merde", "chier", "batard",
];

export function validateResponse(text, { minChars = 2 } = {}) {
  const raw = String(text || "").trim();
  if (!raw || raw.length < minChars) {
    return { ok: false, kind: "empty", reason: "too-short" };
  }
  // spam : un seul char répété
  const dedup = raw.replace(/\s+/g, "");
  if (dedup.length >= 4) {
    const counts = {};
    for (const c of dedup.toLowerCase()) counts[c] = (counts[c] || 0) + 1;
    const max = Math.max(...Object.values(counts));
    if (max / dedup.length > 0.7) {
      return { ok: false, kind: "spam", reason: "repeated-char" };
    }
  }
  const lower = raw.toLowerCase();
  const insulted = TROLL_WORDS.some((w) => lower.includes(w));
  if (insulted && raw.length < 25) {
    return { ok: false, kind: "troll", reason: "insult-short" };
  }
  if (raw.length < 8) {
    return { ok: true, kind: "weak", reason: "short" };
  }
  return { ok: true, kind: "valid", reason: "ok" };
}
