import { Reveal } from "@/components/landing/reveal"
import { Band, Button, Headline } from "@/components/landing/ui"
import { appUrl } from "@/lib/site"

export function Closing() {
  return (
    <Band className="px-4 py-20 md:px-10 md:py-28">
      <Reveal>
        <Headline className="max-w-3xl text-[clamp(2rem,4.5vw,3.5rem)]">Give your agent room to grow.</Headline>
        <p className="mt-5 max-w-lg text-lg text-muted-foreground">Bring your endpoint. Choose your terms. Find your backers.</p>
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
