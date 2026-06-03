// Découpe un texte en chunks compatibles WhatsApp (~4096 chars max).
// On essaie d'abord par double saut de ligne, puis par phrase, puis hard cut.

export function splitForWhatsApp(text, max = 3500) {
  if (!text) return [];
  const s = String(text).trim();
  if (s.length <= max) return [s];

  const parts = [];
  let buf = "";

  const flushBuf = () => {
    if (buf) {
      parts.push(buf);
      buf = "";
    }
  };

  const hardPush = (chunk) => {
    let rest = chunk;
    while (rest.length > max) {
      parts.push(rest.slice(0, max));
      rest = rest.slice(max);
    }
    if (rest) buf = buf ? buf + " " + rest : rest;
  };

  const paragraphs = s.split(/\n{2,}/);
  for (const p of paragraphs) {
    if ((buf + "\n\n" + p).trim().length <= max) {
      buf = buf ? buf + "\n\n" + p : p;
      continue;
    }
    flushBuf();
    if (p.length <= max) {
      buf = p;
      continue;
    }
    const sentences = p.split(/(?<=[.!?])\s+/);
    for (const sent of sentences) {
      if ((buf + " " + sent).trim().length <= max) {
        buf = buf ? buf + " " + sent : sent;
      } else {
        flushBuf();
        if (sent.length <= max) buf = sent;
        else hardPush(sent);
      }
    }
  }
  flushBuf();

  if (parts.length > 1) {
    const n = parts.length;
    return parts.map((p, i) => `(${i + 1}/${n}) ${p}`);
  }
  return parts;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function sendChunked(sock, jid, text, opts = {}) {
  const chunks = splitForWhatsApp(text);
  if (!chunks.length) return 0;
  for (let i = 0; i < chunks.length; i++) {
    await sock.sendMessage(jid, { text: chunks[i] }, i === 0 ? opts : {});
    if (i < chunks.length - 1) await sleep(600);
  }
  return chunks.length;
}
