/**
 * Détecte le type de média d'un message Baileys.
 * @returns {null | "sticker" | "image" | "video" | "audio" | "document" | "gif"}
 */
export function detectMediaType(msg) {
  const m = msg?.message;
  if (!m) return null;
  if (m.stickerMessage) return "sticker";
  if (m.videoMessage?.gifPlayback) return "gif";
  if (m.imageMessage) return "image";
  if (m.videoMessage) return "video";
  if (m.audioMessage) return "audio";
  if (m.documentMessage || m.documentWithCaptionMessage) return "document";
  return null;
}

export const MEDIA_LABEL = {
  sticker: "stickers",
  image: "images",
  video: "vidéos",
  gif: "GIFs",
  audio: "audios / vocaux",
  document: "documents",
};
