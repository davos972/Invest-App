-- ============================================================
--  Plan de la base de données (Supabase / PostgreSQL)
--  À coller dans Supabase : menu "SQL Editor" > New query > Run.
--  Crée les 5 tables prévues dans le document de conception et
--  protège chaque ligne pour qu'un utilisateur ne voie que SES données.
-- ============================================================

-- 1) Recommandations hebdomadaires (un lot par génération)
create table if not exists weekly_recommendations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  generated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- 2) Détail de chaque actif recommandé
create table if not exists assets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  recommendation_id uuid references weekly_recommendations (id) on delete cascade,
  nom text not null,
  ticker text,
  type text,            -- action / crypto / metal
  categorie text,       -- securitaire / risque
  confiance text,       -- High / Medium / Low
  evolution numeric,    -- variation de la semaine en %
  resume_these text,
  points_risque text,
  created_at timestamptz not null default now()
);

-- 3) Portefeuille : état courant de chaque actif détenu (ex. prix actuel)
create table if not exists portfolio (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  ticker text not null,
  nom text,
  type text,
  prix_actuel numeric,
  updated_at timestamptz not null default now(),
  unique (user_id, ticker)
);

-- 4) Transactions : chaque achat / vente journalisé
create table if not exists transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  nom text not null,
  ticker text,
  type text,
  quantite numeric not null,
  prix_achat numeric not null,
  date date not null default current_date,
  created_at timestamptz not null default now()
);

-- 5) Sessions de calcul d'allocation sauvegardées
create table if not exists calculator_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  montant numeric,
  data jsonb,
  created_at timestamptz not null default now()
);

-- ============================================================
--  Sécurité : chaque utilisateur n'accède qu'à SES propres lignes.
-- ============================================================
alter table weekly_recommendations enable row level security;
alter table assets enable row level security;
alter table portfolio enable row level security;
alter table transactions enable row level security;
alter table calculator_sessions enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array[
    'weekly_recommendations', 'assets', 'portfolio',
    'transactions', 'calculator_sessions'
  ]
  loop
    execute format(
      'create policy "owner_all_%1$s" on %1$s
         for all
         using (auth.uid() = user_id)
         with check (auth.uid() = user_id);', t
    );
  end loop;
end $$;
