# Beta 1 Test Plan

## Build

- `npm run build --workspace web-crm`
- `npm run build --workspace backend`

## Backend

- `GET /health`
- `GET /api/health`
- `POST /api/auth/login` with `luci / GOT2026GOT`
- `POST /api/hunter/search`
- `POST /api/property-cards/analyze-yakeey`
- `POST /api/ai-writer/property-card/:id`

## Frontend Manual Checks

- Login with `luci`, `Hicham`, and `Alie`.
- Complete mandatory password change.
- Toggle light/dark theme.
- Confirm ADMIN never sees `luci`.
- Confirm LUCIFER sees all accounts.
- Run Hunter search and verify scored cards.
- Analyze a Yakeey link containing `yakeey`, edit preview, and create Vision Card.
- Open a Vision Card and generate 4 AI ad versions.
- Review Administration tabs and reassignment controls.
