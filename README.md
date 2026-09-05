# Rivlet

<img src="web/landing/public/rivlet-logo.png" alt="Rivlet logo" width="128" height="128" />

Monorepo for the operator and backer app, x402 payment services, and smart contracts.

```text
rivlet/
├── web/
│   ├── landing/  # Landing frontend (Next.js + coss ui)
│   └── app/      # Operator and backer frontend (Next.js + coss ui)
├── server/       # x402 gateway, funding, verification, payout jobs
├── contracts/    # Foundry source, tests, deployment scripts
├── demo/         # Report agent and paying bots
├── deployments/  # Deployed addresses and transaction IDs
├── tests/        # End-to-end funding and payment tests
├── docs/         # Architecture, payment flow, partner feedback
├── package.json  # Bun workspaces and root commands
├── bun.lock
└── README.md
```

## Setup

Install Bun, then run:

```sh
bun install
bun dev
```

Both frontends were initialized with `bunx --bun shadcn@latest init @coss/style`.
Use Bun and the coss style for frontend work.
Each frontend includes only the coss button and its required loading spinner.
Add further components individually as needed.

## Commands

```sh
bun dev               # Run the operator/backer app on port 3000
bun dev:landing       # Run the landing frontend on port 3001
bun run build         # Build both frontends
bun lint              # Lint both frontends
bun typecheck         # Check both frontends' types
bun contracts:build   # Compile Solidity
bun contracts:test    # Run Foundry tests
bun contracts:fmt     # Format Solidity
bun test:e2e          # Run end-to-end tests once added
```

`contracts/` contains the standard Foundry Counter starter, including tests,
deployment script, and vendored forge-std. Forge is installed as a root
development dependency. Install the full [Foundry toolchain](https://getfoundry.sh/getting-started/installation/)
if you also need Anvil, Cast, or Chisel.

`server/`, `demo/`, `deployments/`, `tests/`, and `docs/` contain only `.gitkeep`
placeholders. Add package manifests and root workspace entries for `server/`
and `demo/` when implementing them. No end-to-end tests are implemented yet.
