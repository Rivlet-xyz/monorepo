import Image from "next/image"

import { Button } from "@/components/landing/ui"
import { appUrl, navLinks } from "@/lib/site"

export function Nav() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-sm">
      <div className="container-x flex h-14 items-center justify-between border-x border-border px-4 md:px-6">
        <a href="#top" className="flex items-center gap-2" aria-label="Rivlet home">
          <Image draggable={false} src="/rivlet-mark.png" alt="" width={24} height={24} className="invert" priority />
          <span className="font-semibold tracking-tight">Rivlet</span>
        </a>
        <nav aria-label="Main" className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
          {navLinks.map((link) => (
            <a key={link.href} href={link.href} className="transition-colors hover:text-foreground">
              {link.label}
            </a>
          ))}
        </nav>
        <Button href={appUrl} className="h-9">
          Launch app
        </Button>
      </div>
    </header>
  )
}
