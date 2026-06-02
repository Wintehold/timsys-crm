import { GeneratedAd, HunterProperty } from "./types.js";

export function generatePropertyAds(property: HunterProperty): GeneratedAd[] {
  const location = `${property.district}, ${property.city}`;
  const specs = `${property.surface} m2, ${property.bedrooms} chambres, ${property.bathrooms} salles de bain`;

  return [
    {
      channel: "Avito",
      title: `${property.propertyType} ${property.transaction.toLowerCase()} a ${property.district}`,
      text: `Decouvrez ce ${property.propertyType.toLowerCase()} de ${specs} situe a ${location}. ${property.shortDescription} Contactez votre conseiller TIM CRM pour organiser une visite rapidement.`
    },
    {
      channel: "Mubawab",
      title: `${property.propertyType} premium a ${location}`,
      text: `TIM CRM vous presente un bien soigneusement selectionne a ${location}. Surface: ${property.surface} m2. Chambres: ${property.bedrooms}. Salles de bain: ${property.bathrooms}. Points forts: ${property.shortDescription} Une opportunite ideale pour un client exigeant.`
    },
    {
      channel: "Marketplace",
      title: `${property.propertyType} disponible a ${property.district}`,
      text: `Bien disponible a ${property.district}: ${specs}. ${property.shortDescription} Message prive ou appel pour plus d'informations et visite.`
    },
    {
      channel: "Instagram",
      title: `Nouvelle opportunite a ${property.district}`,
      text: `${property.propertyType} a ${property.district}, ${property.city}. ${specs}. ${property.shortDescription} Contactez TIM CRM pour une visite. #immobilier #casablanca #timcrm`
    }
  ];
}
