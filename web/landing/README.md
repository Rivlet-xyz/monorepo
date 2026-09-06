# Rivlet landing

Landing frontend using Next.js and coss ui, initialized with
`bunx --bun shadcn@latest init @coss/style`.
Run `bun dev:landing` from the repository root to serve it on port 3001.

## Structure

- `app/page.tsx` assembles the sections in the order of `LANDING.md`.
- `components/landing/*` holds one file per section. `ui.tsx` has the shared
  primitives (bands, headline, kicker, button, placeholder).
- `lib/site.ts` holds links; `lib/assets.ts` resolves the video and diagram files at build time.

## Environment

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_APP_URL` | Target of the “Launch app” buttons. Defaults to `http://localhost:3000` in development and `https://app.rivlet.xyz` otherwise. |
| `NEXT_PUBLIC_DEMO_VIDEO_URL` | Hosted product demo (YouTube, Vimeo or a direct file). Overrides `public/videos/demo.mp4`. |

## Adding components

```bash
bunx --bun shadcn@latest add @coss/button
```

```tsx
import { Button } from "@/components/ui/button";
```
