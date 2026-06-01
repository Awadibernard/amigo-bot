import { config } from "../config.js";
import { logger } from "../logger.js";
import { SYSTEM_PROMPT, FEW_SHOTS } from "../persona/prompt.js";
import { stats } from "../dashboard/state.js";

// ============ Sanity check au boot ============
const key = config.gemini.apiKey;
if (!key) {
  logger.error("❌ GEMINI_API_KEY manquante dans bot/.env");
} else {
  logger.info(
    {
      length: key.length,
      prefix: key.slice(0, 6) + "…",
      suffix: "…" + key.slice(-4),
      model: config.gemini.model,
    },
    "✅ Gemini prêt",
  );
}

// ============ Quotas locaux (anti-abus) ============
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

// ============ Appel API Gemini ============
function toGeminiContents(history, userMessage) {
  // Few-shots + history + dernier message
  const all = [...FEW_SHOTS, ...history, { role: "user", content: userMessage }];
  return all.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));
}

export async function askAyumi({ userJid, history, userMessage }) {
  if (!config.gemini.apiKey) {
    stats.aiErrors += 1;
    stats.lastAiError = "GEMINI_API_KEY manquante";
    return "⚠️ IA indisponible : clé GEMINI_API_KEY manquante 🔑";
  }
  if (!allowed(userJid)) {
    return "J'ai déjà trop parlé aujourd'hui, repose-moi plus tard 😮‍💨";
  }

  const model = config.gemini.model;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    model,
  )}:generateContent?key=${encodeURIComponent(config.gemini.apiKey)}`;

  const body = {
    systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents: toGeminiContents(history, userMessage),
    generationConfig: {
      temperature: 0.85,
      maxOutputTokens: config.ai.maxTokens,
    },
  };

  if (config.debugAi) {
    logger.info({ model, msgs: body.contents.length }, "→ Gemini");
  }

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), config.gemini.timeoutMs);
  const t0 = Date.now();
  stats.aiRequests += 1;
  stats.lastModel = model;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    const ms = Date.now() - t0;
    stats.lastAiStatus = res.status;
    stats.lastAiLatencyMs = ms;

    if (!res.ok) {
      const txt = (await res.text()).slice(0, 500);
      stats.aiErrors += 1;
      stats.lastAiError = `HTTP ${res.status}: ${txt.slice(0, 200)}`;
      logger.error({ status: res.status, model, body: txt }, "❌ Gemini");
      if (res.status === 401 || res.status === 403)
        return "⚠️ Clé GEMINI_API_KEY invalide 🔑";
      if (res.status === 429) return "⚠️ Gemini : quota dépassé, réessaie plus tard 🐢";
      if (res.status === 400) return "⚠️ Requête IA invalide.";
      return "⚠️ IA indisponible temporairement";
    }

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts
      ?.map((p) => p.text)
      .filter(Boolean)
      .join("")
      .trim();

    if (!text) {
      stats.aiErrors += 1;
      const blocked = data?.promptFeedback?.blockReason;
      stats.lastAiError = blocked ? `bloqué: ${blocked}` : "réponse vide";
      logger.warn({ blocked, data: JSON.stringify(data).slice(0, 300) }, "Gemini vide");
      return blocked
        ? "🙊 Gemini a bloqué la réponse (safety)."
        : "🤔 (réponse vide)";
    }

    stats.aiSuccess += 1;
    stats.lastAiError = "";
    if (config.debugAi) logger.info({ model, status: 200, ms }, "← Gemini OK");
    return text;
  } catch (err) {
    stats.aiErrors += 1;
    const msg = err?.name === "AbortError" ? "timeout" : err?.message || String(err);
    stats.lastAiError = msg;
    logger.error({ err: msg, model }, "Gemini call failed");
    return msg === "timeout"
      ? "⏱️ Gemini a mis trop de temps."
      : "⚠️ IA indisponible (réseau).";
  } finally {
    clearTimeout(timer);
  }
}
