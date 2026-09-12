"use client"

import { prettySource } from "@/lib/format"
import { useMeta } from "@/lib/use-meta"

export function Footnote() {
  const { meta } = useMeta()

  return (
    <div id="how-this-works" className="scroll-mt-20 border-x border-t border-border px-4 py-4">
      {meta ? (
        <p className="font-mono text-xs text-muted-foreground">
          sources: {meta.sources.lending.map(prettySource).join(", ")} ·{" "}
          {meta.sources.dex.map(prettySource).join(", ")} depth
        </p>
      ) : null}
      <p className="mt-2 max-w-3xl text-xs leading-relaxed text-muted-foreground">
        depth is uniswap v3 only in this version. tokens whose liquidity lives on curve, balancer, pendle or other
        venues show as unknown, not shallow. exposure uses deposits × max ltv, an upper bound. mainnet only. not
        audited.
      </p>
    </div>
  )
}
