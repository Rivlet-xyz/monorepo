import { Spinner } from "@/components/ui/spinner"

/** Shown when /tokens returns an empty array. Never a fabricated row. */
export function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-3 border-x border-t border-border px-4 py-16 text-center">
      <Spinner className="size-5 text-muted-foreground" />
      <p className="text-sm text-muted-foreground">refresh in progress, first run takes a few minutes</p>
    </div>
  )
}

export function LoadingState() {
  return (
    <div className="flex flex-col items-center gap-3 border-x border-t border-border px-4 py-16 text-center">
      <Spinner className="size-5 text-muted-foreground" />
      <p className="font-mono text-xs text-muted-foreground">loading markets…</p>
    </div>
  )
}

/** The error text is shown verbatim so a failing endpoint is debuggable on camera. */
export function ErrorBanner({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive-foreground"
    >
      <span className="font-medium">couldn&rsquo;t load markets.</span>{" "}
      <span className="font-mono text-xs break-words">{message}</span>
    </div>
  )
}
