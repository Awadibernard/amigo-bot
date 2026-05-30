import "dotenv/config";

const parseList = (s) =>
  (s || "")
    .split(",")
    .map((x) => x.trim().replace(/@s\.whatsapp\.net$/, "").replace(/^\+/, ""))
    .filter(Boolean);

const bool = (v, def = false) => {
  if (v === undefined || v === null || v === "") return def;
  return String(v).toLowerCase() === "true";
};

// Liste de modèles tentés dans l'ordre (fallback automatique)
const DEFAULT_MODELS = [
  "deepseek/deepseek-chat-v3.1:free",
  "meta-llama/llama-3.3-70b-instruct:free",
  "meta-llama/llama-3.1-8b-instruct:free",
  "mistralai/mistral-7b-instruct:free",
  "google/gemma-2-9b-it:free",
];

const primary = (process.env.OPENROUTER_MODEL || "").trim();
const models = primary
  ? [primary, ...DEFAULT_MODELS.filter((m) => m !== primary)]
  : DEFAULT_MODELS;

export const config = {
  groupJid: process.env.GROUP_JID || "",
  adminNumbers: parseList(process.env.ADMIN_NUMBERS),
  openrouter: {
    apiKey: (process.env.OPENROUTER_API_KEY || "").trim(),
    model: models[0],
    models,
  },
  logLevel: process.env.LOG_LEVEL || "info",
  debug: bool(process.env.DEBUG, false),
  debugAi: bool(process.env.DEBUG_AI, false),
  tz: process.env.TZ || "Europe/Paris",
  dashboardPort: parseInt(process.env.DASHBOARD_PORT || "3000", 10),

  moderation: {
    // Par défaut : stickers et médias autorisés (BLOCK_MEDIA=false)
    blockMedia: bool(process.env.BLOCK_MEDIA, false),
    deleteBlocked: bool(process.env.DELETE_BLOCKED, true),
  },

  flood: { windowMs: 7000, maxMessages: 5 },
  warnings: { maxBeforeNotice: 3 },
  ai: {
    maxPerUserPerHour: 5,
    maxPerDay: 200,
    historyLength: 12,
    maxTokens: 220,
  },
  silenceMinutes: 240,
};
