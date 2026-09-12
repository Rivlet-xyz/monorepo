/**
 * Phase 0: verify every subgraph we depend on is reachable and indexed near
 * the mainnet head, then decide LENDING_SOURCE and write docs/data-sources.md.
 *
 * Reads process.env directly (not config.ts) so it can run before .env is
 * fully populated. Falls back to the known mainnet IDs when an ID is blank.
 *
 *   bun run --cwd server probe
 */
import { fetchMainnetHead, fetchSubgraphMeta, graphQuery, GraphError } from "../src/collector/graph"

const MAX_LAG_BLOCKS = 2_000

const DEFAULT_IDS = {
  UNISWAP_V3_SUBGRAPH_ID: "5zvR82QoaXYFyDEKLZ9t6v9adgnptxYpKpSbxtgVENFV",
  MESSARI_AAVE_V3_SUBGRAPH_ID: "JCNWRypm7FYwV8fx5HhzZPSFaMxgkPuw4TnR3Gpi81zk",
  MESSARI_COMPOUND_V3_SUBGRAPH_ID: "AwoxEZbiWLvv6e3QdvdMZw4WDURdGbvPfHmZRc8Dpfz9",
  MORPHO_BLUE_SUBGRAPH_ID: "8Lz789DP5VKLXumTMTgygjU2xtuzx8AhbaacgN5PYCAs",
  AAVE_V3_OFFICIAL_SUBGRAPH_ID: "Cd2gEDVeqnjBn1hSeqFMitw8Q1iiyV9FYUZkLNRcL87g",
} as const

type EnvKey = keyof typeof DEFAULT_IDS

function readEnv(name: string): string | undefined {
  const raw = process.env[name]
  if (raw === undefined) return undefined
  const s = raw.replace(/\s+#.*$/, "").trim()
  return s === "" ? undefined : s
}

function resolveId(key: EnvKey): { id: string; fromEnv: boolean } {
  const fromEnv = readEnv(key)
  return fromEnv ? { id: fromEnv, fromEnv: true } : { id: DEFAULT_IDS[key], fromEnv: false }
}

type Kind = "uniswap" | "messari" | "aave"

type Target = {
  key: EnvKey
  name: string
  kind: Kind
  id: string
  fromEnv: boolean
  optional: boolean
}

type Result = Target & {
  ok: boolean
  status: "ok" | "stale" | "error"
  block?: number
  lag?: number
  deployment?: string
  hasIndexingErrors?: boolean
  sample?: string
  error?: string
}

const SAMPLE: Record<Kind, string> = {
  messari: `{
    markets(first: 3, where: { canUseAsCollateral: true }, orderBy: totalDepositBalanceUSD, orderDirection: desc) {
      id name inputToken { id symbol decimals } totalDepositBalanceUSD maximumLTV liquidationThreshold
    }
  }`,
  uniswap: `{
    bundle(id: "1") { ethPriceUSD }
    pools(first: 2, orderBy: totalValueLockedUSD, orderDirection: desc) {
      id liquidity sqrtPrice tick token0 { symbol } token1 { symbol }
    }
  }`,
  aave: `{
    reserves(first: 3, where: { usageAsCollateralEnabled: true }, orderBy: totalLiquidity, orderDirection: desc) {
      id symbol underlyingAsset decimals baseLTVasCollateral reserveLiquidationThreshold totalATokenSupply price { priceInEth }
    }
    weth: reserves(first: 1, where: { symbol: "WETH" }) { symbol decimals price { priceInEth } }
  }`,
}

function summarize(kind: Kind, data: unknown): string {
  const d = data as Record<string, unknown>
  if (kind === "uniswap") {
    const bundle = d.bundle as { ethPriceUSD: string } | null
    const pools = (d.pools as { token0: { symbol: string }; token1: { symbol: string }; tick: string | null }[]) ?? []
    return `ethPriceUSD=${Number(bundle?.ethPriceUSD ?? 0).toFixed(2)}; top pools: ${pools
      .map((p) => `${p.token0.symbol}/${p.token1.symbol}@tick ${p.tick}`)
      .join(", ")}`
  }
  if (kind === "messari") {
    const markets =
      (d.markets as { inputToken: { symbol: string }; maximumLTV: string; totalDepositBalanceUSD: string }[]) ?? []
    if (markets.length === 0) return "0 collateral markets returned"
    return markets
      .map((m) => `${m.inputToken.symbol} LTV=${m.maximumLTV} deposits=$${Number(m.totalDepositBalanceUSD).toExponential(2)}`)
      .join("; ")
  }
  const reserves = (d.reserves as { symbol: string; baseLTVasCollateral: string }[]) ?? []
  const weth = (d.weth as { price: { priceInEth: string } }[])?.[0]
  return `${reserves.map((r) => `${r.symbol} LTVbps=${r.baseLTVasCollateral}`).join("; ")}; WETH price.priceInEth=${weth?.price.priceInEth ?? "n/a"}`
}

async function probe(target: Target, head: number): Promise<Result> {
  try {
    const meta = await fetchSubgraphMeta(target.id)
    const lag = head - meta.block
    const data = await graphQuery<unknown>(target.id, SAMPLE[target.kind])
    const sample = summarize(target.kind, data)
    const status = meta.hasIndexingErrors || lag > MAX_LAG_BLOCKS ? "stale" : "ok"
    return { ...target, ok: status === "ok", status, block: meta.block, lag, deployment: meta.deployment, hasIndexingErrors: meta.hasIndexingErrors, sample }
  } catch (err) {
    const message = err instanceof GraphError ? err.message : String(err)
    return { ...target, ok: false, status: "error", error: message }
  }
}

function fmt(n: number | undefined): string {
  return n === undefined ? "-" : n.toLocaleString("en-US")
}

async function main() {
  if (!readEnv("GRAPH_API_KEY")) {
    console.error("GRAPH_API_KEY is empty. Fill it in .env (repo root) and re-run.")
    process.exit(2)
  }

  const targets: Target[] = [
    { key: "UNISWAP_V3_SUBGRAPH_ID", name: "uniswap-v3-ethereum", kind: "uniswap", optional: false, ...resolveId("UNISWAP_V3_SUBGRAPH_ID") },
    { key: "MESSARI_AAVE_V3_SUBGRAPH_ID", name: "messari-aave-v3-ethereum", kind: "messari", optional: true, ...resolveId("MESSARI_AAVE_V3_SUBGRAPH_ID") },
    { key: "MESSARI_COMPOUND_V3_SUBGRAPH_ID", name: "messari-compound-v3-ethereum", kind: "messari", optional: true, ...resolveId("MESSARI_COMPOUND_V3_SUBGRAPH_ID") },
    { key: "MORPHO_BLUE_SUBGRAPH_ID", name: "morpho-blue-ethereum", kind: "messari", optional: true, ...resolveId("MORPHO_BLUE_SUBGRAPH_ID") },
    { key: "AAVE_V3_OFFICIAL_SUBGRAPH_ID", name: "aave-v3-ethereum (official)", kind: "aave", optional: true, ...resolveId("AAVE_V3_OFFICIAL_SUBGRAPH_ID") },
  ]

  const head = await fetchMainnetHead()
  console.log(`mainnet head: ${fmt(head)}\n`)

  const results = await Promise.all(targets.map((t) => probe(t, head)))

  for (const r of results) {
    const src = r.fromEnv ? "env" : "default"
    const line =
      r.status === "error"
        ? `ERROR  ${r.name} [${r.id}] (${src}): ${r.error}`
        : `${r.status.toUpperCase().padEnd(6)} ${r.name} [${r.id}] (${src}) block=${fmt(r.block)} lag=${fmt(r.lag)}${r.hasIndexingErrors ? " indexingErrors" : ""}\n       ${r.sample}`
    console.log(line)
  }

  const uni = results.find((r) => r.kind === "uniswap")!
  const messariAave = results.find((r) => r.key === "MESSARI_AAVE_V3_SUBGRAPH_ID")!
  const messariCompound = results.find((r) => r.key === "MESSARI_COMPOUND_V3_SUBGRAPH_ID")!
  const morpho = results.find((r) => r.key === "MORPHO_BLUE_SUBGRAPH_ID")!
  const aaveOfficial = results.find((r) => r.key === "AAVE_V3_OFFICIAL_SUBGRAPH_ID")!

  let decision: "messari" | "aave" | "none"
  let reason: string
  if (messariAave.ok || messariCompound.ok) {
    decision = "messari"
    const used = [messariAave, messariCompound, morpho].filter((r) => r.ok).map((r) => r.name)
    reason = `Messari standardized lending subgraphs are indexed within ${MAX_LAG_BLOCKS.toLocaleString("en-US")} blocks of head: ${used.join(", ")}.`
  } else if (aaveOfficial.ok) {
    decision = "aave"
    reason = "Neither Messari lending subgraph is healthy; falling back to the official Aave v3 subgraph (Aave-only coverage)."
  } else {
    decision = "none"
    reason = "No lending subgraph is healthy."
  }

  const envLines: string[] = [`LENDING_SOURCE=${decision === "none" ? "messari" : decision}`]
  for (const r of results) {
    const keep = r.ok
    envLines.push(`${r.key}=${keep ? r.id : ""}`)
  }

  const doc = renderDoc({ head, results, decision, reason, envLines })
  const outPath = new URL("../../docs/data-sources.md", import.meta.url)
  await Bun.write(outPath, doc)

  console.log(`\nDecision: LENDING_SOURCE=${decision} — ${reason}`)
  console.log(`\nSet in .env:\n${envLines.map((l) => "  " + l).join("\n")}`)
  console.log(`\nWrote ${outPath.pathname}`)

  if (!uni.ok) {
    console.error("\nSTOP: the Uniswap v3 subgraph is not healthy. Nothing else can proceed.")
    process.exit(1)
  }
  if (decision === "none") {
    console.error("\nSTOP: no lending subgraph is healthy.")
    process.exit(1)
  }
}

function renderDoc(args: {
  head: number
  results: Result[]
  decision: string
  reason: string
  envLines: string[]
}): string {
  const { head, results, decision, reason, envLines } = args
  const rows = results
    .map((r) => {
      const explorer = `https://thegraph.com/explorer/subgraphs/${r.id}`
      const status = r.status === "error" ? `error` : r.status
      const detail = r.status === "error" ? (r.error ?? "") : (r.sample ?? "")
      return `| ${r.name} | [\`${r.id}\`](${explorer}) | ${fmt(r.block)} | ${fmt(r.lag)} | ${status}${r.hasIndexingErrors ? " (indexing errors)" : ""} | ${detail.replace(/\|/g, "\\|")} |`
    })
    .join("\n")

  return `# Data sources

Generated by \`bun run --cwd server probe\` on ${new Date().toISOString()}.
Mainnet head at probe time: ${fmt(head)} (via \`eth_blockNumber\` on https://ethereum-rpc.publicnode.com).
A subgraph counts as healthy when it has no indexing errors and lags the head by at most ${MAX_LAG_BLOCKS.toLocaleString("en-US")} blocks.

| Subgraph | ID | Block | Lag | Status | Sample |
|---|---|---|---|---|---|
${rows}

## Decision

\`LENDING_SOURCE=${decision}\` — ${reason}

\`\`\`
${envLines.join("\n")}
\`\`\`

## Notes

- Messari lending subgraphs store \`maximumLTV\` and \`liquidationThreshold\` as percentages (80 = 80%); the collector divides by 100.
- The official Aave v3 subgraph stores \`baseLTVasCollateral\` and \`reserveLiquidationThreshold\` in basis points (8000 = 80%); the collector divides by 10,000. Its \`price.priceInEth\` is the oracle price in USD with 8 decimals despite the field name; the WETH sample above should read close to the market ETH price × 1e8.
- Uniswap v3 depth is always read from the official Uniswap v3 Ethereum subgraph; the lending source only changes where collateral markets come from.
- All values are fetched live at runtime through the Graph gateway with a Subgraph Studio API key. Nothing on this page is used as input to the running service.
`
}

await main()
