import Image from "next/image"

import { Reveal } from "@/components/landing/reveal"
import { Band, Headline, Kicker, Placeholder } from "@/components/landing/ui"

export function Integration({ diagram }: { diagram?: string }) {
  return (
    <Band id="integration" className="grid lg:grid-cols-2">
      <div className="flex flex-col border-b border-border lg:border-r lg:border-b-0">
        <div className="border-b border-border px-4 py-12 md:px-10 md:py-16">
          <Reveal>
            <Kicker>Integration</Kicker>
            <Headline className="mt-3 text-[clamp(1.75rem,3.5vw,2.75rem)]">
              Same endpoint.
              <br />
              New possibilities.
            </Headline>
            <p className="mt-5 max-w-md leading-relaxed text-muted-foreground">
              Your customers keep calling the same API. You update{" "}
              <code className="bg-muted px-1 py-0.5 font-mono text-[0.9em] text-foreground">payTo</code> to your
              agreement’s address, and incoming payments can be shared with backers.
            </p>
          </Reveal>
        </div>
        <Reveal className="flex-1">
          <pre className="overflow-x-auto px-4 py-6 font-mono text-[13px] leading-7 md:px-10">
            <code>
              <span className="text-muted-foreground">{"{"}</span>
              {"\n"}
              {"  "}&quot;scheme&quot;: <span className="text-muted-foreground">&quot;exact&quot;</span>,
              {"\n"}
              <span className="-mx-4 block bg-muted/60 px-4 text-muted-foreground line-through md:-mx-10 md:px-10">
                <span className="mr-2 select-none no-underline">-</span>
                {"  "}&quot;payTo&quot;: &quot;0xYourWallet…&quot;,
              </span>
              <span className="-mx-4 block bg-accent px-4 md:-mx-10 md:px-10">
                <span className="mr-2 select-none">+</span>
                {"  "}&quot;payTo&quot;: &quot;0xYourAgreement…&quot;,
              </span>
              {"  "}&quot;asset&quot;: <span className="text-muted-foreground">&quot;USDC&quot;</span>
              {"\n"}
              <span className="text-muted-foreground">{"}"}</span>
            </code>
          </pre>
        </Reveal>
        <p className="border-t border-border px-4 py-4 text-xs text-muted-foreground italic md:px-10">
          Initially supporting compatible x402 endpoints on Hedera. Revenue sharing applies to payments received by the
          agreement contract.
        </p>
      </div>
      <div className="flex flex-col">
        {diagram ? (
          <div className="relative aspect-[3/2] lg:aspect-auto lg:min-h-[320px] lg:flex-1">
            <Image
              src={diagram}
              alt="How a payment flows from your API through the agreement to the builder and backers"
              fill
              sizes="(min-width: 1024px) 640px, 100vw"
              className="object-contain mix-blend-lighten"
            />
          </div>
        ) : (
          <Placeholder file="public/diagrams/payment-flow.svg" note="Payment flow diagram" className="min-h-[320px] flex-1" />
        )}
      </div>
    </Band>
  )
}
