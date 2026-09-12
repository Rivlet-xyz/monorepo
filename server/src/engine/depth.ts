import JSBI from "jsbi"
import { SqrtPriceMath, TickMath } from "@uniswap/v3-sdk"
import type { Direction, Pool, PoolDepth, PoolToken, TickPage } from "./types"

/*
 * Uniswap v3 conventions used throughout:
 *   price P = token1 per token0 = 1.0001^tick, sqrtPriceX96 = sqrt(P) * 2^96.
 *   Selling token0 into the pool pushes P down; selling token1 pushes P up.
 *   Crossing an initialized tick downward: L -= liquidityNet; upward: L += liquidityNet.
 *   Within one range the token0 delta is L * (1/sqrtA - 1/sqrtB), the token1
 *   delta is L * (sqrtB - sqrtA); both come from @uniswap/v3-sdk SqrtPriceMath.
 */

const ZERO = JSBI.BigInt(0)
const LN_TICK = Math.log(1.0001)

export function clampTick(tick: number): number {
  return Math.max(TickMath.MIN_TICK, Math.min(TickMath.MAX_TICK, tick))
}

/**
 * Tick reached when the pool price is multiplied by `ratio`. Ratios below 1
 * round down and ratios above 1 round up, so the target always sits at or
 * beyond the exact price (integer-only, no float sqrtPrice arithmetic).
 */
export function tickForPriceRatio(tick: number, ratio: number): number {
  if (!(ratio > 0)) return TickMath.MIN_TICK
  const delta = Math.log(ratio) / LN_TICK
  return clampTick(tick + (ratio < 1 ? Math.floor(delta) : Math.ceil(delta)))
}

export type WalkPlan = {
  direction: Direction
  targetTick: number
  /** the token that flows INTO the pool during this walk */
  inToken: PoolToken
}

function sideOf(pool: Pool, token: string): 0 | 1 {
  if (pool.token0.address === token) return 0
  if (pool.token1.address === token) return 1
  throw new Error(`token ${token} is not in pool ${pool.id}`)
}

/** Sell `sellToken` until its own price has fallen by `dropBps`. */
export function sellPlan(pool: Pool, sellToken: string, dropBps: number): WalkPlan {
  const s = dropBps / 10_000
  return sideOf(pool, sellToken) === 0
    ? { direction: "down", targetTick: tickForPriceRatio(pool.tick, 1 - s), inToken: pool.token0 }
    : { direction: "up", targetTick: tickForPriceRatio(pool.tick, 1 / (1 - s)), inToken: pool.token1 }
}

/** Buy `buyToken` until its own price has risen by `riseBps`; the other side is spent. */
export function pumpPlan(pool: Pool, buyToken: string, riseBps: number): WalkPlan {
  const p = riseBps / 10_000
  return sideOf(pool, buyToken) === 0
    ? { direction: "up", targetTick: tickForPriceRatio(pool.tick, 1 + p), inToken: pool.token1 }
    : { direction: "down", targetTick: tickForPriceRatio(pool.tick, 1 / (1 + p)), inToken: pool.token0 }
}

export type WalkResult = {
  /** raw units of `plan.inToken` absorbed by the pool before reaching the target */
  amountIn: JSBI
  ticksCrossed: number
  /** false when the tick pages ran out before the target and the tail was extrapolated */
  complete: boolean
}

function deltaIn(direction: Direction, a: JSBI, b: JSBI, liquidity: JSBI): JSBI {
  // SqrtPriceMath sorts a/b internally, so only the direction decides which token.
  return direction === "down"
    ? SqrtPriceMath.getAmount0Delta(a, b, liquidity, false)
    : SqrtPriceMath.getAmount1Delta(a, b, liquidity, false)
}

/**
 * Walk the pool's liquidity from its current price to `plan.targetTick`,
 * crossing the initialized ticks in `page` (already sorted in walk order).
 */
export function walkPool(pool: Pool, plan: WalkPlan, page: TickPage): WalkResult {
  const { direction, targetTick } = plan
  const targetSqrt = TickMath.getSqrtRatioAtTick(targetTick)
  let sqrtCur = JSBI.BigInt(pool.sqrtPriceX96.toString())
  let liquidity = JSBI.BigInt(pool.liquidity.toString())
  let amountIn = ZERO
  let ticksCrossed = 0

  for (const t of page.ticks) {
    const pastTarget = direction === "down" ? t.tickIdx < targetTick : t.tickIdx > targetTick
    if (pastTarget) break
    const sqrtTick = TickMath.getSqrtRatioAtTick(t.tickIdx)
    const onPath =
      direction === "down"
        ? JSBI.lessThanOrEqual(sqrtTick, sqrtCur)
        : JSBI.greaterThanOrEqual(sqrtTick, sqrtCur)
    if (onPath) {
      if (JSBI.greaterThan(liquidity, ZERO)) {
        amountIn = JSBI.add(amountIn, deltaIn(direction, sqrtTick, sqrtCur, liquidity))
      }
      sqrtCur = sqrtTick
    }
    const net = JSBI.BigInt(t.liquidityNet.toString())
    liquidity = direction === "down" ? JSBI.subtract(liquidity, net) : JSBI.add(liquidity, net)
    if (JSBI.lessThan(liquidity, ZERO)) liquidity = ZERO
    ticksCrossed++
  }

  const remaining =
    direction === "down" ? JSBI.greaterThan(sqrtCur, targetSqrt) : JSBI.lessThan(sqrtCur, targetSqrt)
  if (remaining && JSBI.greaterThan(liquidity, ZERO)) {
    amountIn = JSBI.add(amountIn, deltaIn(direction, targetSqrt, sqrtCur, liquidity))
  }

  // The page is complete for this target if it was not cut off by the page cap,
  // or if the last fetched tick already lies at or beyond the target.
  const lastFetched = page.ticks[page.ticks.length - 1]?.tickIdx
  const complete =
    !page.exhausted ||
    (lastFetched !== undefined &&
      (direction === "down" ? lastFetched <= targetTick : lastFetched >= targetTick))

  return { amountIn, ticksCrossed, complete }
}

/** Exact conversion from raw units to a decimal number (bigint division first). */
export function jsbiToUnits(x: JSBI, decimals: number): number {
  const raw = BigInt(x.toString())
  const base = 10n ** BigInt(decimals)
  return Number(raw / base) + Number(raw % base) / Number(base)
}

/** USD price of a token as derived by the Uniswap subgraph, from any pool listing it. */
export function tokenPriceUsd(token: string, pools: Pool[], ethPriceUsd: number): number {
  for (const pool of pools) {
    const side = pool.token0.address === token ? pool.token0 : pool.token1.address === token ? pool.token1 : null
    if (side && side.derivedETH > 0) return side.derivedETH * ethPriceUsd
  }
  return 0
}

export type TokenDepth = {
  priceUsd: number
  depthUsd: number
  perPool: PoolDepth[]
  truncated: boolean
}

/**
 * USD value of `token` that can be sold across `pools` before its price falls
 * by `dropBps`. Pools are treated as independent, so this is an upper bound.
 * `pages` is keyed by pool id and must hold ticks fetched in the sell direction.
 */
export function sellableDepthForToken(
  token: string,
  pools: Pool[],
  pages: Map<string, TickPage>,
  dropBps: number,
  ethPriceUsd: number
): TokenDepth {
  const priceUsd = tokenPriceUsd(token, pools, ethPriceUsd)
  const perPool: PoolDepth[] = []
  let depthUsd = 0
  let truncated = false
  for (const pool of pools) {
    const page = pages.get(pool.id)
    if (!page) continue
    const plan = sellPlan(pool, token, dropBps)
    const walk = walkPool(pool, plan, page)
    const tokens = jsbiToUnits(walk.amountIn, plan.inToken.decimals)
    const usd = tokens * priceUsd
    depthUsd += usd
    truncated ||= !walk.complete
    perPool.push({
      poolId: pool.id,
      feeTier: pool.feeTier,
      pair: `${pool.token0.symbol}/${pool.token1.symbol}`,
      direction: plan.direction,
      depthUsd: usd,
      tvlUsd: pool.tvlUsd,
      truncated: !walk.complete,
    })
  }
  return { priceUsd, depthUsd, perPool, truncated }
}

export type TokenPumpCost = {
  costUsd: number
  perPool: { poolId: string; costUsd: number; truncated: boolean }[]
  truncated: boolean
}

/**
 * USD that must be spent buying `token` across `pools` to raise its price by
 * `riseBps`. `pages` must hold ticks fetched in the buy (opposite) direction.
 */
export function pumpCostForToken(
  token: string,
  pools: Pool[],
  pages: Map<string, TickPage>,
  riseBps: number,
  ethPriceUsd: number
): TokenPumpCost {
  const perPool: TokenPumpCost["perPool"] = []
  let costUsd = 0
  let truncated = false
  for (const pool of pools) {
    const page = pages.get(pool.id)
    if (!page) continue
    const plan = pumpPlan(pool, token, riseBps)
    const walk = walkPool(pool, plan, page)
    const spent = jsbiToUnits(walk.amountIn, plan.inToken.decimals)
    const usd = spent * plan.inToken.derivedETH * ethPriceUsd
    costUsd += usd
    truncated ||= !walk.complete
    perPool.push({ poolId: pool.id, costUsd: usd, truncated: !walk.complete })
  }
  return { costUsd, perPool, truncated }
}
