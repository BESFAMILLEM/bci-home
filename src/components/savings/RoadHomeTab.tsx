import React, { useState } from 'react';
import {
  ArrowRight,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  HelpCircle,
  Lock,
  PiggyBank,
  Plus,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Undo2,
  Wallet,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { EDUCATION_ARTICLES, EducationArticle } from '../../data/educationArticles';
import { EventCategory, EventFrequency, EventType } from '../../types/app';
import { formatCLP, formatUF } from '../../utils/financialEngine';
import { ModalDialog } from '../common/ModalDialog';
import { UnlockPersistentBanner } from '../common/UnlockPersistentBanner';

interface PresetEventOption {
  label: string;
  category: EventCategory;
  type: EventType;
  frequency: EventFrequency;
  suggestedAmount: number;
  defaultFutureOffset: number;
}

const POSITIVE_EVENT_PRESETS: PresetEventOption[] = [
  {
    label: 'Me aumentaron el sueldo',
    category: 'positive',
    type: 'income',
    frequency: 'recurring',
    suggestedAmount: 300000,
    defaultFutureOffset: 0,
  },
  {
    label: 'Recibí un bono laboral',
    category: 'positive',
    type: 'income',
    frequency: 'once',
    suggestedAmount: 800000,
    defaultFutureOffset: 0,
  },
  {
    label: 'Disminuyeron mis gastos fijos',
    category: 'positive',
    type: 'income',
    frequency: 'recurring',
    suggestedAmount: 150000,
    defaultFutureOffset: 0,
  },
];

const NEGATIVE_EVENT_PRESETS: PresetEventOption[] = [
  {
    label: 'Tuve un gasto inesperado hoy',
    category: 'negative',
    type: 'expense',
    frequency: 'once',
    suggestedAmount: 500000,
    defaultFutureOffset: 0,
  },
  {
    label: 'Tendré un gasto programado a futuro',
    category: 'negative',
    type: 'expense',
    frequency: 'once',
    suggestedAmount: 800000,
    defaultFutureOffset: 2,
  },
  {
    label: 'Aumentó mi arriendo u obligación',
    category: 'negative',
    type: 'expense',
    frequency: 'recurring',
    suggestedAmount: 120000,
    defaultFutureOffset: 0,
  },
];

export const RoadHomeTab: React.FC = () => {
  const {
    archetype,
    metrics,
    deposits,
    events,
    unlockThresholdPercent,
    addDeposit,
    addFinancialEvent,
    removeFinancialEvent,
    setActiveTab,
  } = useApp();

  // Modal Depositar
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [depositAmountInput, setDepositAmountInput] = useState('500000');
  const [depositError, setDepositError] = useState('');

  // Acordeón de cambios en la economía
  const [isEconomyAccordionOpen, setIsEconomyAccordionOpen] = useState(false);

  // Modal para agregar evento
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [eventCategory, setEventCategory] = useState<EventCategory>('positive');
  const [eventTitle, setEventTitle] = useState('Me aumentaron el sueldo');
  const [eventType, setEventType] = useState<EventType>('income');
  const [eventFrequency, setEventFrequency] = useState<EventFrequency>('recurring');
  const [eventAmountInput, setEventAmountInput] = useState('300000');
  const [eventMonthOffset, setEventMonthOffset] = useState<number>(0);
  const [eventError, setEventError] = useState('');

  // Modal de lectura de cápsula educativa
  const [selectedArticle, setSelectedArticle] = useState<EducationArticle | null>(null);

  const handleSelectPresetEvent = (preset: PresetEventOption) => {
    setEventCategory(preset.category);
    setEventTitle(preset.label);
    setEventType(preset.type);
    setEventFrequency(preset.frequency);
    setEventAmountInput(String(preset.suggestedAmount));
    setEventMonthOffset(preset.defaultFutureOffset);
    setEventError('');
  };

  const handleConfirmDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    const numeric = Number(depositAmountInput.replace(/[^\d]/g, '').trim());
    if (!Number.isFinite(numeric) || numeric <= 0) {
      setDepositError('Ingresa un monto mayor a $0.');
      return;
    }
    setDepositError('');
    addDeposit(numeric, 'Depósito en Ahorro Vivienda');
    setIsDepositModalOpen(false);
  };

  const handleConfirmEvent = (e: React.FormEvent) => {
    e.preventDefault();
    const numeric = Number(eventAmountInput.replace(/[^\d]/g, '').trim());
    if (!Number.isFinite(numeric) || numeric <= 0) {
      setEventError('Ingresa un monto válido mayor a $0.');
      return;
    }
    if (!eventTitle.trim()) {
      setEventError('Selecciona el acontecimiento.');
      return;
    }

    const dateLabel =
      eventMonthOffset === 0
        ? 'Mes actual'
        : eventMonthOffset === 1
        ? 'Próximo mes'
        : `En ${eventMonthOffset} meses`;

    addFinancialEvent({
      title: eventTitle.trim(),
      category: eventCategory,
      type: eventType,
      frequency: eventFrequency,
      amountCLP: numeric,
      effectiveMonthOffset: eventFrequency === 'once' ? eventMonthOffset : 0,
      dateLabel,
    });

    setEventError('');
    setIsEventModalOpen(false);
  };

  const typeLabel =
    archetype.propertyType === 'casa'
      ? 'Casa'
      : archetype.propertyType === 'parcela'
      ? 'Parcela'
      : archetype.propertyType === 'terreno'
      ? 'Terreno'
      : 'Depto';

  const locationLabel = archetype.communes[0] || archetype.region || 'Ñuñoa';

  // Monto restante para el umbral de desbloqueo (85%)
  const amountNeededForUnlock = Math.max(
    0,
    Math.ceil(
      (metrics.downPaymentTargetCLP * unlockThresholdPercent) / 100 -
        metrics.currentSavings
    )
  );

  const hasNegativeEvents = events.some((e) => e.category === 'negative');

  return (
    <div className="flex flex-col min-h-full">
      {/* Banner persistente de casas desbloqueadas (si aplica) */}
      <UnlockPersistentBanner />

      <div className="px-4 py-4 space-y-4">
        {/* Encabezado limpio de Paso 2 */}
        <div className="flex items-center justify-between gap-2">
          <div>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--green-dark)] bg-[var(--green-20)] px-2.5 py-0.5 rounded-full">
              Paso 2 de 3 · Mi ahorro
            </span>
            <h1 className="text-xl font-bold text-[var(--gray-dark)] mt-1">
              Juntando el pie
            </h1>
          </div>

          <button
            type="button"
            onClick={() => setActiveTab('mi-casa')}
            className="text-xs font-bold text-[var(--blue-dark)] hover:underline flex items-center gap-1 min-h-[44px] cursor-pointer"
          >
            <Building2 className="w-4 h-4" />
            <span>Cambiar casa</span>
          </button>
        </div>

        {/* =================================================================== */}
        {/* 1. TARJETA PRINCIPAL: META, AHORRO ACTUAL Y BOTÓN DEPOSITAR */}
        {/* =================================================================== */}
        <section
          aria-labelledby="savings-main-heading"
          className="rounded-3xl bg-white border border-[var(--gray-semilight)] p-4 shadow-xs space-y-3.5"
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="text-xs font-semibold text-[var(--gray-semidark)] block">
                Tu meta: {typeLabel} en {locationLabel}
              </span>
              <h2
                id="savings-main-heading"
                className="text-2xl font-bold text-[var(--gray-dark)] leading-tight mt-0.5"
              >
                {formatCLP(metrics.currentSavings)}
              </h2>
              <span className="text-xs text-[var(--gray-semidark)]">
                de {formatCLP(metrics.downPaymentTargetCLP)} (Pie {metrics.downPaymentPercentage}%)
              </span>
            </div>

            <div className="text-right">
              <span className="text-lg font-bold text-[var(--green-dark)] block">
                {metrics.savingsProgress}%
              </span>
              <span className="text-xs font-semibold text-[var(--blue-dark)] bg-[var(--blue-20)] px-2 py-0.5 rounded-full inline-block">
                Meta: {formatUF(metrics.downPaymentTargetUF)}
              </span>
            </div>
          </div>

          {/* Barra de progreso visual con marcador visible del umbral */}
          <div className="space-y-1.5 pt-1">
            <div className="relative h-4 w-full rounded-full bg-[var(--gray-light)] overflow-hidden border border-[var(--gray-semilight)]">
              <div
                className="h-full rounded-full bg-[var(--green-dark)] transition-all duration-500"
                style={{ width: `${Math.min(100, metrics.savingsProgress)}%` }}
              />
              {/* Marcador visible al 85% */}
              <div
                title={`Desbloqueas Explorar (${unlockThresholdPercent}%)`}
                className="top-0 bottom-0 w-1 bg-[var(--blue-dark)] z-10"
                style={{ left: `${unlockThresholdPercent}%`, position: 'absolute' }}
              />
            </div>

            <div className="flex items-center justify-between text-xs text-[var(--gray-semidark)] font-medium">
              <span>$0</span>
              <span className="text-[var(--blue-dark)] font-bold text-xs flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Desbloqueas Explorar ({unlockThresholdPercent}%)
              </span>
              <span className="font-semibold">Pie 100%</span>
            </div>
          </div>

          {/* Botón primario dominante: Depositar (48px) */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setIsDepositModalOpen(true)}
              className="bci-btn-primary w-full shadow-xs cursor-pointer text-base flex items-center justify-center gap-2 rounded-2xl"
            >
              <Plus className="w-5 h-5 stroke-[2.5] shrink-0" />
              <span>Depositar</span>
              <span className="text-xs font-normal opacity-85 ml-1">
                (Simulación)
              </span>
            </button>
          </div>
        </section>

        {/* =================================================================== */}
        {/* 2. TARJETA "PRÓXIMO HITO" */}
        {/* =================================================================== */}
        <section className="rounded-2xl bg-[var(--gray-light)] border border-[var(--gray-semilight)] p-3.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                metrics.isHomeMarketUnlocked
                  ? 'bg-[var(--green-20)] text-[var(--green-dark)]'
                  : 'bg-[var(--blue-20)] text-[var(--blue-dark)]'
              }`}
            >
              {metrics.isHomeMarketUnlocked ? (
                <Sparkles className="w-5 h-5" />
              ) : (
                <Lock className="w-5 h-5" />
              )}
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-[var(--gray-semidark)] uppercase tracking-wider block">
                Próximo hito
              </span>
              {!metrics.isHomeMarketUnlocked ? (
                <p className="text-xs font-bold text-[var(--gray-dark)] leading-tight">
                  Te faltan {formatCLP(amountNeededForUnlock)} para desbloquear Explorar casas
                </p>
              ) : metrics.savingsProgress < 100 ? (
                <p className="text-xs font-bold text-[var(--gray-dark)] leading-tight">
                  ¡Explorar desbloqueado! Te faltan {formatCLP(metrics.remainingAmount)} para el pie total
                </p>
              ) : (
                <p className="text-xs font-bold text-[var(--green-dark)] leading-tight">
                  ¡Pie 100% completado! Ya puedes simular tu crédito hipotecario
                </p>
              )}
            </div>
          </div>

          {metrics.isHomeMarketUnlocked ? (
            <button
              type="button"
              onClick={() => setActiveTab('homemarket')}
              className="px-3 py-1.5 rounded-xl bg-[var(--green-dark)] text-white text-xs font-bold shrink-0 flex items-center gap-1 cursor-pointer"
            >
              <span>Explorar</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIsDepositModalOpen(true)}
              className="px-3 py-1.5 rounded-xl border border-[var(--blue-dark)] text-[var(--blue-dark)] text-xs font-bold shrink-0 hover:bg-[var(--blue-20)] transition-colors cursor-pointer"
            >
              Abonar
            </button>
          )}
        </section>

        {/* =================================================================== */}
        {/* 3. PROYECCIÓN EN UNA FRASE */}
        {/* =================================================================== */}
        <section className="rounded-2xl bg-white border border-[var(--gray-semilight)] p-3.5 flex items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[var(--blue-20)] text-[var(--blue-dark)] flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-[var(--gray-dark)] leading-snug">
                {metrics.isGoalReached ? (
                  '¡Completaste tu pie ahorrado!'
                ) : metrics.estimatedMonthsRemaining !== null ? (
                  <>
                    A este ritmo lo logras en{' '}
                    <strong>{metrics.estimatedMonthsRemaining} meses</strong>{' '}
                    ({metrics.estimatedCompletionDate})
                  </>
                ) : (
                  'Aumenta tu capacidad mensual para proyectar tu fecha'
                )}
              </p>
              <p className="text-xs text-[var(--gray-semidark)]">
                Ahorro base mensual: {formatCLP(metrics.monthlySavingCapacity)}
              </p>
            </div>
          </div>

          <span
            className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${
              hasNegativeEvents
                ? 'bg-[var(--yellow-20)] text-[var(--yellow-normal)] border border-[var(--yellow-60)]'
                : 'bg-[var(--green-20)] text-[var(--green-dark)]'
            }`}
          >
            {hasNegativeEvents ? 'Ruta adaptada' : 'Buen ritmo'}
          </span>
        </section>

        {/* =================================================================== */}
        {/* 4. ACORDEÓN: ¿ALGO CAMBIÓ EN TU ECONOMÍA? (SECUNDARIO) */}
        {/* =================================================================== */}
        <section className="rounded-2xl bg-white border border-[var(--gray-semilight)] overflow-hidden shadow-2xs">
          <button
            type="button"
            onClick={() => setIsEconomyAccordionOpen((prev) => !prev)}
            aria-expanded={isEconomyAccordionOpen}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-[var(--gray-light)]/50 transition-colors cursor-pointer min-h-[48px]"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[var(--blue-20)] text-[var(--blue-dark)] flex items-center justify-center">
                <Wallet className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-[var(--gray-dark)]">
                  ¿Algo cambió en tu economía?
                </p>
                <p className="text-xs text-[var(--gray-semidark)]">
                  {events.length > 0
                    ? `${events.length} cambios simulados registrados`
                    : 'Aumento de sueldo, bono o gasto inesperado'}
                </p>
              </div>
            </div>

            {isEconomyAccordionOpen ? (
              <ChevronUp className="w-5 h-5 text-[var(--gray-semidark)]" />
            ) : (
              <ChevronDown className="w-5 h-5 text-[var(--gray-semidark)]" />
            )}
          </button>

          {isEconomyAccordionOpen && (
            <div className="p-4 pt-1 border-t border-[var(--gray-light)] space-y-3">
              <p className="text-xs text-[var(--gray-semidark)] leading-relaxed">
                Prueba escenarios de la vida real. Tu ruta se recalculará automáticamente sin perder el dinero acumulado.
              </p>

              <button
                type="button"
                onClick={() => setIsEventModalOpen(true)}
                className="w-full min-h-[44px] rounded-xl border border-[var(--blue-dark)] text-[var(--blue-dark)] hover:bg-[var(--blue-20)] text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Simular cambio o imprevisto</span>
              </button>

              {/* Lista de eventos registrados con opción de eliminar/deshacer */}
              {events.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-[var(--gray-light)]">
                  <span className="text-xs font-bold text-[var(--gray-semidark)] uppercase tracking-wider block">
                    Escenarios activos:
                  </span>
                  {events.map((ev) => (
                    <div
                      key={ev.id}
                      className="p-2.5 rounded-xl bg-[var(--gray-light)] border border-[var(--gray-semilight)] flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {ev.category === 'positive' ? (
                          <TrendingUp className="w-4 h-4 text-[var(--green-dark)] shrink-0" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-[var(--red-normal)] shrink-0" />
                        )}
                        <div className="min-w-0 truncate">
                          <p className="font-bold text-[var(--gray-dark)] truncate">
                            {ev.title}
                          </p>
                          <span className="text-xs text-[var(--gray-semidark)]">
                            {ev.category === 'positive' ? '+' : '-'}
                            {formatCLP(ev.amountCLP)}{' '}
                            {ev.frequency === 'recurring' ? '/mes' : `(${ev.dateLabel})`}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeFinancialEvent(ev.id)}
                        title="Revertir este escenario"
                        className="p-2 text-[var(--gray-semidark)] hover:text-[var(--red-normal)] min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
                      >
                        <Undo2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>

        {/* =================================================================== */}
        {/* 5. CÁPSULAS EDUCATIVAS AL FINAL */}
        {/* =================================================================== */}
        <section className="space-y-2.5 pt-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-[var(--gray-semidark)] uppercase tracking-wider flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5" />
              Aprende sobre tu primera vivienda
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {EDUCATION_ARTICLES.slice(0, 4).map((art) => (
              <button
                key={art.id}
                type="button"
                onClick={() => setSelectedArticle(art)}
                className="p-3 rounded-2xl border border-[var(--gray-semilight)] bg-white text-left hover:bg-[var(--blue-20)] hover:border-[var(--blue-40)] transition-colors flex flex-col justify-between min-h-[96px] cursor-pointer"
              >
                <div>
                  <span className="text-xs font-bold text-[var(--blue-dark)] block uppercase tracking-wider">
                    {art.category}
                  </span>
                  <p className="text-xs font-bold text-[var(--gray-dark)] mt-0.5 line-clamp-2">
                    {art.title}
                  </p>
                </div>
                <span className="text-xs text-[var(--gray-semidark)] mt-1">
                  Leer {art.readTime}
                </span>
              </button>
            ))}
          </div>
        </section>
      </div>

      {/* =================================================================== */}
      {/* MODAL: DEPOSITAR (SIMULACIÓN) */}
      {/* =================================================================== */}
      <ModalDialog
        isOpen={isDepositModalOpen}
        onClose={() => setIsDepositModalOpen(false)}
        title="Depositar en tu ahorro"
        subtitle="Simula un abono para hacer crecer tu pie"
      >
        <form onSubmit={handleConfirmDeposit} className="space-y-4 pt-1">
          <div>
            <label
              htmlFor="deposit-amount"
              className="block text-xs font-semibold text-[var(--gray-dark)] mb-1"
            >
              Monto a abonar (CLP)
            </label>
            <input
              id="deposit-amount"
              type="text"
              inputMode="numeric"
              value={depositAmountInput}
              onChange={(e) =>
                setDepositAmountInput(
                  e.target.value.replace(/[^\d]/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, '.')
                )
              }
              className="bci-input !text-lg !font-bold"
              placeholder="$500.000"
              autoFocus
            />
            {depositError && (
              <p className="text-xs text-[var(--red-normal)] font-medium mt-1">
                {depositError}
              </p>
            )}
          </div>

          {/* Accesos rápidos de montos */}
          <div className="grid grid-cols-3 gap-2">
            {[300000, 500000, 1000000].map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => setDepositAmountInput(formatCLP(amt).replace('$', ''))}
                className="py-2 px-2 rounded-xl border border-[var(--gray-semilight)] text-xs font-bold text-[var(--gray-dark)] hover:bg-[var(--blue-20)] hover:border-[var(--blue-40)] transition-colors min-h-[44px] cursor-pointer"
              >
                +{formatCLP(amt)}
              </button>
            ))}
          </div>

          <div className="pt-2 flex flex-col gap-2">
            <button type="submit" className="bci-btn-primary w-full cursor-pointer">
              Confirmar depósito
            </button>
            <button
              type="button"
              onClick={() => setIsDepositModalOpen(false)}
              className="bci-btn-secondary w-full cursor-pointer"
            >
              Cancelar
            </button>
          </div>
        </form>
      </ModalDialog>

      {/* =================================================================== */}
      {/* MODAL: CAMBIO O IMPREVISTO */}
      {/* =================================================================== */}
      <ModalDialog
        isOpen={isEventModalOpen}
        onClose={() => setIsEventModalOpen(false)}
        title="Simular cambio o imprevisto"
        subtitle="Evalúa cómo se adapta tu ruta de ahorro"
      >
        <form onSubmit={handleConfirmEvent} className="space-y-3 pt-1">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setEventCategory('positive');
                handleSelectPresetEvent(POSITIVE_EVENT_PRESETS[0]);
              }}
              className={`min-h-[44px] rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                eventCategory === 'positive'
                  ? 'bg-[var(--green-20)] border-[var(--green-dark)] text-[var(--green-dark)]'
                  : 'bg-white border-[var(--gray-semilight)] text-[var(--gray-semidark)]'
              }`}
            >
              Ingreso favorable (+)
            </button>
            <button
              type="button"
              onClick={() => {
                setEventCategory('negative');
                handleSelectPresetEvent(NEGATIVE_EVENT_PRESETS[0]);
              }}
              className={`min-h-[44px] rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                eventCategory === 'negative'
                  ? 'bg-[var(--red-20)] border-[var(--red-normal)] text-[var(--red-normal)]'
                  : 'bg-white border-[var(--gray-semilight)] text-[var(--gray-semidark)]'
              }`}
            >
              Gasto o imprevisto (-)
            </button>
          </div>

          {/* Presets sugeridos */}
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-[var(--gray-semidark)] block">
              Selecciona un escenario típico:
            </span>
            <div className="space-y-1">
              {(eventCategory === 'positive'
                ? POSITIVE_EVENT_PRESETS
                : NEGATIVE_EVENT_PRESETS
              ).map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => handleSelectPresetEvent(preset)}
                  className={`w-full p-2.5 rounded-xl border text-left text-xs font-semibold flex items-center justify-between min-h-[44px] cursor-pointer transition-colors ${
                    eventTitle === preset.label
                      ? 'border-[var(--blue-dark)] bg-[var(--blue-20)] text-[var(--blue-dark)]'
                      : 'border-[var(--gray-semilight)] bg-white text-[var(--gray-dark)] hover:bg-[var(--gray-light)]'
                  }`}
                >
                  <span>{preset.label}</span>
                  <span className="text-xs font-bold">
                    {formatCLP(preset.suggestedAmount)}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label
              htmlFor="event-amount-input"
              className="block text-xs font-semibold text-[var(--gray-dark)] mb-1"
            >
              Monto del cambio (CLP)
            </label>
            <input
              id="event-amount-input"
              type="text"
              inputMode="numeric"
              value={eventAmountInput}
              onChange={(e) =>
                setEventAmountInput(e.target.value.replace(/[^\d]/g, ''))
              }
              className="bci-input"
            />
            {eventError && (
              <p className="text-xs text-[var(--red-normal)] mt-1">{eventError}</p>
            )}
          </div>

          <div className="pt-2 flex flex-col gap-2">
            <button type="submit" className="bci-btn-primary w-full cursor-pointer">
              Registrar en mi simulación
            </button>
            <button
              type="button"
              onClick={() => setIsEventModalOpen(false)}
              className="bci-btn-secondary w-full cursor-pointer"
            >
              Cancelar
            </button>
          </div>
        </form>
      </ModalDialog>

      {/* =================================================================== */}
      {/* MODAL: LECTURA DE CÁPSULA EDUCATIVA */}
      {/* =================================================================== */}
      {selectedArticle && (
        <ModalDialog
          isOpen={Boolean(selectedArticle)}
          onClose={() => setSelectedArticle(null)}
          title={selectedArticle.title}
          subtitle={`Tiempo de lectura: ${selectedArticle.readTime}`}
        >
          <div className="space-y-4 pt-1 text-xs text-[var(--gray-dark)] leading-relaxed max-h-[70vh] overflow-y-auto pr-1">
            <div className="p-3.5 rounded-2xl bg-[var(--blue-20)] border border-[var(--blue-40)]">
              <p className="font-bold text-[var(--blue-dark)] text-sm mb-1">
                Idea clave:
              </p>
              <p className="text-xs">{selectedArticle.keyTakeaway}</p>
            </div>

            {selectedArticle.sections.map((sec, idx) => (
              <div key={idx} className="space-y-1">
                <p className="font-bold text-sm text-[var(--gray-dark)]">
                  {sec.heading}
                </p>
                <p className="text-[var(--gray-semidark)]">{sec.body}</p>
              </div>
            ))}

            <button
              type="button"
              onClick={() => setSelectedArticle(null)}
              className="bci-btn-primary w-full mt-2 cursor-pointer"
            >
              Entendido
            </button>
          </div>
        </ModalDialog>
      )}
    </div>
  );
};
