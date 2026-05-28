/**
 * /poll Question | option1 | option2 | option3 ...
 * Ex: /poll Pizza ce soir ? | Oui | Non | Peut-être
 */
export async function poll({ sock, groupJid, args }) {
  const raw = args.join(" ").trim();
  if (!raw.includes("|")) {
    return "Format : /poll Question | option1 | option2 | option3";
  }
  const parts = raw.split("|").map((s) => s.trim()).filter(Boolean);
  const [question, ...options] = parts;
  if (!question || options.length < 2) {
    return "Il faut une question + au moins 2 options.";
  }
  if (options.length > 12) {
    return "12 options max.";
  }

  await sock.sendMessage(groupJid, {
    poll: {
      name: question,
      values: options,
      selectableCount: 1,
    },
  });
  return null;
}
