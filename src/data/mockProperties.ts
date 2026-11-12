import { PropertyListing, PropertyType } from '../types/app';
import { RM_PROPERTIES } from './catalog/rm';
import { VALPARAISO_PROPERTIES } from './catalog/valparaiso';
import { BIOBIO_PROPERTIES } from './catalog/biobio';
import { OTRAS_REGIONES_PROPERTIES } from './catalog/otrasRegiones';
import {
  getZoneProfileKey,
  ZONE_PROFILES,
  ZoneProfileKey,
} from './zoneProfiles';

/**
 * Generador de ilustraciones arquitectónicas SVG vectoriales de alta definición
 * estrictamente diferenciadas por tipo de propiedad (Departamento, Casa, Parcela, Terreno)
 * y enriquecidas según el perfil de zona geográfica (Oriente Premium, Costa Valparaíso,
 * Precordillera, Biobío, Norte, Sur, etc.).
 */
export function createPropertySvgDataUri(
  type: PropertyType,
  variantTitle: string,
  accentHex = '#0066B3',
  secondaryHex = '#E6F2FA',
  zoneProfileKey?: ZoneProfileKey
): string {
  const profile = zoneProfileKey ? ZONE_PROFILES[zoneProfileKey] : undefined;
  const effectiveAccent = profile ? profile.accentHex : accentHex;
  const effectiveSecondary = profile ? profile.secondaryHex : secondaryHex;
  const badgeLabel = profile ? `${type.toUpperCase()} · ${profile.name.split('(')[0].trim().toUpperCase()}` : `${type.toUpperCase()} · ROADHOME`;

  let illustration = '';

  if (type === 'departamento') {
    // Si es costa o sur, variar motivos de fondo
    const isCostal = zoneProfileKey === 'costa-valparaiso';
    illustration = `
      <rect width="800" height="500" fill="url(#bgGrad)" />
      <circle cx="660" cy="95" r="42" fill="#FEF7E6" opacity="0.85" />
      ${isCostal ? '<path d="M0 380 Q200 360 400 375 T800 370 L800 440 L0 440 Z" fill="#BAE6FD" opacity="0.4"/>' : ''}
      <rect x="70" y="170" width="130" height="270" rx="6" fill="#D5E3EE" />
      <rect x="610" y="190" width="120" height="250" rx="6" fill="#D5E3EE" />
      <rect x="230" y="75" width="340" height="365" rx="10" fill="#FFFFFF" stroke="${effectiveAccent}" stroke-width="4" />
      <rect x="230" y="75" width="340" height="28" rx="8" fill="${effectiveAccent}" />
      ${[125, 185, 245, 305]
        .map(
          (y) => `
        <rect x="260" y="${y}" width="80" height="42" rx="4" fill="${effectiveSecondary}" stroke="${effectiveAccent}" stroke-width="2" />
        <rect x="255" y="${y + 30}" width="90" height="14" rx="2" fill="#CFD8DC" />
        <rect x="360" y="${y}" width="80" height="42" rx="4" fill="#E6F2FA" stroke="${effectiveAccent}" stroke-width="2" />
        <rect x="460" y="${y}" width="80" height="42" rx="4" fill="${effectiveSecondary}" stroke="${effectiveAccent}" stroke-width="2" />
        <rect x="455" y="${y + 30}" width="90" height="14" rx="2" fill="#CFD8DC" />
      `
        )
        .join('')}
      <rect x="350" y="375" width="100" height="65" rx="4" fill="${effectiveAccent}" />
      <rect x="365" y="385" width="32" height="55" fill="#E6F2FA" />
      <rect x="403" y="385" width="32" height="55" fill="#E6F2FA" />
      <circle cx="185" cy="400" r="28" fill="#4CAF68" />
      <rect x="181" y="420" width="8" height="22" fill="#546E7A" />
      <circle cx="615" cy="400" r="28" fill="#269947" />
      <rect x="611" y="420" width="8" height="22" fill="#546E7A" />
      <rect x="0" y="440" width="800" height="60" fill="#37474F" />
    `;
  } else if (type === 'casa') {
    illustration = `
      <rect width="800" height="500" fill="url(#bgGrad)" />
      <circle cx="670" cy="95" r="44" fill="#FEF7E6" />
      <path d="M0 370 Q220 290 450 360 T800 340 L800 440 L0 440 Z" fill="#E8F6EC" />
      <rect x="190" y="215" width="420" height="225" rx="8" fill="#FFFFFF" stroke="${effectiveAccent}" stroke-width="4" />
      <polygon points="155,220 400,95 645,220" fill="${effectiveAccent}" />
      <polygon points="430,220 545,140 655,220" fill="#004B87" opacity="0.9" />
      <rect x="510" y="115" width="32" height="65" rx="3" fill="#37474F" />
      <rect x="235" y="260" width="115" height="95" rx="6" fill="${effectiveSecondary}" stroke="${effectiveAccent}" stroke-width="3" />
      <line x1="292" y1="260" x2="292" y2="355" stroke="${effectiveAccent}" stroke-width="2" />
      <line x1="235" y1="307" x2="350" y2="307" stroke="${effectiveAccent}" stroke-width="2" />
      <rect x="385" y="295" width="75" height="145" rx="6" fill="${effectiveAccent}" />
      <circle cx="445" cy="368" r="5" fill="#F7CC63" />
      <rect x="490" y="260" width="85" height="95" rx="6" fill="${effectiveSecondary}" stroke="${effectiveAccent}" stroke-width="3" />
      <circle cx="125" cy="355" r="48" fill="#269947" />
      <circle cx="155" cy="375" r="35" fill="#4CAF68" />
      <polygon points="660,400 685,340 710,400" fill="#2E7D32" />
      <rect x="0" y="440" width="800" height="60" fill="#2E7D32" />
    `;
  } else if (type === 'parcela') {
    illustration = `
      <rect width="800" height="500" fill="url(#bgGrad)" />
      <polygon points="0,320 180,180 340,320" fill="#A5D6A7" opacity="0.6" />
      <polygon points="260,320 450,150 640,320" fill="#81C784" opacity="0.5" />
      <polygon points="520,320 680,210 800,320" fill="#A5D6A7" opacity="0.6" />
      <path d="M0 320 Q240 280 480 320 T800 300 L800 450 L0 450 Z" fill="#C8E6C9" />
      <path d="M0 370 Q280 330 520 380 T800 360 L800 450 L0 450 Z" fill="#81C784" />
      <circle cx="110" cy="330" r="38" fill="#2E7D32" />
      <rect x="105" y="350" width="10" height="30" fill="#4E342E" />
      <circle cx="680" cy="320" r="42" fill="#1B5E20" />
      <rect x="674" y="345" width="12" height="32" fill="#4E342E" />
      <polygon points="430,300 480,250 530,300" fill="${effectiveAccent}" />
      <rect x="445" y="300" width="70" height="50" rx="3" fill="#FFFFFF" stroke="${effectiveAccent}" stroke-width="2" />
      <rect x="472" y="318" width="16" height="32" fill="${effectiveAccent}" />
      ${[60, 160, 260, 360, 580, 680, 760]
        .map(
          (x) => `
        <line x1="${x}" y1="390" x2="${x}" y2="425" stroke="#8D6E63" stroke-width="3" />
      `
        )
        .join('')}
      <line x1="40" y1="400" x2="780" y2="400" stroke="#8D6E63" stroke-width="2" />
      <line x1="40" y1="415" x2="780" y2="415" stroke="#8D6E63" stroke-width="2" />
      <rect x="0" y="440" width="800" height="60" fill="#4E342E" />
    `;
  } else {
    // Terreno
    illustration = `
      <rect width="800" height="500" fill="url(#bgGrad)" />
      <circle cx="680" cy="110" r="50" fill="#FFF9C4" />
      <path d="M0 290 Q200 240 420 280 T800 260 L800 450 L0 450 Z" fill="#FFF3E0" />
      <polygon points="80,410 240,320 720,340 560,430" fill="#FFE0B2" stroke="${effectiveAccent}" stroke-width="3" stroke-dasharray="10,6" />
      <circle cx="80" cy="410" r="6" fill="${effectiveAccent}" />
      <circle cx="240" cy="320" r="6" fill="${effectiveAccent}" />
      <circle cx="720" cy="340" r="6" fill="${effectiveAccent}" />
      <circle cx="560" cy="430" r="6" fill="${effectiveAccent}" />
      <line x1="400" y1="330" x2="400" y2="420" stroke="${effectiveAccent}" stroke-width="2" stroke-dasharray="4,4" />
      <circle cx="400" cy="375" r="32" fill="#FFFFFF" stroke="${effectiveAccent}" stroke-width="3" />
      <text x="400" y="380" font-family="Overpass, sans-serif" font-size="12" font-weight="700" fill="${effectiveAccent}" text-anchor="middle">SITIO</text>
      <circle cx="680" cy="330" r="28" fill="#A5D6A7" />
      <rect x="677" y="348" width="6" height="20" fill="#795548" />
      <rect x="0" y="440" width="800" height="60" fill="#D7CCC8" />
    `;
  }

  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="100%" height="100%">
    <defs>
      <linearGradient id="bgGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${effectiveSecondary}" />
        <stop offset="100%" stop-color="#FFFFFF" />
      </linearGradient>
    </defs>
    ${illustration}
    <rect x="24" y="24" width="260" height="36" rx="18" fill="#FFFFFF" opacity="0.95" />
    <text x="154" y="47" font-family="Overpass, sans-serif" font-size="11" font-weight="700" fill="${effectiveAccent}" text-anchor="middle">${badgeLabel}</text>
    <rect x="24" y="446" width="752" height="38" rx="8" fill="#37474F" opacity="0.88" />
    <text x="40" y="470" font-family="Overpass, sans-serif" font-size="14" font-weight="600" fill="#FFFFFF">${variantTitle}</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Devuelve una imagen arquitectónica SVG vectorial garantizada según la comuna,
 * región y tipo de vivienda, para usar como fallback en cualquier onError.
 */
export function getFallbackImage(
  property:
    | PropertyListing
    | {
        propertyType: PropertyType;
        title: string;
        commune?: string;
        region?: string;
      }
): string {
  const profileKey = getZoneProfileKey(
    property.commune || '',
    property.region || ''
  );
  const profile = ZONE_PROFILES[profileKey];
  return createPropertySvgDataUri(
    property.propertyType,
    property.title,
    profile.accentHex,
    profile.secondaryHex,
    profileKey
  );
}

export function getArchetypeHeroImage(propertyType: PropertyType | null): string {
  switch (propertyType) {
    case 'casa':
      return 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=900&q=80';
    case 'parcela':
      return 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=900&q=80';
    case 'terreno':
      return 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80';
    case 'departamento':
    default:
      return 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=900&q=80';
  }
}

export const MOCK_PROPERTIES: PropertyListing[] = [
  ...RM_PROPERTIES,
  ...VALPARAISO_PROPERTIES,
  ...BIOBIO_PROPERTIES,
  ...OTRAS_REGIONES_PROPERTIES,
];
