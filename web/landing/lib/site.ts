export const siteName = "Rivlet"

export const appUrl =
  process.env.NEXT_PUBLIC_APP_URL ??
  (process.env.NODE_ENV === "development" ? "http://localhost:3000" : "https://app.rivlet.xyz")

export const githubUrl = "https://github.com/Rivlet-xyz/monorepo"
export const docsUrl = `${githubUrl}#readme`

export const navLinks = [
  { label: "How it works", href: "#how-it-works" },
  { label: "Demo", href: "#demo" },
  { label: "FAQ", href: "#faq" },
] as const
