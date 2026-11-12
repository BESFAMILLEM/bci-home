import { HousingArchetype, MainTab } from '../types/app';

export type UserFlowStep = 'A' | 'B' | 'C' | 'D';

export interface NextStepInfo {
  state: UserFlowStep;
  stepNumber: 1 | 2 | 3;
  stepLabel: string;
  title: string;
  description: string;
  buttonLabel: string;
  targetTab: MainTab;
}

export interface DetermineNextStepParams {
  archetype: HousingArchetype;
  savingsProgress: number;
  isHomeMarketUnlocked: boolean;
  hasVisitedExplore: boolean;
}

/**
 * Función pura que evalúa la máquina de estados del usuario según los 4 estados principales:
 *
 * - Estado A: Sin casa guardada -> Paso 1: "Define tu casa ideal" (lleva a 'mi-casa')
 * - Estado B: Casa guardada y avance < umbral -> Paso 2: "Haz tu depósito" (lleva a 'ahorro')
 * - Estado C: Avance >= umbral y aún no visitó Explorar -> Paso 3: "¡Explora casas para ti!" (lleva a 'homemarket')
 * - Estado D: Avance >= 100% -> Paso 3: "Simula tu crédito con una casa que te guste" (lleva a 'homemarket')
 *
 * Si ya desbloqueó y ya visitó Explorar pero tiene < 100%, su próximo paso es continuar ahorrando.
 */
export function determineUserFlowStep(params: DetermineNextStepParams): NextStepInfo {
  const { archetype, savingsProgress, isHomeMarketUnlocked, hasVisitedExplore } = params;

  // Estado A: Sin casa guardada formalmente
  if (!archetype.isSaved) {
    return {
      state: 'A',
      stepNumber: 1,
      stepLabel: 'Paso 1 de 3',
      title: 'Define tu casa ideal',
      description: 'Elige el tipo de vivienda, comuna y comodidades para calcular tu pie estimado.',
      buttonLabel: 'Empezar ahora',
      targetTab: 'mi-casa',
    };
  }

  // Estado D: 100% del pie alcanzado
  if (savingsProgress >= 100) {
    return {
      state: 'D',
      stepNumber: 3,
      stepLabel: 'Paso 3 de 3',
      title: '¡Meta de pie cumplida!',
      description: 'Ya tienes el 100% de tu pie. Explora las casas y simula tu evaluación hipotecaria Bci.',
      buttonLabel: 'Simular mi crédito hipotecario',
      targetTab: 'homemarket',
    };
  }

  // Estado C: HomeMarket desbloqueado pero aún no visitado
  if (isHomeMarketUnlocked && !hasVisitedExplore) {
    return {
      state: 'C',
      stepNumber: 3,
      stepLabel: 'Paso 3 de 3',
      title: '¡Ya puedes explorar casas!',
      description: 'Alcanzaste el avance necesario. Revisa propiedades reales compatibles con tu pie ahorrado.',
      buttonLabel: 'Explorar casas para ti',
      targetTab: 'homemarket',
    };
  }

  // Estado B: Ahorrando hacia el pie (avance < umbral o ya visitó Explorar y sigue juntando el 100%)
  const isClose = savingsProgress >= 70;
  return {
    state: 'B',
    stepNumber: 2,
    stepLabel: 'Paso 2 de 3',
    title: isHomeMarketUnlocked ? 'Sigue sumando para tu pie' : 'Haz tu depósito mensual',
    description: isHomeMarketUnlocked
      ? 'Continúa ahorrando en tu cuenta para alcanzar el 100% del pie de tu casa ideal.'
      : isClose
      ? '¡Estás muy cerca de desbloquear Explorar casas! Realiza un abono para alcanzar el 85%.'
      : 'Deposita en tu Cuenta Ahorro Vivienda Bci para acercarte a la meta de tu pie.',
    buttonLabel: 'Depositar en mi ahorro',
    targetTab: 'ahorro',
  };
}

