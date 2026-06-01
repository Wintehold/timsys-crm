import type { AuditLog, Client, ClientRequest, PropertyCard, User } from "@timcrm/shared";

const stamp = "2026-05-31T10:00:00.000Z";

export const initialPasswords: Record<string, string> = {
  luci: "GOT2026GOT",
  Hicham: "12345678",
  Alie: "12345678",
  Sara: "12345678"
};

export const users: User[] = [
  {
    id: "u-lucifer",
    username: "luci",
    name: "Lucifer Morningstar",
    role: "LUCIFER",
    mustChangePassword: true,
    isActive: true,
    visibleToAdmin: false,
    createdAt: stamp,
    updatedAt: stamp
  },
  {
    id: "u-admin",
    username: "Hicham",
    name: "Hicham Admin",
    role: "ADMIN",
    mustChangePassword: true,
    isActive: true,
    visibleToAdmin: true,
    createdAt: stamp,
    updatedAt: stamp
  },
  {
    id: "u-alie",
    username: "Alie",
    name: "Alie Conseiller",
    role: "CONSEILLER",
    mustChangePassword: true,
    isActive: true,
    visibleToAdmin: true,
    createdAt: stamp,
    updatedAt: stamp
  },
  {
    id: "u-sara",
    username: "Sara",
    name: "Sara Conseillere",
    role: "CONSEILLER",
    mustChangePassword: true,
    isActive: true,
    visibleToAdmin: true,
    createdAt: stamp,
    updatedAt: stamp
  }
];

export const clients: Client[] = [
  {
    id: "c-1",
    firstName: "Meryem",
    lastName: "Alaoui",
    primaryPhone: "+212 6 11 22 33 44",
    email: "meryem@example.com",
    source: "Yakeey",
    estimatedBudget: 1800000,
    notes: "Recherche un appartement lumineux proche tram.",
    assignedAdvisorId: "u-alie",
    status: "en recherche",
    createdAt: "2026-05-25T09:00:00.000Z",
    updatedAt: stamp
  },
  {
    id: "c-2",
    firstName: "Karim",
    lastName: "Bennis",
    primaryPhone: "+212 6 55 19 88 71",
    secondaryPhone: "+212 5 22 10 20 30",
    source: "Recommandation",
    estimatedBudget: 15000,
    notes: "Investisseur, decision rapide si rendement clair.",
    assignedAdvisorId: "u-sara",
    status: "actif",
    createdAt: "2026-05-26T09:00:00.000Z",
    updatedAt: stamp
  },
  {
    id: "c-3",
    firstName: "Leila",
    lastName: "Tazi",
    primaryPhone: "+212 6 70 42 19 02",
    email: "leila@example.com",
    source: "Instagram",
    estimatedBudget: 4600000,
    notes: "Famille, besoin d'une residence calme.",
    assignedAdvisorId: "u-alie",
    status: "en negociation",
    createdAt: "2026-05-28T09:00:00.000Z",
    updatedAt: stamp
  }
];

export const requests: ClientRequest[] = [
  {
    id: "r-1",
    clientId: "c-1",
    advisorId: "u-alie",
    transactionType: "achat",
    city: "Casablanca",
    districts: ["Maarif", "Gauthier", "Racine"],
    budgetMin: 1450000,
    budgetMax: 1900000,
    propertyType: "Appartement",
    minSurface: 95,
    minBedrooms: 2,
    minBathrooms: 2,
    elevator: true,
    parking: true,
    terrace: false,
    furnished: false,
    urgency: "elevee",
    status: "ouverte",
    notes: "Lumineux, proche commerces et tram.",
    createdAt: "2026-05-25T10:00:00.000Z",
    updatedAt: stamp
  },
  {
    id: "r-2",
    clientId: "c-2",
    advisorId: "u-sara",
    transactionType: "location",
    city: "Rabat",
    districts: ["Agdal", "Hay Riad"],
    budgetMin: 9000,
    budgetMax: 15000,
    propertyType: "Appartement",
    minSurface: 80,
    minBedrooms: 2,
    minBathrooms: 1,
    elevator: true,
    parking: true,
    terrace: true,
    furnished: false,
    urgency: "normale",
    status: "en analyse",
    notes: "Standing, ascenseur, parking et balcon.",
    createdAt: "2026-05-27T10:00:00.000Z",
    updatedAt: stamp
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
    ownerAdvisorId: "u-sara",
    status: "actif",
    elevator: true,
    parking: true,
    terrace: false,
    furnished: false,
    importedAt: "2026-05-26T10:00:00.000Z",
    updatedAt: stamp
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
    ownerAdvisorId: "u-alie",
    status: "actif",
    elevator: false,
    parking: true,
    terrace: true,
    furnished: false,
    importedAt: "2026-05-20T10:00:00.000Z",
    updatedAt: stamp
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
    ownerAdvisorId: "u-alie",
    status: "actif",
    elevator: true,
    parking: true,
    terrace: true,
    furnished: false,
    importedAt: "2026-05-28T10:00:00.000Z",
    updatedAt: stamp
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
    status: "actif",
    elevator: true,
    parking: true,
    terrace: true,
    furnished: false,
    importedAt: "2026-05-29T10:00:00.000Z",
    updatedAt: stamp
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
    status: "actif",
    elevator: true,
    parking: false,
    terrace: false,
    furnished: true,
    importedAt: "2026-05-29T10:00:00.000Z",
    updatedAt: stamp
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
    status: "actif",
    elevator: true,
    parking: true,
    terrace: true,
    furnished: false,
    importedAt: "2026-05-30T10:00:00.000Z",
    updatedAt: stamp
  }
];

export const auditLogs: AuditLog[] = [
  {
    id: "log-1",
    actorUserId: "u-lucifer",
    action: "seed_preview_2",
    entityType: "system",
    entityId: "preview-2",
    metadata: { users: users.length },
    createdAt: stamp
  },
  {
    id: "log-2",
    actorUserId: "u-alie",
    action: "creation_demande",
    entityType: "request",
    entityId: "r-1",
    metadata: { city: "Casablanca" },
    createdAt: "2026-05-25T10:05:00.000Z"
  },
  {
    id: "log-3",
    actorUserId: "u-sara",
    action: "import_vision_card",
    entityType: "property_card",
    entityId: "p-1",
    metadata: { source: "Yakeey" },
    createdAt: "2026-05-26T10:05:00.000Z"
  }
];
