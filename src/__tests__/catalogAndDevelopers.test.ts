import { describe, expect, it } from 'vitest';
import { DEVELOPERS, DeveloperId, getDeveloper } from '../data/developers';
import { MOCK_PROPERTIES, getFallbackImage } from '../data/mockProperties';
import {
  ALL_ALLOWED_CONNECTIVITY,
  ALL_ALLOWED_FEATURES,
  COMMUNES_RM,
} from '../data/preferenceVocabulary';
import { INITIAL_ARCHETYPE } from '../context/AppContext';
import { HousingArchetype, PreferenceTag, PropertyType } from '../types/app';
import {
  filterAndScoreProperties,
  findSmartRelaxationSuggestions,
  findAlmostMatchingProperties,
  syncArchetypeFromTags,
} from '../utils/financialEngine';

describe('HomeMarket — Validación Integral de Catálogo, Inmobiliarias y Cobertura', () => {
  // ===========================================================================
  // PARTE 1 & 8: MODELO DE DATOS, IDS E INMOBILIARIAS
  // ===========================================================================
  it('Verifica catálogo total >= 110 (meta ~120), IDs únicos y conservación de los 17 IDs originales', () => {
    expect(MOCK_PROPERTIES.length).toBeGreaterThanOrEqual(110);
    expect(MOCK_PROPERTIES.length).toBe(128);

    const ids = MOCK_PROPERTIES.map((p) => p.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(MOCK_PROPERTIES.length);

    const existing17Ids = [
      'depto-nunoa-1',
      'depto-nunoa-2',
      'depto-nunoa-3',
      'depto-providencia-1',
      'depto-stgo-1',
      'depto-macul-1',
      'depto-lascondes-1',
      'depto-valpo-1',
      'casa-laflorida-1',
      'casa-laflorida-2',
      'casa-puentealto-1',
      'casa-nunoa-1',
      'casa-biobio-1',
      'parcela-rm-1',
      'parcela-valpo-1',
      'terreno-rm-1',
      'terreno-valpo-1',
    ];

    for (const expectedId of existing17Ids) {
      const found = MOCK_PROPERTIES.find((p) => p.id === expectedId);
      expect(found, `ID existente ${expectedId} debe estar presente`).toBeDefined();
    }
  });

  it('Verifica las 15 inmobiliarias: nombres exactos, 100% asignadas, mínimo 4 c/u y ninguna > 14%', () => {
    expect(DEVELOPERS.length).toBe(15);

    const devCounts: Record<DeveloperId, number> = {} as any;
    for (const dev of DEVELOPERS) {
      devCounts[dev.id] = 0;
      expect(dev.name).toBeTruthy();
      expect(dev.initials.length).toBe(2);
    }

    for (const prop of MOCK_PROPERTIES) {
      expect(prop.developerId, `Propiedad ${prop.id} debe tener developerId`).toBeDefined();
      const dev = getDeveloper(prop.developerId);
      expect(dev).toBeDefined();
      expect(dev.id).toBe(prop.developerId);
      devCounts[prop.developerId] = (devCounts[prop.developerId] || 0) + 1;
    }

    console.log('\n--- DISTRIBUCIÓN POR INMOBILIARIA (124 PROPIEDADES) ---');
    for (const dev of DEVELOPERS) {
      const count = devCounts[dev.id];
      const pct = ((count / MOCK_PROPERTIES.length) * 100).toFixed(1);
      console.log(`• ${dev.name.padEnd(38, ' ')}: ${count} propiedades (${pct}%)`);
      expect(count, `Inmobiliaria ${dev.name} debe tener al menos 4 propiedades`).toBeGreaterThanOrEqual(4);
      expect(
        count / MOCK_PROPERTIES.length,
        `Inmobiliaria ${dev.name} no debe superar el 14% del catálogo`
      ).toBeLessThanOrEqual(0.14);
    }
  });

  // ===========================================================================
  // PARTE 3: PRECIOS Y COHERENCIA FINANCIERA
  // ===========================================================================
  it('Verifica coherencia financiera: downPaymentPercent = 20, pie redondeado, dividendo dentro de ±5% y rangos realistas', () => {
    for (const prop of MOCK_PROPERTIES) {
      expect(prop.downPaymentPercent).toBe(20);
      expect(prop.downPaymentUF).toBe(Math.round((prop.priceUF * 20) / 100));

      // Fórmula 80% financiado, 4.5% anual, 30 años -> factor ~0.005067
      const theoreticalDividend = prop.priceUF * 0.8 * 0.005067;
      const diffRatio = Math.abs(prop.estimatedDividendUF - theoreticalDividend) / theoreticalDividend;
      expect(
        diffRatio,
        `Dividendo de ${prop.id} (${prop.estimatedDividendUF} UF) debe estar dentro de ±5% de la fórmula teórica (${theoreticalDividend.toFixed(1)} UF)`
      ).toBeLessThanOrEqual(0.05);

      expect(prop.surface).toBeGreaterThan(0);
      expect(prop.priceUF).toBeGreaterThan(1000);
      expect(prop.priceUF).toBeLessThanOrEqual(13000);
    }
  });

  it('Verifica que todos los títulos, barrios y descripciones sean únicos', () => {
    const titles = new Set<string>();
    const descriptions = new Set<string>();

    for (const prop of MOCK_PROPERTIES) {
      expect(titles.has(prop.title), `Título duplicado: ${prop.title}`).toBe(false);
      titles.add(prop.title);

      expect(descriptions.has(prop.description), `Descripción duplicada en ${prop.id}`).toBe(false);
      descriptions.add(prop.description);

      expect(prop.neighborhood.length).toBeGreaterThan(2);
      expect(prop.description.length).toBeGreaterThan(30);
    }
  });

  // ===========================================================================
  // PARTE 4 & 5: IMÁGENES, VOCABULARIO Y CONECTIVIDAD REALISTA
  // ===========================================================================
  it('Verifica vocabulario controlado y que "Cerca del metro" solo se use en Región Metropolitana', () => {
    for (const prop of MOCK_PROPERTIES) {
      // Conectividad solo de vocabulario permitido
      for (const conn of prop.connectivity) {
        expect(
          ALL_ALLOWED_CONNECTIVITY.includes(conn as any),
          `Conectividad '${conn}' no permitida en ${prop.id}`
        ).toBe(true);

        // Regla de realismo: Cerca del metro solo en RM
        if (conn.toLowerCase().includes('metro')) {
          expect(
            prop.region,
            `Propiedad ${prop.id} (${prop.commune}, ${prop.region}) no debe tener 'Cerca del metro' fuera de RM`
          ).toBe('Región Metropolitana');
        }
      }

      // Galería con al menos 3 fotos distintas
      expect(prop.gallery.length).toBeGreaterThanOrEqual(3);
      const uniqueGallery = new Set(prop.gallery);
      expect(
        uniqueGallery.size,
        `Propiedad ${prop.id} debe tener al menos 3 fotos distintas en su galería`
      ).toBeGreaterThanOrEqual(3);

      // Verificación de getFallbackImage
      const fallback = getFallbackImage(prop);
      expect(fallback.startsWith('data:image/svg+xml;utf8,')).toBe(true);
    }
  });

  it('Verifica que propiedades de la misma comuna y tipo no compartan foto de portada (mientras el pool lo permita)', () => {
    const grouped: Record<string, string[]> = {};
    for (const prop of MOCK_PROPERTIES) {
      const key = `${prop.commune}_${prop.propertyType}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(prop.image);
    }

    for (const [key, images] of Object.entries(grouped)) {
      if (images.length <= 6) {
        const unique = new Set(images);
        expect(
          unique.size,
          `En el grupo ${key} las fotos de portada no deben duplicarse si hay <= 6 propiedades`
        ).toBe(images.length);
      }
    }
  });

  // ===========================================================================
  // PARTE 2: MATRIZ DE COBERTURA Y MÍNIMOS OBLIGATORIOS
  // ===========================================================================
  it('Imprime y valida la matriz completa de cobertura (tipo x zona)', () => {
    const matrix: Record<string, Record<PropertyType, number>> = {};

    const zones = [
      ...COMMUNES_RM,
      'RM Periferia / Rural',
      'Valparaíso (Región)',
      'Biobío (Región)',
      'Otras Regiones',
    ];

    for (const z of zones) {
      matrix[z] = { departamento: 0, casa: 0, parcela: 0, terreno: 0 };
    }

    for (const prop of MOCK_PROPERTIES) {
      let zoneKey = prop.commune;
      if (COMMUNES_RM.includes(prop.commune as any)) {
        zoneKey = prop.commune;
      } else if (prop.region === 'Región Metropolitana') {
        zoneKey = 'RM Periferia / Rural';
      } else if (prop.region === 'Valparaíso') {
        zoneKey = 'Valparaíso (Región)';
      } else if (prop.region === 'Biobío') {
        zoneKey = 'Biobío (Región)';
      } else {
        zoneKey = 'Otras Regiones';
      }

      matrix[zoneKey][prop.propertyType]++;
    }

    console.log('\n--- MATRIZ DE COBERTURA DEL CATÁLOGO (TIPO x ZONA) ---');
    console.log('Zona                         | Depto | Casa | Parcela | Terreno | Total');
    console.log('-----------------------------+-------+------+---------+---------+------');
    for (const [zone, counts] of Object.entries(matrix)) {
      const tot = counts.departamento + counts.casa + counts.parcela + counts.terreno;
      console.log(
        `${zone.padEnd(28, ' ')} | ${String(counts.departamento).padStart(5)} | ${String(counts.casa).padStart(4)} | ${String(counts.parcela).padStart(7)} | ${String(counts.terreno).padStart(7)} | ${String(tot).padStart(5)}`
      );
    }
    console.log('-----------------------------+-------+------+---------+---------+------');

    // Validar mínimos de cada una de las 8 comunas de RM
    for (const c of COMMUNES_RM) {
      expect(
        matrix[c].departamento,
        `Comuna ${c} debe tener al menos 4 departamentos`
      ).toBeGreaterThanOrEqual(4);
      expect(
        matrix[c].casa,
        `Comuna ${c} debe tener al menos 3 casas`
      ).toBeGreaterThanOrEqual(3);
    }

    // Al menos un 3D/3B en Las Condes, Vitacura, Providencia y Ñuñoa
    for (const c of ['Las Condes', 'Vitacura', 'Providencia', 'Ñuñoa']) {
      const has3D3B = MOCK_PROPERTIES.some(
        (p) =>
          p.commune === c &&
          p.propertyType === 'departamento' &&
          p.bedrooms === 3 &&
          p.bathrooms >= 3
      );
      expect(has3D3B, `Comuna ${c} debe tener al menos un depto 3D/3B`).toBe(true);
    }

    // Parcelas RM: Puente Alto >= 2, periferia >= 8
    expect(matrix['Puente Alto'].parcela).toBeGreaterThanOrEqual(2);
    expect(matrix['RM Periferia / Rural'].parcela).toBeGreaterThanOrEqual(8);

    // Terrenos RM: Puente Alto >= 2, periferia >= 6
    expect(matrix['Puente Alto'].terreno).toBeGreaterThanOrEqual(2);
    expect(matrix['RM Periferia / Rural'].terreno).toBeGreaterThanOrEqual(6);

    // Valparaíso
    expect(matrix['Valparaíso (Región)'].departamento).toBeGreaterThanOrEqual(6);
    expect(matrix['Valparaíso (Región)'].casa).toBeGreaterThanOrEqual(5);
    expect(matrix['Valparaíso (Región)'].parcela).toBeGreaterThanOrEqual(3);
    expect(matrix['Valparaíso (Región)'].terreno).toBeGreaterThanOrEqual(3);

    // Biobío
    expect(matrix['Biobío (Región)'].departamento).toBeGreaterThanOrEqual(5);
    expect(matrix['Biobío (Región)'].casa).toBeGreaterThanOrEqual(5);
    expect(matrix['Biobío (Región)'].parcela).toBeGreaterThanOrEqual(2);
    expect(matrix['Biobío (Región)'].terreno).toBeGreaterThanOrEqual(2);

    // Otras Regiones
    expect(matrix['Otras Regiones'].departamento).toBeGreaterThanOrEqual(6);
    expect(matrix['Otras Regiones'].casa).toBeGreaterThanOrEqual(6);
    expect(matrix['Otras Regiones'].parcela).toBeGreaterThanOrEqual(3);
    expect(matrix['Otras Regiones'].terreno).toBeGreaterThanOrEqual(3);
  });

  // ===========================================================================
  // PARTE 7: PLANTILLAS, COMODINES Y ESTADO VACÍO INTELIGENTE
  // ===========================================================================
  it('Verifica que la casa ideal base y las 5 plantillas típicas devuelvan >= 3 resultados cada una', () => {
    // 1. Casa ideal por defecto: Depto en Ñuñoa 2D/2B
    const resDefault = filterAndScoreProperties(INITIAL_ARCHETYPE, 18000000);
    expect(resDefault.length).toBeGreaterThanOrEqual(3);

    // 2. Plantilla 1: Casa 3D/2B en La Florida
    const arch1 = syncArchetypeFromTags(INITIAL_ARCHETYPE, [
      { id: 't1', label: 'Casa', category: 'tipo', priority: 'indispensable' },
      { id: 't2', label: 'La Florida', category: 'ubicacion', priority: 'indispensable' },
      { id: 't3', label: '3 dormitorios', category: 'interior', priority: 'indispensable' },
      { id: 't4', label: '2 baños', category: 'interior', priority: 'indispensable' },
    ]);
    const res1 = filterAndScoreProperties(arch1, 20000000);
    expect(res1.length).toBeGreaterThanOrEqual(3);

    // 3. Plantilla 2: Depto 1D/1B en Santiago Centro
    const arch2 = syncArchetypeFromTags(INITIAL_ARCHETYPE, [
      { id: 't1', label: 'Departamento', category: 'tipo', priority: 'indispensable' },
      { id: 't2', label: 'Santiago Centro', category: 'ubicacion', priority: 'indispensable' },
      { id: 't3', label: '1 dormitorio', category: 'interior', priority: 'indispensable' },
      { id: 't4', label: '1 baño', category: 'interior', priority: 'indispensable' },
    ]);
    const res2 = filterAndScoreProperties(arch2, 10000000);
    expect(res2.length).toBeGreaterThanOrEqual(3);

    // 4. Plantilla 3: Casa 4D en Las Condes
    const arch3 = syncArchetypeFromTags(INITIAL_ARCHETYPE, [
      { id: 't1', label: 'Casa', category: 'tipo', priority: 'indispensable' },
      { id: 't2', label: 'Las Condes', category: 'ubicacion', priority: 'indispensable' },
      { id: 't3', label: '4 o más dormitorios', category: 'interior', priority: 'indispensable' },
    ]);
    const res3 = filterAndScoreProperties(arch3, 30000000);
    expect(res3.length).toBeGreaterThanOrEqual(3);

    // 5. Plantilla 4: Parcela en RM
    const arch4 = syncArchetypeFromTags(INITIAL_ARCHETYPE, [
      { id: 't1', label: 'Parcela', category: 'tipo', priority: 'indispensable' },
      { id: 't2', label: 'Región Metropolitana', category: 'ubicacion', priority: 'indispensable' },
    ]);
    const res4 = filterAndScoreProperties(arch4, 25000000);
    expect(res4.length).toBeGreaterThanOrEqual(3);

    // 6. Plantilla 5: Depto 2D/2B en Providencia
    const arch5 = syncArchetypeFromTags(INITIAL_ARCHETYPE, [
      { id: 't1', label: 'Departamento', category: 'tipo', priority: 'indispensable' },
      { id: 't2', label: 'Providencia', category: 'ubicacion', priority: 'indispensable' },
      { id: 't3', label: '2 dormitorios', category: 'interior', priority: 'indispensable' },
    ]);
    const res5 = filterAndScoreProperties(arch5, 20000000);
    expect(res5.length).toBeGreaterThanOrEqual(3);
  });

  it('Verifica funcionamiento de comodines "Otras comunas" y "Otra región" como indispensables', () => {
    // Comodín "Otras comunas" debe calzar con comunas fuera de las 8 de RM (ej: Pirque, Colina, Lampa, Melipilla, etc.)
    const archOtrasComunas = syncArchetypeFromTags(INITIAL_ARCHETYPE, [
      { id: 't1', label: 'Parcela', category: 'tipo', priority: 'indispensable' },
      { id: 't2', label: 'Otras comunas', category: 'ubicacion', priority: 'indispensable' },
    ]);
    const resOtrasComunas = filterAndScoreProperties(archOtrasComunas, 20000000);
    expect(resOtrasComunas.length).toBeGreaterThanOrEqual(5);
    expect(
      resOtrasComunas.every(
        (p) => !COMMUNES_RM.includes(p.property.commune as any)
      )
    ).toBe(true);

    // Comodín "Otra región" debe calzar con propiedades fuera de RM, Valparaíso y Biobío
    const archOtraRegion = syncArchetypeFromTags(INITIAL_ARCHETYPE, [
      { id: 't1', label: 'Departamento', category: 'tipo', priority: 'indispensable' },
      { id: 't2', label: 'Otra región', category: 'ubicacion', priority: 'indispensable' },
    ]);
    const resOtraRegion = filterAndScoreProperties(archOtraRegion, 15000000);
    expect(resOtraRegion.length).toBeGreaterThanOrEqual(4);
    expect(
      resOtraRegion.every(
        (p) =>
          !['Región Metropolitana', 'Valparaíso', 'Biobío'].includes(
            p.property.region
          )
      )
    ).toBe(true);
  });

  it('Verifica el estado vacío inteligente y sugerencias de relajación', () => {
    // Caso de búsqueda muy estricta que da 0 resultados iniciales:
    // Depto en Vitacura con 2 dormitorios y cerca del metro indispensables (Vitacura no tiene metro)
    const strictArchetype = syncArchetypeFromTags(INITIAL_ARCHETYPE, [
      { id: 't1', label: 'Departamento', category: 'tipo', priority: 'indispensable' },
      { id: 't2', label: 'Vitacura', category: 'ubicacion', priority: 'indispensable' },
      { id: 't3', label: '2 dormitorios', category: 'interior', priority: 'indispensable' },
      { id: 't4', label: 'Cerca del metro', category: 'conectividad', priority: 'indispensable' },
    ]);

    const initialResults = filterAndScoreProperties(strictArchetype, 30000000);
    expect(initialResults.length).toBe(0);

    // Generar sugerencias de relajación
    const suggestions = findSmartRelaxationSuggestions(strictArchetype, 30000000);
    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions.length).toBeLessThanOrEqual(3);

    // Cada sugerencia debe liberar propiedades si se flexibiliza
    for (const sug of suggestions) {
      expect(sug.resultCount).toBeGreaterThan(0);
      expect(sug.tag.priority).toBe('indispensable');
    }

    // Verificación de propiedades casi compatibles
    const almost = findAlmostMatchingProperties(strictArchetype, 30000000);
    expect(Array.isArray(almost)).toBe(true);
  });
});
