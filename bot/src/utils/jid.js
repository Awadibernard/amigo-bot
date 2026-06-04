// Normalise un JID WhatsApp en retirant le suffixe d'appareil ":N"
// Ex: "12345:8@s.whatsapp.net" -> "12345@s.whatsapp.net"
export function normalizeJid(jid) {
  if (!jid) return "";
  return String(jid).replace(/:\d+(?=@)/, "");
}
