export const siteName = "shoal"

export const scannerUrl =
  process.env.NEXT_PUBLIC_SCANNER_URL ??
  (process.env.NODE_ENV === "development" ? "http://localhost:3000" : "https://app.shoalfi.xyz")

export const redTeamUrl = `${scannerUrl}/red-team`

export const githubUrl = "https://github.com/shoal-xyz/monorepo"
export const docsUrl = `${githubUrl}#readme`
