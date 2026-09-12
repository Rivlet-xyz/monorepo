import { graphQuery } from "./graph"
import type { Market } from "../engine/types"

/**
 * Official Aave v3 Ethereum subgraph (fallback lending source).
 * LTV and liquidation threshold are basis points (8000 = 80%).
 *
 * `price.priceInEth` is the Aave oracle price in USD with 8 decimals despite
 * the field name: on Aave v3 the oracle base currency is USD, and the subgraph
 * kept the v2 field name. The Phase 0 probe prints the WETH value so this scale
 * can be checked against the market ETH price (expect ~ethPrice * 1e8).
 */
const PRICE_SCALE = 1e8

type RawReserve = {
  id: string
  symbol: string
  underlyingAsset: string
  decimals: number | string
  baseLTVasCollateral: string
  reserveLiquidationThreshold: string
  totalATokenSupply: string
  price: { priceInEth: string }
}

const PAGE = 1000

const QUERY = `query Reserves($first: Int!, $skip: Int!) {
  reserves(
    first: $first
    skip: $skip
    where: { usageAsCollateralEnabled: true, isActive: true }
  ) {
    id
    symbol
    underlyingAsset
    decimals
    baseLTVasCollateral
    reserveLiquidationThreshold
    totalATokenSupply
    price { priceInEth }
  }
}`

export async function fetchAaveMarkets(
  subgraphId: string,
  minDepositUsd: number
): Promise<Market[]> {
  const markets: Market[] = []
  for (let skip = 0; skip <= 5000; skip += PAGE) {
    const data = await graphQuery<{ reserves: RawReserve[] }>(subgraphId, QUERY, {
      first: PAGE,
      skip,
    })
    for (const r of data.reserves) {
      const decimals = Number(r.decimals)
      const supply = Number(r.totalATokenSupply) / 10 ** decimals
      const priceUsd = Number(r.price.priceInEth) / PRICE_SCALE
      const depositUsd = supply * priceUsd
      if (!Number.isFinite(depositUsd) || depositUsd < minDepositUsd) continue
      markets.push({
        protocol: "aave-v3",
        marketId: r.id.toLowerCase(),
        marketName: `Aave v3 ${r.symbol}`,
        token: {
          address: r.underlyingAsset.toLowerCase(),
          symbol: r.symbol,
          decimals,
        },
        depositUsd,
        maxLtv: Number(r.baseLTVasCollateral) / 10_000,
        liquidationThreshold: Number(r.reserveLiquidationThreshold) / 10_000,
      })
    }
    if (data.reserves.length < PAGE) break
  }
  return markets
}
