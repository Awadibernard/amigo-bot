import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

const DB_PATH = "data/ayumi.db";
mkdirSync(dirname(DB_PATH), { recursive: true });

export const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    jid           TEXT PRIMARY KEY,
    display_name  TEXT,
    first_seen    INTEGER NOT NULL,
    last_seen     INTEGER NOT NULL,
    msg_count     INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS messages (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_jid    TEXT NOT NULL,
    group_jid   TEXT NOT NULL,
    content     TEXT,
    ts          INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_messages_group_ts ON messages(group_jid, ts DESC);
  CREATE INDEX IF NOT EXISTS idx_messages_user_ts  ON messages(user_jid, ts DESC);

  CREATE TABLE IF NOT EXISTS warnings (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    user_jid  TEXT NOT NULL,
    reason    TEXT,
    ts        INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_warnings_user ON warnings(user_jid);

  CREATE TABLE IF NOT EXISTS kv (
    k TEXT PRIMARY KEY,
    v TEXT
  );
`);
