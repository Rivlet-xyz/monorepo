import type { AskResponse, Meta, Token, TokenDetail } from "@/lib/types"

const API_BASE = process.env.NEXT_PUBLIC_API_BASE?.replace(/\/$/, "") ?? ""
const FORCE_FIXTURES = process.env.NEXT_PUBLIC_USE_FIXTURES === "true"

/**
 * Fixtures are used when explicitly switched on, or whenever no API base is
 * configured. Everything that renders data reads this flag and shows the
 * yellow "fixture data" pill, so nothing fake can reach a recording unnoticed.
 */
export const usingFixtures: boolean = FORCE_FIXTURES || API_BASE === ""

export class ApiError extends Error {
  readonly status: number | null

  constructor(message: string, status: number | null = null) {
    super(message)
    this.name = "ApiError"
    this.status = status
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const url = usingFixtures ? path : `${API_BASE}${path}`
  let response: Response
  try {
    response = await fetch(url, { ...init, headers: { accept: "application/json", ...init?.headers } })
  } catch (error) {
    throw new ApiError(error instanceof Error ? error.message : "network request failed")
  }
  if (!response.ok) {
    throw new ApiError(`${path} returned ${response.status} ${response.statusText}`.trim(), response.status)
  }
  try {
    return (await response.json()) as T
  } catch {
    throw new ApiError(`${path} returned a response that was not json`)
  }
}

export function getMeta(signal?: AbortSignal): Promise<Meta> {
  return request<Meta>(usingFixtures ? "/fixtures/meta.json" : "/meta", { signal })
}

export function getTokens(signal?: AbortSignal): Promise<Token[]> {
  return request<Token[]>(usingFixtures ? "/fixtures/tokens.json" : "/tokens", { signal })
}

export async function getToken(address: string, signal?: AbortSignal): Promise<TokenDetail> {
  if (!usingFixtures) {
    return request<TokenDetail>(`/tokens/${address}`, { signal })
  }
  try {
    return await request<TokenDetail>(`/fixtures/token-${address.toLowerCase()}.json`, { signal })
  } catch {
    // Only two fixture tokens have a detail file. For the rest, fall back to the
    // list entry so the drawer still opens, with pools and summary genuinely
    // absent rather than fabricated.
    const tokens = await getTokens(signal)
    const token = tokens.find((candidate) => candidate.address.toLowerCase() === address.toLowerCase())
    if (!token) throw new ApiError(`no fixture for token ${address}`)
    return { ...token, pools: [], summary: null }
  }
}

export async function postAsk(question: string, signal?: AbortSignal): Promise<AskResponse> {
  if (usingFixtures) {
    return request<AskResponse>("/fixtures/ask.json", { signal })
  }
  return request<AskResponse>("/ask", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ question }),
    signal,
  })
}

export function explorerAddressUrl(address: string): string {
  return `https://etherscan.io/address/${address}`
}

export function explorerBlockUrl(block: number): string {
  return `https://etherscan.io/block/${block}`
}

/**
 * Market pages for the protocols we can link deterministically. Anything not
 * listed falls back to the block explorer rather than guessing a url shape.
 */
export function marketUrl(protocol: string, marketId: string): string {
  switch (protocol) {
    case "aave-v3":
      return `https://app.aave.com/reserve-overview/?underlyingAsset=${marketId}&marketName=proto_mainnet_v3`
    case "morpho-blue":
      return `https://app.morpho.org/market?id=${marketId}`
    default:
      return explorerAddressUrl(marketId)
  }
}
