/**
 * Phase 2 acceptance: sellable depth and pump cost for one token.
 *
 *   bun run --cwd server probe:depth 0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2
 *
 * WETH at 10% must come out well above $100M; a long-tail collateral token
 * should come out below $5M. A tiny WETH number means the walk direction is
 * inverted.
 */
import { env } from "../src/config"
import { fetchEthPriceUsd, fetchPoolsForToken, fetchTicks, normalizeAddress } from "../src/collector/uniswap"
import { pumpCostForToken, pumpPlan, sellPlan, sellableDepthForToken } from "../src/engine/depth"
import type { TickPage } from "../src/engine/types"

const arg = process.argv[2]
if (!arg) {
  console.error("usage: bun run probe:depth <tokenAddress>")
  process.exit(2)
}
const token = normalizeAddress(arg)

const usd = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })

const { ethPriceUsd, block } = await fetchEthPriceUsd()
const pools = await fetchPoolsForToken(token)
console.log(`uniswap block ${block.toLocaleString("en-US")}, ETH = ${usd(ethPriceUsd)}, ${pools.length} pools`)

const sellPages = new Map<string, TickPage>()
const pumpPages = new Map<string, TickPage>()
for (const pool of pools) {
  const sell = sellPlan(pool, token, env.SLIPPAGE_BPS)
  const pump = pumpPlan(pool, token, env.PUMP_TARGET_BPS)
  sellPages.set(pool.id, await fetchTicks(pool.id, pool.tick, sell.direction, sell.targetTick))
  pumpPages.set(pool.id, await fetchTicks(pool.id, pool.tick, pump.direction, pump.targetTick))
}

const depth = sellableDepthForToken(token, pools, sellPages, env.SLIPPAGE_BPS, ethPriceUsd)
const pump = pumpCostForToken(token, pools, pumpPages, env.PUMP_TARGET_BPS, ethPriceUsd)

console.log(`price ${usd(depth.priceUsd)} (${depth.priceUsd.toPrecision(6)})\n`)
for (const p of depth.perPool) {
  console.log(
    `  ${p.pair.padEnd(14)} fee=${String(p.feeTier).padEnd(5)} ${p.direction.padEnd(4)} depth=${usd(p.depthUsd).padStart(16)}  tvl=${usd(p.tvlUsd)}${p.truncated ? "  (truncated)" : ""}`
  )
}
console.log(`\nsellable depth at ${env.SLIPPAGE_BPS / 100}% : ${usd(depth.depthUsd)}${depth.truncated ? " (some pools truncated)" : ""}`)
console.log(`pump cost for +${env.PUMP_TARGET_BPS / 100}%  : ${usd(pump.costUsd)}${pump.truncated ? " (some pools truncated)" : ""}`)
