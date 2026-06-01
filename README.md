# TIM CRM Preview 1

TIMsys is a web CRM preview for real estate advisors, built as a modern SaaS-ready monorepo.

## Structure

```txt
backend/
web-crm/
shared/
docs/
```

## Local start

```bash
npm install
npm run dev
```

The frontend is designed for Vercel. The backend folder is Render-ready and can later expose Supabase-backed APIs.

## Deployment notes

- Vercel project root: `web-crm`
- Render blueprint: `render.yaml`
- Supabase schema draft: `docs/database-schema.md`

## Demo logins

- `lucifer@tim.local` / `preview123`
- `admin@tim.local` / `preview123`
- `sara@tim.local` / `preview123`
- `youssef@tim.local` / `preview123`
