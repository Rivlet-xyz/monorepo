import { describe, expect, test } from "bun:test"
import JSBI from "jsbi"
import { TickMath } from "@uniswap/v3-sdk"
import {
  jsbiToUnits,
  pumpCostForToken,
  pumpPlan,
  sellPlan,
  sellableDepthForToken,
  tickForPriceRatio,
  walkPool,
} from "../src/engine/depth"
import type { Pool, TickPage } from "../src/engine/types"

const T0 = "0x0000000000000000000000000000000000000001"
const T1 = "0x0000000000000000000000000000000000000002"
const L = 10n ** 21n // 1000 units of liquidity at 18 decimals

function makePool(tick: number, liquidity: bigint): Pool {
  return {
    id: "0x00000000000000000000000000000000000000aa",
    feeTier: 3000,
    liquidity,
    sqrtPriceX96: BigInt(TickMath.getSqrtRatioAtTick(tick).toString()),
    tick,
    token0: { address: T0, symbol: "T0", decimals: 18, derivedETH: 1 },
    token1: { address: T1, symbol: "T1", decimals: 18, derivedETH: 1 },
    tvlUsd: 1_000_000,
  }
}

const sqrtPrice = (tick: number) => Math.sqrt(1.0001 ** tick)
const units = (x: bigint) => Number(x) / 1e18
const page = (ticks: [number, bigint][], exhausted = false): TickPage => ({
  ticks: ticks.map(([tickIdx, liquidityNet]) => ({ tickIdx, liquidityNet })),
  exhausted,
})

describe("tickForPriceRatio", () => {
  test("10% down and the symmetric up move", () => {
    expect(tickForPriceRatio(0, 0.9)).toBe(-1054)
    expect(tickForPriceRatio(0, 1 / 0.9)).toBe(1054)
  })
  test("clamps to the tick range", () => {
    expect(tickForPriceRatio(-887_000, 0.01)).toBe(TickMath.MIN_TICK)
    expect(tickForPriceRatio(887_000, 100)).toBe(TickMath.MAX_TICK)
  })
})

describe("plans", () => {
  const pool = makePool(0, L)
  test("selling token0 walks down, selling token1 walks up", () => {
    expect(sellPlan(pool, T0, 1000)).toMatchObject({ direction: "down", targetTick: -1054 })
    expect(sellPlan(pool, T1, 1000)).toMatchObject({ direction: "up", targetTick: 1054 })
  })
  test("buying token0 walks up spending token1; buying token1 walks down spending token0", () => {
    const up = pumpPlan(pool, T0, 10_000)
    expect(up.direction).toBe("up")
    expect(up.inToken.address).toBe(T1)
    expect(up.targetTick).toBe(6932)
    const down = pumpPlan(pool, T1, 10_000)
    expect(down.direction).toBe("down")
    expect(down.inToken.address).toBe(T0)
    expect(down.targetTick).toBe(-6932)
  })
})

describe("walkPool", () => {
  test("single range down matches the closed form L*(1/sqrtT - 1/sqrtC)", () => {
    const pool = makePool(0, L)
    const walk = walkPool(pool, sellPlan(pool, T0, 1000), page([]))
    const expected = units(L) * (1 / sqrtPrice(-1054) - 1 / sqrtPrice(0))
    expect(jsbiToUnits(walk.amountIn, 18)).toBeCloseTo(expected, 3)
    expect(walk.complete).toBe(true)
  })

  test("single range up matches the closed form L*(sqrtT - sqrtC)", () => {
    const pool = makePool(0, L)
    const walk = walkPool(pool, sellPlan(pool, T1, 1000), page([]))
    const expected = units(L) * (sqrtPrice(1054) - sqrtPrice(0))
    expect(jsbiToUnits(walk.amountIn, 18)).toBeCloseTo(expected, 3)
  })

  test("crossing an initialized tick downward removes liquidityNet", () => {
    // Position B adds L over [-500, 500]; active liquidity at tick 0 is 2L.
    const pool = makePool(0, 2n * L)
    const walk = walkPool(pool, sellPlan(pool, T0, 1000), page([[-500, L]]))
    const expected =
      units(2n * L) * (1 / sqrtPrice(-500) - 1 / sqrtPrice(0)) +
      units(L) * (1 / sqrtPrice(-1054) - 1 / sqrtPrice(-500))
    expect(jsbiToUnits(walk.amountIn, 18)).toBeCloseTo(expected, 3)
    expect(walk.ticksCrossed).toBe(1)
  })

  test("crossing an initialized tick upward adds liquidityNet", () => {
    const pool = makePool(0, 2n * L)
    const walk = walkPool(pool, sellPlan(pool, T1, 1000), page([[500, -L]]))
    const expected =
      units(2n * L) * (sqrtPrice(500) - sqrtPrice(0)) +
      units(L) * (sqrtPrice(1054) - sqrtPrice(500))
    expect(jsbiToUnits(walk.amountIn, 18)).toBeCloseTo(expected, 3)
  })

  test("ticks beyond the target are ignored", () => {
    const pool = makePool(0, L)
    const walk = walkPool(pool, sellPlan(pool, T0, 1000), page([[-2000, L]]))
    const expected = units(L) * (1 / sqrtPrice(-1054) - 1 / sqrtPrice(0))
    expect(jsbiToUnits(walk.amountIn, 18)).toBeCloseTo(expected, 3)
    expect(walk.ticksCrossed).toBe(0)
  })

  test("liquidity that would go negative is clamped to zero and stops absorbing", () => {
    const pool = makePool(0, L)
    const walk = walkPool(pool, sellPlan(pool, T0, 1000), page([[-100, 2n * L]]))
    const expected = units(L) * (1 / sqrtPrice(-100) - 1 / sqrtPrice(0))
    expect(jsbiToUnits(walk.amountIn, 18)).toBeCloseTo(expected, 3)
  })

  test("exhausted pages that stop short of the target are flagged incomplete", () => {
    const pool = makePool(0, L)
    const short = walkPool(pool, sellPlan(pool, T0, 1000), page([[-300, 0n]], true))
    expect(short.complete).toBe(false)
    const enough = walkPool(pool, sellPlan(pool, T0, 1000), page([[-1054, 0n]], true))
    expect(enough.complete).toBe(true)
  })

  test("pump: doubling token0's price costs L*(sqrt2 - 1) of token1", () => {
    const pool = makePool(0, L)
    const walk = walkPool(pool, pumpPlan(pool, T0, 10_000), page([]))
    const expected = units(L) * (sqrtPrice(6932) - 1)
    expect(jsbiToUnits(walk.amountIn, 18)).toBeCloseTo(expected, 3)
  })
})

describe("token level", () => {
  test("sellableDepthForToken prices with derivedETH and sums pools", () => {
    const pool = makePool(0, L)
    const pages = new Map([[pool.id, page([])]])
    const depth = sellableDepthForToken(T0, [pool], pages, 1000, 2000)
    const tokens = units(L) * (1 / sqrtPrice(-1054) - 1)
    expect(depth.priceUsd).toBe(2000)
    expect(depth.depthUsd).toBeCloseTo(tokens * 2000, 0)
    expect(depth.perPool[0]?.direction).toBe("down")
    expect(depth.truncated).toBe(false)
  })

  test("pumpCostForToken values the spent token", () => {
    const pool = makePool(0, L)
    const pages = new Map([[pool.id, page([])]])
    const pump = pumpCostForToken(T0, [pool], pages, 10_000, 2000)
    const spent = units(L) * (sqrtPrice(6932) - 1)
    expect(pump.costUsd).toBeCloseTo(spent * 2000, 0)
  })
})

describe("jsbiToUnits", () => {
  test("keeps fractional precision without overflowing", () => {
    expect(jsbiToUnits(JSBI.BigInt("1500000000000000000"), 18)).toBe(1.5)
    expect(jsbiToUnits(JSBI.BigInt("123456789012345678901234567890"), 18)).toBeCloseTo(123456789012.34568, 3)
  })
})
