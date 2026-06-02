import { HunterCriteria, HunterProperty } from "./types.js";

export async function searchMubawab(criteria: HunterCriteria): Promise<HunterProperty[]> {
  const district = criteria.district || "Racine";
  const city = criteria.city || "Casablanca";
  const transaction = criteria.transaction;
  const type = criteria.type || "Appartement";
  const targetPrice = criteria.budgetMax ? Math.round(criteria.budgetMax * 0.96) : transaction === "Location" ? 13500 : 1780000;

  return [
    {
      id: `mubawab-${district}-1`,
      source: "Mubawab",
      title: `${type} premium a ${district}`,
      price: targetPrice,
      transaction,
      city,
      district,
      propertyType: type,
      surface: criteria.surfaceMin ? criteria.surfaceMin + 18 : 108,
      bedrooms: criteria.bedrooms ?? 2,
      bathrooms: 2,
      sourceUrl: "https://mubawab.example/tim-crm-beta-1",
      shortDescription: "Residence standing, finitions premium, concierge, parking et balcon."
    },
    {
      id: `mubawab-${district}-duplicate`,
      source: "Mubawab",
      title: `${type} lumineux ${district} commerces`,
      price: Math.round(targetPrice * 0.98),
      transaction,
      city,
      district,
      propertyType: type,
      surface: criteria.surfaceMin ? criteria.surfaceMin + 13 : 97,
      bedrooms: criteria.bedrooms ?? 2,
      bathrooms: 2,
      sourceUrl: "https://mubawab.example/tim-crm-beta-1-duplicate",
      shortDescription: "Annonce proche d'un bien Avito, conservee seulement si meilleur score."
    }
  ];
}
