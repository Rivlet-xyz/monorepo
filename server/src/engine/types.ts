export type Protocol = "aave-v3" | "compound-v3" | "morpho-blue"

export type Market = {
  protocol: Protocol
  marketId: string
  marketName: string
  /** address is lowercase */
  token: { address: string; symbol: string; decimals: number }
  depositUsd: number
  /** 0..1 */
  maxLtv: number
  /** 0..1 */
  liquidationThreshold: number
}

export type PoolToken = {
  /** lowercase */
  address: string
  symbol: string
  decimals: number
  derivedETH: number
}

export type Pool = {
  /** lowercase */
  id: string
  feeTier: number
  liquidity: bigint
  sqrtPriceX96: bigint
  tick: number
  token0: PoolToken
  token1: PoolToken
  tvlUsd: number
}

export type Tick = { tickIdx: number; liquidityNet: bigint }

/** A page of initialized ticks sorted in walk order; `exhausted` = page cap hit before the bound. */
export type TickPage = { ticks: Tick[]; exhausted: boolean }

export type Direction = "down" | "up"

export type PoolDepth = {
  poolId: string
  feeTier: number
  pair: string
  direction: Direction
  depthUsd: number
  tvlUsd: number
  truncated: boolean
}

export type DepthStatus = "deep" | "shallow" | "no_venue"

export type TokenScore = {
  tokenAddress: string
  symbol: string
  decimals: number
  priceUsd: number
  depthStatus: DepthStatus
  /** null when depthStatus === "no_venue" */
  sellableDepthUsd: number | null
  safeCapUsd: number | null
  exposureUsd: number
  exposureRatio: number | null
  /** USD of the token that must be sold to push its price down by requiredDrop */
  liquidationAttackCostUsd: number | null
  /** USD of quote tokens that must be spent to push the price up by PUMP_TARGET_BPS */
  pumpCostUsd: number | null
  /** 1 - deposit-weighted liquidation threshold */
  requiredDrop: number
  protocols: Protocol[]
  truncated: boolean
  pools: PoolDepth[]
  markets: Market[]
  /** last scoring error for this token, if the stored numbers are stale */
  error: string | null
  /** ISO timestamp */
  computedAt: string
}
