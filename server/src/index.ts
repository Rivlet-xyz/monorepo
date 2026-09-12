import Fastify from "fastify"
import cors from "@fastify/cors"
import cron from "node-cron"
import { env } from "./config"
import { log, errorMessage } from "./log"
import { closeDb, initSchema } from "./db/client"
import { runRefresh } from "./jobs/refresh"
import { healthRoutes } from "./routes/health"
import { tokenRoutes } from "./routes/tokens"
import { askRoutes } from "./routes/ask"

try {
  await initSchema()
} catch (err) {
  log.error(errorMessage(err))
  process.exit(1)
}

const app = Fastify({ logger: false })
await app.register(cors, { origin: true, exposedHeaders: ["x-shoalfi-block", "x-shoalfi-refreshed-at"] })
await app.register(healthRoutes)
await app.register(tokenRoutes)
await app.register(askRoutes)

app.setErrorHandler((err, _request, reply) => {
  log.error(`unhandled route error: ${errorMessage(err)}`)
  void reply.code(500).send({ error: "internal error" })
})

await app.listen({ port: env.PORT, host: "0.0.0.0" })
log.info(`shoalfi api listening on :${env.PORT}`)

void runRefresh("boot")
const task = cron.schedule(env.REFRESH_CRON, () => {
  void runRefresh("cron")
})
log.info(`refresh scheduled: ${env.REFRESH_CRON}`)

async function shutdown(signal: string) {
  log.info(`${signal} received, shutting down`)
  try {
    await task.stop()
    await app.close()
    await closeDb()
  } finally {
    process.exit(0)
  }
}
process.on("SIGINT", () => void shutdown("SIGINT"))
process.on("SIGTERM", () => void shutdown("SIGTERM"))
