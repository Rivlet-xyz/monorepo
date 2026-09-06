import { Footer } from "@/components/landing/footer"
import { Nav } from "@/components/landing/nav"
import { Band, Button, Headline, Kicker } from "@/components/landing/ui"
import { appUrl } from "@/lib/site"

export default function NotFound() {
  return (
    <>
      <Nav />
      <main className="flex min-h-[calc(100svh-3.5rem)] flex-col">
        <Band className="flex flex-1 flex-col justify-center px-4 py-24 md:px-10 md:py-32">
          <Kicker>404</Kicker>
          <Headline as="h1" className="mt-3 text-[clamp(2.25rem,5.5vw,4.5rem)]">
            Nothing here.
          </Headline>
          <p className="mt-5 max-w-md text-lg text-muted-foreground">
            The page you’re looking for doesn’t exist or has moved.
          </p>
          <div className="mt-8 flex flex-wrap gap-2">
            <Button href="/" className="h-11 px-5">
              Back to home
            </Button>
            <Button href={appUrl} variant="outline" className="h-11 px-5">
              Launch app
            </Button>
          </div>
        </Band>
      </main>
      <Footer />
    </>
  )
}
