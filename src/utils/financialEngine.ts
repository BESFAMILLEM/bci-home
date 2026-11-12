import {
  DepositRecord,
  FinancialEvent,
  FinancialMetrics,
  HousingArchetype,
  PreferencePriority,
  PreferenceTag,
  PropertyListing,
  PropertyType,
  ScoredProperty,
} from '../types/app';
import { MOCK_PROPERTIES } from '../data/mockProperties';

export const DEFAULT_UF_CLP = 40000;
export const DEFAULT_DOWN_PAYMENT_PERCENT = 20;
export const DEFAULT_UNLOCK_THRESHOLD_PERCENT = 85;

/**
 * Formatea montos en Pesos Chilenos (CLP) con separador de miles '.' y sin decimales.
 * Ejemplo: 18000000 -> "$18.000.000"
 */
export function formatCLP(amount: number): string {
  const safe = Number.isFinite(amount) ? Math.round(amount) : 0;
  const absFormatted = Math.abs(safe)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return safe < 0 ? `-$${absFormatted}` : `$${absFormatted}`;
}

/**
 * Formatea montos en Unidades de Fomento (UF) diferenciados claramente.
 * Ejemplo: 4500 -> "4.500 UF"
 */
export function formatUF(ufAmount: number, decimals = 0): string {
  if (!Number.isFinite(ufAmount)) return '0 UF';
  const rounded =
    decimals > 0 ? Number(ufAmount.toFixed(decimals)) : Math.round(ufAmount);
  const [intPart, decPart] = rounded.toString().split('.');
  const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return decPart ? `${formattedInt},${decPart} UF` : `${formattedInt} UF`;
}

/**
 * Sincroniza los campos estructurados del arquetipo (`propertyType`, `communes`, `bedrooms`, `bathrooms`)
 * a partir de su lista de etiquetas (`tags`) para garantizar coherencia total entre Etiquetas y Chatbot.
 */
export function syncArchetypeFromTags(
  current: HousingArchetype,
  tags: PreferenceTag[]
): HousingArchetype {
  let propertyType: PropertyType | null = null;
  const communes: string[] = [];
  let region = current.region || 'Región Metropolitana';
  let bedrooms: number | null = null;
  let bathrooms: number | null = null;

  const knownRegions = ['Región Metropolitana', 'Valparaíso', 'Biobío', 'Otra región'];

  for (const tag of tags) {
    const lower = tag.label.toLowerCase();
    if (tag.category === 'tipo') {
      if (lower.includes('departamento')) propertyType = 'departamento';
      else if (lower.includes('casa')) propertyType = 'casa';
      else if (lower.includes('parcela')) propertyType = 'parcela';
      else if (lower.includes('terreno')) propertyType = 'terreno';
    } else if (tag.category === 'ubicacion') {
      const matchedRegion = knownRegions.find(
        (r) => r.toLowerCase() === lower
      );
      if (matchedRegion) {
        region = matchedRegion;
      } else if (!communes.includes(tag.label)) {
        communes.push(tag.label);
      }
    } else if (tag.category === 'interior') {
      if (lower.includes('1 dormitorio')) bedrooms = 1;
      else if (lower.includes('2 dormitorios')) bedrooms = 2;
      else if (lower.includes('3 dormitorios')) bedrooms = 3;
      else if (lower.includes('4 o más dormitorios')) bedrooms = 4;

      if (lower.includes('1 baño')) bathrooms = 1;
      else if (lower.includes('2 baños')) bathrooms = 2;
      else if (lower.includes('3 o más baños')) bathrooms = 3;
    }
  }

  return {
    ...current,
    propertyType,
    region,
    communes,
    bedrooms,
    bathrooms,
    tags,
  };
}

/**
 * Calcula el precio estimado en UF según el arquetipo actual.
 * Respeta exactamente 4.500 UF para el arquetipo demostrativo base (Departamento 2D/2B en Ñuñoa)
 * y recalcula dinámicamente ante cualquier cambio de comuna, tipo de propiedad o características.
 */
export function calculateArchetypeEstimatedUF(archetype: HousingArchetype): number {
  if (
    archetype.customEstimatedPriceUF &&
    archetype.customEstimatedPriceUF > 0
  ) {
    return archetype.customEstimatedPriceUF;
  }

  const propType = archetype.propertyType || 'departamento';
  const primaryCommune = archetype.communes[0] || 'Ñuñoa';
  const beds = archetype.bedrooms ?? (propType === 'terreno' ? 0 : 2);
  const baths = archetype.bathrooms ?? (propType === 'terreno' ? 0 : 2);

  // Caso canónico inicial (Escenario base 4.500 UF)
  const isCanonicalNunoaDepto =
    propType === 'departamento' &&
    primaryCommune.toLowerCase() === 'ñuñoa' &&
    beds === 2 &&
    baths === 2 &&
    archetype.communes.length <= 1;

  if (isCanonicalNunoaDepto) {
    return 4500;
  }

  // Precios base en UF según comuna / región
  const communeBaseUF: Record<string, number> = {
    vitacura: 7200,
    'las condes': 6200,
    providencia: 5200,
    ñuñoa: 4300,
    'la florida': 3900,
    macul: 3500,
    'santiago centro': 3100,
    'puente alto': 3450,
    valparaíso: 3300,
    biobío: 3600,
    'otras comunas': 3800,
  };

  const communeKey = primaryCommune.toLowerCase();
  let baseUF = communeBaseUF[communeKey] ?? 4000;

  if (archetype.region === 'Valparaíso' && !communeBaseUF[communeKey]) {
    baseUF = 3350;
  } else if (archetype.region === 'Biobío' && !communeBaseUF[communeKey]) {
    baseUF = 3650;
  }

  // Factor por tipo de propiedad
  const typeMultiplier: Record<PropertyType, number> = {
    departamento: 1.0,
    casa: 1.12,
    parcela: 1.18,
    terreno: 0.62,
  };

  let estimated = baseUF * typeMultiplier[propType];

  if (propType !== 'terreno') {
    // Ajuste por dormitorios (referencia 2D)
    estimated += (beds - 2) * 420;
    // Ajuste por baños (referencia 2B)
    estimated += (baths - 2) * 180;
  }

  // Ajuste moderado por características exteriores indispensables
  const exteriorCount = archetype.tags.filter(
    (t) => t.category === 'exterior' && t.priority === 'indispensable'
  ).length;
  estimated += exteriorCount * 90;

  // Redondear a múltiplos de 50 UF con límites razonables
  const rounded = Math.round(estimated / 50) * 50;
  return Math.max(1800, Math.min(12000, rounded));
}

/**
 * Genera una descripción en lenguaje natural del arquetipo actual.
 */
export function buildArchetypeSummaryText(archetype: HousingArchetype): string {
  if (archetype.targetPropertyTitle) {
    return `Tu meta actual es "${archetype.targetPropertyTitle}" (${
      archetype.communes[0] || archetype.region
    }).`;
  }

  const typeLabel =
    archetype.propertyType === 'casa'
      ? 'una casa'
      : archetype.propertyType === 'parcela'
      ? 'una parcela'
      : archetype.propertyType === 'terreno'
      ? 'un terreno urbanizado'
      : 'un departamento';

  const roomsParts: string[] = [];
  if (archetype.propertyType !== 'terreno') {
    if (archetype.bedrooms) {
      roomsParts.push(
        `${archetype.bedrooms} ${
          archetype.bedrooms === 1 ? 'dormitorio' : 'dormitorios'
        }`
      );
    }
    if (archetype.bathrooms) {
      roomsParts.push(
        `${archetype.bathrooms} ${archetype.bathrooms === 1 ? 'baño' : 'baños'}`
      );
    }
  }

  const roomsText =
    roomsParts.length > 0 ? ` de ${roomsParts.join(' y ')}` : '';

  const locationText =
    archetype.communes.length > 0
      ? ` en ${archetype.communes.join(' o ')}`
      : archetype.region
      ? ` en ${archetype.region}`
      : '';

  const extraTags = archetype.tags
    .filter(
      (t) =>
        t.category === 'conectividad' ||
        (t.category === 'exterior' && t.priority !== 'opcional')
    )
    .slice(0, 2)
    .map((t) => t.label.toLowerCase());

  const extraText = extraTags.length > 0 ? `, ${extraTags.join(' y ')}` : '';

  return `Tu objetivo podría ser ${typeLabel}${roomsText}${locationText}${extraText}.`;
}

export const NAMED_RM_COMMUNES: readonly string[] = [
  'ñuñoa',
  'providencia',
  'la florida',
  'santiago centro',
  'las condes',
  'macul',
  'puente alto',
  'vitacura',
];

export const MAIN_REGIONS: readonly string[] = [
  'región metropolitana',
  'valparaíso',
  'biobío',
];

export interface RelaxationSuggestion {
  tag: PreferenceTag;
  resultCount: number;
}

export interface AlmostMatchingProperty {
  property: PropertyListing;
  missingTag: PreferenceTag;
}
export function calculateEstimatedDateLabel(monthsRemaining: number | null): string | null {
  if (monthsRemaining === null || !Number.isFinite(monthsRemaining)) {
    return null;
  }
  if (monthsRemaining <= 0) {
    return 'Meta alcanzada hoy';
  }
  const baseDate = new Date(2026, 10, 1); // Noviembre 2026 como referencia consistente
  baseDate.setMonth(baseDate.getMonth() + monthsRemaining);
  const monthNames = [
    'enero',
    'febrero',
    'marzo',
    'abril',
    'mayo',
    'junio',
    'julio',
    'agosto',
    'septiembre',
    'octubre',
    'noviembre',
    'diciembre',
  ];
  return `${monthNames[baseDate.getMonth()]} de ${baseDate.getFullYear()}`;
}

/**
 * Filtra y puntúa el catálogo de propiedades según el arquetipo y el ahorro acumulado.
 */
export function filterAndScoreProperties(
  archetype: HousingArchetype,
  currentSavingsCLP: number,
  ufValueCLP = DEFAULT_UF_CLP,
  properties: PropertyListing[] = MOCK_PROPERTIES
): ScoredProperty[] {
  const requiredType = archetype.propertyType;

  // Etiquetas clasificadas por prioridad
  const indispensableTags = archetype.tags.filter(
    (t) => t.priority === 'indispensable'
  );
  const preferibleTags = archetype.tags.filter(
    (t) => t.priority === 'preferible'
  );
  const opcionalTags = archetype.tags.filter((t) => t.priority === 'opcional');

  // Comunas marcadas como indispensables vs preferibles/opcionales
  const indispensableCommunes = indispensableTags
    .filter(
      (t) =>
        t.category === 'ubicacion' &&
        ![
          'región metropolitana',
          'valparaíso',
          'biobío',
          'otra región',
        ].includes(t.label.toLowerCase())
    )
    .map((t) => t.label.toLowerCase());

  const results: ScoredProperty[] = [];

  for (const prop of properties) {
    // 1. REGLA ESTRICTA DE TIPO DE PROPIEDAD (Sección 6 y 15.2)
    if (requiredType && prop.propertyType !== requiredType) {
      continue;
    }

    // 2. Filtros estrictos para preferencias INDISPENSABLES
    let failsIndispensable = false;
    const matchedReasons: string[] = [];
    const missingPreferable: string[] = [];

    const propCommuneLower = prop.commune.toLowerCase();
    const propRegionLower = prop.region.toLowerCase();

    if (indispensableCommunes.length > 0) {
      const hasWildcardOther = indispensableCommunes.includes('otras comunas');
      const matchesDirect = indispensableCommunes.includes(propCommuneLower);
      const matchesWildcard =
        hasWildcardOther && !NAMED_RM_COMMUNES.includes(propCommuneLower);

      if (!matchesDirect && !matchesWildcard) {
        failsIndispensable = true;
      }
    }

    for (const tag of indispensableTags) {
      const labelLower = tag.label.toLowerCase();

      if (tag.category === 'tipo' || tag.category === 'ubicacion') {
        if (
          ['región metropolitana', 'valparaíso', 'biobío'].includes(
            labelLower
          ) &&
          propRegionLower !== labelLower
        ) {
          failsIndispensable = true;
        } else if (labelLower === 'otra región') {
          if (MAIN_REGIONS.includes(propRegionLower)) {
            failsIndispensable = true;
          }
        }
        continue;
      }

      if (labelLower === '1 dormitorio' && prop.bedrooms < 1) {
        failsIndispensable = true;
      } else if (labelLower === '2 dormitorios' && prop.bedrooms !== 2) {
        failsIndispensable = true;
      } else if (labelLower === '3 dormitorios' && prop.bedrooms !== 3) {
        failsIndispensable = true;
      } else if (labelLower === '4 o más dormitorios' && prop.bedrooms < 4) {
        failsIndispensable = true;
      } else if (labelLower === '1 baño' && prop.bathrooms < 1) {
        failsIndispensable = true;
      } else if (labelLower === '2 baños' && prop.bathrooms !== 2) {
        failsIndispensable = true;
      } else if (labelLower === '3 o más baños' && prop.bathrooms < 3) {
        failsIndispensable = true;
      } else {
        // Conectividad, interior o exterior indispensable
        const allAttrs = [...prop.features, ...prop.connectivity].map((a) =>
          a.toLowerCase()
        );
        const matchesAttr =
          allAttrs.some((a) => a.includes(labelLower) || labelLower.includes(a)) ||
          prop.description.toLowerCase().includes(labelLower);

        if (!matchesAttr) {
          failsIndispensable = true;
        } else {
          matchedReasons.push(tag.label);
        }
      }
    }

    if (failsIndispensable) {
      continue;
    }

    // 3. Puntuación de compatibilidad con preferencias PREFERIBLES y OPCIONALES
    let score = 72;

    const hasWildcardOther = archetype.communes.some(
      (c) => c.toLowerCase() === 'otras comunas'
    );
    const matchesArchetypeCommune =
      archetype.communes.some((c) => c.toLowerCase() === propCommuneLower) ||
      (hasWildcardOther && !NAMED_RM_COMMUNES.includes(propCommuneLower));

    if (matchesArchetypeCommune) {
      score += 14;
      matchedReasons.push(`En ${prop.commune}`);
    }

    if (archetype.bedrooms && prop.bedrooms === archetype.bedrooms) {
      score += 6;
      matchedReasons.push(`${prop.bedrooms} dormitorios`);
    }

    if (archetype.bathrooms && prop.bathrooms === archetype.bathrooms) {
      score += 5;
      matchedReasons.push(`${prop.bathrooms} baños`);
    }

    const allPropTags = [...prop.features, ...prop.connectivity].map((a) =>
      a.toLowerCase()
    );

    for (const tag of preferibleTags) {
      const l = tag.label.toLowerCase();
      if (tag.category === 'ubicacion') continue;
      const found =
        allPropTags.some((a) => a.includes(l) || l.includes(a)) ||
        (l === '2 dormitorios' && prop.bedrooms === 2) ||
        (l === '3 dormitorios' && prop.bedrooms === 3) ||
        (l === '2 baños' && prop.bathrooms === 2);

      if (found) {
        score += 6;
        if (!matchedReasons.includes(tag.label)) {
          matchedReasons.push(tag.label);
        }
      } else {
        missingPreferable.push(tag.label);
      }
    }

    for (const tag of opcionalTags) {
      const l = tag.label.toLowerCase();
      const found = allPropTags.some((a) => a.includes(l) || l.includes(a));
      if (found) {
        score += 3;
        if (!matchedReasons.includes(tag.label)) {
          matchedReasons.push(tag.label);
        }
      }
    }

    const normalizedScore = Math.min(99, Math.max(65, score));
    const priceCLP = prop.priceUF * ufValueCLP;
    const downPaymentCLP = prop.downPaymentUF * ufValueCLP;
    const estimatedDividendCLP = Math.round(prop.estimatedDividendUF * ufValueCLP);
    const rentEstimateCLP = Math.round(prop.rentEstimateUF * ufValueCLP);
    const coveragePercent =
      downPaymentCLP > 0
        ? Math.min(100, Math.round((currentSavingsCLP / downPaymentCLP) * 100))
        : 100;
    const remainingForPieCLP = Math.max(0, downPaymentCLP - currentSavingsCLP);

    let financialStatus: ScoredProperty['financialStatus'] = 'needs_more';
    if (currentSavingsCLP >= downPaymentCLP) {
      financialStatus = 'available';
    } else if (currentSavingsCLP >= downPaymentCLP * 0.8) {
      financialStatus = 'close';
    }

    results.push({
      property: prop,
      matchScore: normalizedScore,
      matchedReasons: Array.from(new Set(matchedReasons)).slice(0, 4),
      missingPreferable,
      downPaymentCLP,
      priceCLP,
      estimatedDividendCLP,
      rentEstimateCLP,
      coveragePercent,
      remainingForPieCLP,
      financialStatus,
    });
  }

  // Ordenar por estado financiero favorable y mayor puntaje de compatibilidad
  const statusWeight: Record<ScoredProperty['financialStatus'], number> = {
    available: 3,
    close: 2,
    needs_more: 1,
  };

  return results.sort((a, b) => {
    if (b.matchScore !== a.matchScore) {
      return b.matchScore - a.matchScore;
    }
    return statusWeight[b.financialStatus] - statusWeight[a.financialStatus];
  });
}

/**
 * Ejecuta el motor financiero central (Sección 13) integrando ahorros, depósitos e imprevistos.
 */
export function computeFinancialMetrics(params: {
  baseMonthlyIncome: number;
  baseMonthlyExpenses: number;
  baseMonthlySavingCapacity: number;
  initialSavings: number;
  deposits: DepositRecord[];
  events: FinancialEvent[];
  archetype: HousingArchetype;
  ufValueCLP?: number;
  downPaymentPercentage?: number;
  unlockThresholdPercent?: number;
}): FinancialMetrics {
  const ufValueCLP = params.ufValueCLP ?? DEFAULT_UF_CLP;
  const downPaymentPercentage =
    params.downPaymentPercentage ?? DEFAULT_DOWN_PAYMENT_PERCENT;
  const unlockThresholdPercent =
    params.unlockThresholdPercent ?? DEFAULT_UNLOCK_THRESHOLD_PERCENT;

  const totalDepositsCLP = params.deposits.reduce(
    (sum, d) => sum + Math.max(0, d.amountCLP),
    0
  );

  // Separar eventos según frecuencia y si son inmediatos o futuros
  let immediateOneTimeDelta = 0;
  let futureOneTimeNetAdjustmentCLP = 0;
  let recurringIncomeDelta = 0;
  let recurringExpenseDelta = 0;

  for (const ev of params.events) {
    const amount = Math.max(0, ev.amountCLP);
    if (ev.frequency === 'once') {
      if (ev.effectiveMonthOffset === 0) {
        immediateOneTimeDelta += ev.type === 'income' ? amount : -amount;
      } else {
        // Eventos futuros programados impactan la proyección sin descontar el saldo de hoy
        futureOneTimeNetAdjustmentCLP +=
          ev.type === 'income' ? -amount : amount;
      }
    } else {
      // Eventos recurrentes modifican la capacidad de ahorro mensual
      if (ev.type === 'income') {
        recurringIncomeDelta += amount;
      } else {
        recurringExpenseDelta += amount;
      }
    }
  }

  const monthlyIncome = Math.max(
    0,
    params.baseMonthlyIncome + recurringIncomeDelta
  );
  const monthlyExpenses = Math.max(
    0,
    params.baseMonthlyExpenses + recurringExpenseDelta
  );

  const monthlySavingCapacity = Math.max(
    0,
    params.baseMonthlySavingCapacity +
      recurringIncomeDelta -
      recurringExpenseDelta
  );

  const currentSavings = Math.max(
    0,
    params.initialSavings + totalDepositsCLP + immediateOneTimeDelta
  );

  const propertyEstimatedPriceUF = calculateArchetypeEstimatedUF(
    params.archetype
  );
  const propertyEstimatedPriceCLP = propertyEstimatedPriceUF * ufValueCLP;
  const downPaymentTargetUF = Math.round(
    (propertyEstimatedPriceUF * downPaymentPercentage) / 100
  );
  const downPaymentTargetCLP = downPaymentTargetUF * ufValueCLP;

  const rawProgress =
    downPaymentTargetCLP > 0
      ? (currentSavings / downPaymentTargetCLP) * 100
      : 100;
  const savingsProgress = Math.min(100, Math.round(rawProgress * 10) / 10);

  const remainingAmount = Math.max(0, downPaymentTargetCLP - currentSavings);

  // Para la proyección de meses restantes consideramos también eventos futuros programados
  const projectedRemainingWithFutureEvents = Math.max(
    0,
    remainingAmount + futureOneTimeNetAdjustmentCLP
  );

  let estimatedMonthsRemaining: number | null = null;
  if (projectedRemainingWithFutureEvents <= 0) {
    estimatedMonthsRemaining = 0;
  } else if (monthlySavingCapacity > 0) {
    estimatedMonthsRemaining = Math.ceil(
      projectedRemainingWithFutureEvents / monthlySavingCapacity
    );
  } else {
    estimatedMonthsRemaining = null;
  }

  const estimatedCompletionDate = calculateEstimatedDateLabel(
    estimatedMonthsRemaining
  );

  const isGoalReached = currentSavings >= downPaymentTargetCLP;

  // Evaluar condiciones de desbloqueo de HomeMarket (Sección 14.1)
  const compatibleProps = filterAndScoreProperties(
    params.archetype,
    currentSavings,
    ufValueCLP
  );

  const anyCompatibleCovered =
    params.archetype.isSaved &&
    compatibleProps.some((item) => currentSavings >= item.downPaymentCLP);

  let isHomeMarketUnlocked = false;
  let unlockReason: FinancialMetrics['unlockReason'] = 'locked';

  if (savingsProgress >= unlockThresholdPercent) {
    isHomeMarketUnlocked = true;
    unlockReason = 'progress_85';
  } else if (anyCompatibleCovered) {
    isHomeMarketUnlocked = true;
    unlockReason = 'compatible_property_covered';
  }

  return {
    ufValueCLP,
    monthlyIncome,
    monthlyExpenses,
    baseMonthlySavingCapacity: params.baseMonthlySavingCapacity,
    monthlySavingCapacity,
    currentSavings,
    propertyEstimatedPriceUF,
    propertyEstimatedPriceCLP,
    downPaymentPercentage,
    downPaymentTargetUF,
    downPaymentTargetCLP,
    savingsProgress,
    remainingAmount,
    estimatedMonthsRemaining,
    estimatedCompletionDate,
    futureOneTimeNetAdjustmentCLP,
    isGoalReached,
    isHomeMarketUnlocked,
    unlockReason,
  };
}

/**
 * Calcula qué etiquetas indispensables, al ser relajadas a "Me gustaría" (preferible),
 * liberan la mayor cantidad de propiedades compatibles.
 * Devuelve hasta `maxSuggestions` sugerencias ordenadas de mayor a menor impacto.
 */
export function findSmartRelaxationSuggestions(
  archetype: HousingArchetype,
  currentSavingsCLP: number,
  ufValueCLP = DEFAULT_UF_CLP,
  properties: PropertyListing[] = MOCK_PROPERTIES,
  maxSuggestions = 3
): RelaxationSuggestion[] {
  const indispensableTags = archetype.tags.filter(
    (t) => t.priority === 'indispensable'
  );
  if (indispensableTags.length === 0) return [];

  const suggestions: RelaxationSuggestion[] = [];

  for (const tag of indispensableTags) {
    // Si la etiqueta es el tipo de propiedad principal, no tiene sentido relajarla
    if (tag.category === 'tipo') continue;

    const relaxedTags = archetype.tags.map((t) =>
      t.id === tag.id ? { ...t, priority: 'preferible' as const } : t
    );
    const testArchetype = syncArchetypeFromTags(archetype, relaxedTags);
    const results = filterAndScoreProperties(
      testArchetype,
      currentSavingsCLP,
      ufValueCLP,
      properties
    );
    if (results.length > 0) {
      suggestions.push({
        tag,
        resultCount: results.length,
      });
    }
  }

  return suggestions
    .sort((a, b) => b.resultCount - a.resultCount)
    .slice(0, maxSuggestions);
}

/**
 * Encuentra propiedades que cumplen casi todo tu arquetipo pero fallan
 * en exactamente UNA sola condición indispensable.
 */
export function findAlmostMatchingProperties(
  archetype: HousingArchetype,
  currentSavingsCLP: number,
  ufValueCLP = DEFAULT_UF_CLP,
  properties: PropertyListing[] = MOCK_PROPERTIES,
  limit = 3
): AlmostMatchingProperty[] {
  const indispensableTags = archetype.tags.filter(
    (t) => t.priority === 'indispensable'
  );
  if (indispensableTags.length === 0) return [];

  const almost: AlmostMatchingProperty[] = [];
  const requiredType = archetype.propertyType;

  for (const prop of properties) {
    if (requiredType && prop.propertyType !== requiredType) continue;

    const failedTags: PreferenceTag[] = [];
    const propCommuneLower = prop.commune.toLowerCase();
    const propRegionLower = prop.region.toLowerCase();

    // Comunas indispensables
    const indispensableCommunes = indispensableTags.filter(
      (t) =>
        t.category === 'ubicacion' &&
        !MAIN_REGIONS.includes(t.label.toLowerCase()) &&
        t.label.toLowerCase() !== 'otra región'
    );

    if (indispensableCommunes.length > 0) {
      const hasWildcardOther = indispensableCommunes.some(
        (t) => t.label.toLowerCase() === 'otras comunas'
      );
      const matchesDirect = indispensableCommunes.some(
        (t) => t.label.toLowerCase() === propCommuneLower
      );
      const matchesWildcard =
        hasWildcardOther && !NAMED_RM_COMMUNES.includes(propCommuneLower);

      if (!matchesDirect && !matchesWildcard) {
        failedTags.push(indispensableCommunes[0]);
      }
    }

    for (const tag of indispensableTags) {
      const labelLower = tag.label.toLowerCase();

      if (tag.category === 'tipo' || tag.category === 'ubicacion') {
        if (
          ['región metropolitana', 'valparaíso', 'biobío'].includes(labelLower) &&
          propRegionLower !== labelLower
        ) {
          failedTags.push(tag);
        } else if (labelLower === 'otra región') {
          if (MAIN_REGIONS.includes(propRegionLower)) {
            failedTags.push(tag);
          }
        }
        continue;
      }

      if (labelLower === '1 dormitorio' && prop.bedrooms < 1) failedTags.push(tag);
      else if (labelLower === '2 dormitorios' && prop.bedrooms !== 2) failedTags.push(tag);
      else if (labelLower === '3 dormitorios' && prop.bedrooms !== 3) failedTags.push(tag);
      else if (labelLower === '4 o más dormitorios' && prop.bedrooms < 4) failedTags.push(tag);
      else if (labelLower === '1 baño' && prop.bathrooms < 1) failedTags.push(tag);
      else if (labelLower === '2 baños' && prop.bathrooms !== 2) failedTags.push(tag);
      else if (labelLower === '3 o más baños' && prop.bathrooms < 3) failedTags.push(tag);
      else {
        const allAttrs = [...prop.features, ...prop.connectivity].map((a) =>
          a.toLowerCase()
        );
        const matchesAttr =
          allAttrs.some((a) => a.includes(labelLower) || labelLower.includes(a)) ||
          prop.description.toLowerCase().includes(labelLower);
        if (!matchesAttr) failedTags.push(tag);
      }

      if (failedTags.length > 1) break;
    }

    if (failedTags.length === 1) {
      almost.push({
        property: prop,
        missingTag: failedTags[0],
      });
      if (almost.length >= limit) break;
    }
  }

  return almost;
}

