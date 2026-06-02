import { askAyumi } from "../ai/gemini.js";
import { recentMessages } from "../db/repo.js";
import { pickRandom } from "../utils/text.js";
import { GREETINGS } from "../persona/canned.js";

export async function ayumi({ args, userJid, pushName, groupJid, botJid }) {
  const userMessage = args.join(" ").trim();
  if (!userMessage) return pickRandom(GREETINGS);

  const recent = recentMessages(groupJid, 10)
    .filter((m) => m.content)
    .map((m) => ({
      role: m.user_jid === botJid ? "assistant" : "user",
      content: m.content,
    }));

  return await askAyumi({
    userJid,
    userName: pushName,
    history: recent,
    userMessage,
  });
}
