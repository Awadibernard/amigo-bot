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

// Sanity check au boot : la clé est-elle bien chargée ?
const rawKey = (config.openrouter.apiKey || "").trim();
if (!rawKey) {
  logger.error(
    "❌ OPENROUTER_API_KEY manquant. Vérifie ton .env (à la racine du dossier bot/) et redémarre.",
  );
} else {
  logger.info(
    {
      length: rawKey.length,
      prefix: rawKey.slice(0, 7),
      suffix: rawKey.slice(-4),
      startsWithSk: rawKey.startsWith("sk-or-"),
      model: config.openrouter.model,
    },
    "✅ OPENROUTER_API_KEY chargée",
  );
}

/**
 * @param {{userJid:string, history:{role:'user'|'assistant', content:string}[], userMessage:string}} args
 * @returns {Promise<string|null>}
 */
export async function askAyumi({ userJid, history, userMessage }) {
  const apiKey = (config.openrouter.apiKey || "").trim();
  if (!apiKey) {
    logger.warn("OPENROUTER_API_KEY manquant — IA désactivée");
    return "Mon cerveau bug : je n'ai pas ma clé API OpenRouter 🔑";
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
        Authorization: `Bearer ${apiKey}`,
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
      logger.error(
        { status: res.status, body: txt.slice(0, 500), model: config.openrouter.model },
        "OpenRouter API error",
      );
      if (res.status === 401) {
        return "Mon cerveau bug : clé API OpenRouter invalide ou mal envoyée 🔑";
      }
      if (res.status === 402) {
        return "Mon cerveau bug : plus de crédits OpenRouter 💸";
      }
      if (res.status === 429) {
        return "Trop de questions d'un coup, laisse-moi respirer 😮‍💨";
      }
      if (res.status === 404) {
        return `Mon cerveau bug : modèle introuvable (${config.openrouter.model}) 🤖`;
      }
      return "Mon cerveau bug, réessaie plus tard 😴";
    }

    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content?.trim();
    if (!text) {
      logger.warn({ data }, "Réponse OpenRouter vide");
      return "Mon cerveau bug : réponse vide 🤔";
    }
    return text;
  } catch (err) {
    logger.error({ err: err?.message || err }, "OpenRouter call failed");
    return "Mon cerveau bug : erreur réseau avec OpenRouter 🌐";
  }
}
