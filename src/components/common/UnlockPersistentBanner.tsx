import React from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const UnlockPersistentBanner: React.FC = () => {
  const { metrics, hasVisitedExplore, setActiveTab } = useApp();

  // Se muestra solo mientras HomeMarket esté desbloqueado y el usuario no haya visitado aún la pestaña Explorar
  if (!metrics.isHomeMarketUnlocked || hasVisitedExplore) {
    return null;
  }

  return (
    <aside
      aria-label="Aviso de casas desbloqueadas"
      className="bg-[var(--green-20)] border-b border-[var(--green-60)] px-4 py-2.5 flex items-center justify-between gap-3 text-[var(--gray-dark)]"
    >
      <div className="flex items-center gap-2 min-w-0">
        <span className="w-7 h-7 rounded-lg bg-[var(--green-dark)] text-white flex items-center justify-center shrink-0">
          <Sparkles className="w-4 h-4" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-bold text-[var(--green-dark)] leading-tight">
            ¡Desbloqueaste Explorar casas!
          </p>
          <p className="text-xs text-[var(--gray-semidark)] leading-tight truncate">
            Ya puedes ver las propiedades que encajan con tu ahorro.
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={() => setActiveTab('homemarket')}
        className="px-3 py-1.5 rounded-xl bg-[var(--green-dark)] text-white text-xs font-bold shrink-0 flex items-center gap-1 hover:bg-[#14632b] transition-colors cursor-pointer"
      >
        <span>Explorar</span>
        <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
      </button>
    </aside>
  );
};

