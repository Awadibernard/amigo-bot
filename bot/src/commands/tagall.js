import { requireAdmin } from "./_admin.js";

/**
 * /tagall [message] — mentionne tous les membres du groupe.
 */
export async function tagall({ sock, groupJid, userJid, args }) {
  const denied = requireAdmin(userJid);
  if (denied) return denied;

  try {
    const meta = await sock.groupMetadata(groupJid);
    const jids = meta.participants.map((p) => p.id);
    const note = args.join(" ").trim() || "📣 Rassemblement général !";
    const body =
      note +
      "\n\n" +
      meta.participants.map((p) => `• @${p.id.split("@")[0]}`).join("\n");
    await sock.sendMessage(groupJid, { text: body, mentions: jids });
    return null;
  } catch {
    return "❌ Impossible de lire la liste du groupe.";
  }
}
