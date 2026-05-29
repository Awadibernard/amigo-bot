import { config } from "../config.js";
import { logger } from "../logger.js";
import { SYSTEM_PROMPT, FEW_SHOTS } from "../persona/prompt.js";

// Rate-limit en mémoire (suffit pour un petit groupe).
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
  logger.error(
    "❌ OPENROUTER_API_KEY est undefined/vide. Vérifie bot/.env (même dossier que package.json) puis redémarre.",
  );
} else {
  logger.info(
    {
      length: rawKey.length,
      prefix: rawKey.slice(0, 10),
      suffix: rawKey.slice(-4),
      startsWithSkOr: rawKey.startsWith("sk-or-"),
      model: config.openrouter.model,
      debugAi: config.debugAi,
    },
    "✅ OPENROUTER_API_KEY chargée",
  );
}

async function callOpenRouter({ apiKey, model, messages }) {
  const body = {
    model,
    messages,
    max_tokens: config.ai.maxTokens,
    temperature: 0.85,
  };

  if (config.debugAi) {
    logger.info({ model, msgCount: messages.length }, "→ OpenRouter request");
  }

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": "https://ayumi.local",
      "X-Title": "Ayumi WhatsApp Bot",
    },
    body: JSON.stringify(body),
  });

  if (config.debugAi) {
    logger.info({ status: res.status, model }, "← OpenRouter response");
  }
  return res;
}

/**
 * @returns {Promise<string|null>}
 */
export async function askAyumi({ userJid, history, userMessage }) {
  const apiKey = config.openrouter.apiKey;
  if (!apiKey) {
    logger.error("OPENROUTER_API_KEY manquant au runtime — IA désactivée");
    return "Mon cerveau bug : clé API OpenRouter manquante 🔑 (vérifie bot/.env)";
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

  const models = [config.openrouter.model];
  if (config.openrouter.fallbackModel && config.openrouter.fallbackModel !== config.openrouter.model) {
    models.push(config.openrouter.fallbackModel);
  }

  let lastErrText = "";
  for (const model of models) {
    try {
      const res = await callOpenRouter({ apiKey, model, messages });
      if (res.ok) {
        const data = await res.json();
        const text = data?.choices?.[0]?.message?.content?.trim();
        if (text) return text;
        logger.warn({ data }, "Réponse OpenRouter vide");
        return "Mon cerveau bug : réponse vide 🤔";
      }

      const txt = await res.text();
      lastErrText = txt.slice(0, 500);
      logger.error(
        { status: res.status, body: lastErrText, model },
        "❌ OpenRouter API error",
      );

      if (res.status === 401) {
        return "Mon cerveau bug : clé API OpenRouter invalide ou mal envoyée 🔑";
      }
      if (res.status === 402) return "Mon cerveau bug : plus de crédits OpenRouter 💸";
      if (res.status === 429) return "Trop de questions d'un coup, laisse-moi respirer 😮‍💨";
      if (res.status === 404) {
        logger.warn({ model }, "Modèle introuvable, tentative fallback...");
        continue; // essaie le modèle suivant
      }
      return "Mon cerveau bug, réessaie plus tard 😴";
    } catch (err) {
      logger.error({ err: err?.message || String(err), model }, "OpenRouter call failed");
      lastErrText = err?.message || String(err);
    }
  }
  return `Mon cerveau bug : aucun modèle dispo (${lastErrText.slice(0, 80)}) 🌐`;
}
