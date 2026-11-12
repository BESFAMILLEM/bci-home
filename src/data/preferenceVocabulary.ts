/**
 * Vocabulario canónico compartido entre el generador de preferencias (ArchetypeTagBuilder, ArchetypeWizard)
 * y el catálogo de propiedades (mockProperties y catálogos por zona).
 *
 * Garantiza que las etiquetas del constructor coincidan exactamente con las características de las propiedades.
 */

export const COMMUNES_RM = [
  'Ñuñoa',
  'Providencia',
  'La Florida',
  'Santiago Centro',
  'Las Condes',
  'Macul',
  'Puente Alto',
  'Vitacura',
] as const;

export type CommuneRM = (typeof COMMUNES_RM)[number];

export const REGIONS = [
  'Región Metropolitana',
  'Valparaíso',
  'Biobío',
  'Otra región',
] as const;

export type RegionOption = (typeof REGIONS)[number];

export const ALL_LOCATION_TAGS = [
  ...COMMUNES_RM,
  'Región Metropolitana',
  'Valparaíso',
  'Biobío',
  'Otra región',
  'Otras comunas',
] as const;

export const BEDROOM_TAGS = [
  '1 dormitorio',
  '2 dormitorios',
  '3 dormitorios',
  '4 o más dormitorios',
] as const;

export const BATHROOM_TAGS = [
  '1 baño',
  '2 baños',
  '3 o más baños',
] as const;

export const INTERIOR_TAGS = [
  'Living amplio',
  'Cocina integrada',
  'Cocina independiente',
  'Espacio de escritorio',
] as const;

export const CONNECTIVITY_TAGS = [
  'Cerca del metro',
  'Cerca de transporte público',
  'Cerca de parques',
  'Cerca de supermercados',
  'Cerca de colegios',
  'Cerca de universidades',
  'Cerca de centros de salud',
  'Cerca de áreas comerciales',
] as const;

export const EXTERIOR_TAGS = [
  'Terraza',
  'Patio',
  'Jardín',
  'Estacionamiento',
  'Bodega',
  'Piscina',
  'Quincho',
  'Áreas verdes',
] as const;

export const ALL_ALLOWED_FEATURES: readonly string[] = [
  ...BEDROOM_TAGS,
  ...BATHROOM_TAGS,
  ...INTERIOR_TAGS,
  ...EXTERIOR_TAGS,
];

export const ALL_ALLOWED_CONNECTIVITY: readonly string[] = [
  ...CONNECTIVITY_TAGS,
];

