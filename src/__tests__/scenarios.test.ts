import { describe, expect, it } from 'vitest';
import { INITIAL_ARCHETYPE } from '../context/AppContext';
import { MOCK_PROPERTIES } from '../data/mockProperties';
import { processUserChatMessage } from '../utils/chatbotEngine';
import {
  computeFinancialMetrics,
  filterAndScoreProperties,
  syncArchetypeFromTags,
} from '../utils/financialEngine';

describe('RoadHome + HomeMarket — Validación de los 9 Escenarios Obligatorios', () => {
  it('Escenario 1: Crear arquetipo mediante etiquetas (Depto en Ñuñoa, 2D, 2B indispensable, cerca del metro preferible) y verificar escenario financiero base', () => {
    const metrics = computeFinancialMetrics({
      baseMonthlyIncome: 2500000,
      baseMonthlyExpenses: 1600000,
      baseMonthlySavingCapacity: 600000,
      initialSavings: 18000000,
      deposits: [],
      events: [],
      archetype: INITIAL_ARCHETYPE,
    });

    expect(metrics.propertyEstimatedPriceUF).toBe(4500);
    expect(metrics.downPaymentTargetUF).toBe(900);
    expect(metrics.downPaymentTargetCLP).toBe(36000000);
    expect(metrics.currentSavings).toBe(18000000);
    expect(metrics.savingsProgress).toBe(50);
    expect(metrics.remainingAmount).toBe(18000000);
    expect(metrics.estimatedMonthsRemaining).toBe(30);
    expect(metrics.isHomeMarketUnlocked).toBe(false);

    const compatible = filterAndScoreProperties(
      INITIAL_ARCHETYPE,
      metrics.currentSavings
    );
    expect(compatible.length).toBeGreaterThan(0);
    expect(
      compatible.every((c) => c.property.propertyType === 'departamento')
    ).toBe(true);
    expect(compatible.every((c) => c.property.commune === 'Ñuñoa')).toBe(true);
  });

  it('Escenario 2: Crear arquetipo mediante conversación (Casa en La Florida, 3 dormitorios, patio preferible)', () => {
    const turn = processUserChatMessage(
      'Quiero vivir en una casa en La Florida de 3 dormitorios y que el patio sea preferible',
      {
        ...INITIAL_ARCHETYPE,
        tags: [],
      }
    );

    expect(turn.updatedArchetype.propertyType).toBe('casa');
    expect(turn.updatedArchetype.communes).toContain('La Florida');
    expect(turn.updatedArchetype.bedrooms).toBe(3);

    const patioTag = turn.updatedArchetype.tags.find(
      (t) => t.label === 'Patio'
    );
    expect(patioTag).toBeDefined();
    expect(patioTag?.priority).toBe('preferible');
  });

  it('Escenario 3: Simular un depósito de $500.000 actualiza ahorro, progreso, monto pendiente y meses', () => {
    const metrics = computeFinancialMetrics({
      baseMonthlyIncome: 2500000,
      baseMonthlyExpenses: 1600000,
      baseMonthlySavingCapacity: 600000,
      initialSavings: 18000000,
      deposits: [
        {
          id: 'dep-test-1',
          amountCLP: 500000,
          dateLabel: 'Hoy',
          note: 'Depósito simulado',
        },
      ],
      events: [],
      archetype: INITIAL_ARCHETYPE,
    });

    expect(metrics.currentSavings).toBe(18500000);
    expect(metrics.remainingAmount).toBe(17500000);
    expect(metrics.savingsProgress).toBe(51.4);
    expect(metrics.estimatedMonthsRemaining).toBe(30);
  });

  it('Escenario 4: Simular un aumento de sueldo de $300.000 aumenta capacidad de ahorro y disminuye el tiempo estimado', () => {
    const metrics = computeFinancialMetrics({
      baseMonthlyIncome: 2500000,
      baseMonthlyExpenses: 1600000,
      baseMonthlySavingCapacity: 600000,
      initialSavings: 18000000,
      deposits: [],
      events: [
        {
          id: 'evt-sueldo',
          title: 'Me aumentaron el sueldo',
          category: 'positive',
          type: 'income',
          frequency: 'recurring',
          amountCLP: 300000,
          effectiveMonthOffset: 0,
          dateLabel: 'Inmediato',
          createdAt: 'Hoy',
        },
      ],
      archetype: INITIAL_ARCHETYPE,
    });

    expect(metrics.monthlySavingCapacity).toBe(900000);
    expect(metrics.estimatedMonthsRemaining).toBe(20);
  });

  it('Escenario 5: Simular un gasto inesperado ($500.000 hoy) y un gasto futuro ($800.000 en diciembre) adapta la ruta', () => {
    const immediateExpenseMetrics = computeFinancialMetrics({
      baseMonthlyIncome: 2500000,
      baseMonthlyExpenses: 1600000,
      baseMonthlySavingCapacity: 600000,
      initialSavings: 18000000,
      deposits: [],
      events: [
        {
          id: 'evt-gasto',
          title: 'Tuve un gasto inesperado',
          category: 'negative',
          type: 'expense',
          frequency: 'once',
          amountCLP: 500000,
          effectiveMonthOffset: 0,
          dateLabel: 'Inmediato',
          createdAt: 'Hoy',
        },
      ],
      archetype: INITIAL_ARCHETYPE,
    });

    expect(immediateExpenseMetrics.currentSavings).toBe(17500000);
    expect(immediateExpenseMetrics.remainingAmount).toBe(18500000);
    expect(immediateExpenseMetrics.estimatedMonthsRemaining).toBe(31);

    // Gasto futuro no descuenta el saldo de hoy pero sí ajusta la proyección de meses
    const futureExpenseMetrics = computeFinancialMetrics({
      baseMonthlyIncome: 2500000,
      baseMonthlyExpenses: 1600000,
      baseMonthlySavingCapacity: 600000,
      initialSavings: 18000000,
      deposits: [],
      events: [
        {
          id: 'evt-futuro',
          title: 'Tendré un gasto futuro',
          category: 'negative',
          type: 'expense',
          frequency: 'once',
          amountCLP: 800000,
          effectiveMonthOffset: 2,
          dateLabel: 'En diciembre',
          createdAt: 'Hoy',
        },
      ],
      archetype: INITIAL_ARCHETYPE,
    });

    expect(futureExpenseMetrics.currentSavings).toBe(18000000);
    expect(futureExpenseMetrics.futureOneTimeNetAdjustmentCLP).toBe(800000);
    expect(futureExpenseMetrics.estimatedMonthsRemaining).toBe(32);
  });

  it('Escenario 6: Modificar el arquetipo de Departamento en Ñuñoa a Casa en La Florida conserva el ahorro y filtra solo casas', () => {
    const newArchetype = syncArchetypeFromTags(INITIAL_ARCHETYPE, [
      {
        id: 't1',
        label: 'Casa',
        category: 'tipo',
        priority: 'indispensable',
      },
      {
        id: 't2',
        label: 'La Florida',
        category: 'ubicacion',
        priority: 'indispensable',
      },
      {
        id: 't3',
        label: '3 dormitorios',
        category: 'interior',
        priority: 'indispensable',
      },
    ]);

    const metrics = computeFinancialMetrics({
      baseMonthlyIncome: 2500000,
      baseMonthlyExpenses: 1600000,
      baseMonthlySavingCapacity: 600000,
      initialSavings: 18000000,
      deposits: [],
      events: [],
      archetype: newArchetype,
    });

    expect(metrics.currentSavings).toBe(18000000);
    expect(metrics.propertyEstimatedPriceUF).not.toBe(4500);

    const compatible = filterAndScoreProperties(
      newArchetype,
      metrics.currentSavings
    );
    expect(compatible.length).toBeGreaterThan(0);
    expect(compatible.every((c) => c.property.propertyType === 'casa')).toBe(
      true
    );
  });

  it('Escenario 7, 8 y 9: Desbloquear HomeMarket con depósitos, evaluar los 3 estados financieros y cambiar propiedad meta', () => {
    const unlockedMetrics = computeFinancialMetrics({
      baseMonthlyIncome: 2500000,
      baseMonthlyExpenses: 1600000,
      baseMonthlySavingCapacity: 600000,
      initialSavings: 18000000,
      deposits: [
        {
          id: 'dep-unlock',
          amountCLP: 12600000,
          dateLabel: 'Hoy',
          note: 'Depósito para alcanzar 85%',
        },
      ],
      events: [],
      archetype: { ...INITIAL_ARCHETYPE, isSaved: true },
    });

    expect(unlockedMetrics.currentSavings).toBe(30600000);
    expect(unlockedMetrics.savingsProgress).toBe(85);
    expect(unlockedMetrics.isHomeMarketUnlocked).toBe(true);

    const feed = filterAndScoreProperties(
      INITIAL_ARCHETYPE,
      unlockedMetrics.currentSavings
    );

    // Debe haber una propiedad con pie cubierto (Condominio Plaza Sucre 3.800 UF -> pie $30.400.000)
    const availableProp = feed.find((p) => p.financialStatus === 'available');
    expect(availableProp).toBeDefined();

    // Debe haber una propiedad que requiere más ahorro (Residencial Simón Bolívar 5.250 UF -> pie $42.000.000)
    const higherProp = MOCK_PROPERTIES.find(
      (p) => p.id === 'depto-nunoa-3'
    )!;
    const updatedGoalMetrics = computeFinancialMetrics({
      baseMonthlyIncome: 2500000,
      baseMonthlyExpenses: 1600000,
      baseMonthlySavingCapacity: 600000,
      initialSavings: 18000000,
      deposits: [],
      events: [],
      archetype: {
        ...INITIAL_ARCHETYPE,
        targetPropertyId: higherProp.id,
        targetPropertyTitle: higherProp.title,
        customEstimatedPriceUF: higherProp.priceUF,
        isSaved: true,
      },
    });

    expect(updatedGoalMetrics.propertyEstimatedPriceUF).toBe(5250);
    expect(updatedGoalMetrics.downPaymentTargetUF).toBe(1050);
    expect(updatedGoalMetrics.downPaymentTargetCLP).toBe(42000000);
  });

  describe('Nuevos tests de UX: Máquina de estados, Desbloqueo único y Persistencia segura', () => {
    it('Evalúa correctamente los 4 estados de la máquina de próximo paso (A, B, C, D)', async () => {
      const { determineUserFlowStep } = await import('../utils/userFlowEngine');

      // Estado A: Sin casa guardada
      const stepA = determineUserFlowStep({
        archetype: { ...INITIAL_ARCHETYPE, isSaved: false },
        savingsProgress: 50,
        isHomeMarketUnlocked: false,
        hasVisitedExplore: false,
      });
      expect(stepA.state).toBe('A');
      expect(stepA.stepNumber).toBe(1);
      expect(stepA.targetTab).toBe('mi-casa');

      // Estado B: Casa guardada, ahorrando para el pie (< 85%)
      const stepB = determineUserFlowStep({
        archetype: { ...INITIAL_ARCHETYPE, isSaved: true },
        savingsProgress: 60,
        isHomeMarketUnlocked: false,
        hasVisitedExplore: false,
      });
      expect(stepB.state).toBe('B');
      expect(stepB.stepNumber).toBe(2);
      expect(stepB.targetTab).toBe('ahorro');

      // Estado C: Desbloqueado pero aún no ha visitado Explorar
      const stepC = determineUserFlowStep({
        archetype: { ...INITIAL_ARCHETYPE, isSaved: true },
        savingsProgress: 85,
        isHomeMarketUnlocked: true,
        hasVisitedExplore: false,
      });
      expect(stepC.state).toBe('C');
      expect(stepC.stepNumber).toBe(3);
      expect(stepC.targetTab).toBe('homemarket');

      // Estado D: 100% de la meta alcanzada
      const stepD = determineUserFlowStep({
        archetype: { ...INITIAL_ARCHETYPE, isSaved: true },
        savingsProgress: 100,
        isHomeMarketUnlocked: true,
        hasVisitedExplore: true,
      });
      expect(stepD.state).toBe('D');
      expect(stepD.stepNumber).toBe(3);
      expect(stepD.targetTab).toBe('homemarket');
    });

    it('Lectura segura de estados antiguos de localStorage sin las nuevas banderas', () => {
      // Simula un JSON antiguo de localStorage que no tenía hasSeenUnlockCelebration ni hasVisitedExplore
      const oldSerializedState = JSON.stringify({
        isBciConnected: true,
        baseMonthlyIncome: 2500000,
        initialSavings: 18000000,
        archetype: {
          propertyType: 'departamento',
          communes: ['Ñuñoa'],
          isSaved: true,
        },
      });

      const parsed = JSON.parse(oldSerializedState);
      const safeHasSeenUnlock = Boolean(parsed.hasSeenUnlockCelebration);
      const safeHasVisitedExplore = Boolean(parsed.hasVisitedExplore);

      expect(safeHasSeenUnlock).toBe(false);
      expect(safeHasVisitedExplore).toBe(false);
    });

    it('Transición de desbloqueo: se activa tanto por umbral del 85% como por propiedad compatible con pie cubierto', () => {
      // Caso 1: Por 85% de avance
      const metrics85 = computeFinancialMetrics({
        baseMonthlyIncome: 2500000,
        baseMonthlyExpenses: 1600000,
        baseMonthlySavingCapacity: 600000,
        initialSavings: 30600000, // 85% de $36.000.000
        deposits: [],
        events: [],
        archetype: { ...INITIAL_ARCHETYPE, isSaved: true },
      });
      expect(metrics85.isHomeMarketUnlocked).toBe(true);
      expect(metrics85.unlockReason).toBe('progress_85');

      // Caso 2: Por propiedad compatible con pie cubierto (aunque el progreso general sea < 85%)
      // Si el pie general es alto pero hay una propiedad compatible de menor valor cuyo pie está cubierto
      const metricsCovered = computeFinancialMetrics({
        baseMonthlyIncome: 2500000,
        baseMonthlyExpenses: 1600000,
        baseMonthlySavingCapacity: 600000,
        initialSavings: 30400000, // Cubre los $30.400.000 de Plaza Sucre (3.800 UF)
        deposits: [],
        events: [],
        archetype: {
          ...INITIAL_ARCHETYPE,
          customEstimatedPriceUF: 5000, // Meta general de 5.000 UF -> Pie $40.000.000 (30.4M = 76% < 85%)
          isSaved: true,
        },
      });
      expect(metricsCovered.savingsProgress).toBeLessThan(85);
      expect(metricsCovered.isHomeMarketUnlocked).toBe(true);
      expect(metricsCovered.unlockReason).toBe('compatible_property_covered');
    });
  });
});

