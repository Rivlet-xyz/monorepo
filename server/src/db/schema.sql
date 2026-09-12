create table if not exists token_scores (
  token_address               text primary key,
  symbol                      text not null,
  decimals                    integer not null,
  price_usd                   real not null default 0,
  depth_status                text not null default 'no_venue',
  sellable_depth_usd          real,
  safe_cap_usd                real,
  exposure_usd                real not null default 0,
  exposure_ratio              real,
  liquidation_attack_cost_usd real,
  pump_cost_usd               real,
  required_drop               real not null default 0,
  protocols                   text not null default '[]',
  truncated                   integer not null default 0,
  pools                       text not null default '[]',
  markets                     text not null default '[]',
  error                       text,
  computed_at                 text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

create index if not exists token_scores_ratio_idx
  on token_scores (exposure_ratio desc);

create table if not exists refresh_runs (
  id              integer primary key autoincrement,
  started_at      text not null,
  finished_at     text,
  duration_ms     integer,
  lending_source  text not null,
  market_counts   text not null default '{}',
  eth_price_usd   real,
  uniswap_block   integer,
  lending_block   integer,
  tokens_total    integer not null default 0,
  tokens_scored   integer not null default 0,
  tokens_failed   integer not null default 0,
  notes           text
);

create index if not exists refresh_runs_started_idx
  on refresh_runs (started_at desc);
