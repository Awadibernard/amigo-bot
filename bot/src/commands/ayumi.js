import { askAyumi } from "../ai/gemini.js";
import { recentMessages } from "../db/repo.js";
import { pickRandom } from "../utils/text.js";
import { GREETINGS } from "../persona/canned.js";

export async function ayumi({ args, userJid, groupJid }) {
  const userMessage = args.join(" ").trim();
  if (!userMessage) return pickRandom(GREETINGS);

  const recent = recentMessages(groupJid, 10).map((m) => ({
    role: "user",
    content: m.content,
  }));

  return await askAyumi({ userJid, history: recent, userMessage });
}
