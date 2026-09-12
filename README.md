# shoal

<img src="web/landing/public/logo.png" alt="shoal logo" width="128" height="128" />

Know what your collateral is actually worth if you had to sell it.

Lending markets keep getting drained by tokens that were never sellable at the
price they were borrowed against. shoal publishes how much of a token can really
be sold, and caps borrowing to that number.

```text
shoal/
├── web/
│   ├── landing/  # Landing frontend (Next.js + coss ui)
│   └── app/      # Scanner and red-team frontend (Next.js + coss ui)
├── server/       # Depth indexing, oracle publishing, x402 gateway
├── contracts/    # Foundry source, tests, deployment scripts
├── demo/         # Forked-market replay and red-team scripts
├── deployments/  # Deployed addresses and transaction IDs
├── tests/        # End-to-end tests
├── docs/         # Architecture and methodology notes
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
bun dev               # Run the scanner app on port 3000
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
