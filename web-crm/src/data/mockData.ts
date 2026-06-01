import type { Client, ClientRequest, PropertyCard, User } from "@timcrm/shared";

export const users: User[] = [
  {
    id: "u-lucifer",
    name: "Lucifer Morningstar",
    email: "lucifer@tim.local",
    role: "LUCIFER",
    visibleToAdmin: false
  },
  {
    id: "u-admin",
    name: "Nadia El Mansouri",
    email: "admin@tim.local",
    role: "ADMIN",
    visibleToAdmin: true
  },
  {
    id: "u-sara",
    name: "Sara Benjelloun",
    email: "sara@tim.local",
    role: "CONSEILLER",
    visibleToAdmin: true
  },
  {
    id: "u-youssef",
    name: "Youssef Amrani",
    email: "youssef@tim.local",
    role: "CONSEILLER",
    visibleToAdmin: true
  }
];

export const clients: Client[] = [
  {
    id: "c-1",
    firstName: "Meryem",
    lastName: "Alaoui",
    primaryPhone: "+212 6 11 22 33 44",
    email: "meryem@example.com",
    notes: "Recherche un appartement lumineux proche tram.",
    assignedAdvisorId: "u-sara"
  },
  {
    id: "c-2",
    firstName: "Karim",
    lastName: "Bennis",
    primaryPhone: "+212 6 55 19 88 71",
    secondaryPhone: "+212 5 22 10 20 30",
    notes: "Investisseur, decision rapide si rendement clair.",
    assignedAdvisorId: "u-youssef"
  },
  {
    id: "c-3",
    firstName: "Leila",
    lastName: "Tazi",
    primaryPhone: "+212 6 70 42 19 02",
    email: "leila@example.com",
    notes: "Famille, besoin d'une residence calme.",
    assignedAdvisorId: "u-sara"
  }
];

export const requests: ClientRequest[] = [
  {
    id: "r-1",
    clientId: "c-1",
    advisorId: "u-sara",
    transactionType: "achat",
    city: "Casablanca",
    districts: ["Maarif", "Gauthier", "Racine"],
    budgetMin: 1450000,
    budgetMax: 1900000,
    propertyType: "Appartement",
    minSurface: 95,
    minBedrooms: 2,
    minBathrooms: 2,
    notes: "Lumineux, proche commerces et tram.",
    createdAt: "2026-05-25"
  },
  {
    id: "r-2",
    clientId: "c-2",
    advisorId: "u-youssef",
    transactionType: "location",
    city: "Rabat",
    districts: ["Agdal", "Hay Riad"],
    budgetMin: 9000,
    budgetMax: 15000,
    propertyType: "Appartement",
    minSurface: 80,
    minBedrooms: 2,
    minBathrooms: 1,
    notes: "Standing, ascenseur et parking.",
    createdAt: "2026-05-27"
  }
];

export const propertyCards: PropertyCard[] = [
  {
    id: "p-1",
    title: "Appartement premium Maarif",
    price: 1720000,
    city: "Casablanca",
    district: "Maarif",
    propertyType: "Appartement",
    surface: 112,
    bedrooms: 3,
    bathrooms: 2,
    shortDescription: "Appartement lumineux, proche commerces, tram et parking.",
    source: "Yakeey",
    sourceUrl: "https://yakeey.example/maarif-112",
    ownerAdvisorId: "u-youssef",
    importedAt: "2026-05-26"
  },
  {
    id: "p-2",
    title: "Villa familiale Californie",
    price: 5200000,
    city: "Casablanca",
    district: "Californie",
    propertyType: "Villa",
    surface: 360,
    bedrooms: 4,
    bathrooms: 3,
    shortDescription: "Villa calme avec jardin et grande reception.",
    source: "Yakeey",
    sourceUrl: "https://yakeey.example/californie-villa",
    ownerAdvisorId: "u-sara",
    importedAt: "2026-05-20"
  },
  {
    id: "p-3",
    title: "Appartement Agdal standing",
    price: 12500,
    city: "Rabat",
    district: "Agdal",
    propertyType: "Appartement",
    surface: 92,
    bedrooms: 2,
    bathrooms: 2,
    shortDescription: "Residence securisee avec ascenseur, parking et balcon.",
    source: "Yakeey",
    sourceUrl: "https://yakeey.example/agdal-standing",
    ownerAdvisorId: "u-sara",
    importedAt: "2026-05-28"
  }
];

export const externalProperties: PropertyCard[] = [
  {
    id: "e-1",
    title: "Avito - Appartement Racine terrasse",
    price: 1850000,
    city: "Casablanca",
    district: "Racine",
    propertyType: "Appartement",
    surface: 105,
    bedrooms: 2,
    bathrooms: 2,
    shortDescription: "Terrasse, proche commerces et excellent ensoleillement.",
    source: "Avito",
    sourceUrl: "https://avito.example/racine-terrasse",
    ownerAdvisorId: "external",
    importedAt: "2026-05-29"
  },
  {
    id: "e-2",
    title: "Mubawab - Studio Bourgogne",
    price: 780000,
    city: "Casablanca",
    district: "Bourgogne",
    propertyType: "Studio",
    surface: 48,
    bedrooms: 1,
    bathrooms: 1,
    shortDescription: "Studio compact proche corniche.",
    source: "Mubawab",
    sourceUrl: "https://mubawab.example/bourgogne-studio",
    ownerAdvisorId: "external",
    importedAt: "2026-05-29"
  },
  {
    id: "e-3",
    title: "Mubawab - Appartement Hay Riad",
    price: 14000,
    city: "Rabat",
    district: "Hay Riad",
    propertyType: "Appartement",
    surface: 118,
    bedrooms: 3,
    bathrooms: 2,
    shortDescription: "Standing, parking, ascenseur, proche ecoles.",
    source: "Mubawab",
    sourceUrl: "https://mubawab.example/hay-riad",
    ownerAdvisorId: "external",
    importedAt: "2026-05-30"
  }
];
