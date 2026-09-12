# Uniswap developer feedback — shoalfi (ETHOnline 2026)

Feedback form: <https://developers.uniswap.org/hackathon-feedback> (submitted alongside this file).

## What we built with Uniswap

shoalfi answers "if a lending protocol had to sell this collateral today, what
would it get?" For every token accepted as collateral by Aave v3 and Compound v3
on Ethereum mainnet we walk the Uniswap v3 tick liquidity of the token's top
pools and compute:

- **sellable depth**: USD of the token that can be sold before its price falls 10%
- **liquidation attack cost**: USD of the token that must be dumped to push the
  price down by `1 − liquidation threshold`
- **pump cost**: USD of quote tokens needed to double the token's price

Those three numbers, compared with what lending markets currently allow to be
borrowed against the token, are the whole product.

## Which parts of the Uniswap stack

| Piece | Where |
|---|---|
| Uniswap v3 Ethereum subgraph on The Graph Network (`5zvR82QoaXYFyDEKLZ9t6v9adgnptxYpKpSbxtgVENFV`) for `bundle`, `pools`, `ticks` | [server/src/collector/uniswap.ts](server/src/collector/uniswap.ts) |
| `@uniswap/v3-sdk` `TickMath.getSqrtRatioAtTick`, `SqrtPriceMath.getAmount0Delta`, `SqrtPriceMath.getAmount1Delta` with `jsbi` | [server/src/engine/depth.ts](server/src/engine/depth.ts) |

## What was easy

- The subgraph's `pools` entity has everything a depth walk needs in one query:
  `liquidity`, `sqrtPrice`, `tick`, `feeTier`, `totalValueLockedUSD`, and
  `derivedETH` on both tokens. One aliased query covers "token on either side"
  ([uniswap.ts:78](server/src/collector/uniswap.ts#L78)).
- `SqrtPriceMath.getAmount0Delta` / `getAmount1Delta` sort their two sqrt-price
  arguments internally, so the walker only has to decide which token is flowing
  in ([depth.ts:69](server/src/engine/depth.ts#L69)).
- `bundle(id: "1").ethPriceUSD` plus `derivedETH` gives a consistent USD price
  for every token in the same query family; no second price source needed.

## What was hard or surprising

1. **Direction semantics take a while to internalise.** Selling token0 pushes the
   pool price down and consumes the token0 delta while crossing ticks with
   `L -= liquidityNet`; selling token1 does the mirror image. Buying (the pump
   case) is the same walk with the *other* token as the one flowing in. We ended
   up with a single walker parameterised by a "plan" ([depth.ts:46](server/src/engine/depth.ts#L46),
   [depth.ts:80](server/src/engine/depth.ts#L80)), and unit tests against the
   closed-form single-range formulas to catch an inverted direction
   ([server/test/depth.test.ts](server/test/depth.test.ts)).
2. **The first tick when walking down is `tickIdx <= currentTick`, not `<`.** The
   pool price sits inside `[tick, tick + 1)`, so an initialized tick exactly at the
   current tick is the first one crossed. `where: { tickIdx_lt: current }` silently
   skips its liquidity change ([uniswap.ts:109](server/src/collector/uniswap.ts#L109)).
3. **Tick pagination.** Large pools have far more than 1,000 initialized ticks
   and the gateway caps `first` at 1,000, so we paginate on `tickIdx` with a
   cursor and bound the range to the target tick instead of using `skip`
   ([uniswap.ts:109](server/src/collector/uniswap.ts#L109)). Ticks are also fetched
   once per pool per direction and shared between tokens in the same refresh
   ([risk.ts:26](server/src/engine/risk.ts#L26)).
4. **Scalar types in the subgraph.** `Pool.id`, `Token.id`, `Tick.poolAddress` are
   `Bytes`, `Token.decimals` and `Pool.tick` are `BigInt` strings, and `tick` is
   nullable for pools that were never initialised. We inline lowercase hex
   literals, cast with `Number()`, and skip pools with a null tick
   ([uniswap.ts:58](server/src/collector/uniswap.ts#L58)).
5. **JSBI ergonomics.** The SDK speaks JSBI, the subgraph speaks decimal strings,
   and TypeScript speaks `bigint`. Converting raw 18-decimal amounts to a float
   with `Number()` loses precision past 2^53, so we divide as `bigint` first
   ([depth.ts:126](server/src/engine/depth.ts#L126)). `jsbi` must stay on the 3.x
   line the SDK depends on so both sides share one class.
6. **What "10% down" means for token1.** The spec's `ln(1 + s)` for the upward
   walk is a 10% rise in the *pool* price, which is only a 9.1% fall in token1's
   price. We use `−ln(1 − s)` so both sides mean "the sold token fell 10%"
   ([depth.ts:26](server/src/engine/depth.ts#L26)).

## What we would want from Uniswap

- **A depth / price-impact endpoint**: given `(token, direction, maxImpactBps)`
  return the absorbable amount per pool and in total. Every risk team rebuilds
  the tick walk; a reference implementation would make the numbers comparable
  across teams.
- **Tick snapshots by pool at a block** in the subgraph (or a Substreams package):
  a single entity per `(pool, block)` with the initialized ticks in range, so the
  walk needs one query instead of a paginated series.
- **A documented invariant for `derivedETH`** on low-liquidity tokens. When a
  token's only pool is thin, `derivedETH` can lag the pool's own `sqrtPrice`;
  a hint about which is authoritative would help.
- **v4 pool and tick data in the same shape** as v3 on the network so the same
  walker can cover both (the MAMO/USDC pool in the Moonwell incident was v4).

## Files

- [server/src/collector/uniswap.ts](server/src/collector/uniswap.ts): `fetchEthPriceUsd` (L39), `fetchPoolsForToken` (L78), `fetchTicks` (L109)
- [server/src/engine/depth.ts](server/src/engine/depth.ts): `tickForPriceRatio` (L26), `sellPlan` (L46), `pumpPlan` (L54), `walkPool` (L80), `jsbiToUnits` (L126), `sellableDepthForToken` (L153), `pumpCostForToken` (L196)
- [server/src/engine/risk.ts](server/src/engine/risk.ts): `cachedTicks` (L26), `scoreToken` (L115)
- [server/test/depth.test.ts](server/test/depth.test.ts): closed-form and direction tests
