export type Role = "LUCIFER" | "ADMIN" | "CONSEILLER";
export type TransactionType = "achat" | "location";

export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
  visibleToAdmin: boolean;
};

export type Client = {
  id: string;
  firstName: string;
  lastName: string;
  primaryPhone: string;
  secondaryPhone?: string;
  email?: string;
  notes?: string;
  assignedAdvisorId: string;
};

export type ClientRequest = {
  id: string;
  clientId: string;
  advisorId: string;
  transactionType: TransactionType;
  city: string;
  districts: string[];
  budgetMin: number;
  budgetMax: number;
  propertyType: string;
  minSurface: number;
  minBedrooms: number;
  minBathrooms: number;
  notes: string;
  createdAt: string;
};

export type PropertyCard = {
  id: string;
  title: string;
  price: number;
  city: string;
  district: string;
  propertyType: string;
  surface: number;
  bedrooms: number;
  bathrooms: number;
  shortDescription: string;
  source: "Yakeey" | "Avito" | "Mubawab";
  sourceUrl: string;
  ownerAdvisorId: string;
  importedAt: string;
};

export type MatchResult = {
  score: number;
  reasons: string[];
};

const clamp = (value: number, min = 1, max = 100) =>
  Math.max(min, Math.min(max, Math.round(value)));

export function scorePropertyMatch(
  request: ClientRequest,
  property: Pick<
    PropertyCard,
    | "price"
    | "city"
    | "district"
    | "propertyType"
    | "surface"
    | "bedrooms"
    | "bathrooms"
    | "shortDescription"
  >
): MatchResult {
  let score = 0;
  const reasons: string[] = [];

  if (property.price >= request.budgetMin && property.price <= request.budgetMax) {
    score += 25;
    reasons.push("Budget dans la fourchette");
  } else {
    const overage = Math.min(
      Math.abs(property.price - request.budgetMin),
      Math.abs(property.price - request.budgetMax)
    );
    const tolerance = Math.max(request.budgetMax * 0.12, 1);
    if (overage <= tolerance) {
      score += 12;
      reasons.push("Budget proche de la cible");
    }
  }

  if (sameText(property.city, request.city)) {
    score += 15;
    reasons.push("Ville compatible");
  }

  if (request.districts.some((district) => sameText(district, property.district))) {
    score += 15;
    reasons.push("Quartier demande");
  }

  if (sameText(property.propertyType, request.propertyType)) {
    score += 15;
    reasons.push("Type de bien exact");
  }

  if (property.surface >= request.minSurface) {
    score += 10;
    reasons.push("Surface suffisante");
  }

  if (property.bedrooms >= request.minBedrooms) {
    score += 10;
    reasons.push("Chambres suffisantes");
  }

  if (property.bathrooms >= request.minBathrooms) {
    score += 5;
    reasons.push("Salles de bain suffisantes");
  }

  if (request.notes && noteOverlap(request.notes, property.shortDescription)) {
    score += 5;
    reasons.push("Notes et description coherentes");
  }

  return {
    score: clamp(score),
    reasons: reasons.length ? reasons : ["Correspondance faible"]
  };
}

export function visibleMatch<T extends PropertyCard>(
  request: ClientRequest,
  property: T
): (MatchResult & { property: T }) | null {
  const result = scorePropertyMatch(request, property);
  return result.score >= 50 ? { ...result, property } : null;
}

function sameText(a: string, b: string) {
  return normalize(a) === normalize(b);
}

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim();
}

function noteOverlap(notes: string, description: string) {
  const tokens = new Set(
    normalize(notes)
      .split(/\W+/)
      .filter((token) => token.length > 4)
  );

  return normalize(description)
    .split(/\W+/)
    .some((token) => tokens.has(token));
}
