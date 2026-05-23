import { config } from "../config.js";
import { logger } from "../logger.js";
import { SYSTEM_PROMPT, FEW_SHOTS } from "../persona/prompt.js";

// Rate-limit en mémoire (suffit pour un petit groupe).
const userHits = new Map(); // jid -> [timestamps]
let dayHits = { day: dayKey(), count: 0 };

function dayKey() {
  return new Date().toISOString().slice(0, 10);
}

function allowed(userJid) {
  // Quota journalier global
  const today = dayKey();
  if (dayHits.day !== today) dayHits = { day: today, count: 0 };
  if (dayHits.count >= config.ai.maxPerDay) return false;

  // Quota par utilisateur / heure
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

/**
 * @param {{userJid:string, history:{role:'user'|'assistant', content:string}[], userMessage:string}} args
 * @returns {Promise<string|null>} réponse texte, ou null si quota/erreur
 */
export async function askAyumi({ userJid, history, userMessage }) {
  if (!config.openrouter.apiKey) {
    logger.warn("OPENROUTER_API_KEY manquant — IA désactivée");
    return null;
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

  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.openrouter.apiKey}`,
        "HTTP-Referer": "https://ayumi.local",
        "X-Title": "Ayumi WhatsApp Bot",
      },
      body: JSON.stringify({
        model: config.openrouter.model,
        messages,
        max_tokens: config.ai.maxTokens,
        temperature: 0.85,
      }),
    });

    if (!res.ok) {
      const txt = await res.text();
      logger.error({ status: res.status, txt }, "OpenRouter error");
      return null;
    }
    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content?.trim();
    return text || null;
  } catch (err) {
    logger.error({ err }, "OpenRouter call failed");
    return null;
  }
}
