// ============================================================
// CONTEXT BUILDER — assemble tout ce qu'Ayumi doit "savoir"
// avant de générer une réponse.
// ============================================================
import { getUserContext, latestSummary, listFacts } from "./index.js";
import { recentMessages } from "../db/repo.js";
import { config } from "../config.js";

/**
 * Renvoie { systemExtras, history } prêts à injecter dans Gemini.
 * - systemExtras : texte additionnel pour le system prompt
 *   (mémoire user + faits groupe + dernier résumé)
 * - history : derniers messages bruts au format {role, content}
 */
export function buildAiContext({ groupJid, userJid, botJid }) {
  const userMem = getUserContext(userJid);
  const facts = listFacts(groupJid || "group", 5)
    .map((f) => `- ${f.text}`)
    .join("\n");
  const summary = latestSummary(groupJid);

  const parts = [];
  if (userMem) parts.push("Mémoire utilisateur :\n" + userMem);
  if (facts) parts.push("Faits notables du groupe :\n" + facts);
  if (summary) parts.push("Résumé des échanges récents :\n" + summary);

  const history = recentMessages(groupJid, config.ai.historyLength)
    .filter((m) => m.content)
    .map((m) => ({
      role: m.user_jid === botJid ? "assistant" : "user",
      content: m.content,
    }));

  return {
    systemExtras: parts.join("\n\n"),
    history,
    sizes: {
      userMem: userMem.length,
      facts: facts.length,
      summary: summary ? summary.length : 0,
      history: history.length,
    },
  };
}
