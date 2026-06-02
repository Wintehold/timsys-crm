import { HunterCriteria, HunterProperty } from "./types.js";

export async function searchAvito(criteria: HunterCriteria): Promise<HunterProperty[]> {
  const district = criteria.district || "Gauthier";
  const city = criteria.city || "Casablanca";
  const transaction = criteria.transaction;
  const type = criteria.type || "Appartement";
  const targetPrice = criteria.budgetMax ? Math.round(criteria.budgetMax * 0.92) : transaction === "Location" ? 11500 : 1650000;

  return [
    {
      id: `avito-${district}-1`,
      source: "Avito",
      title: `${type} ${district} avec belle lumiere`,
      price: targetPrice,
      transaction,
      city,
      district,
      propertyType: type,
      surface: criteria.surfaceMin ? criteria.surfaceMin + 12 : 96,
      bedrooms: criteria.bedrooms ?? 2,
      bathrooms: 2,
      sourceUrl: "https://avito.example/tim-crm-beta-1",
      shortDescription: "Annonce Avito realiste avec ascenseur, parking et proximite commerces."
    },
    {
      id: `avito-${district}-2`,
      source: "Avito",
      title: `${type} refait a neuf ${district}`,
      price: Math.round(targetPrice * 1.04),
      transaction,
      city,
      district,
      propertyType: type,
      surface: criteria.surfaceMin ? criteria.surfaceMin + 5 : 88,
      bedrooms: criteria.bedrooms ?? 2,
      bathrooms: 1,
      sourceUrl: "https://avito.example/tim-crm-beta-1-new",
      shortDescription: "Bien propre, lumineux, proche axes principaux, disponible rapidement."
    }
  ];
}
