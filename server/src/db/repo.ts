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
  protocols: string
  truncated: number
  pools: string
  markets: string
  error: string | null
  computed_at: string
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
    protocols: JSON.parse(r.protocols) as Protocol[],
    truncated: r.truncated === 1,
    pools: JSON.parse(r.pools) as PoolDepth[],
    markets: JSON.parse(r.markets) as Market[],
    error: r.error,
    computedAt: r.computed_at,
  }
}

export async function upsertScore(s: TokenScore): Promise<void> {
  db.query(
    `insert into token_scores (
       token_address, symbol, decimals, price_usd, depth_status,
       sellable_depth_usd, safe_cap_usd, exposure_usd, exposure_ratio,
       liquidation_attack_cost_usd, pump_cost_usd, required_drop,
       protocols, truncated, pools, markets, error, computed_at
     ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, null, ?)
     on conflict(token_address) do update set
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
       computed_at = excluded.computed_at`
  ).run(
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
    JSON.stringify(s.protocols),
    s.truncated ? 1 : 0,
    JSON.stringify(s.pools),
    JSON.stringify(s.markets),
    s.computedAt
  )
}

/** Records a scoring failure while keeping the last good numbers, if any. */
export async function markScoreError(
  tokenAddress: string,
  symbol: string,
  decimals: number,
  message: string
): Promise<void> {
  db.query(
    `insert into token_scores (token_address, symbol, decimals, error)
     values (?, ?, ?, ?)
     on conflict(token_address) do update set error = excluded.error`
  ).run(tokenAddress, symbol, decimals, message.slice(0, 1000))
}

export async function listScores(filter: ListFilter): Promise<TokenScore[]> {
  const sortColumn = SORT_KEYS.includes(filter.sort) ? filter.sort : "exposure_ratio"
  const direction = filter.order === "asc" ? "asc" : "desc"

  const params: (string | number)[] = [filter.minExposureUsd]
  let protocolClause = "1"
  if (filter.protocol) {
    protocolClause = "exists (select 1 from json_each(protocols) where value = ?)"
    params.push(filter.protocol)
  }
  const unknownClause = filter.includeUnknown ? "1" : "depth_status <> 'no_venue'"
  params.push(filter.limit)

  const rows = db
    .query(
      `select * from token_scores
        where exposure_usd >= ?
          and (${protocolClause})
          and (${unknownClause})
        order by (${sortColumn} is null) asc, ${sortColumn} ${direction}, symbol asc
        limit ?`
    )
    .all(...params) as ScoreRow[]
  return rows.map(rowToScore)
}

export async function getScore(tokenAddress: string): Promise<TokenScore | null> {
  const row = db
    .query(`select * from token_scores where token_address = ?`)
    .get(tokenAddress.toLowerCase()) as ScoreRow | null
  return row ? rowToScore(row) : null
}

export async function getScores(addresses: string[]): Promise<TokenScore[]> {
  if (addresses.length === 0) return []
  const placeholders = addresses.map(() => "?").join(", ")
  const rows = db
    .query(
      `select * from token_scores where token_address in (${placeholders})
         order by (exposure_ratio is null) asc, exposure_ratio desc, symbol asc`
    )
    .all(...addresses.map((a) => a.toLowerCase())) as ScoreRow[]
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
  db.query(
    `insert into refresh_runs (
       started_at, finished_at, duration_ms, lending_source, market_counts, eth_price_usd,
       uniswap_block, lending_block, tokens_total, tokens_scored, tokens_failed, notes
     ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    run.startedAt.toISOString(),
    run.finishedAt.toISOString(),
    Math.round(run.durationMs),
    run.lendingSource,
    JSON.stringify(run.marketCounts),
    run.ethPriceUsd,
    run.uniswapBlock,
    run.lendingBlock,
    run.tokensTotal,
    run.tokensScored,
    run.tokensFailed,
    run.notes
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

type RunRow = {
  started_at: string
  finished_at: string | null
  duration_ms: number | null
  lending_source: string
  market_counts: string
  eth_price_usd: number | null
  uniswap_block: number | null
  lending_block: number | null
  tokens_total: number
  tokens_scored: number
  tokens_failed: number
  notes: string | null
}

export async function lastRun(): Promise<LastRun | null> {
  const row = db
    .query(
      `select started_at, finished_at, duration_ms, lending_source, market_counts,
              eth_price_usd, uniswap_block, lending_block,
              tokens_total, tokens_scored, tokens_failed, notes
         from refresh_runs
        order by started_at desc
        limit 1`
    )
    .get() as RunRow | null
  if (!row) return null
  return {
    startedAt: row.started_at,
    finishedAt: row.finished_at,
    durationMs: row.duration_ms,
    lendingSource: row.lending_source,
    marketCounts: JSON.parse(row.market_counts) as Record<string, number>,
    ethPriceUsd: row.eth_price_usd,
    uniswapBlock: row.uniswap_block,
    lendingBlock: row.lending_block,
    tokensTotal: row.tokens_total,
    tokensScored: row.tokens_scored,
    tokensFailed: row.tokens_failed,
    notes: row.notes,
  }
}
