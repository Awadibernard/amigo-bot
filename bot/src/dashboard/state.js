// État partagé entre le bot et le dashboard
export const stats = {
  startedAt: Date.now(),
  whatsappConnected: false,
  botJid: "",

  // IA
  aiRequests: 0,
  aiSuccess: 0,
  aiErrors: 0,
  lastModel: "",
  lastAiStatus: 0,
  lastAiError: "",
  lastAiLatencyMs: 0,
  totalAiLatencyMs: 0,
  lastContextSize: 0,
  lastPromptChars: 0,
  lastResponseChars: 0,
  truncatedResponses: 0,
  recentAiErrors: [],

  // Activité
  messagesSeen: 0,
  commandsRun: 0,
  warnsIssued: 0,
  deletes: 0,
  duplicatesSkipped: 0,

  // Mémoire / sessions / jeux
  summariesStored: 0,
  autoFactsExtracted: 0,

  // Proactif
  proactiveSentToday: 0,
  proactiveDay: "",
  quizAutoSentToday: 0,
  debateAutoSentToday: 0,
  scheduledRunCount: 0,

  // Dernier prompt envoyé (debug)
  lastContext: null, // { systemExtras, history, userMessage, ts, userJid, groupJid, sizes }
  lastDecision: null, // { decision, reason, ts }
};

const MAX_LOGS = 300;
const logs = [];

export function pushLog(level, obj, msg) {
  logs.push({ t: Date.now(), level, obj, msg });
  if (logs.length > MAX_LOGS) logs.shift();
}

export function getLogs() {
  return logs;
}

// ===== Ring buffer DEBUG_CONVERSATION =====
import { config } from "../config.js";
const MAX_DEBUG = config.ai?.debugBufferSize || 300;
const debugBuf = [];

export function pushDebug(entry) {
  debugBuf.push({ ts: Date.now(), ...entry });
  if (debugBuf.length > MAX_DEBUG) debugBuf.shift();
  stats.lastDecision = {
    decision: entry.decision,
    reason: entry.reason,
    ts: Date.now(),
  };
}

export function getDebug() {
  return debugBuf;
}

export function setLastContext(ctx) {
  stats.lastContext = { ts: Date.now(), ...ctx };
}
