export type PropertySource = "Yakeey" | "Avito" | "Mubawab";
export type TransactionKind = "Vente" | "Location";

export type HunterCriteria = {
  type: string;
  transaction: TransactionKind;
  city?: string;
  district: string;
  bedrooms?: number;
  budgetMin?: number;
  budgetMax?: number;
  surfaceMin?: number;
  surfaceMax?: number;
};

export type HunterProperty = {
  id: string;
  source: PropertySource | "Yakeey interne";
  title: string;
  price: number;
  transaction: TransactionKind;
  city: string;
  district: string;
  propertyType: string;
  surface: number;
  bedrooms: number;
  bathrooms: number;
  sourceUrl: string;
  shortDescription: string;
  ownerAdvisorId?: string;
};

export type ScoredHunterResult = HunterProperty & {
  score: number;
  reasons: string[];
  blockers: string[];
  duplicateNotice?: string;
};

export type GeneratedAd = {
  channel: "Avito" | "Mubawab" | "Marketplace" | "Instagram";
  title: string;
  text: string;
};
