# Beta 1 Scope

Beta 1 makes TIM CRM presentable for a client demo with a polished Mojave-inspired interface and business-ready workflows.

## Delivered

- Premium dark/light UI with frosted cards, soft borders, blue/champagne accents, responsive layouts, and favicon fallback.
- Username login, forced password change, and role visibility inherited from Preview 2.
- Smart Property Hunter search form for Avito, Mubawab, and Yakeey interne.
- Mocked but realistic Avito/Mubawab connectors, Yakeey normalization, scoring, filtering under 50, and deduplication.
- Yakeey import flow: paste link, analyze, edit preview, validate, create Vision Card.
- Vision Cards with status, owner, detail/source link, and AI ad writer entry point.
- AI ad writer with Avito, Mubawab, Marketplace, and Instagram versions.
- Administration page with tabs for Utilisateurs, Affectations, Activite, and Securite.
- Dashboard metrics for active clients, open requests, active cards, Hunter results, generated ads, urgent requests, recent imports, and active advisors.

## Limits

- Persistence remains in-memory/demo state for Beta 1.
- External search uses clean mock connectors prepared for real scraping/API replacement.
- No real AI API is called; ad writing is deterministic.
- No uploaded logo file was present, so the app uses the TIM CRM fallback mark and favicon.
