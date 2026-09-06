import { GeistPixelSquare } from "geist/font/pixel"
import type { Metadata } from "next"
import { Geist_Mono, Inter } from "next/font/google"

import "./globals.css"
import { cn } from "@/lib/utils"

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" })
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono" })

const title = "Rivlet | Back a bot. Share its earnings."
const description =
  "Help fund an AI bot and earn a share of the money it makes from paying customers."

export const metadata: Metadata = {
  metadataBase: new URL("https://www.rivlet.xyz"),
  title,
  description,
  openGraph: {
    title,
    description,
    type: "website",
    url: "/",
    siteName: "Rivlet",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Rivlet — Back a bot. Share its earnings." }],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    site: "@vwakesahu",
    creator: "@vwakesahu",
    images: ["/og.png"],
  },
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("dark antialiased", "font-sans", inter.variable, geistMono.variable, GeistPixelSquare.variable)}
      style={{ ["--font-pixel" as string]: "var(--font-geist-pixel-square)" }}
    >
      <body className="bg-background text-foreground selection:bg-primary selection:text-primary-foreground">{children}</body>
    </html>
  )
}
