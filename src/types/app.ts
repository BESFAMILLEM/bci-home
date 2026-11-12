import { DeveloperId, Developer, getDeveloper } from '../data/developers';

export type { DeveloperId, Developer };
export { getDeveloper };

export type PropertyType = 'departamento' | 'casa' | 'parcela' | 'terreno';

export type PreferencePriority = 'indispensable' | 'preferible' | 'opcional';

export type PreferenceCategory =
  | 'ubicacion'
  | 'tipo'
  | 'conectividad'
  | 'interior'
  | 'exterior';

export interface PreferenceTag {
  id: string;
  label: string;
  category: PreferenceCategory;
  priority: PreferencePriority;
  isCustom?: boolean;
}

export interface HousingArchetype {
  propertyType: PropertyType | null;
  region: string;
  communes: string[];
  bedrooms: number | null;
  bathrooms: number | null;
  tags: PreferenceTag[];
  /** Si el usuario seleccionó una propiedad específica de HomeMarket como meta */
  targetPropertyId?: string | null;
  /** Título personalizado si se eligió una propiedad específica */
  targetPropertyTitle?: string | null;
  /** Precio en UF de la propiedad específica seleccionada */
  customEstimatedPriceUF?: number | null;
  /** Indica si el usuario ya guardó formalmente su arquetipo al menos una vez */
  isSaved: boolean;
}

export interface SimulatedMovement {
  id: string;
  date: string;
  description: string;
  amountCLP: number;
  type: 'credit' | 'debit';
  category: string;
}

export interface DepositRecord {
  id: string;
  amountCLP: number;
  dateLabel: string;
  note: string;
}

export type EventCategory = 'positive' | 'negative';
export type EventType = 'income' | 'expense';
export type EventFrequency = 'once' | 'recurring';

export interface FinancialEvent {
  id: string;
  title: string;
  category: EventCategory;
  type: EventType;
  frequency: EventFrequency;
  amountCLP: number;
  /** 0 = ocurre inmediatamente (mes actual), >0 = ocurre en N meses hacia adelante */
  effectiveMonthOffset: number;
  dateLabel: string;
  description?: string;
  createdAt: string;
}

export interface PropertyListing {
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
  downPaymentPercent: number;
  downPaymentUF: number;
  estimatedDividendUF: number;
  rentEstimateUF: number;
  image: string;
  gallery: string[];
  features: string[];
  connectivity: string[];
  description: string;
}

export type PropertyFinancialStatus = 'available' | 'close' | 'needs_more';

export interface ScoredProperty {
  property: PropertyListing;
  matchScore: number;
  matchedReasons: string[];
  missingPreferable: string[];
  downPaymentCLP: number;
  priceCLP: number;
  estimatedDividendCLP: number;
  rentEstimateCLP: number;
  coveragePercent: number;
  remainingForPieCLP: number;
  financialStatus: PropertyFinancialStatus;
}

export interface MortgageApplication {
  id: string;
  propertyId: string;
  propertyTitle: string;
  propertyType: PropertyType;
  commune: string;
  priceUF: number;
  priceCLP: number;
  downPaymentRequiredUF: number;
  downPaymentRequiredCLP: number;
  downPaymentAvailableCLP: number;
  financedAmountUF: number;
  financedAmountCLP: number;
  estimatedDividendUF: number;
  estimatedDividendCLP: number;
  submittedAt: string;
}

export interface ChatMessage {
  id: string;
  sender: 'agent' | 'user';
  text: string;
  timestamp: string;
  detectedUpdates?: string[];
  suggestions?: string[];
}

export type MainTab = 'inicio' | 'mi-casa' | 'ahorro' | 'homemarket';

export interface FinancialMetrics {
  ufValueCLP: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  baseMonthlySavingCapacity: number;
  monthlySavingCapacity: number;
  currentSavings: number;
  propertyEstimatedPriceUF: number;
  propertyEstimatedPriceCLP: number;
  downPaymentPercentage: number;
  downPaymentTargetUF: number;
  downPaymentTargetCLP: number;
  savingsProgress: number;
  remainingAmount: number;
  estimatedMonthsRemaining: number | null;
  estimatedCompletionDate: string | null;
  futureOneTimeNetAdjustmentCLP: number;
  isGoalReached: boolean;
  isHomeMarketUnlocked: boolean;
  unlockReason: 'progress_85' | 'compatible_property_covered' | 'locked';
}

