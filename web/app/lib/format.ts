/** Rendered wherever the backend could not give us a number. Never a zero. */
export const DASH = "—"

function isMissing(value: number | null | undefined): value is null | undefined {
  return value === null || value === undefined || Number.isNaN(value)
}

/** $412M, $1.2B, $88K. Under 10 of a unit keeps one decimal, above it none. */
export function compactUsd(value: number | null | undefined): string {
  if (isMissing(value)) return DASH
  const sign = value < 0 ? "-" : ""
  const abs = Math.abs(value)
  const units: [number, string][] = [
    [1e12, "T"],
    [1e9, "B"],
    [1e6, "M"],
    [1e3, "K"],
  ]
  for (const [size, suffix] of units) {
    if (abs >= size) {
      const scaled = abs / size
      return `${sign}$${scaled >= 10 ? Math.round(scaled) : scaled.toFixed(1)}${suffix}`
    }
  }
  return `${sign}$${abs >= 10 ? Math.round(abs) : abs.toFixed(2)}`
}

/** Prices keep cents below $10 so a $0.42 token does not render as $0. */
export function priceUsd(value: number | null | undefined): string {
  if (isMissing(value)) return DASH
  if (value >= 1000) return `$${Math.round(value).toLocaleString("en-US")}`
  if (value >= 10) return `$${value.toFixed(2)}`
  if (value >= 0.01) return `$${value.toFixed(3)}`
  return `$${value.toPrecision(2)}`
}

/** Always two decimals, as specified. */
export function ratio(value: number | null | undefined): string {
  if (isMissing(value)) return DASH
  return value.toFixed(2)
}

/** Takes a fraction: 0.805 renders as 80.5%, 0.17 as 17%. */
export function percent(value: number | null | undefined): string {
  if (isMissing(value)) return DASH
  const pct = value * 100
  const rounded = Math.round(pct * 10) / 10
  return `${Number.isInteger(rounded) ? rounded : rounded.toFixed(1)}%`
}

export function truncateAddress(address: string, lead = 6, tail = 4): string {
  if (address.length <= lead + tail + 2) return address
  return `${address.slice(0, lead)}…${address.slice(-tail)}`
}

/** Fee tiers arrive in hundredths of a bip: 500 is 0.05%. */
export function feeTier(value: number | null | undefined): string {
  if (isMissing(value)) return DASH
  return `${value / 10000}%`
}

/** "09:41 utc" from an ISO timestamp. */
export function utcTime(iso: string | null | undefined): string {
  if (!iso) return DASH
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return DASH
  const hh = String(date.getUTCHours()).padStart(2, "0")
  const mm = String(date.getUTCMinutes()).padStart(2, "0")
  return `${hh}:${mm} utc`
}

export function blockNumber(value: number | null | undefined): string {
  if (isMissing(value)) return DASH
  return value.toLocaleString("en-US")
}

/** "aave-v3" reads as "aave v3" in the header, per the spec's wording. */
export function prettySource(value: string): string {
  return value.replace(/-/g, " ")
}
