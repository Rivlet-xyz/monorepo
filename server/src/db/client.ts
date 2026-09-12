import { Database } from "bun:sqlite"
import { mkdirSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { env } from "../config"

const dbPath = resolve(env.DATABASE_PATH)
mkdirSync(dirname(dbPath), { recursive: true })

export const db = new Database(dbPath, { create: true })
db.exec("pragma journal_mode = WAL")
db.exec("pragma foreign_keys = ON")

/** Creates tables and indexes if missing. Safe to run on every boot. */
export async function initSchema(): Promise<void> {
  const sql = await Bun.file(new URL("./schema.sql", import.meta.url)).text()
  try {
    db.exec(sql)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    throw new Error(`cannot initialise SQLite database at ${dbPath}: ${msg}`)
  }
}

export function pingDb(): boolean {
  try {
    db.query("select 1").get()
    return true
  } catch {
    return false
  }
}

export function closeDb(): void {
  db.close()
}
