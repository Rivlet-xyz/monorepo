/**
 * Phase 1 acceptance: market counts per protocol and WETH's top Uniswap v3
 * pools with one page of ticks.
 *
 *   bun run --cwd server probe:collect
 */
import { fetchAllMarkets, marketsByToken } from "../src/collector/lending"
import { fetchEthPriceUsd, fetchPoolsForToken, fetchTicks } from "../src/collector/uniswap"

const WETH = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"

const usd = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })

const snapshot = await fetchAllMarkets()
console.log(`lending block ${snapshot.block.toLocaleString("en-US")}`)
for (const [protocol, count] of Object.entries(snapshot.counts)) {
  console.log(`${protocol}: ${count} collateral markets`)
}
if (snapshot.failed.length) console.log(`failed sources: ${snapshot.failed.join(", ")}`)
const tokens = marketsByToken(snapshot.markets)
console.log(`${tokens.size} distinct collateral tokens\n`)

const { ethPriceUsd, block } = await fetchEthPriceUsd()
console.log(`uniswap block ${block.toLocaleString("en-US")}, ETH = ${usd(ethPriceUsd)}\n`)

const pools = await fetchPoolsForToken(WETH)
console.log(`WETH pools (${pools.length}):`)
for (const p of pools) {
  console.log(
    `  ${p.id}  ${p.token0.symbol}/${p.token1.symbol}  fee=${p.feeTier}  tick=${p.tick}  liquidity=${p.liquidity}  tvl=${usd(p.tvlUsd)}`
  )
}

const top = pools[0]
if (top) {
  const dir = top.token0.address === WETH ? "down" : "up"
  const bound = dir === "down" ? top.tick - 1100 : top.tick + 1100
  const page = await fetchTicks(top.id, top.tick, dir, bound, 1)
  console.log(
    `\ntop pool ${top.token0.symbol}/${top.token1.symbol}: ${page.ticks.length} initialized ticks walking ${dir} to ${bound} (page cap hit: ${page.exhausted})`
  )
}
