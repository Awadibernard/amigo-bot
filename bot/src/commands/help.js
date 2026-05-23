export async function help() {
  return [
    "*Commandes Ayumi* :",
    "• /ayumi <question>  — me parler",
    "• /ping              — test",
    "• /stats             — stats du groupe (24h)",
    "• /warn @user raison — ajouter un warn (admin)",
    "• /help              — cette aide",
  ].join("\n");
}
