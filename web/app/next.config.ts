import type { NextConfig } from "next"

const usingFixtures =
  process.env.NEXT_PUBLIC_USE_FIXTURES === "true" || !process.env.NEXT_PUBLIC_API_BASE

const isProduction = process.env.NODE_ENV === "production"
/** Vercel sets this on every build it runs. */
const isDeploy = Boolean(process.env.VERCEL)
const fixturesExplicitlyOn = process.env.NEXT_PUBLIC_USE_FIXTURES === "true"

/**
 * Deliberate, temporary override: ship a preview that serves fixture data
 * while the backend url does not exist yet.
 *
 * Remove this from the deploy environment as soon as NEXT_PUBLIC_API_BASE is
 * real. It is opt-in on purpose, so no fixture deploy can happen by accident.
 */
const allowFixtureDeploy = process.env.ALLOW_FIXTURE_DEPLOY === "true"

const wouldShipFixtures = usingFixtures && (isDeploy || (isProduction && fixturesExplicitlyOn))

if (wouldShipFixtures && allowFixtureDeploy) {
  console.warn(
    [
      "",
      "  ┌─────────────────────────────────────────────────────────────┐",
      "  │  BUILDING WITH FIXTURE DATA                                 │",
      "  │  ALLOW_FIXTURE_DEPLOY=true is set, so the guard is bypassed. │",
      "  │  Every number this deploy shows is fake. The ui labels it    │",
      "  │  with a yellow \"fixture data\" pill.                          │",
      "  │  Unset ALLOW_FIXTURE_DEPLOY once the backend url exists.     │",
      "  └─────────────────────────────────────────────────────────────┘",
      "",
    ].join("\n"),
  )
} else if (wouldShipFixtures) {
  throw new Error(
    [
      "refusing to build with fixture data.",
      process.env.NEXT_PUBLIC_API_BASE
        ? "NEXT_PUBLIC_USE_FIXTURES is 'true'; set it to 'false' for production."
        : "NEXT_PUBLIC_API_BASE is not set; point it at the backend for production.",
      "To ship a fixture preview on purpose, set ALLOW_FIXTURE_DEPLOY=true.",
    ].join(" "),
  )
}

const nextConfig: NextConfig = {}

export default nextConfig
