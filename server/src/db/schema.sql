create table if not exists token_scores (
  token_address               text primary key,
  symbol                      text not null,
  decimals                    int not null,
  price_usd                   numeric not null default 0,
  depth_status                text not null default 'no_venue',
  sellable_depth_usd          numeric,
  safe_cap_usd                numeric,
  exposure_usd                numeric not null default 0,
  exposure_ratio              numeric,
  liquidation_attack_cost_usd numeric,
  pump_cost_usd               numeric,
  required_drop               numeric not null default 0,
  protocols                   text[] not null default '{}',
  truncated                   boolean not null default false,
  pools                       jsonb not null default '[]',
  markets                     jsonb not null default '[]',
  error                       text,
  computed_at                 timestamptz not null default now()
);

create index if not exists token_scores_ratio_idx
  on token_scores (exposure_ratio desc nulls last);
create index if not exists token_scores_protocols_idx
  on token_scores using gin (protocols);

create table if not exists refresh_runs (
  id              bigserial primary key,
  started_at      timestamptz not null,
  finished_at     timestamptz,
  duration_ms     int,
  lending_source  text not null,
  market_counts   jsonb not null default '{}',
  eth_price_usd   numeric,
  uniswap_block   bigint,
  lending_block   bigint,
  tokens_total    int not null default 0,
  tokens_scored   int not null default 0,
  tokens_failed   int not null default 0,
  notes           text
);

create index if not exists refresh_runs_started_idx
  on refresh_runs (started_at desc);
