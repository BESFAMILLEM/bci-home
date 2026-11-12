import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  ChatMessage,
  DepositRecord,
  FinancialEvent,
  FinancialMetrics,
  HousingArchetype,
  MainTab,
  MortgageApplication,
  PreferenceCategory,
  PreferencePriority,
  PreferenceTag,
  PropertyListing,
  PropertyType,
  ScoredProperty,
  SimulatedMovement,
} from '../types/app';
import {
  computeFinancialMetrics,
  DEFAULT_DOWN_PAYMENT_PERCENT,
  DEFAULT_UF_CLP,
  DEFAULT_UNLOCK_THRESHOLD_PERCENT,
  filterAndScoreProperties,
  formatCLP,
  syncArchetypeFromTags,
} from '../utils/financialEngine';

const STORAGE_KEY = 'bci_roadhome_homemarket_v1_state';

export const INITIAL_SIMULATED_MOVEMENTS: SimulatedMovement[] = [
  {
    id: 'mov-1',
    date: '05 nov 2026',
    description: 'Abono automático Cuenta Ahorro Vivienda Bci',
    amountCLP: 600000,
    type: 'credit',
    category: 'Ahorro programado',
  },
  {
    id: 'mov-2',
    date: '30 oct 2026',
    description: 'Remuneración mensual líquida',
    amountCLP: 2500000,
    type: 'credit',
    category: 'Ingresos',
  },
  {
    id: 'mov-3',
    date: '28 oct 2026',
    description: 'Pago arriendo y gastos fijos mensuales',
    amountCLP: 1600000,
    type: 'debit',
    category: 'Gastos fijos',
  },
];

export const INITIAL_ARCHETYPE_TAGS: PreferenceTag[] = [
  {
    id: 'tipo-departamento',
    label: 'Departamento',
    category: 'tipo',
    priority: 'indispensable',
  },
  {
    id: 'ubicacion-región-metropolitana',
    label: 'Región Metropolitana',
    category: 'ubicacion',
    priority: 'indispensable',
  },
  {
    id: 'ubicacion-ñuñoa',
    label: 'Ñuñoa',
    category: 'ubicacion',
    priority: 'indispensable',
  },
  {
    id: 'interior-2-dormitorios',
    label: '2 dormitorios',
    category: 'interior',
    priority: 'indispensable',
  },
  {
    id: 'interior-2-baños',
    label: '2 baños',
    category: 'interior',
    priority: 'indispensable',
  },
  {
    id: 'conectividad-cerca-del-metro',
    label: 'Cerca del metro',
    category: 'conectividad',
    priority: 'preferible',
  },
];

export const INITIAL_ARCHETYPE: HousingArchetype = syncArchetypeFromTags(
  {
    propertyType: 'departamento',
    region: 'Región Metropolitana',
    communes: ['Ñuñoa'],
    bedrooms: 2,
    bathrooms: 2,
    tags: INITIAL_ARCHETYPE_TAGS,
    targetPropertyId: null,
    targetPropertyTitle: null,
    customEstimatedPriceUF: null,
    isSaved: false,
  },
  INITIAL_ARCHETYPE_TAGS
);

export const INITIAL_CHAT_MESSAGES: ChatMessage[] = [
  {
    id: 'chat-welcome-1',
    sender: 'agent',
    text: '¡Comencemos! Soy tu asesor virtual de Bci RoadHome. ¿En qué tipo de lugar y comuna te imaginas viviendo?',
    timestamp: 'Ahora',
    suggestions: [
      'Me gustaría vivir en Ñuñoa, cerca del metro',
      'Quiero una casa de 3 dormitorios en La Florida con patio preferible',
      'Busco un departamento de 2 dormitorios y 2 baños indispensables',
    ],
  },
];

interface PersistedState {
  isBciConnected: boolean;
  hasCompletedOnboarding: boolean;
  activeTab: MainTab;
  builderMode: 'choice' | 'chat' | 'tags';
  baseMonthlyIncome: number;
  baseMonthlyExpenses: number;
  baseMonthlySavingCapacity: number;
  initialSavings: number;
  ufValueCLP: number;
  downPaymentPercentage: number;
  unlockThresholdPercent: number;
  archetype: HousingArchetype;
  deposits: DepositRecord[];
  events: FinancialEvent[];
  chatMessages: ChatMessage[];
  mortgageApplications: MortgageApplication[];
  favoritePropertyIds: string[];
  hasSeenUnlockCelebration: boolean;
  hasVisitedExplore: boolean;
}

const DEFAULT_PERSISTED_STATE: PersistedState = {
  isBciConnected: false,
  hasCompletedOnboarding: false,
  activeTab: 'inicio',
  builderMode: 'choice',
  baseMonthlyIncome: 2500000,
  baseMonthlyExpenses: 1600000,
  baseMonthlySavingCapacity: 600000,
  initialSavings: 18000000,
  ufValueCLP: DEFAULT_UF_CLP,
  downPaymentPercentage: DEFAULT_DOWN_PAYMENT_PERCENT,
  unlockThresholdPercent: DEFAULT_UNLOCK_THRESHOLD_PERCENT,
  archetype: INITIAL_ARCHETYPE,
  deposits: [],
  events: [],
  chatMessages: INITIAL_CHAT_MESSAGES,
  mortgageApplications: [],
  favoritePropertyIds: [],
  hasSeenUnlockCelebration: false,
  hasVisitedExplore: false,
};

export interface ToastNotification {
  id: string;
  title: string;
  message: string;
  tone: 'success' | 'info' | 'warning';
}

interface AppContextValue extends PersistedState {
  metrics: FinancialMetrics;
  compatibleProperties: ScoredProperty[];
  toast: ToastNotification | null;
  dismissToast: () => void;
  showToast: (title: string, message: string, tone?: ToastNotification['tone']) => void;
  isCelebrationModalOpen: boolean;
  closeCelebrationModal: () => void;
  openCelebrationModal: () => void;
  goToExploreFromCelebration: () => void;
  markExploreVisited: () => void;
  connectBciAccount: () => void;
  setActiveTab: (tab: MainTab) => void;
  setBuilderMode: (mode: 'choice' | 'chat' | 'tags') => void;
  updateArchetypeTags: (tags: PreferenceTag[]) => void;
  toggleTag: (
    label: string,
    category: PreferenceCategory,
    defaultPriority?: PreferencePriority,
    isCustom?: boolean
  ) => void;
  setTagPriority: (
    label: string,
    category: PreferenceCategory,
    priority: PreferencePriority
  ) => void;
  cycleTagState: (
    label: string,
    category: PreferenceCategory,
    isCustom?: boolean
  ) => void;
  clearAllTags: () => void;
  changeTagPriority: (tagId: string, priority: PreferencePriority) => void;
  removeTag: (tagId: string) => void;
  setPropertyTypePreference: (type: PropertyType) => void;
  saveArchetypeAsGoal: (customArchetype?: HousingArchetype) => void;
  addChatMessage: (msg: ChatMessage, updatedArchetype?: HousingArchetype) => void;
  addDeposit: (amountCLP: number, note?: string) => void;
  addFinancialEvent: (event: Omit<FinancialEvent, 'id' | 'createdAt'>) => void;
  removeFinancialEvent: (eventId: string) => void;
  selectPropertyAsNewGoal: (property: PropertyListing) => void;
  toggleFavoriteProperty: (propertyId: string) => void;
  submitMortgageSimulation: (property: PropertyListing) => MortgageApplication;
  updateSimulationParameters: (params: {
    baseMonthlyIncome?: number;
    baseMonthlyExpenses?: number;
    baseMonthlySavingCapacity?: number;
    initialSavings?: number;
    ufValueCLP?: number;
    downPaymentPercentage?: number;
    unlockThresholdPercent?: number;
  }) => void;
  resetDemo: () => void;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, setState] = useState<PersistedState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_PERSISTED_STATE,
          ...parsed,
          hasSeenUnlockCelebration: Boolean(parsed.hasSeenUnlockCelebration),
          hasVisitedExplore: Boolean(parsed.hasVisitedExplore),
          archetype: {
            ...INITIAL_ARCHETYPE,
            ...(parsed.archetype || {}),
          },
        };
      }
    } catch {
      // Ignore storage errors
    }
    return DEFAULT_PERSISTED_STATE;
  });

  const [toast, setToast] = useState<ToastNotification | null>(null);
  const [isCelebrationModalOpen, setIsCelebrationModalOpen] = useState(false);
  const prevUnlockedRef = useRef<boolean>(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore storage quota errors
    }
  }, [state]);

  const showToast = (
    title: string,
    message: string,
    tone: ToastNotification['tone'] = 'success'
  ) => {
    const id = `toast-${Date.now()}`;
    setToast({ id, title, message, tone });
  };

  const dismissToast = () => setToast(null);

  const metrics = useMemo(
    () =>
      computeFinancialMetrics({
        baseMonthlyIncome: state.baseMonthlyIncome,
        baseMonthlyExpenses: state.baseMonthlyExpenses,
        baseMonthlySavingCapacity: state.baseMonthlySavingCapacity,
        initialSavings: state.initialSavings,
        deposits: state.deposits,
        events: state.events,
        archetype: state.archetype,
        ufValueCLP: state.ufValueCLP,
        downPaymentPercentage: state.downPaymentPercentage,
        unlockThresholdPercent: state.unlockThresholdPercent,
      }),
    [
      state.baseMonthlyIncome,
      state.baseMonthlyExpenses,
      state.baseMonthlySavingCapacity,
      state.initialSavings,
      state.deposits,
      state.events,
      state.archetype,
      state.ufValueCLP,
      state.downPaymentPercentage,
      state.unlockThresholdPercent,
    ]
  );

  // Detecta el momento en que se desbloquea HomeMarket (transición false -> true)
  useEffect(() => {
    if (!prevUnlockedRef.current && metrics.isHomeMarketUnlocked && !state.hasSeenUnlockCelebration) {
      setIsCelebrationModalOpen(true);
    }
    prevUnlockedRef.current = metrics.isHomeMarketUnlocked;
  }, [metrics.isHomeMarketUnlocked, state.hasSeenUnlockCelebration]);

  const closeCelebrationModal = () => {
    setIsCelebrationModalOpen(false);
    setState((prev) => ({ ...prev, hasSeenUnlockCelebration: true }));
  };

  const openCelebrationModal = () => {
    setIsCelebrationModalOpen(true);
  };

  const goToExploreFromCelebration = () => {
    setIsCelebrationModalOpen(false);
    setState((prev) => ({
      ...prev,
      hasSeenUnlockCelebration: true,
      hasVisitedExplore: true,
      activeTab: 'homemarket',
    }));
  };

  const markExploreVisited = () => {
    setState((prev) => (prev.hasVisitedExplore ? prev : { ...prev, hasVisitedExplore: true }));
  };

  const compatibleProperties = useMemo(
    () =>
      filterAndScoreProperties(
        state.archetype,
        metrics.currentSavings,
        state.ufValueCLP
      ),
    [state.archetype, metrics.currentSavings, state.ufValueCLP]
  );

  const connectBciAccount = () => {
    setState((prev) => ({
      ...prev,
      isBciConnected: true,
      activeTab: 'mi-casa',
    }));
    showToast(
      'Conexión Bci completada',
      'Cargamos tu perfil financiero demostrativo. Ahora definamos tu casa ideal.',
      'success'
    );
  };

  const setActiveTab = (tab: MainTab) => {
    setState((prev) => {
      if (tab === 'homemarket') {
        return { ...prev, activeTab: tab, hasVisitedExplore: true };
      }
      return { ...prev, activeTab: tab };
    });
  };

  const setBuilderMode = (mode: 'choice' | 'chat' | 'tags') => {
    setState((prev) => ({ ...prev, builderMode: mode }));
  };

  const updateArchetypeTags = (tags: PreferenceTag[]) => {
    setState((prev) => ({
      ...prev,
      archetype: syncArchetypeFromTags(
        {
          ...prev.archetype,
          targetPropertyId: null,
          targetPropertyTitle: null,
          customEstimatedPriceUF: null,
        },
        tags
      ),
    }));
  };

  const setPropertyTypePreference = (type: PropertyType) => {
    const labelMap: Record<PropertyType, string> = {
      departamento: 'Departamento',
      casa: 'Casa',
      parcela: 'Parcela',
      terreno: 'Terreno vacío',
    };
    const filtered = state.archetype.tags.filter((t) => t.category !== 'tipo');
    const nextTags: PreferenceTag[] = [
      {
        id: `tipo-${type}`,
        label: labelMap[type],
        category: 'tipo',
        priority: 'indispensable',
      },
      ...filtered,
    ];
    updateArchetypeTags(nextTags);
  };

  const toggleTag = (
    label: string,
    category: PreferenceCategory,
    defaultPriority: PreferencePriority = 'preferible',
    isCustom = false
  ) => {
    const existing = state.archetype.tags.find(
      (t) => t.label.toLowerCase() === label.toLowerCase()
    );

    if (existing) {
      const next = state.archetype.tags.filter((t) => t.id !== existing.id);
      updateArchetypeTags(next);
      return;
    }

    let baseTags = [...state.archetype.tags];

    // Si es tipo de propiedad, dormitorios o baños, reemplazar la etiqueta anterior de ese subgrupo
    if (category === 'tipo') {
      baseTags = baseTags.filter((t) => t.category !== 'tipo');
    } else if (label.toLowerCase().includes('dormitorio')) {
      baseTags = baseTags.filter(
        (t) => !t.label.toLowerCase().includes('dormitorio')
      );
    } else if (label.toLowerCase().includes('baño')) {
      baseTags = baseTags.filter((t) => !t.label.toLowerCase().includes('baño'));
    }

    const newTag: PreferenceTag = {
      id: `${category}-${label.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
      label,
      category,
      priority:
        category === 'tipo' || category === 'ubicacion'
          ? 'indispensable'
          : defaultPriority,
      isCustom,
    };

    updateArchetypeTags([...baseTags, newTag]);
  };

  const setTagPriority = (
    label: string,
    category: PreferenceCategory,
    priority: PreferencePriority
  ) => {
    const existing = state.archetype.tags.find(
      (t) => t.label.toLowerCase() === label.toLowerCase()
    );
    if (existing) {
      const next = state.archetype.tags.map((t) =>
        t.id === existing.id ? { ...t, priority } : t
      );
      updateArchetypeTags(next);
    } else {
      const newTag: PreferenceTag = {
        id: `${category}-${label.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
        label,
        category,
        priority,
      };
      updateArchetypeTags([...state.archetype.tags, newTag]);
    }
  };

  const cycleTagState = (
    label: string,
    category: PreferenceCategory,
    isCustom = false
  ) => {
    const existing = state.archetype.tags.find(
      (t) => t.label.toLowerCase() === label.toLowerCase()
    );

    // Estado 1 (Indispensable en Verde Bci) -> pasa a Estado 2 (Preferible en Azul Bci)
    if (existing && existing.priority === 'indispensable') {
      const next = state.archetype.tags.map((t) =>
        t.id === existing.id ? { ...t, priority: 'preferible' as const } : t
      );
      updateArchetypeTags(next);
      return;
    }

    // Estado 2 (Preferible en Azul Bci / u Opcional) -> pasa a Estado 0 (No seleccionado)
    if (existing) {
      const next = state.archetype.tags.filter((t) => t.id !== existing.id);
      updateArchetypeTags(next);
      return;
    }

    // Estado 0 (No seleccionado) -> pasa a Estado 1 (Indispensable en Verde Bci)
    let baseTags = [...state.archetype.tags];
    if (category === 'tipo') {
      baseTags = baseTags.filter((t) => t.category !== 'tipo');
    } else if (label.toLowerCase().includes('dormitorio')) {
      baseTags = baseTags.filter(
        (t) => !t.label.toLowerCase().includes('dormitorio')
      );
    } else if (label.toLowerCase().includes('baño')) {
      baseTags = baseTags.filter((t) => !t.label.toLowerCase().includes('baño'));
    }

    const newTag: PreferenceTag = {
      id: `${category}-${label.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
      label,
      category,
      priority: 'indispensable',
      isCustom,
    };

    updateArchetypeTags([...baseTags, newTag]);
  };

  const clearAllTags = () => {
    updateArchetypeTags([]);
  };

  const changeTagPriority = (tagId: string, priority: PreferencePriority) => {
    const nextTags = state.archetype.tags.map((t) =>
      t.id === tagId ? { ...t, priority } : t
    );
    updateArchetypeTags(nextTags);
  };

  const removeTag = (tagId: string) => {
    const nextTags = state.archetype.tags.filter((t) => t.id !== tagId);
    updateArchetypeTags(nextTags);
  };

  const saveArchetypeAsGoal = (customArchetype?: HousingArchetype) => {
    setState((prev) => {
      const targetArch = customArchetype ?? prev.archetype;
      return {
        ...prev,
        hasCompletedOnboarding: true,
        activeTab: 'ahorro',
        archetype: {
          ...targetArch,
          isSaved: true,
        },
      };
    });
    showToast(
      '¡Meta inmobiliaria actualizada!',
      'RoadHome calculó tu pie estimado y tu ruta de ahorro manteniendo intacto tu ahorro acumulado.',
      'success'
    );
  };

  const addChatMessage = (
    msg: ChatMessage,
    updatedArchetype?: HousingArchetype
  ) => {
    setState((prev) => ({
      ...prev,
      chatMessages: [...prev.chatMessages, msg],
      archetype: updatedArchetype ?? prev.archetype,
    }));
  };

  const addDeposit = (amountCLP: number, note = 'Depósito simulado en Ahorro Vivienda') => {
    if (!Number.isFinite(amountCLP) || amountCLP <= 0) return;

    const wasUnlocked = metrics.isHomeMarketUnlocked;
    const newRecord: DepositRecord = {
      id: `dep-${Date.now()}`,
      amountCLP: Math.round(amountCLP),
      dateLabel: 'Hoy · Simulación',
      note,
    };

    const nextMetrics = computeFinancialMetrics({
      baseMonthlyIncome: state.baseMonthlyIncome,
      baseMonthlyExpenses: state.baseMonthlyExpenses,
      baseMonthlySavingCapacity: state.baseMonthlySavingCapacity,
      initialSavings: state.initialSavings,
      deposits: [newRecord, ...state.deposits],
      events: state.events,
      archetype: state.archetype,
      ufValueCLP: state.ufValueCLP,
      downPaymentPercentage: state.downPaymentPercentage,
      unlockThresholdPercent: state.unlockThresholdPercent,
    });

    setState((prev) => ({
      ...prev,
      deposits: [newRecord, ...prev.deposits],
    }));

    if (!wasUnlocked && nextMetrics.isHomeMarketUnlocked) {
      if (!state.hasSeenUnlockCelebration) {
        setIsCelebrationModalOpen(true);
      }
    } else {
      showToast(
        `¡Excelente! Sumaste ${formatCLP(amountCLP)} a tu ahorro`,
        `Tu ahorro acumulado subió a ${formatCLP(nextMetrics.currentSavings)} (${nextMetrics.savingsProgress}% del pie).`,
        'success'
      );
    }
  };

  const addFinancialEvent = (
    eventInput: Omit<FinancialEvent, 'id' | 'createdAt'>
  ) => {
    if (!Number.isFinite(eventInput.amountCLP) || eventInput.amountCLP <= 0) {
      return;
    }

    const newEvent: FinancialEvent = {
      ...eventInput,
      id: `evt-${Date.now()}`,
      createdAt: 'Registrado en simulación',
    };

    setState((prev) => ({
      ...prev,
      events: [newEvent, ...prev.events],
    }));

    if (eventInput.category === 'positive') {
      showToast(
        '¡Buenas noticias!',
        eventInput.frequency === 'recurring'
          ? 'Tu capacidad de ahorro estimada aumentó. Ahora podrías alcanzar tu pie antes de lo previsto.'
          : 'Este aporte positivo impulsa directamente tu avance hacia el pie.',
        'success'
      );
    } else {
      showToast(
        'Ruta adaptada con anticipación',
        eventInput.effectiveMonthOffset > 0
          ? 'Consideramos este compromiso futuro en los meses correspondientes sin descontar tu saldo de hoy.'
          : 'Este gasto modifica temporalmente tu ruta. Ajustamos la proyección para que puedas visualizar cómo recuperar tu objetivo.',
        'info'
      );
    }
  };

  const removeFinancialEvent = (eventId: string) => {
    setState((prev) => ({
      ...prev,
      events: prev.events.filter((e) => e.id !== eventId),
    }));
    showToast(
      'Escenario revertido',
      'Eliminamos el evento simulado y recalculamos tu ruta original.',
      'info'
    );
  };

  const selectPropertyAsNewGoal = (property: PropertyListing) => {
    setState((prev) => {
      const labelMap: Record<PropertyType, string> = {
        departamento: 'Departamento',
        casa: 'Casa',
        parcela: 'Parcela',
        terreno: 'Terreno vacío',
      };

      // Conservar etiquetas compatibles y actualizar tipo y comuna de la propiedad elegida
      const filteredTags = prev.archetype.tags.filter(
        (t) =>
          t.category !== 'tipo' &&
          t.category !== 'ubicacion' &&
          !t.label.toLowerCase().includes('dormitorio') &&
          !t.label.toLowerCase().includes('baño')
      );

      const updatedTags: PreferenceTag[] = [
        {
          id: `tipo-${property.propertyType}`,
          label: labelMap[property.propertyType],
          category: 'tipo',
          priority: 'indispensable',
        },
        {
          id: `ubicacion-${property.region.toLowerCase().replace(/\s+/g, '-')}`,
          label: property.region,
          category: 'ubicacion',
          priority: 'indispensable',
        },
        {
          id: `ubicacion-${property.commune.toLowerCase().replace(/\s+/g, '-')}`,
          label: property.commune,
          category: 'ubicacion',
          priority: 'indispensable',
        },
        ...(property.bedrooms > 0
          ? [
              {
                id: `interior-${property.bedrooms}-dormitorios`,
                label:
                  property.bedrooms >= 4
                    ? '4 o más dormitorios'
                    : `${property.bedrooms} ${
                        property.bedrooms === 1 ? 'dormitorio' : 'dormitorios'
                      }`,
                category: 'interior' as const,
                priority: 'indispensable' as const,
              },
            ]
          : []),
        ...(property.bathrooms > 0
          ? [
              {
                id: `interior-${property.bathrooms}-banos`,
                label:
                  property.bathrooms >= 3
                    ? '3 o más baños'
                    : `${property.bathrooms} ${
                        property.bathrooms === 1 ? 'baño' : 'baños'
                      }`,
                category: 'interior' as const,
                priority: 'indispensable' as const,
              },
            ]
          : []),
        ...filteredTags,
      ];

      const synced = syncArchetypeFromTags(
        {
          ...prev.archetype,
          targetPropertyId: property.id,
          targetPropertyTitle: property.title,
          customEstimatedPriceUF: property.priceUF,
          isSaved: true,
        },
        updatedTags
      );

      return {
        ...prev,
        activeTab: 'ahorro',
        archetype: synced,
      };
    });

    showToast(
      'Nueva propiedad objetivo',
      `"${property.title}" (${property.priceUF.toLocaleString('es-CL')} UF) es ahora tu meta en RoadHome.`,
      'success'
    );
  };

  const toggleFavoriteProperty = (propertyId: string) => {
    setState((prev) => {
      const current = prev.favoritePropertyIds || [];
      const exists = current.includes(propertyId);
      const next = exists
        ? current.filter((id) => id !== propertyId)
        : [...current, propertyId];
      return {
        ...prev,
        favoritePropertyIds: next,
      };
    });
  };

  const submitMortgageSimulation = (
    property: PropertyListing
  ): MortgageApplication => {
    const priceCLP = property.priceUF * state.ufValueCLP;
    const downPaymentRequiredCLP = property.downPaymentUF * state.ufValueCLP;
    const financedAmountUF = property.priceUF - property.downPaymentUF;
    const financedAmountCLP = financedAmountUF * state.ufValueCLP;
    const estimatedDividendCLP = Math.round(
      property.estimatedDividendUF * state.ufValueCLP
    );

    const app: MortgageApplication = {
      id: `mort-${Date.now()}`,
      propertyId: property.id,
      propertyTitle: property.title,
      propertyType: property.propertyType,
      commune: property.commune,
      priceUF: property.priceUF,
      priceCLP,
      downPaymentRequiredUF: property.downPaymentUF,
      downPaymentRequiredCLP,
      downPaymentAvailableCLP: metrics.currentSavings,
      financedAmountUF,
      financedAmountCLP,
      estimatedDividendUF: property.estimatedDividendUF,
      estimatedDividendCLP,
      submittedAt: 'Hoy · Solicitud demostrativa Bci',
    };

    setState((prev) => ({
      ...prev,
      mortgageApplications: [app, ...prev.mortgageApplications],
    }));

    return app;
  };

  const updateSimulationParameters = (params: {
    baseMonthlyIncome?: number;
    baseMonthlyExpenses?: number;
    baseMonthlySavingCapacity?: number;
    initialSavings?: number;
    ufValueCLP?: number;
    downPaymentPercentage?: number;
    unlockThresholdPercent?: number;
  }) => {
    setState((prev) => ({
      ...prev,
      ...params,
    }));
    showToast(
      'Parámetros actualizados',
      'Se recalcularon las proyecciones con los nuevos supuestos de simulación.',
      'info'
    );
  };

  const resetDemo = () => {
    localStorage.removeItem(STORAGE_KEY);
    setState(DEFAULT_PERSISTED_STATE);
    showToast(
      'Demostración reiniciada',
      'Se restauraron los valores iniciales del prototipo ($18.000.000 de ahorro inicial y 4.500 UF).',
      'info'
    );
  };

  return (
    <AppContext.Provider
      value={{
        ...state,
        metrics,
        compatibleProperties,
        toast,
        dismissToast,
        showToast,
        isCelebrationModalOpen,
        closeCelebrationModal,
        openCelebrationModal,
        goToExploreFromCelebration,
        markExploreVisited,
        connectBciAccount,
        setActiveTab,
        setBuilderMode,
        updateArchetypeTags,
        setTagPriority,
        toggleTag,
        cycleTagState,
        clearAllTags,
        changeTagPriority,
        removeTag,
        setPropertyTypePreference,
        saveArchetypeAsGoal,
        addChatMessage,
        addDeposit,
        addFinancialEvent,
        removeFinancialEvent,
        selectPropertyAsNewGoal,
        toggleFavoriteProperty,
        submitMortgageSimulation,
        updateSimulationParameters,
        resetDemo,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useApp debe utilizarse dentro de un AppProvider');
  }
  return ctx;
}

