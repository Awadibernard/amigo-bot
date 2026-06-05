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
const num = (v, def) => {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : def;
};

export const config = {
  groupJid: process.env.GROUP_JID || "",
  adminNumbers: parseList(process.env.ADMIN_NUMBERS),
  testMode: bool(process.env.TEST_MODE, false),
  conversationalMode: bool(process.env.CONVERSATIONAL_MODE, true),

  gemini: {
    apiKey: (process.env.GEMINI_API_KEY || "").trim(),
    model: (process.env.GEMINI_MODEL || "gemini-2.5-flash").trim(),
    timeoutMs: num(process.env.GEMINI_TIMEOUT_MS, 45000),
  },

  logLevel: process.env.LOG_LEVEL || "info",
  debug: bool(process.env.DEBUG, false),
  debugAi: bool(process.env.DEBUG_AI, false),
  debugConversation: bool(process.env.DEBUG_CONVERSATION, false),
  tz: process.env.TZ || "Europe/Paris",
  dashboardPort: num(process.env.DASHBOARD_PORT, 3000),

  moderation: {
    blockLinks: bool(process.env.BLOCK_LINKS, true),
    blockMedia: bool(process.env.BLOCK_MEDIA, false),
    deleteBlocked: bool(process.env.DELETE_BLOCKED, true),
  },

  flood: { windowMs: 7000, maxMessages: 5 },
  warnings: { maxBeforeNotice: 3 },
  ai: {
    maxPerUserPerHour: num(process.env.AI_MAX_PER_USER_PER_HOUR, 10),
    maxPerDay: num(process.env.AI_MAX_PER_DAY, 400),
    historyLength: num(process.env.AI_HISTORY_LENGTH, 12),
    maxTokens: num(process.env.AI_MAX_TOKENS, 2048),
    memFactsLimit: num(process.env.AI_MEM_FACTS_LIMIT, 5),
    summarizeEvery: num(process.env.AI_SUMMARIZE_EVERY, 50),
    debugBufferSize: num(process.env.DEBUG_BUFFER_SIZE, 300),
  },
  silenceMinutes: num(process.env.SILENCE_MINUTES, 240),

  proactive: {
    enabled: bool(process.env.PROACTIVE_MODE, true),
    maxPerDay: num(process.env.MAX_PROACTIVE_MESSAGES_PER_DAY, 2),
    welcomeNewMembers: bool(process.env.WELCOME_NEW_MEMBERS, true),
  },
  scheduler: {
    quizAuto: bool(process.env.QUIZ_AUTO, true),
    debateAuto: bool(process.env.DEBAT_AUTO, true),
    birthdaysAuto: bool(process.env.ANNIVERSAIRES_AUTO, true),
    maxQuizAutoPerWeek: num(process.env.MAX_QUIZ_AUTO_PER_WEEK, 2),
    maxDebateAutoPerWeek: num(process.env.MAX_DEBAT_AUTO_PER_WEEK, 1),
  },
  // ancien alias conservé pour rétro-compat
  games: { autoFridayQuiz: bool(process.env.QUIZ_AUTO, true) },
};
