import { PropertyListing, PropertyType, DeveloperId } from '../../types/app';
import { getZoneProfileKey, ZONE_PROFILES } from '../zoneProfiles';

/**
 * Fotos reales verificadas de Unsplash para portadas e interiores,
 * organizadas para rotación determinista y sin duplicar portadas en misma comuna/tipo.
 */
export const VERIFIED_IMAGES = {
  deptoModern: [
    'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1460317442991-0ec209397118?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1567496898669-ee935f5f647a?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1515263487990-61b07816b324?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1574362848149-11496d93a7c7?auto=format&fit=crop&w=1000&q=80',
  ],
  casaModern: [
    'https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1598228723793-52759bba239c?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1449844908441-8829872d2607?auto=format&fit=crop&w=1000&q=80',
  ],
  parcelaNature: [
    'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1000&q=80',
  ],
  terrenoOpen: [
    'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1000&q=80',
  ],
  interiors: [
    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1502672023488-70e25813eb80?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1000&q=80',
  ],
};

/**
 * Calcula campos financieros consistentes según reglas de negocio:
 * - downPaymentPercent = 20
 * - downPaymentUF = round(priceUF * 0.2)
 * - estimatedDividendUF = round(priceUF * 0.8 * 0.005067 * 10) / 10
 * - rentEstimateUF = ~0.35% a 0.45% del precio (para deptos/casas), más bajo en parcelas/terrenos.
 */
export function createPropertyListing(
  params: {
    id: string;
    developerId: DeveloperId;
    title: string;
    propertyType: PropertyType;
    region: string;
    commune: string;
    neighborhood: string;
    bedrooms: number;
    bathrooms: number;
    surface: number;
    priceUF: number;
    image: string;
    gallery?: string[];
    features: string[];
    connectivity: string[];
    description: string;
    rentEstimateUF?: number;
    downPaymentUF?: number;
    estimatedDividendUF?: number;
  }
): PropertyListing {
  const downPaymentPercent = 20;
  const downPaymentUF =
    params.downPaymentUF ?? Math.round((params.priceUF * downPaymentPercent) / 100);

  // Fórmula canónica: 80% financiado, 4.5% anual, 30 años -> factor ~0.005067
  const estimatedDividendUF =
    params.estimatedDividendUF ??
    Math.round(params.priceUF * 0.8 * 0.005067 * 10) / 10;

  // Renta estimada mensual (0.35% a 0.45% en viviendas urbanas, 0.15% en parcelas/terrenos)
  let rentRate = 0.0038;
  if (params.propertyType === 'parcela' || params.propertyType === 'terreno') {
    rentRate = 0.0016;
  } else if (params.priceUF < 3000) {
    rentRate = 0.0044; // mayor rentabilidad en departamentos pequeños
  } else if (params.priceUF > 8000) {
    rentRate = 0.0033;
  }

  const rentEstimateUF =
    params.rentEstimateUF ??
    Math.round(params.priceUF * rentRate * 10) / 10;

  // Galería garantizada de al menos 3 fotos distintas
  const gallery = params.gallery && params.gallery.length >= 3
    ? params.gallery
    : [
        params.image,
        VERIFIED_IMAGES.interiors[Math.abs(hashString(params.id)) % VERIFIED_IMAGES.interiors.length],
        VERIFIED_IMAGES.interiors[(Math.abs(hashString(params.id)) + 2) % VERIFIED_IMAGES.interiors.length],
      ];

  // Asegurar que la galería no tenga URLs idénticas consecutivas
  const uniqueGallery = Array.from(new Set(gallery));
  while (uniqueGallery.length < 3) {
    const extra = VERIFIED_IMAGES.interiors[(uniqueGallery.length + 3) % VERIFIED_IMAGES.interiors.length];
    if (!uniqueGallery.includes(extra)) {
      uniqueGallery.push(extra);
    }
  }

  return {
    id: params.id,
    developerId: params.developerId,
    title: params.title,
    propertyType: params.propertyType,
    region: params.region,
    commune: params.commune,
    neighborhood: params.neighborhood,
    bedrooms: params.bedrooms,
    bathrooms: params.bathrooms,
    surface: params.surface,
    priceUF: params.priceUF,
    downPaymentPercent,
    downPaymentUF,
    estimatedDividendUF,
    rentEstimateUF,
    image: params.image,
    gallery: uniqueGallery,
    features: params.features,
    connectivity: params.connectivity,
    description: params.description,
  };
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

