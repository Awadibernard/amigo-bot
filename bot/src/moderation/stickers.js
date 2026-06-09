// ============================================================
// MODÉRATION STICKERS — pipeline indépendant.
// 1) sticker reçu  2) Gemini Vision classifie  3) action si NSFW/violence
// JAMAIS de description — uniquement classification booléenne.
// ============================================================
import { config } from "../config.js";
import { logger } from "../logger.js";
import { stats } from "../dashboard/state.js";

const PROMPT = `Tu es un classifieur d'images STRICT. Tu reçois une image.
Ta tâche : classifier UNIQUEMENT. Ne décris rien. Ne nomme rien.
Réponds STRICTEMENT en JSON :
{"sexual":bool,"violence":bool,"safe":bool,"confidence":0..1}
- sexual: contenu sexuel/nudité.
- violence: violence graphique, sang, armes pointées sur des gens.
- safe: aucun des deux ci-dessus.
- confidence: certitude globale 0..1.
Aucun autre texte.`;

const recent = []; // ring buffer pour dashboard
function logSticker(entry) {
  recent.unshift({ ts: Date.now(), ...entry });
  if (recent.length > 100) recent.pop();
}
export function recentStickerLog() {
  return recent;
}

function parseJson(text) {
  if (!text) return null;
  const m = text.replace(/```(?:json)?/gi, "").match(/\{[\s\S]*\}/);
  if (!m) return null;
  try { return JSON.parse(m[0]); } catch { return null; }
}

/**
 * @param {Buffer|null} imageBuffer  PNG/WebP/JPEG bytes
 */
export async function classifySticker(imageBuffer) {
  if (!config.stickers?.moderation) return { skipped: true };
  if (!config.gemini.apiKey) return { skipped: true, reason: "no-key" };
  if (!imageBuffer || !imageBuffer.length) return { skipped: true, reason: "no-image" };

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    config.gemini.model,
  )}:generateContent?key=${encodeURIComponent(config.gemini.apiKey)}`;
  const body = {
    contents: [{
      role: "user",
      parts: [
        { text: PROMPT },
        { inline_data: { mime_type: "image/png", data: imageBuffer.toString("base64") } },
      ],
    }],
    generationConfig: { temperature: 0, maxOutputTokens: 100 },
  };
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), config.gemini.timeoutMs);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    if (!res.ok) {
      const txt = (await res.text()).slice(0, 200);
      logger.warn({ status: res.status, txt }, "sticker classify failed");
      return { error: true, status: res.status };
    }
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text).filter(Boolean).join("").trim();
    const parsed = parseJson(text);
    if (!parsed) return { error: true, reason: "parse" };
    return parsed;
  } catch (err) {
    return { error: true, reason: err?.message || "fetch" };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Décide l'action selon les seuils.
 * @returns {{action:"delete"|"warn"|"keep", reason:string, score:object}}
 */
export function decideAction(verdict) {
  if (!verdict || verdict.skipped || verdict.error) {
    return { action: "keep", reason: verdict?.reason || "no-verdict", score: verdict };
  }
  const t = config.stickers || {};
  const conf = Number(verdict.confidence || 0);
  if (verdict.sexual && conf >= (t.nsfwThreshold || 0.8))
    return { action: "delete", reason: "nsfw", score: verdict };
  if (verdict.violence && conf >= (t.violenceThreshold || 0.8))
    return { action: "delete", reason: "violence", score: verdict };
  return { action: "keep", reason: "safe", score: verdict };
}

/**
 * Hook appelé depuis handleMessage avant l'addressing.
 * @param {{sock,msg,groupJid,userJid,pushName}} ctx
 * @param {Buffer|null} buf  image décodée (optionnelle ; null => skip)
 */
export async function moderateSticker(ctx, buf) {
  const verdict = await classifySticker(buf);
  const decision = decideAction(verdict);
  logSticker({
    userJid: ctx.userJid,
    pushName: ctx.pushName,
    groupJid: ctx.groupJid,
    verdict,
    decision,
  });
  stats.stickersChecked = (stats.stickersChecked || 0) + 1;
  if (decision.action === "delete") {
    stats.stickersBlocked = (stats.stickersBlocked || 0) + 1;
  }
  return decision;
}
