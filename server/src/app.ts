import Fastify, { type FastifyInstance } from "fastify"
import cors from "@fastify/cors"
import { log, errorMessage } from "./log"
import { healthRoutes } from "./routes/health"
import { tokenRoutes } from "./routes/tokens"
import { askRoutes } from "./routes/ask"

/**
 * Builds the Fastify app with every route registered. Does not listen on a
 * port and does not start the refresh job — callers (index.ts, e2e tests)
 * decide whether and how to run it.
 */
export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({ logger: false })
  await app.register(cors, {
    origin: true,
    exposedHeaders: ["x-shoalfi-block", "x-shoalfi-refreshed-at"],
  })
  await app.register(healthRoutes)
  await app.register(tokenRoutes)
  await app.register(askRoutes)

  app.setErrorHandler((err, _request, reply) => {
    log.error(`unhandled route error: ${errorMessage(err)}`)
    void reply.code(500).send({ error: "internal error" })
  })

  return app
}
