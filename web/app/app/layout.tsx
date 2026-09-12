import type { Metadata } from "next"
import { Geist_Mono, Inter } from "next/font/google"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@/lib/utils";

const interHeading = Inter({subsets:['latin'],variable:'--font-heading'});

const inter = Inter({subsets:['latin'],variable:'--font-sans'})

const geistMono = Geist_Mono({subsets:['latin'],variable:'--font-mono'})

const title = "shoal — executable liquidity oracle for lending markets"
const description =
  "oracle for how much of a token can actually be sold, plus a plug-in that caps borrowing to it. stops the pump-and-borrow attack."

export const metadata: Metadata = {
  metadataBase: new URL("https://app.shoalfi.xyz"),
  title,
  description,
  openGraph: {
    title: "shoal",
    description,
    type: "website",
    url: "/",
    siteName: "shoal",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "shoal — executable liquidity oracle for lending markets",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "shoal",
    description,
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
      className={cn("dark antialiased", "font-mono", inter.variable, interHeading.variable, geistMono.variable)}
    >
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
