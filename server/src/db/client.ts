import pg from "pg"
import { env } from "../config"

export const db = new pg.Pool({
  connectionString: env.DATABASE_URL,
  max: 8,
  connectionTimeoutMillis: 5_000,
  idleTimeoutMillis: 30_000,
})

function describeTarget(): string {
  try {
    const u = new URL(env.DATABASE_URL)
    return `${u.hostname}:${u.port || "5432"}${u.pathname}`
  } catch {
    return "(unparseable DATABASE_URL)"
  }
}

/** Creates tables and indexes if missing. Safe to run on every boot. */
export async function initSchema(): Promise<void> {
  const sql = await Bun.file(new URL("./schema.sql", import.meta.url)).text()
  try {
    await db.query(sql)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    throw new Error(`cannot initialise Postgres at ${describeTarget()}: ${msg}`)
  }
}

export async function pingDb(): Promise<boolean> {
  try {
    await db.query("select 1")
    return true
  } catch {
    return false
  }
}

export async function closeDb(): Promise<void> {
  await db.end()
}
