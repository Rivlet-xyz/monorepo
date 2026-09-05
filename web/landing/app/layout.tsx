import type { Metadata } from "next"
import { Geist_Mono, Inter } from "next/font/google"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@/lib/utils";

const interHeading = Inter({subsets:['latin'],variable:'--font-heading'});

const inter = Inter({subsets:['latin'],variable:'--font-sans'})

const geistMono = Geist_Mono({subsets:['latin'],variable:'--font-mono'})

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
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "Rivlet — Back a bot. Share its earnings.",
      },
    ],
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("antialiased", "font-mono", inter.variable, interHeading.variable, geistMono.variable)}
    >
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
