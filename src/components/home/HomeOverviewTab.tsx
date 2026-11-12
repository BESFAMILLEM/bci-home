import React, { useState } from 'react';
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Lock,
  PiggyBank,
  ShieldCheck,
  Sparkles,
  Store,
  Wallet,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatCLP, formatUF } from '../../utils/financialEngine';
import { determineUserFlowStep } from '../../utils/userFlowEngine';
import { UnlockPersistentBanner } from '../common/UnlockPersistentBanner';

export const HomeOverviewTab: React.FC = () => {
  const {
    archetype,
    metrics,
    compatibleProperties,
    setActiveTab,
    unlockThresholdPercent,
    hasVisitedExplore,
  } = useApp();

  const [isFinancialProfileOpen, setIsFinancialProfileOpen] = useState(false);

  // Máquina de estados: determina el único próximo paso recomendado
  const nextStep = determineUserFlowStep({
    archetype,
    savingsProgress: metrics.savingsProgress,
    isHomeMarketUnlocked: metrics.isHomeMarketUnlocked,
    hasVisitedExplore,
  });

  const typeLabel =
    archetype.propertyType === 'casa'
      ? 'Casa'
      : archetype.propertyType === 'parcela'
      ? 'Parcela'
      : archetype.propertyType === 'terreno'
      ? 'Terreno'
      : 'Depto';

  const communeLabel = archetype.communes[0] || archetype.region || 'Ñuñoa';

  return (
    <div className="flex flex-col min-h-full">
      {/* Banner persistente de desbloqueo si aplica */}
      <UnlockPersistentBanner />

      <div className="px-4 py-4 space-y-4">
        {/* Encabezado */}
        <div>
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--green-dark)] bg-[var(--green-20)] px-2.5 py-0.5 rounded-full">
            <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
            Bci primera vivienda
          </span>
          <h1 className="text-2xl font-bold text-[var(--gray-dark)] mt-1 tracking-tight">
            Tu camino a la primera casa
          </h1>
          <p className="text-xs text-[var(--gray-semidark)] mt-0.5">
            Sigue tu avance paso a paso para reunir tu pie y elegir tu hogar.
          </p>
        </div>

        {/* STEPPER DE 3 PASOS */}
        <div className="rounded-2xl bg-[var(--gray-light)] border border-[var(--gray-semilight)] p-3">
          <ol role="list" className="grid grid-cols-3 gap-2 m-0 p-0 list-none">
            {/* Paso 1: Casa ideal */}
            <li className="flex flex-col items-center text-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  archetype.isSaved
                    ? 'bg-[var(--green-dark)] text-white'
                    : 'bg-[var(--blue-dark)] text-white ring-4 ring-[var(--blue-20)]'
                }`}
              >
                {archetype.isSaved ? <CheckCircle2 className="w-4 h-4" /> : '1'}
              </div>
              <span className="text-xs font-bold text-[var(--gray-dark)] mt-1.5 leading-tight">
                1. Casa ideal
              </span>
              <span className="text-xs text-[var(--gray-semidark)]">
                {archetype.isSaved ? 'Definida' : 'Pendiente'}
              </span>
            </li>

            {/* Paso 2: Ahorrar el pie */}
            <li className="flex flex-col items-center text-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  metrics.savingsProgress >= 100
                    ? 'bg-[var(--green-dark)] text-white'
                    : archetype.isSaved
                    ? 'bg-[var(--blue-dark)] text-white ring-4 ring-[var(--blue-20)]'
                    : 'bg-white border border-[var(--gray-semilight)] text-[var(--gray-semidark)]'
                }`}
              >
                {metrics.savingsProgress >= 100 ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  '2'
                )}
              </div>
              <span className="text-xs font-bold text-[var(--gray-dark)] mt-1.5 leading-tight">
                2. Ahorrar pie
              </span>
              <span className="text-xs text-[var(--gray-semidark)]">
                {metrics.savingsProgress}%
              </span>
            </li>

            {/* Paso 3: Explorar casas */}
            <li className="flex flex-col items-center text-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  metrics.isHomeMarketUnlocked
                    ? 'bg-[var(--green-dark)] text-white ring-4 ring-[var(--green-20)]'
                    : 'bg-white border border-[var(--gray-semilight)] text-[var(--gray-semidark)]'
                }`}
              >
                {metrics.isHomeMarketUnlocked ? (
                  <Sparkles className="w-4 h-4" />
                ) : (
                  <Lock className="w-3.5 h-3.5" />
                )}
              </div>
              <span className="text-xs font-bold text-[var(--gray-dark)] mt-1.5 leading-tight">
                3. Explorar
              </span>
              <span className="text-xs text-[var(--gray-semidark)]">
                {metrics.isHomeMarketUnlocked ? 'Disponible' : `${unlockThresholdPercent}%`}
              </span>
            </li>
          </ol>
        </div>

        {/* =================================================================== */}
        {/* UNA SOLA TARJETA DESTACADA: "TU PRÓXIMO PASO" (VON RESTORFF) */}
        {/* =================================================================== */}
        <section
          aria-labelledby="next-step-heading"
          className="rounded-3xl bg-white border-2 border-[var(--green-dark)] p-5 shadow-sm space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[var(--green-20)] text-[var(--green-dark)]">
              <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Tu próximo paso · {nextStep.stepLabel}</span>
            </span>

            <span className="text-xs font-bold text-[var(--gray-semidark)]">
              Paso {nextStep.stepNumber} de 3
            </span>
          </div>

          <div>
            <h2
              id="next-step-heading"
              className="text-xl font-bold text-[var(--gray-dark)] leading-tight"
            >
              {nextStep.title}
            </h2>
            <p className="text-xs text-[var(--gray-semidark)] mt-1 leading-relaxed">
              {nextStep.description}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setActiveTab(nextStep.targetTab)}
            className="bci-btn-primary w-full text-base shadow-xs cursor-pointer flex items-center justify-center gap-2 rounded-2xl"
          >
            <span>{nextStep.buttonLabel}</span>
            <ArrowRight className="w-5 h-5 shrink-0" aria-hidden="true" />
          </button>
        </section>

        {/* RESUMEN COMPACTO DEL ESTADO ACTUAL */}
        <section className="rounded-2xl bg-white border border-[var(--gray-semilight)] p-4 shadow-2xs space-y-3">
          <h3 className="text-xs font-bold text-[var(--gray-semidark)] uppercase tracking-wider">
            Resumen de tu avance
          </h3>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-[var(--gray-light)]">
              <span className="text-xs text-[var(--gray-semidark)] block">
                Tu casa ideal
              </span>
              <p className="text-sm font-bold text-[var(--gray-dark)] mt-0.5 truncate">
                {typeLabel} en {communeLabel}
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('mi-casa')}
                className="text-xs font-bold text-[var(--blue-dark)] hover:underline mt-1 block cursor-pointer"
              >
                Ver detalles
              </button>
            </div>

            <div className="p-3 rounded-xl bg-[var(--green-20)]/60 border border-[var(--green-60)]">
              <span className="text-xs text-[var(--green-dark)] font-semibold block">
                Pie acumulado ({metrics.savingsProgress}%)
              </span>
              <p className="text-sm font-bold text-[var(--green-dark)] mt-0.5">
                {formatCLP(metrics.currentSavings)}
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('ahorro')}
                className="text-xs font-bold text-[var(--green-dark)] hover:underline mt-1 block cursor-pointer"
              >
                Ir a depositar
              </button>
            </div>
          </div>
        </section>

        {/* PERFIL FINANCIERO SIMULADO (COLAPSABLE) */}
        <section className="rounded-2xl bg-white border border-[var(--gray-semilight)] overflow-hidden shadow-2xs">
          <button
            type="button"
            onClick={() => setIsFinancialProfileOpen((prev) => !prev)}
            aria-expanded={isFinancialProfileOpen}
            className="w-full p-3.5 flex items-center justify-between text-left hover:bg-[var(--gray-light)]/50 transition-colors cursor-pointer min-h-[48px]"
          >
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-[var(--blue-dark)]" />
              <span className="text-xs font-bold text-[var(--gray-dark)]">
                Mi perfil financiero simulado
              </span>
            </div>

            {isFinancialProfileOpen ? (
              <ChevronUp className="w-4 h-4 text-[var(--gray-semidark)]" />
            ) : (
              <ChevronDown className="w-4 h-4 text-[var(--gray-semidark)]" />
            )}
          </button>

          {isFinancialProfileOpen && (
            <div className="p-3.5 pt-0 border-t border-[var(--gray-light)] space-y-2">
              <div className="grid grid-cols-2 gap-2 text-xs pt-2">
                <div className="p-2.5 rounded-xl bg-[var(--gray-light)]">
                  <span className="text-xs text-[var(--gray-semidark)] block">
                    Ingreso mensual líquido
                  </span>
                  <span className="font-bold text-[var(--gray-dark)]">
                    {formatCLP(metrics.monthlyIncome)}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-[var(--gray-light)]">
                  <span className="text-xs text-[var(--gray-semidark)] block">
                    Gastos fijos estimados
                  </span>
                  <span className="font-bold text-[var(--gray-dark)]">
                    {formatCLP(metrics.monthlyExpenses)}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-[var(--blue-20)]">
                  <span className="text-xs text-[var(--blue-dark)] block">
                    Capacidad mensual
                  </span>
                  <span className="font-bold text-[var(--blue-dark)]">
                    {formatCLP(metrics.monthlySavingCapacity)}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-[var(--green-20)]">
                  <span className="text-xs text-[var(--green-dark)] block">
                    Ahorro acumulado
                  </span>
                  <span className="font-bold text-[var(--green-dark)]">
                    {formatCLP(metrics.currentSavings)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
