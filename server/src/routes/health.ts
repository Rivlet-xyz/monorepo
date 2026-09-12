import type { FastifyInstance } from "fastify"
import { configuredSubgraphs, env } from "../config"
import { pingDb } from "../db/client"
import { lastRun } from "../db/repo"

export async function healthRoutes(app: FastifyInstance): Promise<void> {
  app.get("/health", async (_request, reply) => {
    const dbOk = await pingDb()
    const run = dbOk ? await lastRun().catch(() => null) : null
    return reply.code(dbOk ? 200 : 503).send({
      ok: dbOk,
      lastRun: run,
      lendingSource: env.LENDING_SOURCE,
      subgraphs: configuredSubgraphs().map(({ name, id }) => ({ name, id })),
      uptimeSec: Math.round(process.uptime()),
    })
  })
}
