import { Reveal } from "@/components/landing/reveal"
import { Band, Headline, Kicker } from "@/components/landing/ui"

const steps = [
  {
    title: "Connect your agent",
    body: "Add your existing x402 endpoint. Set up your agreement and update its payment address.",
  },
  {
    title: "Choose your terms",
    body: "Decide how much to raise, how much revenue to share, and for how long.",
  },
  {
    title: "Keep building",
    body: "Your agent keeps serving customers. The contract handles each backer’s share.",
  },
]

export function HowItWorks() {
  return (
    <Band id="how-it-works">
      <div className="border-b border-border px-4 py-12 md:px-10 md:py-16">
        <Reveal>
          <Kicker>How it works</Kicker>
          <Headline className="mt-3 text-[clamp(1.75rem,3.5vw,2.75rem)]">Connect. Raise. Share.</Headline>
        </Reveal>
      </div>
      <ol className="grid md:grid-cols-3">
        {steps.map((step, index) => (
          <li
            key={step.title}
            className="border-b border-border px-4 py-8 last:border-b-0 md:border-r md:border-b-0 md:px-8 md:py-10 md:last:border-r-0"
          >
            <Reveal delay={index * 0.06}>
              <span className="font-mono text-xs text-muted-foreground">0{index + 1}</span>
              <h3 className="mt-6 text-xl font-medium tracking-tight">{step.title}</h3>
              <p className="mt-2 leading-relaxed text-muted-foreground">{step.body}</p>
            </Reveal>
          </li>
        ))}
      </ol>
    </Band>
  )
}
