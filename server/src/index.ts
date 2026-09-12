import Fastify from "fastify"
import cors from "@fastify/cors"
import { env } from "./config"
import { log } from "./log"

const app = Fastify({ logger: false })

await app.register(cors, { origin: true })

app.get("/health", async () => ({ ok: true }))

await app.listen({ port: env.PORT, host: "0.0.0.0" })
log.info(`shoalfi api listening on :${env.PORT}`)
