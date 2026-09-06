import Image from "next/image"

import { Band } from "@/components/landing/ui"

const partners = [
  { name: "Hedera", logo: "/logos/hedera.svg", href: "https://hedera.com" },
  { name: "x402", logo: "/logos/x402.svg", href: "https://www.x402.org", wordmark: true },
  { name: "World", logo: "/logos/world.svg", href: "https://world.org" },
  { name: "The Graph", logo: "/logos/thegraph.svg", href: "https://thegraph.com" },
]

export function BuiltWith() {
  return (
    <Band className="grid grid-cols-2 md:grid-cols-[auto_repeat(4,1fr)]">
      <div className="col-span-2 flex items-center border-b border-border px-4 py-3 font-mono text-xs tracking-[0.08em] text-muted-foreground uppercase md:col-span-1 md:border-r md:border-b-0 md:px-6">
        Built with
      </div>
      {partners.map((partner, index) => (
        <a
          key={partner.name}
          href={partner.href}
          target="_blank"
          rel="noreferrer"
          className={
            "flex h-16 items-center justify-center gap-3 border-border text-muted-foreground transition-colors hover:text-foreground md:h-auto md:border-r md:border-b-0 md:last:border-r-0 " +
            (index % 2 === 0 ? "border-r border-b md:border-b-0" : "border-b md:border-b-0") +
            (index < 2 ? "" : " border-b-0")
          }
        >
          <Image
            src={partner.logo}
            alt={partner.wordmark ? partner.name : ""}
            width={partner.wordmark ? 72 : 22}
            height={partner.wordmark ? 28 : 22}
            className={partner.wordmark ? "h-6 w-auto opacity-90" : "size-5 opacity-90"}
          />
          {partner.wordmark ? null : <span className="text-sm font-medium text-foreground">{partner.name}</span>}
        </a>
      ))}
    </Band>
  )
}
