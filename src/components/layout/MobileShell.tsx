import React, { useEffect, useState } from 'react';
import {
  Building2,
  CheckCircle2,
  Home,
  Info,
  Lock,
  MoreVertical,
  PiggyBank,
  RotateCcw,
  SlidersHorizontal,
  Store,
  X,
  AlertTriangle,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { MainTab } from '../../types/app';
import { determineUserFlowStep } from '../../utils/userFlowEngine';
import { BciLogo } from '../common/BciLogo';
import { ModalDialog } from '../common/ModalDialog';
import { UnlockCelebrationModal } from '../common/UnlockCelebrationModal';

interface MobileShellProps {
  children: React.ReactNode;
}

export const MobileShell: React.FC<MobileShellProps> = ({ children }) => {
  const {
    isBciConnected,
    activeTab,
    setActiveTab,
    metrics,
    archetype,
    toast,
    dismissToast,
    resetDemo,
    baseMonthlyIncome,
    baseMonthlyExpenses,
    baseMonthlySavingCapacity,
    ufValueCLP,
    downPaymentPercentage,
    unlockThresholdPercent,
    updateSimulationParameters,
    hasVisitedExplore,
  } = useApp();

  // Menú de opciones de la demostración (⋯)
  const [isOptionsMenuOpen, setIsOptionsMenuOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isSimConfigOpen, setIsSimConfigOpen] = useState(false);

  // Parámetros de simulación
  const [incomeInput, setIncomeInput] = useState(String(baseMonthlyIncome));
  const [expensesInput, setExpensesInput] = useState(String(baseMonthlyExpenses));
  const [capacityInput, setCapacityInput] = useState(String(baseMonthlySavingCapacity));
  const [ufInput, setUfInput] = useState(String(ufValueCLP));
  const [piePctInput, setPiePctInput] = useState(String(downPaymentPercentage));
  const [thresholdInput, setThresholdInput] = useState(String(unlockThresholdPercent));

  // Auto-cierre del toast a los 6 segundos
  useEffect(() => {
    if (toast) {
      const timer = window.setTimeout(() => {
        dismissToast();
      }, 6000);
      return () => window.clearTimeout(timer);
    }
  }, [toast, dismissToast]);

  const openSimConfig = () => {
    setIncomeInput(String(baseMonthlyIncome));
    setExpensesInput(String(baseMonthlyExpenses));
    setCapacityInput(String(baseMonthlySavingCapacity));
    setUfInput(String(ufValueCLP));
    setPiePctInput(String(downPaymentPercentage));
    setThresholdInput(String(unlockThresholdPercent));
    setIsOptionsMenuOpen(false);
    setIsSimConfigOpen(true);
  };

  const handleSaveSimConfig = (e: React.FormEvent) => {
    e.preventDefault();
    const nextIncome = Math.max(0, Number(incomeInput) || 2500000);
    const nextExpenses = Math.max(0, Number(expensesInput) || 1600000);
    const nextCapacity = Math.max(0, Number(capacityInput) || 600000);
    const nextUf = Math.max(1000, Number(ufInput) || 40000);
    const nextPiePct = Math.min(50, Math.max(5, Number(piePctInput) || 20));
    const nextThreshold = Math.min(100, Math.max(10, Number(thresholdInput) || 85));

    updateSimulationParameters({
      baseMonthlyIncome: nextIncome,
      baseMonthlyExpenses: nextExpenses,
      baseMonthlySavingCapacity: nextCapacity,
      ufValueCLP: nextUf,
      downPaymentPercentage: nextPiePct,
      unlockThresholdPercent: nextThreshold,
    });
    setIsSimConfigOpen(false);
  };

  const handleConfirmReset = () => {
    setIsResetConfirmOpen(false);
    setIsOptionsMenuOpen(false);
    resetDemo();
  };

  // Determinar la pestaña donde se encuentra la siguiente acción sugerida (Next Step)
  const nextStep = determineUserFlowStep({
    archetype,
    savingsProgress: metrics.savingsProgress,
    isHomeMarketUnlocked: metrics.isHomeMarketUnlocked,
    hasVisitedExplore,
  });

  // Título legible para el header según la pestaña
  const getHeaderTitle = (tab: MainTab): string => {
    switch (tab) {
      case 'inicio':
        return 'Tu camino';
      case 'mi-casa':
        return 'Tu casa ideal';
      case 'ahorro':
        return 'Mi ahorro';
      case 'homemarket':
        return 'Explorar casas';
      default:
        return 'Bci';
    }
  };

  const navItems: {
    id: MainTab;
    label: string;
    icon: (isActive: boolean) => React.ReactNode;
    isLocked?: boolean;
    isPendingAction?: boolean;
    isNew?: boolean;
    accessibleLabel?: string;
  }[] = [
    {
      id: 'inicio',
      label: 'Inicio',
      icon: (isActive) => (
        <Home className={`w-6 h-6 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} aria-hidden="true" />
      ),
      isPendingAction: nextStep.targetTab === 'inicio' && activeTab !== 'inicio',
    },
    {
      id: 'mi-casa',
      label: 'Mi casa',
      icon: (isActive) => (
        <Building2 className={`w-6 h-6 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} aria-hidden="true" />
      ),
      isPendingAction: nextStep.targetTab === 'mi-casa' && activeTab !== 'mi-casa',
    },
    {
      id: 'ahorro',
      label: 'Ahorro',
      icon: (isActive) => (
        <PiggyBank className={`w-6 h-6 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} aria-hidden="true" />
      ),
      isPendingAction: nextStep.targetTab === 'ahorro' && activeTab !== 'ahorro',
    },
    {
      id: 'homemarket',
      label: 'Explorar',
      icon: (isActive) => (
        <Store className={`w-6 h-6 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} aria-hidden="true" />
      ),
      isLocked: !metrics.isHomeMarketUnlocked,
      isNew: metrics.isHomeMarketUnlocked && !hasVisitedExplore,
      isPendingAction: nextStep.targetTab === 'homemarket' && activeTab !== 'homemarket',
      accessibleLabel: !metrics.isHomeMarketUnlocked
        ? `Explorar, bloqueado, se activa al ${unlockThresholdPercent}% del pie`
        : 'Explorar casas compatibles',
    },
  ];

  return (
    <div className="min-h-dvh w-full flex justify-center bg-[#E9EEF2] sm:py-3 select-none">
      {/* Contenedor unificado: flex columna, h-dvh fijo para evitar saltos */}
      <div className="w-full max-w-[430px] bg-white sm:rounded-[32px] sm:shadow-xl sm:border sm:border-[var(--gray-semilight)] flex flex-col h-dvh sm:h-[844px] relative overflow-hidden">
        {/* Franja tricolor de marca Bci */}
        <div
          aria-hidden="true"
          className="h-1.5 w-full flex shrink-0"
          style={{
            background:
              'linear-gradient(90deg, var(--red-normal) 0%, var(--yellow-normal) 33%, var(--green-normal) 66%, var(--blue-normal) 100%)',
          }}
        />

        {/* Header institucional limpio */}
        <header className="shrink-0 bg-white border-b border-[var(--gray-light)] px-4 py-3 flex items-center justify-between gap-3 z-20">
          <div className="flex items-center gap-2.5 min-w-0">
            <BciLogo size="sm" />
            <div className="h-4 w-[1px] bg-[var(--gray-semilight)] shrink-0" />
            <div className="truncate">
              <span className="text-xs font-semibold text-[var(--gray-semidark)] block leading-tight">
                Paso a tu primera casa
              </span>
              <h1 className="text-sm font-bold text-[var(--gray-dark)] leading-tight truncate">
                {getHeaderTitle(activeTab)}
              </h1>
            </div>
          </div>

          {isBciConnected && (
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setIsOptionsMenuOpen((prev) => !prev)}
                aria-label="Opciones de la demostración"
                aria-expanded={isOptionsMenuOpen}
                className="w-11 h-11 rounded-xl flex items-center justify-center text-[var(--gray-semidark)] hover:bg-[var(--gray-light)] active:bg-[var(--gray-semilight)] transition-colors cursor-pointer"
              >
                <MoreVertical className="w-5 h-5" aria-hidden="true" />
              </button>

              {/* Menú desplegable flotante de opciones */}
              {isOptionsMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsOptionsMenuOpen(false)}
                    aria-hidden="true"
                  />
                  <div
                    role="menu"
                    className="absolute right-0 top-12 z-50 w-64 rounded-2xl bg-white shadow-xl border border-[var(--gray-semilight)] p-2 space-y-1 text-xs"
                  >
                    <div className="px-3 py-2 border-b border-[var(--gray-light)]">
                      <p className="font-bold text-[var(--gray-dark)]">
                        Opciones de demostración
                      </p>
                      <p className="text-xs text-[var(--gray-semidark)] mt-0.5 leading-snug">
                        Prototipo demostrativo · datos ficticios · no es un sitio oficial de Bci
                      </p>
                    </div>

                    <button
                      type="button"
                      role="menuitem"
                      onClick={openSimConfig}
                      className="w-full min-h-[44px] px-3 py-2 rounded-xl text-left flex items-center gap-2.5 text-[var(--gray-dark)] hover:bg-[var(--gray-light)] transition-colors cursor-pointer"
                    >
                      <SlidersHorizontal className="w-4 h-4 text-[var(--blue-dark)]" aria-hidden="true" />
                      <span>Parámetros de simulación</span>
                    </button>

                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setIsOptionsMenuOpen(false);
                        setIsResetConfirmOpen(true);
                      }}
                      className="w-full min-h-[44px] px-3 py-2 rounded-xl text-left flex items-center gap-2.5 text-[var(--red-normal)] hover:bg-[var(--red-20)] transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-4 h-4" aria-hidden="true" />
                      <span>Reiniciar demostración</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </header>

        {/* Toast flotante accesible (auto-cierre a los 6 s) */}
        <div
          aria-live="polite"
          aria-atomic="true"
          className="px-4 pointer-events-none fixed top-16 left-0 right-0 z-40 max-w-[430px] mx-auto"
        >
          {toast && (
            <div
              className={`pointer-events-auto mt-1 rounded-2xl p-3.5 shadow-lg border flex items-start gap-3 transition-all ${
                toast.tone === 'success'
                  ? 'bg-[var(--green-20)] border-[var(--green-60)] text-[var(--gray-dark)]'
                  : toast.tone === 'warning'
                  ? 'bg-[var(--yellow-20)] border-[var(--yellow-60)] text-[var(--gray-dark)]'
                  : 'bg-[var(--blue-20)] border-[var(--blue-60)] text-[var(--gray-dark)]'
              }`}
            >
              {toast.tone === 'success' ? (
                <CheckCircle2
                  className="w-5 h-5 text-[var(--green-dark)] shrink-0 mt-0.5"
                  aria-hidden="true"
                />
              ) : (
                <Info
                  className="w-5 h-5 text-[var(--blue-dark)] shrink-0 mt-0.5"
                  aria-hidden="true"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold leading-snug">{toast.title}</p>
                <p className="text-xs text-[var(--gray-dark)] mt-0.5 leading-relaxed">
                  {toast.message}
                </p>
              </div>
              <button
                type="button"
                onClick={dismissToast}
                aria-label="Cerrar aviso"
                className="min-w-[44px] min-h-[44px] -mr-2 -mt-2 rounded-lg flex items-center justify-center text-[var(--gray-semidark)] hover:text-[var(--gray-dark)] cursor-pointer"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          )}
        </div>

        {/* Contenido principal: cada pantalla hace scroll de forma natural dentro de main */}
        <main
          id="main-content"
          className="flex-1 min-h-0 w-full overflow-y-auto overflow-x-hidden bg-white"
        >
          {children}
        </main>

        {/* Navbar inferior fijo y unificado (4 pestañas, altura >= 64px) */}
        {isBciConnected && (
          <nav
            aria-label="Navegación principal"
            className="shrink-0 bg-white border-t border-[var(--gray-semilight)] px-2 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] z-30"
          >
            <ul role="list" className="grid grid-cols-4 gap-1 m-0 p-0 list-none">
              {navItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <li key={item.id} className="relative">
                    <button
                      type="button"
                      onClick={() => setActiveTab(item.id)}
                      aria-current={isActive ? 'page' : undefined}
                      aria-label={item.accessibleLabel || item.label}
                      className={`w-full min-h-[64px] rounded-xl flex flex-col items-center justify-center gap-1 relative transition-colors cursor-pointer ${
                        isActive
                          ? 'text-[var(--green-dark)] font-bold'
                          : 'text-[var(--gray-semidark)] hover:bg-[var(--gray-light)] font-medium'
                      }`}
                    >
                      {/* Indicador activo de 3px superior (no solo color) */}
                      {isActive && (
                        <span
                          aria-hidden="true"
                          className="absolute -top-1.5 inset-x-3 h-[3px] bg-[var(--green-dark)] rounded-full"
                        />
                      )}

                      {/* Contenedor de ícono relativo para que las insignias NUNCA descuadren el ícono */}
                      <div className="relative w-7 h-7 flex items-center justify-center">
                        {item.icon(isActive)}

                        {/* Candado para Explorar bloqueado */}
                        {item.isLocked && (
                          <span
                            aria-hidden="true"
                            className="absolute -top-1 -right-2.5 w-4 h-4 rounded-full bg-[var(--yellow-20)] border border-[var(--yellow-80)] text-[var(--gray-dark)] flex items-center justify-center shadow-xs"
                          >
                            <Lock className="w-2.5 h-2.5" />
                          </span>
                        )}

                        {/* Insignia ¡Nuevo! cuando se desbloquea Explorar */}
                        {!item.isLocked && item.isNew && (
                          <span
                            aria-hidden="true"
                            className="absolute -top-2.5 -right-6 px-1.5 py-0.5 rounded-full bg-[var(--green-dark)] text-white text-xs font-bold leading-none tracking-tight shadow-xs animate-pulse"
                          >
                            ¡Nuevo!
                          </span>
                        )}

                        {/* Punto verde de acción pendiente (próximo paso recomendado) */}
                        {!isActive && item.isPendingAction && !item.isNew && (
                          <span
                            aria-hidden="true"
                            className="absolute top-0 right-0 w-2.5 h-2.5 rounded-full bg-[var(--green-dark)] border-2 border-white"
                          />
                        )}
                      </div>

                      <span className="text-xs leading-none">
                        {item.label}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
        )}

        {/* Modal de confirmación para reiniciar demostración */}
        <ModalDialog
          isOpen={isResetConfirmOpen}
          onClose={() => setIsResetConfirmOpen(false)}
          title="¿Reiniciar la demostración?"
          subtitle="Se restablecerán el ahorro inicial ($18.000.000) y la casa ideal demostrativa."
        >
          <div className="space-y-4 pt-1">
            <div className="rounded-2xl bg-[var(--yellow-20)] border border-[var(--yellow-60)] p-3.5 flex items-start gap-3 text-xs text-[var(--gray-dark)]">
              <AlertTriangle className="w-5 h-5 text-[var(--yellow-normal)] shrink-0 mt-0.5" aria-hidden="true" />
              <p className="leading-relaxed">
                Esta acción borrará tus depósitos simulados y cambios de preferencias para volver al estado inicial del prototipo.
              </p>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={handleConfirmReset}
                className="w-full min-h-[48px] rounded-xl bg-[var(--red-normal)] text-white font-semibold text-sm hover:bg-[#b82419] transition-colors cursor-pointer"
              >
                Sí, reiniciar demostración
              </button>
              <button
                type="button"
                onClick={() => setIsResetConfirmOpen(false)}
                className="bci-btn-secondary w-full"
                autoFocus
              >
                Cancelar
              </button>
            </div>
          </div>
        </ModalDialog>

        {/* Modal de supuestos de simulación */}
        <ModalDialog
          isOpen={isSimConfigOpen}
          onClose={() => setIsSimConfigOpen(false)}
          title="Supuestos de simulación"
          subtitle="Datos referenciales y configurables para pruebas de estrés"
        >
          <form onSubmit={handleSaveSimConfig} className="space-y-3.5">
            <div className="bg-[var(--blue-20)] border border-[var(--blue-40)] rounded-xl p-3 text-xs text-[var(--gray-dark)]">
              Estos valores son demostrativos y permiten verificar cómo la app recalcula el pie, la proyección y los desbloqueos en vivo.
            </div>

            <div>
              <label htmlFor="sim-income" className="block text-xs font-semibold text-[var(--gray-dark)] mb-1">
                Ingreso mensual líquido base (CLP)
              </label>
              <input
                id="sim-income"
                name="baseMonthlyIncome"
                type="text"
                inputMode="numeric"
                value={incomeInput}
                onChange={(e) => setIncomeInput(e.target.value.replace(/[^\d]/g, ''))}
                className="bci-input"
              />
            </div>

            <div>
              <label htmlFor="sim-expenses" className="block text-xs font-semibold text-[var(--gray-dark)] mb-1">
                Gastos mensuales estimados (CLP)
              </label>
              <input
                id="sim-expenses"
                name="baseMonthlyExpenses"
                type="text"
                inputMode="numeric"
                value={expensesInput}
                onChange={(e) => setExpensesInput(e.target.value.replace(/[^\d]/g, ''))}
                className="bci-input"
              />
            </div>

            <div>
              <label htmlFor="sim-capacity" className="block text-xs font-semibold text-[var(--gray-dark)] mb-1">
                Capacidad de ahorro mensual inicial (CLP)
              </label>
              <input
                id="sim-capacity"
                name="baseMonthlySavingCapacity"
                type="text"
                inputMode="numeric"
                value={capacityInput}
                onChange={(e) => setCapacityInput(e.target.value.replace(/[^\d]/g, ''))}
                className="bci-input"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="sim-uf" className="block text-xs font-semibold text-[var(--gray-dark)] mb-1">
                  Valor UF simulada ($)
                </label>
                <input
                  id="sim-uf"
                  name="ufValueCLP"
                  type="text"
                  inputMode="numeric"
                  value={ufInput}
                  onChange={(e) => setUfInput(e.target.value.replace(/[^\d]/g, ''))}
                  className="bci-input"
                />
              </div>

              <div>
                <label htmlFor="sim-pie-pct" className="block text-xs font-semibold text-[var(--gray-dark)] mb-1">
                  Porcentaje de pie (%)
                </label>
                <input
                  id="sim-pie-pct"
                  name="downPaymentPercentage"
                  type="text"
                  inputMode="numeric"
                  value={piePctInput}
                  onChange={(e) => setPiePctInput(e.target.value.replace(/[^\d]/g, ''))}
                  className="bci-input"
                />
              </div>
            </div>

            <div>
              <label htmlFor="sim-threshold" className="block text-xs font-semibold text-[var(--gray-dark)] mb-1">
                Umbral de desbloqueo (% del pie)
              </label>
              <input
                id="sim-threshold"
                name="unlockThresholdPercent"
                type="text"
                inputMode="numeric"
                value={thresholdInput}
                onChange={(e) => setThresholdInput(e.target.value.replace(/[^\d]/g, ''))}
                className="bci-input"
              />
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <button type="submit" className="bci-btn-primary w-full">
                Guardar supuestos
              </button>
              <button
                type="button"
                onClick={() => {
                  resetDemo();
                  setIsSimConfigOpen(false);
                }}
                className="bci-btn-secondary w-full"
              >
                Restaurar valores de fábrica
              </button>
            </div>
          </form>
        </ModalDialog>

        {/* Modal de celebración de desbloqueo memorable */}
        <UnlockCelebrationModal />
      </div>
    </div>
  );
};
