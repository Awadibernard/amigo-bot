import "dotenv/config";

const parseList = (s) =>
  (s || "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);

export const config = {
  groupJid: process.env.GROUP_JID || "",
  adminNumbers: parseList(process.env.ADMIN_NUMBERS),
  openrouter: {
    apiKey: process.env.OPENROUTER_API_KEY || "",
    model: process.env.OPENROUTER_MODEL || "meta-llama/llama-3.1-8b-instruct:free",
  },
  logLevel: process.env.LOG_LEVEL || "info",
  tz: process.env.TZ || "Europe/Paris",

  // Limites MVP (faciles à ajuster)
  flood: { windowMs: 7000, maxMessages: 5 }, // 5 msg / 7s = flood
  warnings: { maxBeforeNotice: 3 }, // au-delà : message d'alerte (pas de kick auto)
  ai: {
    maxPerUserPerHour: 5,
    maxPerDay: 200,
    historyLength: 12, // nb de messages récents envoyés au modèle
    maxTokens: 220,
  },
  silenceMinutes: 240, // 4h sans message -> relance possible
};
