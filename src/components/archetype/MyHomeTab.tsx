import React, { useRef, useState } from 'react';
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Edit3,
  MapPin,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  getArchetypeHeroImage,
  getFallbackImage,
} from '../../data/mockProperties';
import {
  buildArchetypeSummaryText,
  formatCLP,
  formatUF,
} from '../../utils/financialEngine';
import { ModalDialog } from '../common/ModalDialog';
import { ArchetypeWizard } from './ArchetypeWizard';

export const MyHomeTab: React.FC = () => {
  const {
    archetype,
    metrics,
    compatibleProperties,
    saveArchetypeAsGoal,
    setActiveTab,
  } = useApp();

  const [isEditingWizard, setIsEditingWizard] = useState(!archetype.isSaved);
  const [wizardStartStep, setWizardStartStep] = useState(1);

  // Registro del pie con el que inició para alertar si el cambio altera la meta
  const initialPieRef = useRef<{
    uf: number;
    clp: number;
    wasSaved: boolean;
  }>({
    uf: metrics.downPaymentTargetUF,
    clp: metrics.downPaymentTargetCLP,
    wasSaved: archetype.isSaved,
  });

  const [isConfirmChangeModalOpen, setIsConfirmChangeModalOpen] = useState(false);

  const heroImg = getArchetypeHeroImage(archetype.propertyType);
  const earlyPreviewItems = compatibleProperties.slice(0, 2);

  const handleOpenStep = (stepNumber: number) => {
    setWizardStartStep(stepNumber);
    setIsEditingWizard(true);
  };

  const handleFinishWizard = () => {
    setIsEditingWizard(false);
    setActiveTab('ahorro');
  };

  if (isEditingWizard || !archetype.isSaved) {
    return (
      <ArchetypeWizard
        initialStep={wizardStartStep}
        onFinish={handleFinishWizard}
        onCancel={archetype.isSaved ? () => setIsEditingWizard(false) : undefined}
      />
    );
  }

  return (
    <div className="px-4 py-4 space-y-4">
      {/* Encabezado limpio: Paso 1 de 3 */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--green-dark)] bg-[var(--green-20)] px-3 py-0.5 rounded-full">
            <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
            Paso 1 de 3 · Casa ideal definida
          </span>
          <button
            type="button"
            onClick={() => handleOpenStep(1)}
            className="text-xs font-bold text-[var(--blue-dark)] hover:underline flex items-center gap-1 min-h-[44px] cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Editar todo</span>
          </button>
        </div>
        <h1 className="text-xl font-bold text-[var(--gray-dark)]">
          Tu casa ideal
        </h1>
        <p className="text-xs text-[var(--gray-semidark)]">
          Tu meta inmobiliaria activa. Puedes revisar los detalles o ajustar cualquier sección.
        </p>
      </div>

      {/* Tarjeta Hero de la vivienda guardada */}
      <div className="rounded-3xl bg-white border border-[var(--gray-semilight)] overflow-hidden shadow-xs">
        <div className="relative h-40 w-full bg-[var(--gray-light)]">
          <img
            src={heroImg}
            alt={archetype.propertyType || 'Tu casa ideal'}
            onError={(e) => {
              e.currentTarget.src = getFallbackImage({
                propertyType: archetype.propertyType || 'departamento',
                title: buildArchetypeSummaryText(archetype),
                commune: archetype.communes[0],
                region: archetype.region,
              });
            }}
            className="w-full h-full object-cover"
          />
          <span
            className="top-3 right-3 px-3 py-1 rounded-full bg-white/95 text-xs font-bold text-[var(--gray-dark)] shadow-xs flex items-center gap-1"
            style={{ position: 'absolute' }}
          >
            <Sparkles className="w-3.5 h-3.5 text-[var(--green-dark)]" />
            <span>Meta activa</span>
          </span>
        </div>

        <div className="p-4 space-y-3">
          <p className="text-sm font-semibold text-[var(--gray-dark)] leading-snug">
            {buildArchetypeSummaryText(archetype)}
          </p>

          {/* Cajas de valores estimados */}
          <div className="rounded-2xl bg-[var(--gray-light)] p-3 grid grid-cols-2 gap-3 border border-[var(--gray-semilight)]">
            <div>
              <span className="text-xs text-[var(--gray-semidark)] block">
                Valor estimado
              </span>
              <span className="text-base font-bold text-[var(--gray-dark)] block">
                {formatUF(metrics.propertyEstimatedPriceUF)}
              </span>
              <span className="text-xs text-[var(--gray-semidark)]">
                ≈ {formatCLP(metrics.propertyEstimatedPriceCLP)}
              </span>
            </div>

            <div className="border-l border-[var(--gray-semilight)] pl-3">
              <span className="text-xs text-[var(--green-dark)] font-semibold block">
                Pie necesario ({metrics.downPaymentPercentage}%)
              </span>
              <span className="text-base font-bold text-[var(--green-dark)] block">
                {formatUF(metrics.downPaymentTargetUF)}
              </span>
              <span className="text-xs font-semibold text-[var(--gray-dark)]">
                {formatCLP(metrics.downPaymentTargetCLP)}
              </span>
            </div>
          </div>

          {/* Desglose con accesos directos "Editar por sección" */}
          <div className="space-y-2 pt-1 border-t border-[var(--gray-light)] divide-y divide-[var(--gray-light)]">
            <div className="flex items-center justify-between pt-1 text-xs">
              <div>
                <span className="text-xs text-[var(--gray-semidark)] block">Tipo</span>
                <span className="font-bold capitalize">{archetype.propertyType || 'Departamento'}</span>
              </div>
              <button
                type="button"
                onClick={() => handleOpenStep(1)}
                className="font-bold text-[var(--blue-dark)] hover:underline min-h-[44px] flex items-center cursor-pointer"
              >
                Editar
              </button>
            </div>

            <div className="flex items-center justify-between pt-2 text-xs">
              <div>
                <span className="text-xs text-[var(--gray-semidark)] block">Comunas</span>
                <span className="font-bold">{archetype.communes.join(', ') || 'Ñuñoa'}</span>
              </div>
              <button
                type="button"
                onClick={() => handleOpenStep(2)}
                className="font-bold text-[var(--blue-dark)] hover:underline min-h-[44px] flex items-center cursor-pointer"
              >
                Editar
              </button>
            </div>

            {archetype.propertyType !== 'terreno' && (
              <div className="flex items-center justify-between pt-2 text-xs">
                <div>
                  <span className="text-xs text-[var(--gray-semidark)] block">Distribución</span>
                  <span className="font-bold">
                    {archetype.bedrooms || 2} dorms · {archetype.bathrooms || 2} baños
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleOpenStep(3)}
                  className="font-bold text-[var(--blue-dark)] hover:underline min-h-[44px] flex items-center cursor-pointer"
                >
                  Editar
                </button>
              </div>
            )}

            <div className="flex items-center justify-between pt-2 text-xs">
              <div>
                <span className="text-xs text-[var(--gray-semidark)] block">Preferencias</span>
                <span className="font-bold">
                  {archetype.tags.filter((t) => t.category !== 'tipo' && t.category !== 'ubicacion').length} seleccionadas
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleOpenStep(4)}
                className="font-bold text-[var(--blue-dark)] hover:underline min-h-[44px] flex items-center cursor-pointer"
              >
                Editar
              </button>
            </div>
          </div>

          {/* Botón hacia Ahorro */}
          <button
            type="button"
            onClick={() => setActiveTab('ahorro')}
            className="bci-btn-primary w-full mt-2 cursor-pointer"
          >
            <span>Ir a Mi ahorro</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Ejemplos compatibles preliminares */}
      {earlyPreviewItems.length > 0 && (
        <div className="space-y-2 pt-1">
          <span className="text-xs font-bold text-[var(--gray-semidark)]">
            Inspiración: casas compatibles con tu meta
          </span>
          <div className="space-y-2">
            {earlyPreviewItems.map(({ property, matchScore }) => (
              <div
                key={property.id}
                className="rounded-2xl border border-[var(--gray-semilight)] bg-white p-3 flex items-center gap-3 shadow-2xs"
              >
                <img
                  src={property.image}
                  alt={property.title}
                  onError={(e) => {
                    e.currentTarget.src = getFallbackImage(property);
                  }}
                  className="w-16 h-14 rounded-xl object-cover shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-[var(--gray-dark)] truncate">
                      {property.title}
                    </p>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[var(--green-20)] text-[var(--green-dark)] shrink-0">
                      {matchScore}% afín
                    </span>
                  </div>
                  <p className="text-xs text-[var(--gray-semidark)] truncate">
                    {property.commune} · Ref. {formatUF(property.priceUF)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal de confirmación para cambio de casa que altera el pie */}
      <ModalDialog
        isOpen={isConfirmChangeModalOpen}
        onClose={() => setIsConfirmChangeModalOpen(false)}
        title="Confirmar cambio de casa ideal"
        subtitle="Tu ahorro acumulado se conservará íntegramente"
      >
        <div className="space-y-3 pt-1 text-xs text-[var(--gray-dark)]">
          <div className="p-3.5 rounded-2xl bg-[var(--blue-20)] border border-[var(--blue-40)] space-y-1">
            <p className="font-bold text-sm text-[var(--blue-dark)]">
              Tu nuevo pie será de {formatUF(metrics.downPaymentTargetUF)} ({formatCLP(metrics.downPaymentTargetCLP)})
            </p>
            <p className="text-[var(--gray-semidark)]">
              Tu ahorro acumulado de <strong>{formatCLP(metrics.currentSavings)}</strong> se mantiene intacto. Solo se recalculará tu porcentaje de avance y meses restantes.
            </p>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <button
              type="button"
              onClick={() => {
                setIsConfirmChangeModalOpen(false);
                saveArchetypeAsGoal();
                setActiveTab('ahorro');
              }}
              className="bci-btn-primary w-full"
              autoFocus
            >
              Confirmar cambio
            </button>
            <button
              type="button"
              onClick={() => setIsConfirmChangeModalOpen(false)}
              className="bci-btn-secondary w-full"
            >
              Seguir editando
            </button>
          </div>
        </div>
      </ModalDialog>
    </div>
  );
};
