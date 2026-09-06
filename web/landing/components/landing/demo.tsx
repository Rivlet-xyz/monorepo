import { Reveal } from "@/components/landing/reveal"
import { Band, Headline, Kicker, Placeholder } from "@/components/landing/ui"

function isEmbed(url: string) {
  return /youtube\.com|youtu\.be|vimeo\.com/.test(url)
}

function toEmbedUrl(url: string) {
  const youtube = url.match(/(?:youtu\.be\/|v=|shorts\/)([\w-]{11})/)
  if (youtube) return `https://www.youtube-nocookie.com/embed/${youtube[1]}`
  const vimeo = url.match(/vimeo\.com\/(\d+)/)
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`
  return url
}

export function Demo({ src }: { src?: string }) {
  return (
    <Band id="demo">
      <div className="border-b border-border px-4 py-12 md:px-10 md:py-16">
        <Reveal>
          <Kicker>Demo</Kicker>
          <Headline className="mt-3 text-[clamp(1.75rem,3.5vw,2.75rem)]">From earning to funded.</Headline>
          <p className="mt-4 max-w-xl text-lg text-muted-foreground">
            See a builder raise funding, a backer contribute, and an agent’s payments split between them.
          </p>
        </Reveal>
      </div>
      <div className="aspect-video">
        {src ? (
          isEmbed(src) ? (
            <iframe
              src={toEmbedUrl(src)}
              title="Rivlet demo"
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <video src={src} className="h-full w-full bg-black" controls playsInline preload="metadata" aria-label="Rivlet demo" />
          )
        ) : (
          <Placeholder file="public/videos/demo.mp4" note="Product video" className="h-full" />
        )}
      </div>
    </Band>
  )
}
