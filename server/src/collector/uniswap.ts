import { env } from "../config"
import { graphQuery } from "./graph"
import type { Direction, Pool, PoolToken, Tick, TickPage } from "../engine/types"

const ADDRESS_RE = /^0x[0-9a-f]{40}$/

/** Lowercases and validates an address before it is inlined into a query. */
export function normalizeAddress(address: string): string {
  const a = address.toLowerCase()
  if (!ADDRESS_RE.test(a)) throw new Error(`invalid address: ${address}`)
  return a
}

const POOL_FIELDS = `
  id
  feeTier
  liquidity
  sqrtPrice
  tick
  totalValueLockedUSD
  token0 { id symbol decimals derivedETH }
  token1 { id symbol decimals derivedETH }
`

type RawToken = { id: string; symbol: string; decimals: string; derivedETH: string }
type RawPool = {
  id: string
  feeTier: string
  liquidity: string
  sqrtPrice: string
  tick: string | null
  totalValueLockedUSD: string
  token0: RawToken
  token1: RawToken
}

const subgraphId = () => env.UNISWAP_V3_SUBGRAPH_ID

export async function fetchEthPriceUsd(): Promise<{ ethPriceUsd: number; block: number }> {
  const data = await graphQuery<{
    _meta: { block: { number: number } }
    bundle: { ethPriceUSD: string } | null
  }>(subgraphId(), `{ _meta { block { number } } bundle(id: "1") { ethPriceUSD } }`)
  const ethPriceUsd = Number(data.bundle?.ethPriceUSD ?? 0)
  if (!(ethPriceUsd > 0)) throw new Error("uniswap bundle returned no ETH price")
  return { ethPriceUsd, block: Number(data._meta.block.number) }
}

function parseToken(t: RawToken): PoolToken {
  return {
    address: t.id.toLowerCase(),
    symbol: t.symbol,
    decimals: Number(t.decimals),
    derivedETH: Number(t.derivedETH),
  }
}

function parsePool(p: RawPool): Pool | null {
  if (p.tick === null || p.tick === undefined) return null
  const liquidity = BigInt(p.liquidity)
  if (liquidity <= 0n) return null
  return {
    id: p.id.toLowerCase(),
    feeTier: Number(p.feeTier),
    liquidity,
    sqrtPriceX96: BigInt(p.sqrtPrice),
    tick: Number(p.tick),
    token0: parseToken(p.token0),
    token1: parseToken(p.token1),
    tvlUsd: Number(p.totalValueLockedUSD),
  }
}

/**
 * Top pools (by TVL) that include the token on either side.
 * Pools with zero liquidity, under $1,000 TVL, or no current tick are dropped.
 */
export async function fetchPoolsForToken(
  tokenAddress: string,
  maxPools: number = env.MAX_POOLS_PER_TOKEN
): Promise<Pool[]> {
  const addr = normalizeAddress(tokenAddress)
  const where = (side: "token0" | "token1") =>
    `{ ${side}: "${addr}", liquidity_gt: "0", totalValueLockedUSD_gt: "1000" }`
  const query = `{
    asToken0: pools(first: ${maxPools}, orderBy: totalValueLockedUSD, orderDirection: desc, where: ${where("token0")}) { ${POOL_FIELDS} }
    asToken1: pools(first: ${maxPools}, orderBy: totalValueLockedUSD, orderDirection: desc, where: ${where("token1")}) { ${POOL_FIELDS} }
  }`
  const data = await graphQuery<{ asToken0: RawPool[]; asToken1: RawPool[] }>(subgraphId(), query)

  const seen = new Set<string>()
  const pools: Pool[] = []
  for (const raw of [...data.asToken0, ...data.asToken1]) {
    const pool = parsePool(raw)
    if (!pool || seen.has(pool.id)) continue
    seen.add(pool.id)
    pools.push(pool)
  }
  pools.sort((a, b) => b.tvlUsd - a.tvlUsd)
  return pools.slice(0, maxPools)
}

/**
 * Initialized ticks between the pool's current tick and `boundTick`, in walk
 * order (descending for "down", ascending for "up"), using cursor pagination
 * on tickIdx. The first "down" page includes tickIdx == fromTick because the
 * pool price sits inside [tick, tick + 1) and that tick is crossed first.
 */
export async function fetchTicks(
  poolId: string,
  fromTick: number,
  direction: Direction,
  boundTick: number,
  maxPages: number = env.MAX_TICK_PAGES_PER_POOL
): Promise<TickPage> {
  const pool = normalizeAddress(poolId)
  const ticks: Tick[] = []
  let cursor = fromTick
  let inclusive = direction === "down"

  for (let page = 0; page < maxPages; page++) {
    const range =
      direction === "down"
        ? `${inclusive ? "tickIdx_lte" : "tickIdx_lt"}: "${cursor}", tickIdx_gte: "${boundTick}"`
        : `tickIdx_gt: "${cursor}", tickIdx_lte: "${boundTick}"`
    const query = `{
      ticks(
        first: 1000
        orderBy: tickIdx
        orderDirection: ${direction === "down" ? "desc" : "asc"}
        where: { poolAddress: "${pool}", ${range}, liquidityNet_not: "0" }
      ) { tickIdx liquidityNet }
    }`
    const data = await graphQuery<{ ticks: { tickIdx: string; liquidityNet: string }[] }>(
      subgraphId(),
      query
    )
    for (const t of data.ticks) {
      ticks.push({ tickIdx: Number(t.tickIdx), liquidityNet: BigInt(t.liquidityNet) })
    }
    if (data.ticks.length < 1000) return { ticks, exhausted: false }
    cursor = ticks[ticks.length - 1]!.tickIdx
    inclusive = false
  }
  return { ticks, exhausted: true }
}
