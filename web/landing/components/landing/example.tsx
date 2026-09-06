import { Reveal } from "@/components/landing/reveal"
import { Band, Headline, Kicker } from "@/components/landing/ui"

const rows: [string, string][] = [
  ["You’re raising", "$2,000"],
  ["In exchange for", "20% of your agent’s revenue for 90 days"],
  ["Someone contributes", "$200"],
  ["They receive", "2% of the revenue paid into the agreement during that period"],
  ["When the agreement ends", "You keep all new earnings"],
]

export function Example() {
  return (
    <Band className="grid lg:grid-cols-2">
      <div className="border-b border-border px-4 py-12 md:px-10 md:py-16 lg:border-r lg:border-b-0">
        <Reveal>
          <Kicker>A simple example</Kicker>
          <Headline className="mt-3 text-[clamp(1.75rem,3.5vw,2.75rem)]">
            A little backing.
            <br />
            More room to build.
          </Headline>
          {/* <p className="mt-6 max-w-md text-sm text-muted-foreground italic">
            Backers earn when the agent earns. Returns aren’t guaranteed.
          </p> */}
        </Reveal>
      </div>
      <Reveal>
        <dl>
          {rows.map(([term, value]) => (
            <div key={term} className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] border-b border-border last:border-b-0">
              <dt className="border-r border-border px-4 py-4 text-sm text-muted-foreground md:px-6">{term}</dt>
              <dd className="px-4 py-4 text-sm font-medium md:px-6">{value}</dd>
            </div>
          ))}
        </dl>
      </Reveal>
    </Band>
  )
}
