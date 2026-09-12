import type { NextConfig } from "next"

const usingFixtures =
  process.env.NEXT_PUBLIC_USE_FIXTURES === "true" || !process.env.NEXT_PUBLIC_API_BASE

const isProduction = process.env.NODE_ENV === "production"
/** Vercel sets this on every build it runs. */
const isDeploy = Boolean(process.env.VERCEL)
const fixturesExplicitlyOn = process.env.NEXT_PUBLIC_USE_FIXTURES === "true"

/**
 * Refuse to produce a shippable build that would serve fixture data.
 *
 * Fires on any deploy where fixtures would be used, and on a local production
 * build only when fixtures were switched on deliberately. A plain local
 * `next build` with no env still works, so the repo builds out of the box.
 */
if (usingFixtures && (isDeploy || (isProduction && fixturesExplicitlyOn))) {
  throw new Error(
    [
      "refusing to build with fixture data.",
      process.env.NEXT_PUBLIC_API_BASE
        ? "NEXT_PUBLIC_USE_FIXTURES is 'true'; set it to 'false' for production."
        : "NEXT_PUBLIC_API_BASE is not set; point it at the backend for production.",
    ].join(" "),
  )
}

const nextConfig: NextConfig = {}

export default nextConfig
