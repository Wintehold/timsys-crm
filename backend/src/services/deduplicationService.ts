import { ScoredHunterResult } from "./types.js";

export function deduplicateResults(results: ScoredHunterResult[]) {
  const kept: ScoredHunterResult[] = [];

  for (const result of results) {
    const duplicateIndex = kept.findIndex((candidate) => isProbableDuplicate(candidate, result));
    if (duplicateIndex === -1) {
      kept.push(result);
      continue;
    }

    const existing = kept[duplicateIndex];
    const winner = result.score > existing.score ? result : existing;
    kept[duplicateIndex] = {
      ...winner,
      duplicateNotice: "Doublon detecte - meilleure source conservee"
    };
  }

  return kept.sort((a, b) => b.score - a.score);
}

function isProbableDuplicate(a: ScoredHunterResult, b: ScoredHunterResult) {
  const sameDistrict = normalize(a.district) === normalize(b.district);
  const closePrice = Math.abs(a.price - b.price) <= Math.max(a.price, b.price) * 0.05;
  const closeSurface = Math.abs(a.surface - b.surface) <= 5;
  const sameBedrooms = a.bedrooms === b.bedrooms;
  const titleOverlap = titleSimilarity(a.title, b.title) >= 0.45;

  return [sameDistrict, closePrice, closeSurface, sameBedrooms, titleOverlap].filter(Boolean).length >= 4;
}

function titleSimilarity(a: string, b: string) {
  const left = new Set(normalize(a).split(/\W+/).filter((token) => token.length > 3));
  const right = new Set(normalize(b).split(/\W+/).filter((token) => token.length > 3));
  const shared = [...left].filter((token) => right.has(token)).length;
  return shared / Math.max(left.size, right.size, 1);
}

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}
