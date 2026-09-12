# shoalfi contracts

> **ROADMAP. Not built into the product, not deployed, not audited.**
> shoalfi ships as an off-chain API for ETHOnline 2026. This folder shows how the
> API's `sellable_depth_usd` would become an on-chain borrow cap. The contract
> compiles and its tests pass, but no oracle feeds it and nothing calls it.

## What is here

| File | Purpose |
|---|---|
| `src/CapSteward.sol` | `IDepthOracle` interface plus `CapSteward`, which turns a depth snapshot into `maxBorrowableUsd(token)` |
| `test/CapSteward.t.sol` | Foundry tests with a mock oracle: fresh, boundary, stale, unpublished, constructor guards, fuzz |
| `script/CapSteward.s.sol` | Deploy script that reads `DEPTH_ORACLE` from the environment (never run) |

```sh
bun contracts:build   # forge build --root contracts
bun contracts:test    # forge test  --root contracts
bun contracts:fmt     # forge fmt   --root contracts
```

## How a lending protocol would use it

1. A keeper reads `GET /tokens/:address` from the shoalfi API every few minutes and
   posts `(token, sellable_depth_usd, computed_at)` to an `IDepthOracle`
   implementation. Each post is signed by the keeper key; the oracle rejects
   unsigned or older-than-latest snapshots.
2. The protocol deploys `CapSteward(oracle, 3000, 15 minutes)`: lend against at
   most 30% of the depth that can be sold within a 10% price move, and treat any
   snapshot older than 15 minutes as missing.
3. Before approving a borrow that uses `token` as collateral, the protocol's risk
   module calls `capSteward.maxBorrowableUsd(token)` and rejects the borrow if the
   market's total borrows against `token` would exceed the returned value.
4. Because a stale or missing snapshot returns `0`, the cap fails closed: an
   oracle outage stops new borrows against that token rather than allowing
   unlimited ones.

The two incidents that motivated shoalfi would have hit this cap directly. On
Moonwell (MAMO, Base, Aug 27 2026) the collateral had a market cap of a few
million dollars and daily volume around a million, so a 30%-of-depth cap would
have been far below the $11M that was borrowed. On Morpho (PT-reUSD, Aug 25 2026)
the Pendle pool held about $9M of liquidity against $67.5M of collateral.

## Why it is only a roadmap item

- The oracle feed does not exist yet. Posting signed snapshots needs a keeper,
  a funded key, and an on-chain contract with replay protection.
- `sellable_depth_usd` today is Uniswap v3 only and treats pools as independent.
  A production cap should read every venue and account for shared liquidity.
- Governance: who sets `capBps` and `maxStaleness`, and how a protocol overrides
  the cap for a token, are protocol decisions that are out of scope here.
