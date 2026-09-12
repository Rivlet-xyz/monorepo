import { errorMessage } from "../log"

const GATEWAY = "https://gateway.thegraph.com/api/subgraphs/id/"
const MAINNET_RPC = "https://ethereum-rpc.publicnode.com"

export class GraphError extends Error {
  constructor(
    message: string,
    readonly subgraphId: string,
    readonly status?: number,
    readonly errors?: { message: string }[],
    readonly indexing = false
  ) {
    super(message)
    this.name = "GraphError"
  }
}

export type GraphQueryOptions = {
  /** Abort the request after this many milliseconds. Default 20s. */
  timeoutMs?: number
  /** Retries on 429 / 5xx / network / timeout with 1s backoff. Default 1. */
  retries?: number
  /** Defaults to process.env.GRAPH_API_KEY. */
  apiKey?: string
}

type GraphResponse<T> = { data?: T | null; errors?: { message: string }[] }

/**
 * POST a GraphQL query to a subgraph on The Graph Network gateway.
 * Throws GraphError on HTTP errors, any `errors` entry, or a null `data`.
 */
export async function graphQuery<T>(
  subgraphId: string,
  query: string,
  variables: Record<string, unknown> = {},
  opts: GraphQueryOptions = {}
): Promise<T> {
  const { timeoutMs = 20_000, retries = 1 } = opts
  const apiKey = opts.apiKey ?? process.env.GRAPH_API_KEY
  if (!apiKey) throw new GraphError("GRAPH_API_KEY is not set", subgraphId)

  let attempt = 0
  for (;;) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)
    try {
      const res = await fetch(GATEWAY + subgraphId, {
        method: "POST",
        signal: controller.signal,
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ query, variables }),
      })

      if (!res.ok) {
        const body = (await res.text().catch(() => "")).slice(0, 300)
        const retryable = res.status === 429 || res.status >= 500
        if (retryable && attempt < retries) {
          attempt++
          await Bun.sleep(1000 * attempt)
          continue
        }
        throw new GraphError(
          `HTTP ${res.status} from subgraph ${subgraphId}: ${body}`,
          subgraphId,
          res.status
        )
      }

      const json = (await res.json()) as GraphResponse<T>
      if (json.errors && json.errors.length > 0) {
        const msg = json.errors.map((e) => e.message).join("; ")
        const indexing = /indexing_error|failed indexer|bad indexers/i.test(msg)
        throw new GraphError(
          `GraphQL error from subgraph ${subgraphId}: ${msg}`,
          subgraphId,
          undefined,
          json.errors,
          indexing
        )
      }
      if (json.data == null) {
        throw new GraphError(`Empty data from subgraph ${subgraphId}`, subgraphId)
      }
      return json.data
    } catch (err) {
      if (err instanceof GraphError) throw err
      if (attempt < retries) {
        attempt++
        await Bun.sleep(1000 * attempt)
        continue
      }
      const aborted = err instanceof Error && err.name === "AbortError"
      throw new GraphError(
        `${aborted ? "Timeout" : "Network error"} querying subgraph ${subgraphId}: ${errorMessage(err)}`,
        subgraphId
      )
    } finally {
      clearTimeout(timer)
    }
  }
}

export type SubgraphMeta = {
  block: number
  hasIndexingErrors: boolean
  deployment: string
}

export async function fetchSubgraphMeta(subgraphId: string): Promise<SubgraphMeta> {
  const data = await graphQuery<{
    _meta: { block: { number: number }; hasIndexingErrors: boolean; deployment: string }
  }>(subgraphId, `{ _meta { block { number } hasIndexingErrors deployment } }`)
  return {
    block: Number(data._meta.block.number),
    hasIndexingErrors: data._meta.hasIndexingErrors,
    deployment: data._meta.deployment,
  }
}

/** Current Ethereum mainnet head block from a public RPC, for measuring subgraph lag. */
export async function fetchMainnetHead(timeoutMs = 15_000): Promise<number> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(MAINNET_RPC, {
      method: "POST",
      signal: controller.signal,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_blockNumber", params: [] }),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status} from ${MAINNET_RPC}`)
    const json = (await res.json()) as { result?: string; error?: { message: string } }
    if (!json.result) throw new Error(json.error?.message ?? "no result")
    return Number(BigInt(json.result))
  } finally {
    clearTimeout(timer)
  }
}
