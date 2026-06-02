# Deployment Notes

- Keep Node 20 via `.node-version`.
- Render health checks remain available at `/health`.
- API health remains available at `/api/health`.
- `backend/package.json` keeps runtime dependencies valid for Render.
- `render.yaml` uses environment variable names only. Store Supabase secrets in Render, never in Git.
- Vercel builds the frontend with `npm run build --workspace web-crm`.
- Beta 1 persistence is in-memory/demo state; Supabase schema is prepared in `docs/database-schema.md`.
