# Supabase PostgreSQL Schema - Preview 2

Preview 2 uses an internal username/password model. Do not use Supabase Auth `users` for these accounts; the application table is `app_users`.

```sql
create extension if not exists pgcrypto;

create type user_role as enum ('LUCIFER', 'ADMIN', 'CONSEILLER');
create type client_status as enum ('nouveau', 'actif', 'en recherche', 'en negociation', 'cloture');
create type request_status as enum ('ouverte', 'en analyse', 'biens trouves', 'client contacte', 'cloturee');
create type request_urgency as enum ('faible', 'normale', 'elevee', 'immediate');
create type transaction_type as enum ('achat', 'location');
create type property_source as enum ('Yakeey', 'Avito', 'Mubawab');
create type property_card_status as enum ('actif', 'ignore', 'expire');

create table app_users (
  id uuid primary key default gen_random_uuid(),
  username text not null unique check (username ~ '^[A-Za-z0-9_]+$'),
  password_hash text not null,
  full_name text not null,
  role user_role not null default 'CONSEILLER',
  must_change_password boolean not null default true,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table clients (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  primary_phone text not null,
  secondary_phone text,
  email text,
  source text,
  estimated_budget numeric,
  notes text,
  assigned_advisor_id uuid not null references app_users(id),
  status client_status not null default 'nouveau',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table requests (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  advisor_id uuid not null references app_users(id),
  transaction_type transaction_type not null,
  city text not null,
  districts text[] not null default '{}',
  budget_min numeric not null,
  budget_max numeric not null,
  property_type text not null,
  min_surface numeric not null,
  min_bedrooms integer not null,
  min_bathrooms integer not null,
  preferred_floor text,
  elevator boolean not null default false,
  parking boolean not null default false,
  terrace boolean not null default false,
  furnished boolean not null default false,
  urgency request_urgency not null default 'normale',
  status request_status not null default 'ouverte',
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table property_cards (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  price numeric not null,
  city text not null,
  district text not null,
  property_type text not null,
  surface numeric not null,
  bedrooms integer not null,
  bathrooms integer not null,
  short_description text not null default '',
  source property_source not null default 'Yakeey',
  source_url text not null,
  owner_advisor_id uuid not null references app_users(id),
  status property_card_status not null default 'actif',
  elevator boolean not null default false,
  parking boolean not null default false,
  terrace boolean not null default false,
  furnished boolean not null default false,
  imported_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table matches (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references requests(id) on delete cascade,
  property_card_id uuid references property_cards(id) on delete set null,
  external_source property_source,
  external_url text,
  score integer not null check (score between 1 and 100),
  reasons text[] not null default '{}',
  blockers text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references app_users(id),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index idx_clients_advisor on clients(assigned_advisor_id);
create index idx_requests_advisor on requests(advisor_id);
create index idx_requests_client on requests(client_id);
create index idx_property_cards_owner on property_cards(owner_advisor_id);
create index idx_audit_logs_entity on audit_logs(entity_type, entity_id);
```

## Seed Strategy

Seed accounts must be inserted idempotently by `username`. Passwords must be hashed by the backend before insertion.

```sql
-- Pseudocode values only. Replace password_hash with backend-generated hashes.
insert into app_users (username, password_hash, full_name, role, must_change_password, is_active)
values
  ('luci', '<hash:GOT2026GOT>', 'Lucifer Morningstar', 'LUCIFER', true, true),
  ('Hicham', '<hash:12345678>', 'Hicham Admin', 'ADMIN', true, true),
  ('Alie', '<hash:12345678>', 'Alie Conseiller', 'CONSEILLER', true, true)
on conflict (username) do update set
  role = excluded.role,
  must_change_password = app_users.must_change_password,
  is_active = app_users.is_active,
  updated_at = now();
```

## Security Rules

- LUCIFER can read and mutate all rows and can see LUCIFER accounts.
- ADMIN can see ADMIN and CONSEILLER users, never LUCIFER accounts.
- ADMIN can create, deactivate, reset, and force password changes for CONSEILLER accounts.
- CONSEILLER can manage only their assigned clients and requests.
- CONSEILLER can see other advisors' cards only through matching result views.
- Audit logs should be append-only from application code.
