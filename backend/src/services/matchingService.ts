import { HunterCriteria, HunterProperty, ScoredHunterResult } from "./types.js";

const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();

export function scoreHunterProperty(criteria: HunterCriteria, property: HunterProperty): ScoredHunterResult {
  let score = 0;
  const reasons: string[] = [];
  const blockers: string[] = [];

  if (withinBudget(criteria, property.price)) {
    score += 25;
    reasons.push("Budget compatible");
  } else if (criteria.budgetMax && Math.abs(property.price - criteria.budgetMax) <= criteria.budgetMax * 0.12) {
    score += 12;
    reasons.push("Budget proche");
  } else {
    blockers.push("Budget hors cible");
  }

  if (criteria.district && normalize(criteria.district) === normalize(property.district)) {
    score += 25;
    reasons.push("Quartier demande");
  } else if (criteria.city && normalize(criteria.city) === normalize(property.city)) {
    score += 12;
    reasons.push("Ville compatible");
  } else if (criteria.district) {
    blockers.push("Quartier different");
  }

  if (normalize(criteria.type) === normalize(property.propertyType)) {
    score += 15;
    reasons.push("Type de bien exact");
  } else {
    blockers.push("Type different");
  }

  if (isInRange(property.surface, criteria.surfaceMin, criteria.surfaceMax)) {
    score += 10;
    reasons.push("Surface suffisante");
  } else {
    blockers.push("Surface hors cible");
  }

  if (!criteria.bedrooms || property.bedrooms >= criteria.bedrooms) {
    score += 10;
    reasons.push(`${property.bedrooms} chambres trouvees`);
  } else {
    blockers.push("Chambres insuffisantes");
  }

  if (criteria.transaction === property.transaction) {
    score += 10;
    reasons.push("Transaction compatible");
  } else {
    blockers.push("Transaction differente");
  }

  if (property.shortDescription.length > 40) {
    score += 5;
    reasons.push("Description coherente");
  }

  return {
    ...property,
    score: Math.max(1, Math.min(100, Math.round(score))),
    reasons,
    blockers
  };
}

export function filterVisibleScores(results: ScoredHunterResult[]) {
  return results.filter((result) => result.score >= 50).sort((a, b) => b.score - a.score);
}

function withinBudget(criteria: HunterCriteria, price: number) {
  const min = criteria.budgetMin ?? 0;
  const max = criteria.budgetMax ?? Number.MAX_SAFE_INTEGER;
  return price >= min && price <= max;
}

function isInRange(value: number, min?: number, max?: number) {
  return value >= (min ?? 0) && value <= (max ?? Number.MAX_SAFE_INTEGER);
}
