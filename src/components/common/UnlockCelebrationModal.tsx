import React from 'react';
import { Sparkles, ArrowRight, Store, CheckCircle2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ModalDialog } from './ModalDialog';

export const UnlockCelebrationModal: React.FC = () => {
  const {
    isCelebrationModalOpen,
    closeCelebrationModal,
    goToExploreFromCelebration,
    compatibleProperties,
    metrics,
  } = useApp();

  if (!isCelebrationModalOpen) return null;

  const isCoveredReason = metrics.unlockReason === 'compatible_property_covered';
  const is100Percent = metrics.savingsProgress >= 100;

  const title = is100Percent
    ? '¡Completaste el 100% de tu pie!'
    : isCoveredReason
    ? '¡El pie de una casa está 100% cubierto!'
    : '¡Llegaste al 85% de tu pie!';

  const subtitle = is100Percent
    ? 'Tienes el pie total para tu vivienda ideal. Ya puedes simular tu crédito hipotecario.'
    : 'Desbloqueaste el catálogo. Ya puedes explorar casas reales que encajan con tu ahorro y tus gustos.';

  return (
    <ModalDialog
      isOpen={isCelebrationModalOpen}
      onClose={closeCelebrationModal}
      title=""
    >
      <div className="text-center py-2 space-y-4">
        {/* Ícono de celebración Bci */}
        <div className="mx-auto w-16 h-16 rounded-2xl bg-[var(--green-20)] border border-[var(--green-60)] text-[var(--green-dark)] flex items-center justify-center shadow-xs">
          <Sparkles className="w-8 h-8" aria-hidden="true" />
        </div>

        <div className="space-y-1.5">
          <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-bold bg-[var(--green-20)] text-[var(--green-dark)]">
            <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
            Hito desbloqueado
          </span>
          <h2 className="text-xl font-bold text-[var(--gray-dark)] leading-tight">
            {title}
          </h2>
          <p className="text-sm text-[var(--gray-semidark)] leading-relaxed max-w-xs mx-auto">
            {subtitle}
          </p>
        </div>

        {/* Tarjeta con dato concreto */}
        <div className="rounded-2xl bg-[var(--gray-light)] border border-[var(--gray-semilight)] p-3.5 flex items-center justify-between text-left">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--blue-20)] text-[var(--blue-dark)] flex items-center justify-center shrink-0">
              <Store className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-xs text-[var(--gray-semidark)] font-medium">
                Propiedades para ti
              </p>
              <p className="text-sm font-bold text-[var(--gray-dark)]">
                {compatibleProperties.length} casas compatibles
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-[var(--green-dark)] bg-[var(--green-20)] px-2.5 py-1 rounded-full">
            Listas
          </span>
        </div>

        {/* Acciones */}
        <div className="space-y-2 pt-2">
          <button
            type="button"
            onClick={goToExploreFromCelebration}
            className="bci-btn-primary w-full"
            autoFocus
          >
            <span>Explorar casas para ti</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={closeCelebrationModal}
            className="bci-btn-secondary w-full"
          >
            Seguir en mi ahorro
          </button>
        </div>
      </div>
    </ModalDialog>
  );
};

