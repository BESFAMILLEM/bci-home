import {
  HousingArchetype,
  PreferenceCategory,
  PreferencePriority,
  PreferenceTag,
} from '../types/app';
import { syncArchetypeFromTags } from './financialEngine';

export interface ChatbotTurnResult {
  updatedArchetype: HousingArchetype;
  detectedUpdates: string[];
  agentReply: string;
  suggestions: string[];
}

function detectPriority(textLower: string, defaultPriority: PreferencePriority): PreferencePriority {
  if (
    textLower.includes('indispensable') ||
    textLower.includes('obligatorio') ||
    textLower.includes('sí o sí') ||
    textLower.includes('si o si') ||
    textLower.includes('necesito') ||
    textLower.includes('fundamental') ||
    textLower.includes('requisito')
  ) {
    return 'indispensable';
  }
  if (
    textLower.includes('opcional') ||
    textLower.includes('extra') ||
    textLower.includes('sería bueno') ||
    textLower.includes('seria bueno') ||
    textLower.includes('secundario')
  ) {
    return 'opcional';
  }
  if (
    textLower.includes('preferible') ||
    textLower.includes('preferencia') ||
    textLower.includes('deseable') ||
    textLower.includes('me gustaría') ||
    textLower.includes('me gustaria') ||
    textLower.includes('idealmente')
  ) {
    return 'preferible';
  }
  return defaultPriority;
}

function upsertTag(
  tags: PreferenceTag[],
  newTag: PreferenceTag,
  exclusiveGroupResolver?: (existing: PreferenceTag) => boolean
): PreferenceTag[] {
  let filtered = [...tags];
  if (exclusiveGroupResolver) {
    filtered = filtered.filter((t) => !exclusiveGroupResolver(t));
  } else {
    filtered = filtered.filter(
      (t) => t.label.toLowerCase() !== newTag.label.toLowerCase()
    );
  }
  return [...filtered, newTag];
}

export function processUserChatMessage(
  userText: string,
  currentArchetype: HousingArchetype
): ChatbotTurnResult {
  const textLower = userText.toLowerCase().trim();
  let tags = [...currentArchetype.tags];
  const detectedUpdates: string[] = [];

  // 1. Detectar Tipo de Propiedad (exclusivo)
  const typePatterns: { keywords: string[]; label: string }[] = [
    { keywords: ['departamento', 'depto', 'dpto'], label: 'Departamento' },
    { keywords: ['casa'], label: 'Casa' },
    { keywords: ['parcela'], label: 'Parcela' },
    { keywords: ['terreno vacío', 'terreno vacio', 'terreno', 'sitio'], label: 'Terreno vacío' },
  ];

  for (const tp of typePatterns) {
    if (tp.keywords.some((kw) => new RegExp(`\\b${kw}\\b`, 'i').test(textLower))) {
      const priority = detectPriority(textLower, 'indispensable');
      tags = upsertTag(
        tags,
        {
          id: `tipo-${tp.label.toLowerCase().replace(/\s+/g, '-')}`,
          label: tp.label,
          category: 'tipo',
          priority,
        },
        (existing) => existing.category === 'tipo'
      );
      detectedUpdates.push(`Tipo: ${tp.label} (${priority})`);
      break;
    }
  }

  // 2. Detectar Ubicación / Comunas
  const knownLocations: { keywords: string[]; label: string }[] = [
    { keywords: ['ñuñoa', 'nunoa'], label: 'Ñuñoa' },
    { keywords: ['providencia'], label: 'Providencia' },
    { keywords: ['la florida', 'florida'], label: 'La Florida' },
    { keywords: ['santiago centro', 'santiago', 'centro'], label: 'Santiago Centro' },
    { keywords: ['las condes', 'condes'], label: 'Las Condes' },
    { keywords: ['macul'], label: 'Macul' },
    { keywords: ['puente alto'], label: 'Puente Alto' },
    { keywords: ['vitacura'], label: 'Vitacura' },
    { keywords: ['valparaíso', 'valparaiso', 'viña', 'vina del mar'], label: 'Valparaíso' },
    { keywords: ['biobío', 'biobio', 'concepción', 'concepcion'], label: 'Biobío' },
    { keywords: ['región metropolitana', 'region metropolitana'], label: 'Región Metropolitana' },
  ];

  const mentionsReplaceLocation =
    textLower.includes('cambiar a') ||
    textLower.includes('mejor en') ||
    textLower.includes('prefiero en') ||
    textLower.includes('en vez de');

  for (const loc of knownLocations) {
    if (loc.keywords.some((kw) => textLower.includes(kw))) {
      const priority = detectPriority(textLower, 'indispensable');
      tags = upsertTag(
        tags,
        {
          id: `ubicacion-${loc.label.toLowerCase().replace(/\s+/g, '-')}`,
          label: loc.label,
          category: 'ubicacion',
          priority,
        },
        mentionsReplaceLocation
          ? (existing) =>
              existing.category === 'ubicacion' &&
              existing.label !== 'Región Metropolitana'
          : undefined
      );
      detectedUpdates.push(`Ubicación: ${loc.label} (${priority})`);
    }
  }

  // 3. Detectar Dormitorios
  const bedroomPatterns: { regex: RegExp; label: string }[] = [
    { regex: /\b(1|un|uno)\s*(dormitorio|dorm|pieza|habitaci[oó]n)/i, label: '1 dormitorio' },
    { regex: /\b(2|dos)\s*(dormitorios|dormitorio|dorms|piezas|habitaciones)/i, label: '2 dormitorios' },
    { regex: /\b(3|tres)\s*(dormitorios|dormitorio|dorms|piezas|habitaciones)/i, label: '3 dormitorios' },
    { regex: /\b(4|cuatro|5|cinco)\s*(dormitorios|dormitorio|dorms|piezas|habitaciones)/i, label: '4 o más dormitorios' },
  ];

  for (const bp of bedroomPatterns) {
    if (bp.regex.test(textLower)) {
      const priority = detectPriority(textLower, 'indispensable');
      tags = upsertTag(
        tags,
        {
          id: `interior-${bp.label.replace(/\s+/g, '-')}`,
          label: bp.label,
          category: 'interior',
          priority,
        },
        (existing) => existing.label.includes('dormitorio')
      );
      detectedUpdates.push(`${bp.label} (${priority})`);
      break;
    }
  }

  // 4. Detectar Baños
  const bathroomPatterns: { regex: RegExp; label: string }[] = [
    { regex: /\b(1|un|uno)\s*ba[ñn]o/i, label: '1 baño' },
    { regex: /\b(2|dos)\s*ba[ñn]os/i, label: '2 baños' },
    { regex: /\b(3|tres|4|cuatro)\s*ba[ñn]os/i, label: '3 o más baños' },
  ];

  for (const btp of bathroomPatterns) {
    if (btp.regex.test(textLower)) {
      const priority = detectPriority(textLower, 'indispensable');
      tags = upsertTag(
        tags,
        {
          id: `interior-${btp.label.replace(/\s+/g, '-')}`,
          label: btp.label,
          category: 'interior',
          priority,
        },
        (existing) => existing.label.includes('baño')
      );
      detectedUpdates.push(`${btp.label} (${priority})`);
      break;
    }
  }

  // 5. Detectar Conectividad, Interior y Exterior
  const featureCatalog: {
    keywords: string[];
    label: string;
    category: PreferenceCategory;
    defaultPriority: PreferencePriority;
  }[] = [
    {
      keywords: ['metro', 'estación', 'estacion'],
      label: 'Cerca del metro',
      category: 'conectividad',
      defaultPriority: 'preferible',
    },
    {
      keywords: ['transporte público', 'transporte publico', 'micro', 'locomoción', 'locomocion'],
      label: 'Cerca de transporte público',
      category: 'conectividad',
      defaultPriority: 'preferible',
    },
    {
      keywords: ['colegio', 'colegios', 'jardín infantil'],
      label: 'Cerca de colegios',
      category: 'conectividad',
      defaultPriority: 'preferible',
    },
    {
      keywords: ['universidad', 'universidades', 'campus'],
      label: 'Cerca de universidades',
      category: 'conectividad',
      defaultPriority: 'preferible',
    },
    {
      keywords: ['supermercado', 'supermercados'],
      label: 'Cerca de supermercados',
      category: 'conectividad',
      defaultPriority: 'preferible',
    },
    {
      keywords: ['salud', 'clínica', 'clinica', 'hospital', 'cesfam'],
      label: 'Cerca de centros de salud',
      category: 'conectividad',
      defaultPriority: 'preferible',
    },
    {
      keywords: ['parque', 'parques', 'plaza'],
      label: 'Cerca de parques',
      category: 'conectividad',
      defaultPriority: 'preferible',
    },
    {
      keywords: ['comercio', 'comercial', 'mall', 'tiendas'],
      label: 'Cerca de áreas comerciales',
      category: 'conectividad',
      defaultPriority: 'opcional',
    },
    {
      keywords: ['living amplio', 'living grande'],
      label: 'Living amplio',
      category: 'interior',
      defaultPriority: 'preferible',
    },
    {
      keywords: ['cocina integrada', 'cocina americana'],
      label: 'Cocina integrada',
      category: 'interior',
      defaultPriority: 'preferible',
    },
    {
      keywords: ['cocina independiente', 'cocina cerrada', 'cocina tradicional'],
      label: 'Cocina independiente',
      category: 'interior',
      defaultPriority: 'preferible',
    },
    {
      keywords: ['escritorio', 'home office', 'teletrabajo', 'estudio'],
      label: 'Espacio de escritorio',
      category: 'interior',
      defaultPriority: 'preferible',
    },
    {
      keywords: ['patio'],
      label: 'Patio',
      category: 'exterior',
      defaultPriority: 'preferible',
    },
    {
      keywords: ['terraza', 'balcón', 'balcon'],
      label: 'Terraza',
      category: 'exterior',
      defaultPriority: 'preferible',
    },
    {
      keywords: ['jardín', 'jardin'],
      label: 'Jardín',
      category: 'exterior',
      defaultPriority: 'preferible',
    },
    {
      keywords: ['piscina'],
      label: 'Piscina',
      category: 'exterior',
      defaultPriority: 'opcional',
    },
    {
      keywords: ['quincho', 'parrilla'],
      label: 'Quincho',
      category: 'exterior',
      defaultPriority: 'opcional',
    },
    {
      keywords: ['estacionamiento', 'auto', 'cochera'],
      label: 'Estacionamiento',
      category: 'exterior',
      defaultPriority: 'preferible',
    },
    {
      keywords: ['bodega'],
      label: 'Bodega',
      category: 'exterior',
      defaultPriority: 'opcional',
    },
    {
      keywords: ['áreas verdes', 'areas verdes'],
      label: 'Áreas verdes',
      category: 'exterior',
      defaultPriority: 'preferible',
    },
  ];

  for (const feat of featureCatalog) {
    if (feat.keywords.some((kw) => textLower.includes(kw))) {
      const priority = detectPriority(textLower, feat.defaultPriority);
      tags = upsertTag(tags, {
        id: `${feat.category}-${feat.label.toLowerCase().replace(/\s+/g, '-')}`,
        label: feat.label,
        category: feat.category,
        priority,
      });
      detectedUpdates.push(`${feat.label} (${priority})`);
    }
  }

  // Si el usuario responde solo con una prioridad ("es indispensable", "solo una preferencia")
  // aplicarla a la última etiqueta agregada
  if (
    detectedUpdates.length === 0 &&
    tags.length > 0 &&
    (textLower.includes('indispensable') ||
      textLower.includes('preferencia') ||
      textLower.includes('preferible') ||
      textLower.includes('opcional'))
  ) {
    const newPriority = detectPriority(textLower, 'preferible');
    const lastIdx = tags.length - 1;
    const updatedLast = { ...tags[lastIdx], priority: newPriority };
    tags[lastIdx] = updatedLast;
    detectedUpdates.push(`${updatedLast.label} actualizado a ${newPriority}`);
  }

  const updatedArchetype = syncArchetypeFromTags(
    {
      ...currentArchetype,
      targetPropertyId: null,
      targetPropertyTitle: null,
      customEstimatedPriceUF: null,
    },
    tags
  );

  // Construir respuesta empática y siguiente pregunta progresiva del agente
  let agentReply = '';
  let suggestions: string[] = [];

  if (!updatedArchetype.propertyType) {
    agentReply =
      detectedUpdates.length > 0
        ? `¡Perfecto! Ya anoté ${detectedUpdates.join(', ')}. ¿Te imaginas viviendo más en un departamento, en una casa o en una parcela?`
        : '¡Comencemos a darle forma a tu meta! ¿Te imaginas más en un departamento, en una casa con patio o en una parcela?';
    suggestions = [
      'En un departamento de 2 dormitorios',
      'En una casa en La Florida',
      'En un departamento en Ñuñoa cerca del metro',
    ];
  } else if (updatedArchetype.communes.length === 0) {
    agentReply = `¡Excelente elección con ${
      updatedArchetype.propertyType === 'casa' ? 'una casa' : 'un departamento'
    }! ¿En qué comuna o sector te gustaría vivir?`;
    suggestions = [
      'Me gustaría vivir en Ñuñoa, cerca del metro',
      'Quiero vivir en La Florida',
      'En Providencia o Santiago Centro',
    ];
  } else if (
    updatedArchetype.propertyType !== 'terreno' &&
    !updatedArchetype.bedrooms
  ) {
    agentReply = `¡Genial! Vivir en ${updatedArchetype.communes.join(
      ', '
    )} es una gran meta. ¿Cuántos dormitorios necesitas para estar cómodo?`;
    suggestions = [
      'Necesito 2 dormitorios indispensables',
      'Quiero 3 dormitorios',
      '1 dormitorio es suficiente',
    ];
  } else if (
    updatedArchetype.propertyType !== 'terreno' &&
    !updatedArchetype.bathrooms
  ) {
    agentReply = `¡Ya tenemos una muy buena base (${updatedArchetype.propertyType} de ${updatedArchetype.bedrooms} dormitorios en ${updatedArchetype.communes[0]})! ¿Te gustaría que tuviera 2 baños? ¿Es algo indispensable o una preferencia?`;
    suggestions = [
      '2 baños es indispensable para mí',
      '2 baños como preferencia deseable',
      'Con 1 baño está bien',
    ];
  } else {
    const hasExteriorOrConn = updatedArchetype.tags.some(
      (t) => t.category === 'exterior' || t.category === 'conectividad'
    );
    if (!hasExteriorOrConn) {
      agentReply =
        updatedArchetype.propertyType === 'casa'
          ? '¡Va quedando súper claro! ¿Te gustaría sumar alguna característica como patio, jardín o estacionamiento?'
          : '¡Muy bien! ¿Hay algún detalle adicional que valores, como estar cerca del metro, tener terraza o estacionamiento?';
      suggestions =
        updatedArchetype.propertyType === 'casa'
          ? [
              'Que el patio sea preferible y tenga estacionamiento',
              'Cerca de colegios y parques',
              'Ya estoy conforme con mi resumen',
            ]
          : [
              'Cerca del metro es preferible y con terraza',
              'Que tenga estacionamiento y espacio de escritorio',
              'Ya estoy conforme con mi resumen',
            ];
    } else {
      agentReply = `¡Excelente! Actualicé tu arquetipo: ${
        updatedArchetype.propertyType
      } en ${updatedArchetype.communes.join(', ')}${
        updatedArchetype.bedrooms ? ` con ${updatedArchetype.bedrooms} dormitorios` : ''
      }. Puedes seguir ajustando detalles aquí o guardar tu arquetipo abajo.`;
      suggestions = [
        'Agregar piscina como opcional',
        'Cambiar a una casa de 3 dormitorios en La Florida',
        'Que 2 baños sea indispensable',
      ];
    }
  }

  return {
    updatedArchetype,
    detectedUpdates,
    agentReply,
    suggestions,
  };
}

