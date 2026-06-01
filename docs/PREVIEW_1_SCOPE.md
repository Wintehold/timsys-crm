# TIMsys Preview 1 Scope

## Included

- Responsive web CRM shell with sidebar navigation and mobile layout.
- Mock authentication with login, logout, current user and route protection.
- Three roles: LUCIFER, ADMIN and CONSEILLER.
- LUCIFER can see all data and is hidden from ADMIN-facing user lists.
- CONSEILLER users see only their own clients and requests.
- Dashboard cards for clients, requests, Vision Cards and internal matches.
- Clients list, simple search, detail panel and new client form.
- Requests list, new request form and scored request detail.
- Internal matching against Vision Cards owned by other advisors.
- External mocked Avito and Mubawab listings with the same scoring rule.
- Yakeey import mock that creates a realistic Vision Card from a pasted link.
- Vision Cards list, filters and detail panel.
- Smart Property Hunter V3 base with request summary, top 3 compatible properties and human matching explanation.
- Shared matching engine returning `{ score, reasons }` and hiding scores below 50 in the UI.
- Supabase/PostgreSQL schema draft in `docs/database-schema.md`.

## Not Included Yet

- Real Supabase authentication.
- Real persistence.
- Real Yakeey scraping.
- Real Avito or Mubawab integrations.
- AI API integration for Smart Property Hunter V3.
- Production audit log pipeline.

## Deployment Direction

- `web-crm/` is the Vercel frontend.
- `backend/` is the Render service foundation.
- `shared/` contains shared TypeScript domain and matching logic.
- Supabase tables are documented for the next persistence phase.
