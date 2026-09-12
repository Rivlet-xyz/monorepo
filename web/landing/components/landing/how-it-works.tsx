import Image from "next/image"

import { Reveal } from "@/components/landing/reveal"
import { Band, Headline, Kicker } from "@/components/landing/ui"
import { cn } from "@/lib/utils"

const parts = [
  {
    title: "depth oracle",
    body: "how much usd you could sell right now within a slippage band. dex side from uniswap pools via the graph, cex side inside a chainlink confidential workflow.",
  },
  {
    title: "cap steward",
    body: "a contract a lending market enrolls with one call. it clamps borrow caps to a fraction of executable liquidity and drops them to zero when a pump starts.",
  },
  {
    title: "scanner",
    body: "every market we can index, ranked by how much is lent vs how much could actually be sold. with a time machine.",
  },
  {
    title: "api",
    body: "the depth numbers behind an x402 gateway. any agent can pay per query.",
  },
]

export function HowItWorks() {
  return (
    <Band id="how-it-works">
      <div className="border-b border-border px-4 py-12 md:px-10 md:py-16">
        <Reveal>
          <Kicker>how it works</Kicker>
          <Headline className="mt-3 text-[clamp(1.75rem,3.5vw,2.75rem)]">two numbers, one plug-in.</Headline>
        </Reveal>
      </div>
      <ol className="grid md:grid-cols-2">
        {parts.map((part, index) => (
          <li
            key={part.title}
            className={cn(
              "border-b border-border px-4 py-8 md:px-8 md:py-10",
              index % 2 === 1 && "md:border-l",
              index >= parts.length - 2 && "md:border-b-0",
              index === parts.length - 1 && "border-b-0",
            )}
          >
            <Reveal delay={index * 0.06}>
              <span className="font-mono text-xs text-muted-foreground">0{index + 1}</span>
              <h3 className="mt-6 text-xl font-medium tracking-tight">{part.title}</h3>
              <p className="mt-2 leading-relaxed text-muted-foreground">{part.body}</p>
            </Reveal>
          </li>
        ))}
      </ol>
      <div className="relative aspect-[2/1] border-t border-border">
        <Image
          draggable={false}
          src="/illustrations/how-it-works.png"
          alt="depth oracle feeding the cap steward, the scanner, and a pay-per-query api"
          fill
          sizes="100vw"
          className="object-contain mix-blend-lighten"
        />
      </div>
    </Band>
  )
}
