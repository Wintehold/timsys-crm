export type Role = "LUCIFER" | "ADMIN" | "CONSEILLER";
export type TransactionType = "achat" | "location";
export type ClientStatus = "nouveau" | "actif" | "en recherche" | "en negociation" | "cloture";
export type RequestStatus = "ouverte" | "en analyse" | "biens trouves" | "client contacte" | "cloturee";
export type Urgency = "faible" | "normale" | "elevee" | "immediate";
export type PropertyCardStatus = "actif" | "ignore" | "expire";
export type PropertySource = "Yakeey" | "Avito" | "Mubawab";

export type User = {
  id: string;
  username: string;
  name: string;
  role: Role;
  mustChangePassword: boolean;
  isActive: boolean;
  visibleToAdmin: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Client = {
  id: string;
  firstName: string;
  lastName: string;
  primaryPhone: string;
  secondaryPhone?: string;
  email?: string;
  source?: string;
  estimatedBudget?: number;
  notes?: string;
  assignedAdvisorId: string;
  status: ClientStatus;
  createdAt: string;
  updatedAt: string;
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
  preferredFloor?: string;
  elevator: boolean;
  parking: boolean;
  terrace: boolean;
  furnished: boolean;
  urgency: Urgency;
  status: RequestStatus;
  notes: string;
  createdAt: string;
  updatedAt: string;
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
  source: PropertySource;
  sourceUrl: string;
  ownerAdvisorId: string;
  status: PropertyCardStatus;
  elevator: boolean;
  parking: boolean;
  terrace: boolean;
  furnished: boolean;
  importedAt: string;
  updatedAt: string;
};

export type MatchResult<T extends PropertyCard = PropertyCard> = {
  score: number;
  reasons: string[];
  blockers: string[];
  property: T;
};

export type AuditLog = {
  id: string;
  actorUserId: string;
  action: string;
  entityType: string;
  entityId?: string;
  metadata: Record<string, string | number | boolean | null>;
  createdAt: string;
};

const clamp = (value: number, min = 1, max = 100) =>
  Math.max(min, Math.min(max, Math.round(value)));

export function scorePropertyMatch<T extends PropertyCard>(
  request: ClientRequest,
  property: T
): MatchResult<T> {
  let score = 0;
  const reasons: string[] = [];
  const blockers: string[] = [];

  if (property.price >= request.budgetMin && property.price <= request.budgetMax) {
    score += 25;
    reasons.push("Budget dans la fourchette");
  } else {
    const distance = Math.min(
      Math.abs(property.price - request.budgetMin),
      Math.abs(property.price - request.budgetMax)
    );
    const tolerance = Math.max(request.budgetMax * 0.12, 1);
    if (distance <= tolerance) {
      score += 12;
      reasons.push("Budget proche de la cible");
    } else {
      blockers.push("Budget hors cible");
    }
  }

  if (request.districts.some((district) => sameText(district, property.district))) {
    score += 25;
    reasons.push("Quartier demande");
  } else if (sameText(property.city, request.city)) {
    score += 12;
    reasons.push("Ville compatible");
  } else {
    blockers.push("Ville differente");
  }

  if (sameText(property.propertyType, request.propertyType)) {
    score += 15;
    reasons.push("Type de bien exact");
  } else {
    blockers.push("Type de bien different");
  }

  if (property.surface >= request.minSurface) {
    score += 10;
    reasons.push("Surface suffisante");
  } else {
    blockers.push("Surface insuffisante");
  }

  if (property.bedrooms >= request.minBedrooms) {
    score += 10;
    reasons.push("Chambres suffisantes");
  } else {
    blockers.push("Chambres insuffisantes");
  }

  const propertyTransaction: TransactionType = property.price < 50000 ? "location" : "achat";
  if (propertyTransaction === request.transactionType) {
    score += 10;
    reasons.push("Transaction compatible");
  } else {
    blockers.push("Transaction differente");
  }

  const wantedOptions = [
    property.bathrooms >= request.minBathrooms,
    request.elevator && property.elevator,
    request.parking && property.parking,
    request.terrace && property.terrace,
    request.furnished && property.furnished
  ].filter(Boolean).length;
  if (wantedOptions > 0 || noteOverlap(request.notes, property.shortDescription)) {
    score += 5;
    reasons.push("Options ou notes coherentes");
  }

  return {
    score: clamp(score),
    reasons: reasons.length ? reasons : ["Correspondance faible"],
    blockers,
    property
  };
}

export function visibleMatch<T extends PropertyCard>(request: ClientRequest, property: T) {
  const result = scorePropertyMatch(request, property);
  return result.score >= 50 ? result : null;
}

export function sameText(a: string, b: string) {
  return normalize(a) === normalize(b);
}

export function normalize(value: string) {
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
