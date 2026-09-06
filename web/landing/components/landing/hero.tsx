import { Reveal } from "@/components/landing/reveal"
import { Band, Button, Headline } from "@/components/landing/ui"
import { appUrl } from "@/lib/site"

export function Hero() {
  return (
    <Band id="top" className="px-4 py-20 md:px-10 md:py-28 lg:py-32">
      <Reveal>
        <Headline as="h1" className="max-w-4xl text-[clamp(2.25rem,5.5vw,4.5rem)]">
          Your agent earns.
          <br />
          Let it fund what’s next.
        </Headline>
      </Reveal>
      <Reveal delay={0.08}>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground md:text-xl">
          Raise money by sharing a portion of your agent’s future earnings. Keep your API, your customers, and your
          x402 payment flow.
        </p>
      </Reveal>
      <Reveal delay={0.14}>
        <div className="mt-8 flex flex-wrap gap-2">
          <Button href={appUrl} className="h-11 px-5">
            Launch app
          </Button>
          <Button href="#demo" variant="outline" className="h-11 px-5">
            Watch demo
          </Button>
        </div>
      </Reveal>
    </Band>
  )
}
