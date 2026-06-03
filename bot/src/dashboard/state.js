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

  // Mémoire / sessions / jeux
  summariesStored: 0,
  autoFactsExtracted: 0,

  // Proactif
  proactiveSentToday: 0,
  proactiveDay: "",
  quizAutoSentToday: 0,
  debateAutoSentToday: 0,
  scheduledRunCount: 0,
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
