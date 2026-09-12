import { db } from "./client"
import type { Market, PoolDepth, Protocol, TokenScore } from "../engine/types"

export const SORT_KEYS = [
  "exposure_ratio",
  "exposure_usd",
  "sellable_depth_usd",
  "safe_cap_usd",
  "liquidation_attack_cost_usd",
  "pump_cost_usd",
  "price_usd",
] as const
export type SortKey = (typeof SORT_KEYS)[number]

export type ListFilter = {
  sort: SortKey
  order: "asc" | "desc"
  minExposureUsd: number
  protocol?: Protocol
  includeUnknown: boolean
  limit: number
}

const SCORE_COLUMNS = `
  token_address, symbol, decimals,
  price_usd::float8 as price_usd,
  depth_status,
  sellable_depth_usd::float8 as sellable_depth_usd,
  safe_cap_usd::float8 as safe_cap_usd,
  exposure_usd::float8 as exposure_usd,
  exposure_ratio::float8 as exposure_ratio,
  liquidation_attack_cost_usd::float8 as liquidation_attack_cost_usd,
  pump_cost_usd::float8 as pump_cost_usd,
  required_drop::float8 as required_drop,
  protocols, truncated, pools, markets, error, computed_at
`

type ScoreRow = {
  token_address: string
  symbol: string
  decimals: number
  price_usd: number
  depth_status: TokenScore["depthStatus"]
  sellable_depth_usd: number | null
  safe_cap_usd: number | null
  exposure_usd: number
  exposure_ratio: number | null
  liquidation_attack_cost_usd: number | null
  pump_cost_usd: number | null
  required_drop: number
  protocols: Protocol[]
  truncated: boolean
  pools: PoolDepth[]
  markets: Market[]
  error: string | null
  computed_at: Date
}

function rowToScore(r: ScoreRow): TokenScore {
  return {
    tokenAddress: r.token_address,
    symbol: r.symbol,
    decimals: r.decimals,
    priceUsd: r.price_usd,
    depthStatus: r.depth_status,
    sellableDepthUsd: r.sellable_depth_usd,
    safeCapUsd: r.safe_cap_usd,
    exposureUsd: r.exposure_usd,
    exposureRatio: r.exposure_ratio,
    liquidationAttackCostUsd: r.liquidation_attack_cost_usd,
    pumpCostUsd: r.pump_cost_usd,
    requiredDrop: r.required_drop,
    protocols: r.protocols,
    truncated: r.truncated,
    pools: r.pools,
    markets: r.markets,
    error: r.error,
    computedAt: r.computed_at.toISOString(),
  }
}

export async function upsertScore(s: TokenScore): Promise<void> {
  await db.query(
    `insert into token_scores (
       token_address, symbol, decimals, price_usd, depth_status,
       sellable_depth_usd, safe_cap_usd, exposure_usd, exposure_ratio,
       liquidation_attack_cost_usd, pump_cost_usd, required_drop,
       protocols, truncated, pools, markets, error, computed_at
     ) values (
       $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15::jsonb, $16::jsonb, null, $17
     )
     on conflict (token_address) do update set
       symbol = excluded.symbol,
       decimals = excluded.decimals,
       price_usd = excluded.price_usd,
       depth_status = excluded.depth_status,
       sellable_depth_usd = excluded.sellable_depth_usd,
       safe_cap_usd = excluded.safe_cap_usd,
       exposure_usd = excluded.exposure_usd,
       exposure_ratio = excluded.exposure_ratio,
       liquidation_attack_cost_usd = excluded.liquidation_attack_cost_usd,
       pump_cost_usd = excluded.pump_cost_usd,
       required_drop = excluded.required_drop,
       protocols = excluded.protocols,
       truncated = excluded.truncated,
       pools = excluded.pools,
       markets = excluded.markets,
       error = null,
       computed_at = excluded.computed_at`,
    [
      s.tokenAddress,
      s.symbol,
      s.decimals,
      s.priceUsd,
      s.depthStatus,
      s.sellableDepthUsd,
      s.safeCapUsd,
      s.exposureUsd,
      s.exposureRatio,
      s.liquidationAttackCostUsd,
      s.pumpCostUsd,
      s.requiredDrop,
      s.protocols,
      s.truncated,
      JSON.stringify(s.pools),
      JSON.stringify(s.markets),
      s.computedAt,
    ]
  )
}

/** Records a scoring failure while keeping the last good numbers, if any. */
export async function markScoreError(
  tokenAddress: string,
  symbol: string,
  decimals: number,
  message: string
): Promise<void> {
  await db.query(
    `insert into token_scores (token_address, symbol, decimals, error)
     values ($1, $2, $3, $4)
     on conflict (token_address) do update set error = excluded.error`,
    [tokenAddress, symbol, decimals, message.slice(0, 1000)]
  )
}

export async function listScores(filter: ListFilter): Promise<TokenScore[]> {
  const sortColumn = SORT_KEYS.includes(filter.sort) ? filter.sort : "exposure_ratio"
  const direction = filter.order === "asc" ? "asc" : "desc"
  const { rows } = await db.query<ScoreRow>(
    `select ${SCORE_COLUMNS}
       from token_scores
      where exposure_usd >= $1
        and ($2::text is null or $2 = any(protocols))
        and ($3::boolean or depth_status <> 'no_venue')
      order by ${sortColumn} ${direction} nulls last, symbol asc
      limit $4`,
    [filter.minExposureUsd, filter.protocol ?? null, filter.includeUnknown, filter.limit]
  )
  return rows.map(rowToScore)
}

export async function getScore(tokenAddress: string): Promise<TokenScore | null> {
  const { rows } = await db.query<ScoreRow>(
    `select ${SCORE_COLUMNS} from token_scores where token_address = $1`,
    [tokenAddress.toLowerCase()]
  )
  return rows[0] ? rowToScore(rows[0]) : null
}

export async function getScores(addresses: string[]): Promise<TokenScore[]> {
  if (addresses.length === 0) return []
  const { rows } = await db.query<ScoreRow>(
    `select ${SCORE_COLUMNS} from token_scores where token_address = any($1::text[])
      order by exposure_ratio desc nulls last, symbol asc`,
    [addresses.map((a) => a.toLowerCase())]
  )
  return rows.map(rowToScore)
}

export type RunRecord = {
  startedAt: Date
  finishedAt: Date
  durationMs: number
  lendingSource: string
  marketCounts: Record<string, number>
  ethPriceUsd: number | null
  uniswapBlock: number | null
  lendingBlock: number | null
  tokensTotal: number
  tokensScored: number
  tokensFailed: number
  notes: string | null
}

export async function recordRun(run: RunRecord): Promise<void> {
  await db.query(
    `insert into refresh_runs (
       started_at, finished_at, duration_ms, lending_source, market_counts, eth_price_usd,
       uniswap_block, lending_block, tokens_total, tokens_scored, tokens_failed, notes
     ) values ($1, $2, $3, $4, $5::jsonb, $6, $7, $8, $9, $10, $11, $12)`,
    [
      run.startedAt,
      run.finishedAt,
      Math.round(run.durationMs),
      run.lendingSource,
      JSON.stringify(run.marketCounts),
      run.ethPriceUsd,
      run.uniswapBlock,
      run.lendingBlock,
      run.tokensTotal,
      run.tokensScored,
      run.tokensFailed,
      run.notes,
    ]
  )
}

export type LastRun = {
  startedAt: string
  finishedAt: string | null
  durationMs: number | null
  lendingSource: string
  marketCounts: Record<string, number>
  ethPriceUsd: number | null
  uniswapBlock: number | null
  lendingBlock: number | null
  tokensTotal: number
  tokensScored: number
  tokensFailed: number
  notes: string | null
}

export async function lastRun(): Promise<LastRun | null> {
  const { rows } = await db.query<{
    started_at: Date
    finished_at: Date | null
    duration_ms: number | null
    lending_source: string
    market_counts: Record<string, number>
    eth_price_usd: number | null
    uniswap_block: string | null
    lending_block: string | null
    tokens_total: number
    tokens_scored: number
    tokens_failed: number
    notes: string | null
  }>(
    `select started_at, finished_at, duration_ms, lending_source, market_counts,
            eth_price_usd::float8 as eth_price_usd, uniswap_block, lending_block,
            tokens_total, tokens_scored, tokens_failed, notes
       from refresh_runs
      order by started_at desc
      limit 1`
  )
  const r = rows[0]
  if (!r) return null
  return {
    startedAt: r.started_at.toISOString(),
    finishedAt: r.finished_at ? r.finished_at.toISOString() : null,
    durationMs: r.duration_ms,
    lendingSource: r.lending_source,
    marketCounts: r.market_counts,
    ethPriceUsd: r.eth_price_usd,
    uniswapBlock: r.uniswap_block === null ? null : Number(r.uniswap_block),
    lendingBlock: r.lending_block === null ? null : Number(r.lending_block),
    tokensTotal: r.tokens_total,
    tokensScored: r.tokens_scored,
    tokensFailed: r.tokens_failed,
    notes: r.notes,
  }
}
