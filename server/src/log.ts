const stamp = () => new Date().toISOString()

export const log = {
  info(message: string, ...rest: unknown[]) {
    console.log(`${stamp()} INFO  ${message}`, ...rest)
  },
  warn(message: string, ...rest: unknown[]) {
    console.warn(`${stamp()} WARN  ${message}`, ...rest)
  },
  error(message: string, ...rest: unknown[]) {
    console.error(`${stamp()} ERROR ${message}`, ...rest)
  },
}

export const errorMessage = (err: unknown): string =>
  err instanceof Error ? err.message : String(err)
