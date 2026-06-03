import { askAyumi } from "../ai/gemini.js";
import { pickRandom } from "../utils/text.js";
import { GREETINGS } from "../persona/canned.js";
import { buildAiContext } from "../memory/context.js";

export async function ayumi({ args, userJid, pushName, groupJid, botJid }) {
  const userMessage = args.join(" ").trim();
  if (!userMessage) return pickRandom(GREETINGS);
  const { systemExtras, history } = buildAiContext({ groupJid, userJid, botJid });
  return await askAyumi({
    userJid,
    userName: pushName,
    history,
    userMessage,
    systemExtras,
  });
}
