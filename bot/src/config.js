import "dotenv/config";

const parseList = (s) =>
  (s || "")
    .split(",")
    .map((x) =>
      x
        .trim()
        .replace(/@s\.whatsapp\.net$/, "")
        .replace(/^\+/, "")
        .replace(/\s+/g, ""),
    )
    .filter(Boolean);

const bool = (v, def = false) => {
  if (v === undefined || v === null || v === "") return def;
  return String(v).toLowerCase() === "true";
};

export const config = {
  groupJid: process.env.GROUP_JID || "",
  adminNumbers: parseList(process.env.ADMIN_NUMBERS),
  testMode: bool(process.env.TEST_MODE, false),

  gemini: {
    apiKey: (process.env.GEMINI_API_KEY || "").trim(),
    model: (process.env.GEMINI_MODEL || "gemini-2.5-flash").trim(),
    timeoutMs: 25000,
  },

  logLevel: process.env.LOG_LEVEL || "info",
  debug: bool(process.env.DEBUG, false),
  debugAi: bool(process.env.DEBUG_AI, false),
  tz: process.env.TZ || "Europe/Paris",
  dashboardPort: parseInt(process.env.DASHBOARD_PORT || "3000", 10),

  moderation: {
    blockLinks: bool(process.env.BLOCK_LINKS, true),
    // Stickers TOUJOURS autorisés. BLOCK_MEDIA agit sur image/video/audio/doc/gif.
    blockMedia: bool(process.env.BLOCK_MEDIA, false),
    deleteBlocked: bool(process.env.DELETE_BLOCKED, true),
  },

  flood: { windowMs: 7000, maxMessages: 5 },
  warnings: { maxBeforeNotice: 3 },
  ai: {
    maxPerUserPerHour: 5,
    maxPerDay: 200,
    historyLength: 12,
    maxTokens: 256,
  },
  silenceMinutes: 240,

  proactive: {
    enabled: bool(process.env.PROACTIVE_MODE, true),
    maxPerDay: parseInt(process.env.MAX_PROACTIVE_MESSAGES_PER_DAY || "2", 10),
    welcomeNewMembers: bool(process.env.WELCOME_NEW_MEMBERS, true),
  },
  games: {
    autoFridayQuiz: bool(process.env.AUTO_FRIDAY_QUIZ, true),
  },
};
