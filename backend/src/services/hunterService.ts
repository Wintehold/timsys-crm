import { searchAvito } from "./avitoConnector.js";
import { deduplicateResults } from "./deduplicationService.js";
import { filterVisibleScores, scoreHunterProperty } from "./matchingService.js";
import { searchMubawab } from "./mubawabConnector.js";
import { HunterCriteria, HunterProperty } from "./types.js";

export async function searchHunter(criteria: HunterCriteria, internalCards: HunterProperty[] = []) {
  const [avito, mubawab] = await Promise.all([searchAvito(criteria), searchMubawab(criteria)]);
  const scored = [...avito, ...mubawab, ...internalCards]
    .map((property) => scoreHunterProperty(criteria, property));

  return deduplicateResults(filterVisibleScores(scored));
}
