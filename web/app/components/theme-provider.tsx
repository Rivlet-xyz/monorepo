"use client"

import { ThemeProvider as NextThemesProvider } from "next-themes"
import type * as React from "react"

/** shoal ships dark only. The theme is forced so system settings never flip it. */
function ThemeProvider({ children, ...props }: React.ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      forcedTheme="dark"
      enableSystem={false}
      disableTransitionOnChange
      {...props}
    >
      {children}
    </NextThemesProvider>
  )
}

export { ThemeProvider }
