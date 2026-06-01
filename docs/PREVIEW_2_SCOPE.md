# Preview 2 Scope

TIM CRM Preview 2 turns the Preview 1 mock into a demo-ready business workflow for real-estate CRM operations.

## Delivered

- Username/password login with `username`, role, active state, and mandatory first-login password change.
- Roles: `LUCIFER`, `ADMIN`, and `CONSEILLER`.
- LUCIFER visibility rules: can see all users, including hidden LUCIFER accounts.
- ADMIN visibility rules: can administer ADMIN/CONSEILLER accounts but never sees LUCIFER accounts.
- CONSEILLER visibility rules: sees own clients, own requests, and own Vision Cards.
- Light/dark theme toggle with local preference storage.
- Dashboard metrics for active clients, open requests, active Vision Cards, internal/external matches, urgent requests, and Yakeey imports.
- Client creation, list, filters, detail page, and simple action history.
- Request creation, list, detail page, urgency, status, options, and internal/external matching sections.
- Vision Card import from mocked Yakeey extraction and persisted browser/backend state.
- Avito/Mubawab mocked external source structure.
- Smart Property Hunter V3 with deterministic summary, top internal/external matches, blockers, opportunities, and advisor recommendation.
- Administration users page for creating, deactivating, forcing password change, resetting password, and removing counselor accounts in demo state.
- Audit log model and LUCIFER audit page.
- Backend routes under `/api` for health, auth, users, clients, requests, property cards, matching, smart hunter, and audit logs.
- `/health` remains available for Render health checks.

## Persistence

The frontend demo keeps state in React memory for Vercel-safe demonstrations. The backend keeps an idempotent in-memory seed for Preview 2 API checks. Supabase SQL is documented in `docs/database-schema.md` for the production persistence pass.

## Deployment Notes

- Keep Node 20 through `.node-version`.
- Do not commit Supabase keys.
- Configure `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `AUTH_TOKEN_SECRET` in Render when moving from in-memory preview data to Supabase-backed persistence.
- Configure any frontend API URL in Vercel environment variables when the UI is switched from demo state to backend-backed calls.

## Verification Checklist

- `npm run build --workspace web-crm`
- `npm run build --workspace backend`
- Start backend with `npm run dev --workspace backend`
- Check `GET /health`
- Check `GET /api/health`
