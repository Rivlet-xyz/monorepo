import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

/** Full-width band. Content sits in the page column, whose side rules run the whole page. */
export function Band({ children, className, id }: { children: ReactNode; className?: string; id?: string }) {
  return (
    <section id={id} className="scroll-mt-14 border-b border-border">
      <div className={cn("container-x border-x border-border", className)}>{children}</div>
    </section>
  )
}

export function Headline({
  children,
  as: Tag = "h2",
  className,
}: {
  children: ReactNode
  as?: "h1" | "h2"
  className?: string
}) {
  return <Tag className={cn("font-pixel leading-[1.08] tracking-tight text-balance", className)}>{children}</Tag>
}

export function Kicker({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={cn("font-mono text-xs tracking-[0.08em] text-muted-foreground uppercase", className)}>{children}</p>
  )
}

export function Button({
  href,
  children,
  variant = "primary",
  className,
  external,
}: {
  href: string
  children: ReactNode
  variant?: "primary" | "outline"
  className?: string
  external?: boolean
}) {
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
      className={cn(
        "inline-flex h-10 items-center justify-center px-4 text-sm font-medium transition-colors",
        variant === "primary"
          ? "bg-primary text-primary-foreground hover:bg-primary/85"
          : "border border-input text-foreground hover:bg-accent",
        className,
      )}
    >
      {children}
    </a>
  )
}

/** Empty media panel with a file hint, used until the real asset is dropped in. */
export function Placeholder({ file, note, className }: { file: string; note: string; className?: string }) {
  return (
    <div
      role="img"
      aria-label={`${note} placeholder`}
      className={cn("relative flex items-center justify-center bg-card bg-grid", className)}
    >
      <div className="flex flex-col items-center gap-1.5 bg-background px-4 py-3 text-center">
        <span className="font-mono text-xs text-foreground">{file}</span>
        <span className="text-xs text-muted-foreground">{note}</span>
      </div>
    </div>
  )
}
