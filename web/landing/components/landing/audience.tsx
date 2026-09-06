import Image from "next/image"

import { Reveal } from "@/components/landing/reveal"
import { Band, Headline, Kicker, Placeholder } from "@/components/landing/ui"
import { appUrl } from "@/lib/site"

const sides = [
  { key: "builders", kicker: "For builders", title: "Get support for your next step.", cta: "Raise for your agent" },
  { key: "backers", kicker: "For backers", title: "Back an agent you believe in.", cta: "Browse agreements" },
] as const

export function Audience({ images }: { images: { builders?: string; backers?: string } }) {
  return (
    <Band id="audience">
      <div className="border-b border-border px-4 py-12 md:px-10 md:py-16">
        <Reveal>
          <Kicker>For builders and backers</Kicker>
          <Headline className="mt-3 text-[clamp(1.75rem,3.5vw,2.75rem)]">Two sides. One agreement.</Headline>
        </Reveal>
      </div>
      <div className="grid md:grid-cols-2">
        {sides.map((side, index) => {
          const image = images[side.key]
          return (
            <div key={side.key} className="border-b border-border last:border-b-0 md:border-b-0 md:first:border-r">
              <div className="relative aspect-[16/10] border-b border-border">
                {image ? (
                  <Image draggable={false} src={image} alt="" fill sizes="(min-width: 768px) 640px, 100vw" className="object-cover mix-blend-lighten" />
                ) : (
                  <Placeholder file={`public/illustrations/${side.key}.svg`} note={side.kicker} className="h-full" />
                )}
              </div>
              <Reveal delay={index * 0.05} className="flex items-end justify-between gap-6 px-4 py-6 md:px-8">
                <div>
                  <Kicker>{side.kicker}</Kicker>
                  <h3 className="mt-2 text-xl font-medium tracking-tight md:text-2xl">{side.title}</h3>
                </div>
                <a href={appUrl} className="shrink-0 text-sm font-medium underline-offset-4 hover:underline">
                  {side.cta} →
                </a>
              </Reveal>
            </div>
          )
        })}
      </div>
    </Band>
  )
}
