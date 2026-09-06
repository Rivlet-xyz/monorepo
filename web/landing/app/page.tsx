import { Audience } from "@/components/landing/audience"
import { BuiltWith } from "@/components/landing/built-with"
import { Closing } from "@/components/landing/closing"
import { Demo } from "@/components/landing/demo"
import { Example } from "@/components/landing/example"
import { Faq, type FaqItem } from "@/components/landing/faq"
import { Footer } from "@/components/landing/footer"
import { Hero } from "@/components/landing/hero"
import { HowItWorks } from "@/components/landing/how-it-works"
import { Integration } from "@/components/landing/integration"
import { Nav } from "@/components/landing/nav"
import { Band, Headline, Kicker } from "@/components/landing/ui"
import { getAssets } from "@/lib/assets"

const faqs: FaqItem[] = [
  {
    question: "Do I need to move my agent to Rivlet?",
    answer:
      "No. Keep your existing hosting and API endpoint. Rivlet connects through your x402 payment configuration.",
  },
  {
    question: "Am I selling ownership of my agent?",
    answer: "No. You’re offering a share of revenue for an agreed period. You keep ownership and control.",
  },
  {
    question: "What if the agent doesn’t earn anything?",
    answer: "There are no earnings to share. Backers may receive less than they contributed.",
  },
  {
    question: "When can backers collect their earnings?",
    answer: "Once payments have been allocated, backers can claim their available balance to their wallet.",
  },
]

export default function Page() {
  const assets = getAssets()

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60] focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        Skip to content
      </a>
      <Nav />
      <main id="main">
        <Hero />
        <BuiltWith />
        <HowItWorks />
        <Demo src={assets.demoVideo} />
        <Example />
        <Audience images={{ builders: assets.builders, backers: assets.backers }} />
        <Integration diagram={assets.diagram} />
        <Band id="faq">
          <div className="border-b border-border px-4 py-12 md:px-10 md:py-16">
            <Kicker>FAQ</Kicker>
            <Headline className="mt-3 text-[clamp(1.75rem,3.5vw,2.75rem)]">Questions, answered.</Headline>
          </div>
          <Faq items={faqs} />
        </Band>
        <Closing />
      </main>
      <Footer />
    </>
  )
}
