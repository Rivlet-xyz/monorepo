# Case studies: collateral valued by spot price, drained by shallow liquidity

Static, sourced numbers for the demo. Nothing on this page is read by the
running service; shoalfi computes everything live from The Graph.

## Moonwell / MAMO (Base, 27 Aug 2026)

| Item | Value | Source |
|---|---|---|
| Protocol, chain, date | Moonwell, Base, 27 Aug 2026 | [The Defiant][defiant], [CryptoTimes][ct-moonwell] |
| Collateral token | MAMO | [The Defiant][defiant] |
| MAMO market cap before the attack | ≈ $6M | [The Defiant][defiant], [Cryptonomist][cryptonomist] |
| MAMO 24h volume before the attack | ≈ $1.18M | [Cryptonomist][cryptonomist] |
| Venues | MAMO/cbBTC on Aerodrome Slipstream, MAMO/USDC on Uniswap v4 | [The Defiant][defiant] |
| Moonwell collateral factor | 50% | [Cryptonomist][cryptonomist] |
| Supply cap / borrow cap | 20M MAMO / 3M MAMO | [Cryptonomist][cryptonomist] |
| Oracle | Spot price, no TWAP | [The Defiant][defiant], [KuCoin][kucoin] |
| Price move | ≈ 8× ($0.0105 → ≈ $0.088; some reports quote a peak near $0.43) | [The Defiant][defiant], [CryptoTimes][ct-moonwell] |
| Gross borrowed against inflated MAMO | ≈ $11.03M (cbBTC, ETH, USDC, wstETH) | [Cryptonomist][cryptonomist] |
| Net loss | ≈ $8.7M | [The Defiant][defiant], [KuCoin][kucoin] |
| Residual bad debt | ≈ $9.1M | [Cryptonomist][cryptonomist] |
| Response | Borrow caps on all Base core markets set to 1 wei | [The Defiant][defiant] |

**Mechanism.** The attacker bought MAMO across the two thin Base pools, pushing
the spot price up roughly eightfold, deposited the inflated MAMO as collateral,
and borrowed about $11M of liquid assets against it. The oracle read the pool
price as truth.

## Morpho / PT-reUSD (Ethereum, 25 Aug 2026)

| Item | Value | Source |
|---|---|---|
| Trigger | ≈ $320,000 of SY-reUSD swapped into > 9.5M YT-reUSD by wallet 0x854e…690d, 11 consecutive Pendle trades between 04:28 and 04:37 UTC | [Crypto Briefing][cb] |
| Oracle | Lower of the 15-minute TWAP of PT-reUSD on Pendle and a fixed curve | [CryptoDaily][cd], [CryptoTimes][ct-morpho] |
| Market state | ≈ $67.5M of collateral against ≈ $52.2M of borrows; 91.5% liquidation threshold | [CryptoDaily][cd] |
| Pendle pool liquidity | ≈ $8.97M | [CryptoDaily][cd] |
| Result | ≈ $36.4M liquidated across 33 events, 04:37 to 04:51 UTC | [CryptoDaily][cd], [Crypto Briefing][cb] |
| Attacker profit | ≥ $360,000 realized (PeckShield attribution via CryptoTimes) | [CryptoTimes][ct-morpho] |

**Mechanism.** About $320K of buys in a pool holding about $9M of liquidity moved
the PT-reUSD oracle by less than 3%, which was enough at a 91.5% liquidation
threshold to liquidate tens of millions. Collateral value and pool depth are not
directly comparable measures, but the ratio between them is the point: the
market was lending against far more than the venue could absorb.

## Tectonic (Cronos, 30 Aug 2026)

Roughly $75M of damage from the same family of failure: collateral valued by a
manipulable price rather than by what could be sold. Included here for scale
only; shoalfi is Ethereum-mainnet only in this version.

## What shoalfi would have shown

Order-of-magnitude reasoning only. shoalfi does not index Base or Pendle, so the
numbers below are not outputs of the service.

- **MAMO.** A token with a ≈ $6M market cap and ≈ $1M of daily volume, split
  across two pools, cannot have more than a few hundred thousand dollars of
  sellable depth within a 10% move. A 30% cap on that is well under $1M.
  Moonwell's supply cap of 20M MAMO at a 50% collateral factor allowed roughly
  $100K of borrowing at the pre-attack price and about $11M after the pump.
  Either way the exposure ratio would have been far above 1.0, and the pump
  cost to double the price would have been a small fraction of the borrowable
  amount. The table row would have been red with the "profitable to attack"
  flag before the attack.
- **PT-reUSD.** $52.2M borrowed against a venue with ≈ $9M of total liquidity is
  an exposure ratio of order 20 against a 30%-of-depth cap, and the required
  drop to trigger liquidations was under 10%. The liquidation attack cost would
  have been a small fraction of the exposure.

## Sources

[defiant]: https://thedefiant.io/news/hacks/moonwell-loses-8-7-million-to-mamo-price-manipulation-on-base
[ct-moonwell]: https://www.cryptotimes.io/2026/08/27/moonwell-loses-nearly-8-7m-in-base-exploit-after-mamo-price-manipulation/
[cryptonomist]: https://en.cryptonomist.ch/2026/08/28/moonwell-mamo-exploit/
[kucoin]: https://www.kucoin.com/news/flash/moonwell-exploit-on-base-drains-8-7m-via-mamo-oracle-manipulation
[cb]: https://cryptobriefing.com/morpho-liquidations-pendle-reusd-cascade/
[ct-morpho]: https://www.cryptotimes.io/2026/08/25/morphos-15-minute-twap-oracle-exploited-in-36-4m-liquidation-attack/
[cd]: https://cryptodaily.co.uk/2026/08/pt-reusd-morpho-liquidations-36m

- The Defiant, "Moonwell Loses $8.7 Million To MAMO Price Manipulation On Base": <https://thedefiant.io/news/hacks/moonwell-loses-8-7-million-to-mamo-price-manipulation-on-base>
- CryptoTimes, "Moonwell Loses Nearly $8.7M in Base Exploit After MAMO Price Manipulation": <https://www.cryptotimes.io/2026/08/27/moonwell-loses-nearly-8-7m-in-base-exploit-after-mamo-price-manipulation/>
- Cryptonomist, "Moonwell MAMO Exploit Reveals $8.7M Lending Flaw": <https://en.cryptonomist.ch/2026/08/28/moonwell-mamo-exploit/>
- KuCoin News, "Moonwell Exploit on Base Drains $8.7M via MAMO Oracle Manipulation": <https://www.kucoin.com/news/flash/moonwell-exploit-on-base-drains-8-7m-via-mamo-oracle-manipulation>
- Crypto Briefing, "Morpho liquidations: Pendle reUSD cascade": <https://cryptobriefing.com/morpho-liquidations-pendle-reusd-cascade/>
- CryptoTimes, "Morpho's 15-Minute TWAP Oracle Exploited in $36.4M Liquidation Attack": <https://www.cryptotimes.io/2026/08/25/morphos-15-minute-twap-oracle-exploited-in-36-4m-liquidation-attack/>
- CryptoDaily, "PT-reUSD Morpho liquidations $36M": <https://cryptodaily.co.uk/2026/08/pt-reusd-morpho-liquidations-36m>
