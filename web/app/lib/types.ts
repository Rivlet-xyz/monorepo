/**
 * Mirrors the backend API contract exactly. Nothing here is invented: if a
 * field is absent from the contract it is absent from these types.
 *
 * Every numeric field the backend may not be able to compute is `number | null`
 * so the UI can render an em dash instead of a misleading zero.
 */

export type RiskLevel = "green" | "amber" | "red" | "unknown"
export type DepthState = "deep" | "shallow" | "unknown"
export type LendingSchema = "messari-standardized" | "aave-official"

export interface Meta {
  chain: string
  block: number
  refreshedAt: string
  sources: { lending: string[]; dex: string[] }
  lendingSchema: LendingSchema
}

export interface Depth {
  state: DepthState
  sellableUsd10pct: number | null
  venue: string | null
  poolCount: number
}

export interface Exposure {
  depositsUsd: number | null
  maxLtv: number | null
  exposureUsd: number | null
}

export interface AttackCost {
  direction: "down" | "up"
  /** Fraction, not percent: 0.17 means a 17% move. */
  movePct: number
  costUsd: number
}

export interface Market {
  protocol: string
  marketId: string
  ltv: number | null
  liquidationThreshold: number | null
  depositsUsd: number | null
  borrowsUsd: number | null
}

export interface Token {
  address: string
  symbol: string
  name: string
  priceUsd: number | null
  depth: Depth
  safeCapUsd: number | null
  exposure: Exposure
  /** exposureUsd ÷ sellableUsd10pct. Null whenever depth is unknown. */
  ratio: number | null
  attackCost: AttackCost | null
  risk: RiskLevel
  markets: Market[]
}

export interface Pool {
  venue: string
  pool: string
  pair: string
  feeTier: number
  tvlUsd: number | null
  sellableUsd10pct: number | null
}

export interface TokenDetail extends Token {
  pools: Pool[]
  /** One plain-english sentence written by the backend. Never written here. */
  summary: string | null
}

export interface ToolCall {
  tool: string
  target: string
  ms: number
}

export interface AskResponse {
  /** Markdown. */
  answer: string
  toolCalls: ToolCall[]
  usedMcp: boolean
}
