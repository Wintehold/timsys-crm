# Supabase PostgreSQL Schema

This schema is the Preview 1 target for connecting the mock CRM to Supabase later.

```sql
create type user_role as enum ('LUCIFER', 'ADMIN', 'CONSEILLER');
create type transaction_type as enum ('achat', 'location');

create table users (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text unique not null,
  role user_role not null default 'CONSEILLER',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table clients (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  primary_phone text not null,
  secondary_phone text,
  email text,
  notes text,
  assigned_advisor_id uuid references users(id),
  created_by uuid references users(id),
  created_at timestamptz not null default now()
);

create table requests (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id),
  advisor_id uuid not null references users(id),
  transaction_type transaction_type not null,
  city text not null,
  districts text[] not null default '{}',
  budget_min numeric not null,
  budget_max numeric not null,
  property_type text not null,
  min_surface numeric not null,
  min_bedrooms integer not null,
  min_bathrooms integer not null,
  notes text,
  created_at timestamptz not null default now()
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
  short_description text,
  source text not null default 'Yakeey',
  source_url text not null,
  owner_advisor_id uuid not null references users(id),
  imported_at timestamptz not null default now()
);

create table matches (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references requests(id),
  property_card_id uuid references property_cards(id),
  external_source text,
  score integer not null check (score between 1 and 100),
  reasons text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  assigned_to uuid references users(id),
  related_request_id uuid references requests(id),
  done boolean not null default false,
  due_at timestamptz,
  created_at timestamptz not null default now()
);

create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references users(id),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);
```

## Security Rules To Implement

- LUCIFER bypasses all row filters and remains invisible in ADMIN user lists.
- ADMIN can read advisor, client and request data, but not hidden LUCIFER identities.
- CONSEILLER can read and write their own clients and requests.
- CONSEILLER can read other advisors' property cards only through matching/result views.
- Insert and update policies should stamp ownership through the authenticated Supabase user.
