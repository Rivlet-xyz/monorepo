export function Footnote() {
  return (
    <div id="how-this-works" className="scroll-mt-20 border-x border-t border-b border-border px-4 py-4">
      <p className="max-w-3xl text-xs leading-relaxed text-muted-foreground">
        depth is uniswap v3 only in this version. tokens whose liquidity lives on curve, balancer, pendle or other
        venues show as unknown, not shallow. exposure uses deposits × max ltv, an upper bound. mainnet only. not
        audited.
      </p>
    </div>
  )
}
