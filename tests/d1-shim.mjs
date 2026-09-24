// Minimal stand-in for Cloudflare's D1 binding, backed by Node's built-in SQLite.
import {DatabaseSync} from 'node:sqlite';
import fs from 'node:fs';

export function createD1(migrationsDir) {
  const sqlite = new DatabaseSync(':memory:');
  for (const file of fs.readdirSync(migrationsDir).filter(name => name.endsWith('.sql')).sort()) sqlite.exec(fs.readFileSync(`${migrationsDir}/${file}`, 'utf8'));
  const statement = (sql, params = []) => ({
    bind: (...values) => statement(sql, values),
    first: async () => sqlite.prepare(sql).get(...params) ?? null,
    all: async () => ({results: sqlite.prepare(sql).all(...params)}),
    run: async () => { const r = sqlite.prepare(sql).run(...params); return {meta: {changes: Number(r.changes)}}; },
    runSync: () => sqlite.prepare(sql).run(...params)
  });
  return {
    sqlite,
    prepare: sql => statement(sql),
    batch: async statements => {
      sqlite.exec('BEGIN');
      try { const out = statements.map(s => s.runSync()); sqlite.exec('COMMIT'); return out; }
      catch (error) { sqlite.exec('ROLLBACK'); throw error; }
    }
  };
}
