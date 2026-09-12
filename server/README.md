# @shoalfi/server

Fastify API and refresh job for shoalfi. Runs on Bun, stores scores in Postgres,
reads every on-chain number live from The Graph Network.

## Scripts

```sh
bun run dev            # watch mode, loads ../.env
bun run start          # production start, expects env vars to be set
bun run typecheck
bun run test
bun run probe          # Phase 0 subgraph health check, writes ../docs/data-sources.md
bun run probe:collect  # market counts per protocol + WETH pools
bun run probe:depth <tokenAddress>
```

All scripts except `start` load `../.env`. See `../.env.example` for every
variable and its default.
