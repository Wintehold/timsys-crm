# Smart Property Hunter Spec

Hunter searches Avito, Mubawab, and Yakeey interne.

## Criteria

- Type: Appartement, Villa, Maison, Terrain, Bureau, Local commercial.
- Transaction: Vente or Location.
- District, bedrooms, budget min/max, surface min/max.

## Scoring

- Budget: 25 points.
- Ville/quartier: 25 points.
- Type: 15 points.
- Surface: 10 points.
- Bedrooms: 10 points.
- Transaction: 10 points.
- Global coherence/options: 5 points.

Results under 50 are hidden.

## Deduplication

Probable duplicates share district, close price within 5%, close surface within 5 m2, same bedrooms, and similar title words. The best-scored source is kept and marked with a duplicate notice.

## Backend Services

- `hunterService.ts`
- `avitoConnector.ts`
- `mubawabConnector.ts`
- `yakeeyNormalizer.ts`
- `deduplicationService.ts`
- `matchingService.ts`
