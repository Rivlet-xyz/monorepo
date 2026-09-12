import type { FastifyInstance, FastifyReply } from "fastify"
import { z } from "zod"
import { getScore, lastRun, listScores, SORT_KEYS, type LastRun } from "../db/repo"

const ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/

const flag = z.preprocess(
  (v) => (v === undefined ? false : v === "1" || v === "true" || v === true),
  z.boolean()
)

export const ListQuery = z.object({
  sort: z.enum(SORT_KEYS).default("exposure_ratio"),
  order: z.enum(["asc", "desc"]).default("desc"),
  min_exposure_usd: z.coerce.number().min(0).default(0),
  protocol: z.enum(["aave-v3", "compound-v3", "morpho-blue"]).optional(),
  include_unknown: flag,
  limit: z.coerce.number().int().min(1).max(1000).default(200),
})

// The last-run stamp goes on every /tokens response; cache it briefly so a
// busy dashboard does not turn into a refresh_runs query per request.
let stamp: { at: number; run: LastRun | null } | null = null
async function refreshStamp(): Promise<LastRun | null> {
  const now = Date.now()
  if (stamp && now - stamp.at < 5_000) return stamp.run
  const run = await lastRun().catch(() => null)
  stamp = { at: now, run }
  return run
}

async function stampReply(reply: FastifyReply): Promise<void> {
  const run = await refreshStamp()
  if (run?.uniswapBlock) reply.header("x-shoalfi-block", String(run.uniswapBlock))
  if (run?.finishedAt) reply.header("x-shoalfi-refreshed-at", run.finishedAt)
}

export async function tokenRoutes(app: FastifyInstance): Promise<void> {
  app.get("/tokens", async (request, reply) => {
    const parsed = ListQuery.safeParse(request.query)
    if (!parsed.success) {
      return reply.code(400).send({ error: "invalid query", issues: parsed.error.issues })
    }
    const q = parsed.data
    const rows = await listScores({
      sort: q.sort,
      order: q.order,
      minExposureUsd: q.min_exposure_usd,
      protocol: q.protocol,
      includeUnknown: q.include_unknown,
      limit: q.limit,
    })
    await stampReply(reply)
    return reply.send(rows)
  })

  app.get<{ Params: { address: string } }>("/tokens/:address", async (request, reply) => {
    const { address } = request.params
    if (!ADDRESS_RE.test(address)) {
      return reply.code(400).send({ error: "invalid address" })
    }
    const score = await getScore(address.toLowerCase())
    if (!score) return reply.code(404).send({ error: "not found" })
    await stampReply(reply)
    return reply.send(score)
  })
}
