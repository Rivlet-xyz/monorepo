import { describe, expect, test } from "bun:test"
import { classifyDepth, exposureFor, exposureRatio, protocolsOf, RATIO_CAP } from "../src/engine/risk"
import type { Market } from "../src/engine/types"

const market = (over: Partial<Market>): Market => ({
  protocol: "aave-v3",
  marketId: "m",
  marketName: "m",
  token: { address: "0x0", symbol: "X", decimals: 18 },
  depositUsd: 1_000_000,
  maxLtv: 0.7,
  liquidationThreshold: 0.8,
  ...over,
})

describe("exposureFor", () => {
  test("sums deposits × LTV and deposit-weights the liquidation threshold", () => {
    const e = exposureFor([
      market({ depositUsd: 1_000_000, maxLtv: 0.7, liquidationThreshold: 0.8 }),
      market({ depositUsd: 3_000_000, maxLtv: 0.5, liquidationThreshold: 0.6, protocol: "compound-v3" }),
    ])
    expect(e.exposureUsd).toBe(700_000 + 1_500_000)
    expect(e.weightedLt).toBeCloseTo((0.8 * 1 + 0.6 * 3) / 4, 10)
    expect(e.requiredDrop).toBeCloseTo(1 - 0.65, 10)
  })
  test("clamps the required drop into [0.01, 0.99]", () => {
    expect(exposureFor([market({ liquidationThreshold: 0.999 })]).requiredDrop).toBe(0.01)
    expect(exposureFor([market({ liquidationThreshold: 0 })]).requiredDrop).toBe(0.99)
    expect(exposureFor([]).requiredDrop).toBe(0.99)
  })
})

describe("classifyDepth", () => {
  test("three states", () => {
    expect(classifyDepth(null, 5_000_000)).toBe("no_venue")
    expect(classifyDepth(4_999_999, 5_000_000)).toBe("shallow")
    expect(classifyDepth(5_000_000, 5_000_000)).toBe("deep")
  })
})

describe("exposureRatio", () => {
  test("null cap means unknown, zero cap with exposure is capped, no exposure is 0", () => {
    expect(exposureRatio(1_000, null)).toBeNull()
    expect(exposureRatio(1_000, 0)).toBe(RATIO_CAP)
    expect(exposureRatio(0, 0)).toBe(0)
    expect(exposureRatio(300, 100)).toBe(3)
    expect(exposureRatio(1e12, 1)).toBe(RATIO_CAP)
  })
})

describe("protocolsOf", () => {
  test("distinct and sorted", () => {
    expect(
      protocolsOf([market({ protocol: "compound-v3" }), market({}), market({ protocol: "compound-v3" })])
    ).toEqual(["aave-v3", "compound-v3"])
  })
})
