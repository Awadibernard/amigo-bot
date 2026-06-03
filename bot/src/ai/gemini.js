// ============================================================
// AI — Google Gemini (avec personnalité Ayumi + mémoire + résumés)
// ============================================================
import { config } from "../config.js";
import { logger } from "../logger.js";
import { buildSystemPrompt, FEW_SHOTS } from "./personality.js";
import { stats } from "../dashboard/state.js";

const key = config.gemini.apiKey;
if (!key) {
  logger.error("❌ GEMINI_API_KEY manquante dans bot/.env");
} else {
  logger.info(
    {
      length: key.length,
      prefix: key.slice(0, 6) + "…",
      model: config.gemini.model,
      maxTokens: config.ai.maxTokens,
      timeoutMs: config.gemini.timeoutMs,
    },
    "✅ Gemini prêt",
  );
}

// ===== Quotas =====
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

function toGeminiContents(history, userMessage, includeFewShots) {
  const all = [
    ...(includeFewShots ? FEW_SHOTS : []),
    ...history,
    { role: "user", content: userMessage },
  ];
  return all.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));
}

/**
 * @param {{
 *   userJid: string, userName?: string,
 *   history?: Array<{role,content}>,
 *   historyOverride?: Array<{role,content}>,
 *   userMessage: string,
 *   systemExtras?: string,
 *   bypassQuota?: boolean,
 *   isInternal?: boolean,  // résumé/extracteur : pas de few-shots + log discret
 * }} args
 */
export async function askAyumi({
  userJid,
  userName,
  history = [],
  historyOverride,
  userMessage,
  systemExtras = "",
  bypassQuota = false,
  isInternal = false,
}) {
  if (!config.gemini.apiKey) {
    stats.aiErrors += 1;
    stats.lastAiError = "GEMINI_API_KEY manquante";
    return "⚠️ IA indisponible : clé GEMINI_API_KEY manquante 🔑";
  }
  if (!bypassQuota && !allowed(userJid)) {
    return "J'ai déjà trop parlé aujourd'hui, repose-moi plus tard 😮‍💨";
  }

  const model = config.gemini.model;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    model,
  )}:generateContent?key=${encodeURIComponent(config.gemini.apiKey)}`;

  const systemPrompt = isInternal
    ? systemExtras || "Réponds de manière concise et factuelle."
    : buildSystemPrompt({
        userName,
        userContext: systemExtras,
      });

  const hist = historyOverride !== undefined ? historyOverride : history;
  const body = {
    systemInstruction: { parts: [{ text: systemPrompt }] },
    contents: toGeminiContents(hist, userMessage, !isInternal),
    generationConfig: {
      temperature: isInternal ? 0.3 : 0.9,
      maxOutputTokens: config.ai.maxTokens,
    },
  };

  const promptChars =
    systemPrompt.length +
    body.contents.reduce((n, c) => n + (c.parts?.[0]?.text?.length || 0), 0);

  if (config.debugAi) {
    logger.info(
      { model, msgs: body.contents.length, promptChars, internal: isInternal },
      "→ Gemini",
    );
  }

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), config.gemini.timeoutMs);
  const t0 = Date.now();
  if (!isInternal) {
    stats.aiRequests += 1;
    stats.lastModel = model;
    stats.lastContextSize = body.contents.length;
    stats.lastPromptChars = promptChars;
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    const ms = Date.now() - t0;
    if (!isInternal) {
      stats.lastAiStatus = res.status;
      stats.lastAiLatencyMs = ms;
      stats.totalAiLatencyMs = (stats.totalAiLatencyMs || 0) + ms;
    }

    if (!res.ok) {
      const txt = (await res.text()).slice(0, 500);
      stats.aiErrors += 1;
      stats.lastAiError = `HTTP ${res.status}: ${txt.slice(0, 200)}`;
      pushAiError({ status: res.status, body: txt, model });
      logger.error({ status: res.status, model, body: txt }, "❌ Gemini");
      if (res.status === 401 || res.status === 403)
        return "⚠️ Clé GEMINI_API_KEY invalide 🔑";
      if (res.status === 429) return "⚠️ Gemini : quota dépassé, réessaie plus tard 🐢";
      if (res.status === 400) return "⚠️ Requête IA invalide.";
      return "⚠️ IA indisponible temporairement";
    }

    const data = await res.json();
    const cand = data?.candidates?.[0];
    const text = cand?.content?.parts
      ?.map((p) => p.text)
      .filter(Boolean)
      .join("")
      .trim();
    const truncated = cand?.finishReason === "MAX_TOKENS";

    if (!text) {
      stats.aiErrors += 1;
      const blocked = data?.promptFeedback?.blockReason;
      stats.lastAiError = blocked ? `bloqué: ${blocked}` : "réponse vide";
      pushAiError({ status: 200, body: blocked || "empty", model });
      logger.warn({ blocked, finishReason: cand?.finishReason }, "Gemini vide");
      return blocked
        ? "🙊 Gemini a bloqué la réponse (safety)."
        : "🤔 (réponse vide)";
    }

    if (!isInternal) {
      stats.aiSuccess += 1;
      stats.lastAiError = "";
      stats.lastResponseChars = text.length;
      if (truncated) {
        stats.truncatedResponses = (stats.truncatedResponses || 0) + 1;
        logger.warn({ chars: text.length }, "✂️ réponse tronquée (MAX_TOKENS)");
      }
    }
    if (config.debugAi) {
      logger.info(
        { model, status: 200, ms, chars: text.length, truncated },
        "← Gemini OK",
      );
    }
    return text;
  } catch (err) {
    stats.aiErrors += 1;
    const msg = err?.name === "AbortError" ? "timeout" : err?.message || String(err);
    stats.lastAiError = msg;
    pushAiError({ status: 0, body: msg, model });
    logger.error({ err: msg, model }, "Gemini call failed");
    return msg === "timeout"
      ? "⏱️ Gemini a mis trop de temps."
      : "⚠️ IA indisponible (réseau).";
  } finally {
    clearTimeout(timer);
  }
}

function pushAiError(e) {
  stats.recentAiErrors = stats.recentAiErrors || [];
  stats.recentAiErrors.push({ ...e, ts: Date.now() });
  if (stats.recentAiErrors.length > 15) stats.recentAiErrors.shift();
}
