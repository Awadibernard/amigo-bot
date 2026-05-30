// État partagé entre le bot et le dashboard
export const stats = {
  startedAt: Date.now(),
  whatsappConnected: false,
  botJid: "",
  aiRequests: 0,
  aiSuccess: 0,
  aiErrors: 0,
  lastModel: "",
  messagesSeen: 0,
  commandsRun: 0,
  warnsIssued: 0,
  deletes: 0,
};

// Ring buffer de logs pour le dashboard
const MAX_LOGS = 300;
const logs = [];

export function pushLog(level, obj, msg) {
  logs.push({ t: Date.now(), level, obj, msg });
  if (logs.length > MAX_LOGS) logs.shift();
}

export function getLogs() {
  return logs;
}
