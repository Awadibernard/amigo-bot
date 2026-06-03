// ============================================================
// REGISTRY DE JEUX CUSTOM
// Stockage JSON sur disque. Aucune exécution de code.
// Schéma :
//   { id, name, rules, rounds: [{ question, answers:[], hints?:[] }] }
// ============================================================
import fs from "node:fs";
import path from "node:path";
import { logger } from "../logger.js";

const FILE = "data/custom_games.json";

function load() {
  try {
    if (!fs.existsSync(FILE)) return [];
    return JSON.parse(fs.readFileSync(FILE, "utf8"));
  } catch (err) {
    logger.warn({ err: err?.message }, "custom_games.json illisible");
    return [];
  }
}

function save(list) {
  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  fs.writeFileSync(FILE, JSON.stringify(list, null, 2));
}

export function validateGameSpec(raw) {
  if (!raw || typeof raw !== "object") return "spec absent";
  const { id, name, rounds } = raw;
  if (!id || typeof id !== "string" || !/^[a-z0-9_-]{2,32}$/i.test(id))
    return "id invalide (a-z0-9_- 2-32 chars)";
  if (!name || typeof name !== "string" || name.length > 60) return "name invalide";
  if (!Array.isArray(rounds) || rounds.length < 2 || rounds.length > 20)
    return "rounds: 2 à 20 attendus";
  for (const [i, r] of rounds.entries()) {
    if (!r || typeof r.question !== "string" || r.question.length > 400)
      return `round ${i}: question invalide`;
    if (!Array.isArray(r.answers) || r.answers.length < 1 || r.answers.length > 10)
      return `round ${i}: answers (1 à 10) attendues`;
    if (r.answers.some((a) => typeof a !== "string" || a.length > 120))
      return `round ${i}: réponses non-string ou trop longues`;
  }
  return null;
}

export function listCustomGames() {
  return load().map(({ id, name, rounds }) => ({ id, name, rounds: rounds.length }));
}

export function getCustomGame(id) {
  return load().find((g) => g.id === id) || null;
}

export function saveCustomGame(spec) {
  const err = validateGameSpec(spec);
  if (err) return { error: err };
  const list = load().filter((g) => g.id !== spec.id);
  list.push({
    id: spec.id,
    name: spec.name,
    rules: spec.rules || "",
    rounds: spec.rounds,
    createdAt: Date.now(),
  });
  save(list);
  return { ok: true };
}

export function deleteCustomGame(id) {
  const list = load();
  const next = list.filter((g) => g.id !== id);
  if (next.length === list.length) return false;
  save(next);
  return true;
}
