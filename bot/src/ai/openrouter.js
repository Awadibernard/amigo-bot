import { config } from "../config.js";
import { logger } from "../logger.js";
import { SYSTEM_PROMPT, FEW_SHOTS } from "../persona/prompt.js";
import { stats } from "../dashboard/state.js";

const userHits = new Map();
let dayHits = { day: dayKey(), count: 0 };

function dayKey() {
  return new Date().toISOString().slice(0, 10);
}

function allowed(userJid) {
  const today = dayKey();
  if (dayHits.day !== today) dayHits = { day: today, count: 0 };
  if (dayHits.count >= config.ai.maxPerDay) return false;
  const now = Date.now();
  const hourAgo = now - 3600 * 1000;
  const arr = (userHits.get(userJid) || []).filter((t) => t > hourAgo);
  if (arr.length >= config.ai.maxPerUserPerHour) {
    userHits.set(userJid, arr);
    return false;
  }
  arr.push(now);
  userHits.set(userJid, arr);
  dayHits.count += 1;
  return true;
}

// ============ Sanity check au boot ============
const rawKey = config.openrouter.apiKey;
if (!rawKey) {
  logger.error("❌ OPENROUTER_API_KEY manquante dans bot/.env");
} else {
  logger.info(
    {
      length: rawKey.length,
      prefix: rawKey.slice(0, 10) + "…",
      suffix: "…" + rawKey.slice(-4),
      models: config.openrouter.models,
    },
    "✅ OpenRouter prêt",
  );
}
logger.info({ admins: config.adminNumbers }, "👮 Admins détectés");
logger.info(
  {
    blockMedia: config.moderation.blockMedia,
    deleteBlocked: config.moderation.deleteBlocked,
    debug: config.debug,
  },
  "⚙️  Modération",
);

async function callOpenRouter({ apiKey, model, messages }) {
  const body = {
    model,
    messages,
    max_tokens: config.ai.maxTokens,
    temperature: 0.85,
  };

  if (config.debugAi) logger.info({ model, msgs: messages.length }, "→ OpenRouter");

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 25000);

  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": "https://ayumi.local",
        "X-Title": "Ayumi WhatsApp Bot",
      },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

export async function askAyumi({ userJid, history, userMessage }) {
  const apiKey = config.openrouter.apiKey;
  if (!apiKey) {
    return "⚠️ IA indisponible : clé API OpenRouter manquante 🔑";
  }
  if (!allowed(userJid)) {
    return "J'ai déjà trop parlé aujourd'hui, repose-moi plus tard 😮‍💨";
  }

  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    ...FEW_SHOTS,
    ...history,
    { role: "user", content: userMessage },
  ];

  const errors = [];
  for (const model of config.openrouter.models) {
    stats.aiRequests += 1;
    try {
      const res = await callOpenRouter({ apiKey, model, messages });

      if (res.ok) {
        const data = await res.json();
        const text = data?.choices?.[0]?.message?.content?.trim();
        if (text) {
          stats.lastModel = model;
          stats.aiSuccess += 1;
          if (config.debugAi) logger.info({ model, status: 200 }, "← OK");
          return text;
        }
        const errMsg = data?.error?.message || "réponse vide";
        logger.warn({ model, errMsg }, "Réponse vide / erreur soft");
        errors.push(`${model}: ${errMsg.slice(0, 100)}`);
        continue;
      }

      const bodyTxt = await res.text();
      const short = bodyTxt.slice(0, 300);
      logger.error({ status: res.status, model, body: short }, "❌ OpenRouter");
      errors.push(`${model}[${res.status}]: ${short.slice(0, 100)}`);

      if (res.status === 401) {
        return "⚠️ Clé API OpenRouter invalide 🔑";
      }
      if (res.status === 402) {
        return "⚠️ Plus de crédits OpenRouter 💸";
      }
      // 404 (no endpoints), 429 (rate), 5xx → fallback modèle suivant
      continue;
    } catch (err) {
      const msg = err?.message || String(err);
      logger.error({ model, err: msg }, "Call failed");
      errors.push(`${model}: ${msg.slice(0, 100)}`);
    }
  }

  stats.aiErrors += 1;
  if (config.debug) {
    logger.error({ errors }, "Tous les modèles ont échoué");
  }
  return "⚠️ IA indisponible temporairement";
}
