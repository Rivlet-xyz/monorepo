import pLimit from "p-limit"
import { env } from "../config"
import { log, errorMessage } from "../log"
import { fetchAllMarkets, marketsByToken } from "../collector/lending"
import { fetchEthPriceUsd } from "../collector/uniswap"
import { scoreToken, type TickCache } from "../engine/risk"
import { markScoreError, recordRun, upsertScore } from "../db/repo"

const CONCURRENCY = 4
const TOKEN_TIMEOUT_MS = 90_000
const SOFT_DEADLINE_MS = 4 * 60_000

export type RefreshSummary = {
  tokensTotal: number
  scored: number
  failed: number
  skipped: number
  durationMs: number
}

let inFlight = false

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
  })
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer))
}

/**
 * One full scoring pass: lending markets -> distinct collateral tokens ->
 * Uniswap v3 depth walks -> Postgres. Per-token failures are logged and
 * counted; they never abort the run.
 */
export async function runRefresh(reason: "boot" | "cron"): Promise<RefreshSummary | null> {
  if (inFlight) {
    log.warn(`refresh(${reason}) skipped: previous run still in progress`)
    return null
  }
  inFlight = true
  const startedAt = new Date()
  const t0 = performance.now()
  log.info(`refresh(${reason}) started, lending source ${env.LENDING_SOURCE}`)

  try {
    const [marketsResult, ethResult] = await Promise.allSettled([
      fetchAllMarkets(),
      fetchEthPriceUsd(),
    ])
    if (marketsResult.status === "rejected" || ethResult.status === "rejected") {
      const reasons = [marketsResult, ethResult]
        .filter((r): r is PromiseRejectedResult => r.status === "rejected")
        .map((r) => errorMessage(r.reason))
      log.error(`refresh(${reason}) aborted before scoring: ${reasons.join(" | ")}`)
      await recordRun({
        startedAt,
        finishedAt: new Date(),
        durationMs: performance.now() - t0,
        lendingSource: env.LENDING_SOURCE,
        marketCounts: {},
        ethPriceUsd: null,
        uniswapBlock: null,
        lendingBlock: null,
        tokensTotal: 0,
        tokensScored: 0,
        tokensFailed: 0,
        notes: `aborted: ${reasons.join(" | ")}`.slice(0, 1000),
      }).catch((err) => log.error(`recordRun failed: ${errorMessage(err)}`))
      return null
    }

    const snapshot = marketsResult.value
    const { ethPriceUsd, block: uniswapBlock } = ethResult.value
    const byToken = marketsByToken(snapshot.markets)
    const cache: TickCache = new Map()
    const limit = pLimit(CONCURRENCY)
    let scored = 0
    let failed = 0
    let skipped = 0

    await Promise.all(
      [...byToken.entries()].map(([address, markets]) =>
        limit(async () => {
          if (performance.now() - t0 > SOFT_DEADLINE_MS) {
            skipped++
            return
          }
          try {
            const score = await withTimeout(
              scoreToken({ address, markets, ethPriceUsd, cache }),
              TOKEN_TIMEOUT_MS,
              `score ${markets[0]?.token.symbol ?? address}`
            )
            await upsertScore(score)
            scored++
          } catch (err) {
            failed++
            const message = errorMessage(err)
            log.error(`token ${markets[0]?.token.symbol ?? "?"} ${address}: ${message}`)
            const first = markets[0]!
            await markScoreError(address, first.token.symbol, first.token.decimals, message).catch(
              (e) => log.error(`markScoreError failed: ${errorMessage(e)}`)
            )
          }
        })
      )
    )

    const durationMs = performance.now() - t0
    const notes: string[] = []
    if (snapshot.failed.length) notes.push(`lending sources failed: ${snapshot.failed.join(", ")}`)
    if (skipped) notes.push(`${skipped} tokens skipped by the ${SOFT_DEADLINE_MS / 60_000}-minute deadline`)

    await recordRun({
      startedAt,
      finishedAt: new Date(),
      durationMs,
      lendingSource: env.LENDING_SOURCE,
      marketCounts: snapshot.counts,
      ethPriceUsd,
      uniswapBlock,
      lendingBlock: snapshot.block,
      tokensTotal: byToken.size,
      tokensScored: scored,
      tokensFailed: failed + skipped,
      notes: notes.length ? notes.join("; ") : null,
    }).catch((err) => log.error(`recordRun failed: ${errorMessage(err)}`))

    const counts = Object.entries(snapshot.counts)
      .map(([p, n]) => `${p}=${n}`)
      .join(" ")
    log.info(
      `refresh(${reason}) done: markets ${counts} tokens=${byToken.size} scored=${scored} failed=${failed} skipped=${skipped} blocks uni=${uniswapBlock} lend=${snapshot.block} in ${Math.round(durationMs)}ms`
    )
    if (durationMs > SOFT_DEADLINE_MS) {
      log.warn("refresh exceeded 4 minutes; consider MAX_POOLS_PER_TOKEN=3 or a slower REFRESH_CRON")
    }
    return { tokensTotal: byToken.size, scored, failed, skipped, durationMs }
  } finally {
    inFlight = false
  }
}
