import Image from "next/image"
import Link from "next/link"

import { Button } from "@/components/ui/button"

const landingUrl = process.env.NEXT_PUBLIC_LANDING_URL ?? "https://www.shoalfi.xyz"

export default function NotFound() {
  return (
    <main className="flex min-h-svh items-center justify-center p-6">
      <div className="flex w-full max-w-md flex-col items-start gap-6">
        <Image draggable={false} src="/logo.png" alt="shoal" width={40} height={40} />
        <div className="space-y-2">
          <p className="font-mono text-xs text-muted-foreground">404</p>
          <h1 className="text-2xl font-semibold tracking-tight">Page not found</h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            The page you’re looking for doesn’t exist or has moved. Check the address, or head back to the app.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button render={<Link href="/" />}>Back to app</Button>
          <Button variant="outline" render={<a href={landingUrl} />}>
            Visit shoalfi.xyz
          </Button>
        </div>
      </div>
    </main>
  )
}
