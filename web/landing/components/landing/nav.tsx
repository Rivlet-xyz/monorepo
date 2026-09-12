import Image from "next/image"

import { Button } from "@/components/landing/ui"
import { scannerUrl } from "@/lib/site"

export function Nav() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-sm">
      <div className="container-x flex h-14 items-center justify-between border-x border-border px-4 md:px-6">
        <a href="#top" className="flex items-center gap-2" aria-label="shoal home">
          <Image draggable={false} src="/logo.png" alt="" width={24} height={24} priority />
          <span className="font-semibold tracking-tight">shoal</span>
        </a>
        <Button href={scannerUrl} className="h-9">
          open scanner
        </Button>
      </div>
    </header>
  )
}
