// Petit LRU pour ne pas retraiter deux fois le même msg.key.id
const MAX = 500;
const seen = new Set();

export function alreadyProcessed(id) {
  if (!id) return false;
  if (seen.has(id)) return true;
  seen.add(id);
  if (seen.size > MAX) {
    // supprime les plus anciens
    const it = seen.values();
    for (let i = 0; i < 100; i++) {
      const v = it.next().value;
      if (v === undefined) break;
      seen.delete(v);
    }
  }
  return false;
}

export function _resetDedupeForTests() {
  seen.clear();
}
