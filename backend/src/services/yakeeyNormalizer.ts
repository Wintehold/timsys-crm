import { HunterProperty } from "./types.js";

type YakeeyInput = { sourceUrl: string; ownerAdvisorId?: string };

const samples = [
  {
    key: "gauthier",
    title: "Appartement lumineux a Gauthier",
    price: 1680000,
    city: "Casablanca",
    district: "Gauthier",
    propertyType: "Appartement",
    surface: 101,
    bedrooms: 2,
    bathrooms: 2,
    shortDescription: "Appartement lumineux proche tram, commerces, ascenseur et parking."
  },
  {
    key: "racine",
    title: "Appartement terrasse a Racine",
    price: 1850000,
    city: "Casablanca",
    district: "Racine",
    propertyType: "Appartement",
    surface: 105,
    bedrooms: 2,
    bathrooms: 2,
    shortDescription: "Belle terrasse, residence entretenue et quartier recherche."
  },
  {
    key: "agdal",
    title: "Appartement standing Agdal",
    price: 13200,
    city: "Rabat",
    district: "Agdal",
    propertyType: "Appartement",
    surface: 96,
    bedrooms: 2,
    bathrooms: 2,
    shortDescription: "Location standing avec ascenseur, balcon et parking."
  }
];

export function analyzeYakeeyUrl(input: YakeeyInput): HunterProperty {
  const url = input.sourceUrl.trim();
  if (!/yakeey/i.test(url)) {
    throw new Error("Le lien doit contenir yakeey.");
  }

  const normalizedUrl = url.toLowerCase();
  const sample = samples.find((item) => normalizedUrl.includes(item.key)) ?? samples[0];
  const transaction = sample.price < 50000 ? "Location" : "Vente";

  return {
    id: `yakeey-${sample.key}`,
    source: "Yakeey",
    sourceUrl: url,
    ownerAdvisorId: input.ownerAdvisorId,
    transaction,
    ...sample
  };
}
