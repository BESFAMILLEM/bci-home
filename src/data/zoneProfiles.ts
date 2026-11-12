import { PropertyListing, PropertyType } from '../types/app';

export type ZoneProfileKey =
  | 'oriente-premium'
  | 'centro-urbano'
  | 'sur-oriente-familiar'
  | 'costa-valparaiso'
  | 'biobio'
  | 'campo-precordillera'
  | 'norte'
  | 'sur';

export interface ZoneProfile {
  key: ZoneProfileKey;
  name: string;
  accentHex: string;
  secondaryHex: string;
  bgGradient: [string, string];
  motifs: string[];
  communes: string[];
}

export const ZONE_PROFILES: Record<ZoneProfileKey, ZoneProfile> = {
  'oriente-premium': {
    key: 'oriente-premium',
    name: 'Sector Oriente Premium (Las Condes, Vitacura, Providencia)',
    accentHex: '#004B87',
    secondaryHex: '#E6F2FA',
    bgGradient: ['#E9F2F9', '#FFFFFF'],
    motifs: ['Torres modernas de vidrio', 'Barrios ejecutivos', 'Parques de altura'],
    communes: ['Las Condes', 'Vitacura', 'Providencia'],
  },
  'centro-urbano': {
    key: 'centro-urbano',
    name: 'Centro Urbano y Barrios Consolidados (Santiago Centro, Ñuñoa, Macul)',
    accentHex: '#0066B3',
    secondaryHex: '#F0F4F8',
    bgGradient: ['#F2F6FA', '#FFFFFF'],
    motifs: ['Edificios de mediana altura', 'Calles arboladas', 'Vida de barrio'],
    communes: ['Santiago Centro', 'Ñuñoa', 'Macul'],
  },
  'sur-oriente-familiar': {
    key: 'sur-oriente-familiar',
    name: 'Sur-Oriente Residencial y Familiar (La Florida, Puente Alto)',
    accentHex: '#1B7F37',
    secondaryHex: '#EBF6EE',
    bgGradient: ['#EBF5ED', '#FFFFFF'],
    motifs: ['Condominios cerrados', 'Antejardines', 'Vista a la Cordillera'],
    communes: ['La Florida', 'Puente Alto'],
  },
  'costa-valparaiso': {
    key: 'costa-valparaiso',
    name: 'Costa y Valles de Valparaíso',
    accentHex: '#0284C7',
    secondaryHex: '#E0F2FE',
    bgGradient: ['#E0F2FE', '#FFFFFF'],
    motifs: ['Cerros con casas de colores', 'Vistas al mar', 'Borde costero'],
    communes: [
      'Valparaíso',
      'Viña del Mar',
      'Concón',
      'Quilpué',
      'Villa Alemana',
      'Limache',
      'Olmué',
      'San Antonio',
    ],
  },
  biobio: {
    key: 'biobio',
    name: 'Región del Biobío y Gran Concepción',
    accentHex: '#0F766E',
    secondaryHex: '#CCFBF1',
    bgGradient: ['#CCFBF1', '#FFFFFF'],
    motifs: ['Río Biobío', 'Bosques nativos', 'Ciudad universitaria y verde'],
    communes: [
      'Concepción',
      'San Pedro de la Paz',
      'Hualpén',
      'Chiguayante',
      'Talcahuano',
      'Coronel',
      'Los Ángeles',
    ],
  },
  'campo-precordillera': {
    key: 'campo-precordillera',
    name: 'Campo, Valles y Precordillera RM',
    accentHex: '#15803D',
    secondaryHex: '#DCFCE7',
    bgGradient: ['#E6F8ED', '#FFFFFF'],
    motifs: ['Parcelas con árboles', 'Viñedos', 'Cercos rústicos y cerros'],
    communes: [
      'Pirque',
      'Calera de Tango',
      'Padre Hurtado',
      'Melipilla',
      'Colina',
      'Lampa',
      'Buin',
      'Paine',
      'Talagante',
      'Peñaflor',
      'Curacaví',
      'San José de Maipo',
      'Otras comunas',
    ],
  },
  norte: {
    key: 'norte',
    name: 'Norte Costero y Minero (Coquimbo, La Serena, Antofagasta)',
    accentHex: '#D97706',
    secondaryHex: '#FEF3C7',
    bgGradient: ['#FEF3C7', '#FFFFFF'],
    motifs: ['Costanera soleada', 'Cerros desérticos y mar', 'Arquitectura colonial y moderna'],
    communes: ['La Serena', 'Coquimbo', 'Antofagasta'],
  },
  sur: {
    key: 'sur',
    name: 'Sur de Lagos y Volcanes (Rancagua, Temuco, Puerto Montt)',
    accentHex: '#0D9488',
    secondaryHex: '#F0FDFA',
    bgGradient: ['#E6FFFA', '#FFFFFF'],
    motifs: ['Lagos y volcanes', 'Casas de madera y teja', 'Verdor lluvioso'],
    communes: ['Rancagua', 'Temuco', 'Puerto Montt', 'Otra región'],
  },
};

/**
 * Determina el perfil de zona a partir de la comuna y región de una propiedad.
 */
export function getZoneProfileKey(commune: string, region: string): ZoneProfileKey {
  const c = (commune || '').trim().toLowerCase();
  const r = (region || '').trim().toLowerCase();

  // Oriente premium
  if (['vitacura', 'las condes', 'providencia'].includes(c)) {
    return 'oriente-premium';
  }

  // Centro urbano
  if (['santiago centro', 'ñuñoa', 'macul'].includes(c)) {
    return 'centro-urbano';
  }

  // Sur-oriente familiar
  if (['la florida', 'puente alto'].includes(c)) {
    return 'sur-oriente-familiar';
  }

  // Costa Valparaíso
  if (
    r.includes('valparaíso') ||
    r.includes('valparaiso') ||
    ['valparaíso', 'valparaiso', 'viña del mar', 'concón', 'quilpué', 'villa alemana', 'limache', 'olmué'].includes(c)
  ) {
    return 'costa-valparaiso';
  }

  // Biobío
  if (
    r.includes('biobío') ||
    r.includes('biobio') ||
    ['concepción', 'concepcion', 'san pedro de la paz', 'hualpén', 'hualpen', 'chiguayante', 'talcahuano'].includes(c)
  ) {
    return 'biobio';
  }

  // Norte
  if (
    r.includes('antofagasta') ||
    r.includes('coquimbo') ||
    ['la serena', 'coquimbo', 'antofagasta'].includes(c)
  ) {
    return 'norte';
  }

  // Sur (Araucanía, Los Lagos, O'Higgins)
  if (
    r.includes('araucanía') ||
    r.includes('araucania') ||
    r.includes('lagos') ||
    r.includes('o\'higgins') ||
    r.includes('ohiggins') ||
    ['temuco', 'puerto montt', 'rancagua'].includes(c)
  ) {
    return 'sur';
  }

  // Rural RM / Precordillera / Parcelas
  if (
    r.includes('metropolitana') ||
    ['pirque', 'calera de tango', 'padre hurtado', 'melipilla', 'colina', 'lampa', 'buin', 'paine', 'talagante', 'peñaflor', 'curacaví', 'san josé de maipo'].includes(c)
  ) {
    return 'campo-precordillera';
  }

  return 'centro-urbano';
}

