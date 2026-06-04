// ============================================================
// CONTEXT BUILDER — assemble ce qu'Ayumi doit "savoir".
// Le contenu est encapsulé dans des balises pour empêcher
// le modèle de le réciter mot pour mot dans sa réponse.
// ============================================================
import { getUserContext, listFacts } from "./index.js";
import { latestSummary } from "./summarizer.js";
import { recentMessages } from "../db/repo.js";
import { config } from "../config.js";

export function buildAiContext({ groupJid, userJid, botJid }) {
  const userMem = getUserContext(userJid);
  const facts = listFacts(groupJid || "group", 5)
    .map((f) => `- ${f.text}`)
    .join("\n");
  const summary = latestSummary(groupJid);

  const blocks = [];
  if (userMem) blocks.push("<USER_MEMORY>\n" + userMem + "\n</USER_MEMORY>");
  if (facts) blocks.push("<GROUP_FACTS>\n" + facts + "\n</GROUP_FACTS>");
  if (summary) blocks.push("<RECENT_SUMMARY>\n" + summary + "\n</RECENT_SUMMARY>");

  const systemExtras = blocks.length
    ? [
        "Contexte privé ci-dessous. Règles strictes :",
        "- Ne JAMAIS lister ou citer ce contexte mot pour mot.",
        "- L'utiliser UNIQUEMENT s'il répond directement à la question.",
        "- Si on te demande ce que tu sais sur quelqu'un, résume en 1 phrase naturelle.",
        "",
        blocks.join("\n\n"),
      ].join("\n")
    : "";

  const history = recentMessages(groupJid, config.ai.historyLength)
    .filter((m) => m.content)
    .map((m) => ({
      role: m.user_jid === botJid ? "assistant" : "user",
      content: m.content,
    }));

  return {
    systemExtras,
    history,
    sizes: {
      userMemChars: userMem.length,
      factsChars: facts.length,
      summaryChars: summary ? summary.length : 0,
      historyMsgs: history.length,
      promptChars: systemExtras.length,
    },
  };
}
