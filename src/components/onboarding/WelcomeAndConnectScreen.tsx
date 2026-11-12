import React, { useState } from 'react';
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Info,
  Loader2,
  PiggyBank,
  ShieldCheck,
  Sparkles,
  Store,
  Wallet,
} from 'lucide-react';
import {
  INITIAL_SIMULATED_MOVEMENTS,
  useApp,
} from '../../context/AppContext';
import { formatCLP } from '../../utils/financialEngine';
import { BciLogo } from '../common/BciLogo';
import { ModalDialog } from '../common/ModalDialog';

type ConnectStep = 'idle' | 'permissions' | 'connecting' | 'summary';

export const WelcomeAndConnectScreen: React.FC = () => {
  const {
    connectBciAccount,
    baseMonthlyIncome,
    baseMonthlyExpenses,
    baseMonthlySavingCapacity,
    initialSavings,
  } = useApp();

  const [step, setStep] = useState<ConnectStep>('idle');

  const handleStartConnection = () => {
    setStep('permissions');
  };

  const handleAuthorizeSimulatedConnection = () => {
    setStep('connecting');
    window.setTimeout(() => {
      setStep('summary');
    }, 950);
  };

  const handleFinishConnection = () => {
    setStep('idle');
    connectBciAccount();
  };

  return (
    <div className="px-5 py-6 flex flex-col justify-between min-h-[calc(100dvh-64px)]">
      {/* Encabezado e identidad visual */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <BciLogo size="lg" />
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[var(--blue-20)] text-[var(--blue-dark)]">
            <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
            Prototipo interactivo
          </span>
        </div>

        {/* Tarjeta Hero de bienvenida */}
        <div className="rounded-3xl bg-[var(--gray-light)] border border-[var(--gray-semilight)] p-5 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-white border border-[var(--gray-semilight)]">
            <span className="w-2 h-2 rounded-full bg-[var(--green-normal)]" />
            <span className="text-xs font-semibold text-[var(--gray-dark)]">
              RoadHome + HomeMarket
            </span>
          </div>

          <h1 className="h2 font-bold text-[var(--gray-dark)] tracking-tight">
            Tu camino hacia la primera casa comienza aquí
          </h1>

          <p className="text-sm leading-relaxed text-[var(--gray-semidark)]">
            Conectemos tu información financiera para ayudarte a definir tu casa ideal y armar un plan claro de ahorro.
          </p>

          {/* Resumen de los 3 pasos claros */}
          <ol
            role="list"
            className="space-y-2.5 pt-2 m-0 p-0 list-none"
          >
            <li className="bg-white rounded-2xl p-3.5 border border-[var(--gray-semilight)] flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-[var(--blue-20)] text-[var(--blue-dark)] flex items-center justify-center shrink-0 font-bold text-sm">
                <Building2 className="w-4 h-4" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-bold text-[var(--gray-dark)]">
                  1. Definir mi casa ideal
                </p>
                <p className="text-xs text-[var(--gray-semidark)] mt-0.5">
                  Elige qué buscas, comuna y comodidades para calcular el pie necesario.
                </p>
              </div>
            </li>

            <li className="bg-white rounded-2xl p-3.5 border border-[var(--gray-semilight)] flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-[var(--green-20)] text-[var(--green-dark)] flex items-center justify-center shrink-0 font-bold text-sm">
                <PiggyBank className="w-4 h-4" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-bold text-[var(--gray-dark)]">
                  2. Juntar el pie ahorrando
                </p>
                <p className="text-xs text-[var(--gray-semidark)] mt-0.5">
                  Conoce tu meta en UF y pesos, y simula depósitos para ver tu avance en tiempo real.
                </p>
              </div>
            </li>

            <li className="bg-white rounded-2xl p-3.5 border border-[var(--gray-semilight)] flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-[var(--yellow-20)] text-[var(--gray-dark)] flex items-center justify-center shrink-0 font-bold text-sm">
                <Store className="w-4 h-4" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-bold text-[var(--gray-dark)]">
                  3. Explorar casas para ti
                </p>
                <p className="text-xs text-[var(--gray-semidark)] mt-0.5">
                  Al alcanzar el 85% de tu pie, desbloqueas casas reales compatibles con tu ahorro.
                </p>
              </div>
            </li>
          </ol>
        </div>
      </div>

      {/* Acción principal */}
      <div className="pt-6 space-y-3">
        <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl bg-[var(--blue-20)] text-xs text-[var(--gray-dark)]">
          <ShieldCheck
            className="w-4 h-4 text-[var(--blue-dark)] shrink-0 mt-0.5"
            aria-hidden="true"
          />
          <span>
            <strong>Conexión 100% simulada:</strong> No solicitaremos claves
            bancarias ni datos personales reales. Se cargará un perfil financiero
            demostrativo.
          </span>
        </div>

        <button
          type="button"
          onClick={handleStartConnection}
          className="bci-btn-primary w-full"
        >
          <span>Conectar mi cuenta Bci</span>
          <ArrowRight className="w-5 h-5" aria-hidden="true" />
        </button>

        <p className="text-xs text-[var(--gray-semidark)] text-center leading-relaxed">
          Prototipo demostrativo · datos ficticios · no es un sitio oficial de Bci
        </p>
      </div>

      {/* Modal de simulación de conexión bancaria */}
      <ModalDialog
        isOpen={step !== 'idle'}
        onClose={() => {
          if (step !== 'connecting') setStep('idle');
        }}
        title={
          step === 'permissions'
            ? 'Conexión financiera simulada Bci'
            : step === 'connecting'
            ? 'Sincronizando perfil demostrativo...'
            : '¡Conexión exitosa con Bci!'
        }
        subtitle="Demostración interactiva · Datos referenciales y ficticios"
      >
        {step === 'permissions' && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-2xl bg-[var(--gray-light)] border border-[var(--gray-semilight)] space-y-2">
              <p className="text-sm font-semibold text-[var(--gray-dark)]">
                ¿Qué información simulada utilizará RoadHome?
              </p>
              <ul className="space-y-2 text-xs text-[var(--gray-semidark)] pl-4 list-disc">
                <li>
                  <strong>Ingresos y gastos mensuales estimados</strong> para
                  calcular una capacidad de ahorro saludable.
                </li>
                <li>
                  <strong>Saldo de ahorro inicial destinado a vivienda</strong>{' '}
                  para mostrar tu punto de partida hacia el pie.
                </li>
                <li>
                  <strong>Movimientos demostrativos</strong> para proyectar tu
                  ruta en RoadHome.
                </li>
              </ul>
            </div>

            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[var(--yellow-20)] border border-[var(--yellow-60)] text-xs text-[var(--gray-dark)]">
              <Info
                className="w-4 h-4 text-[var(--yellow-normal)] shrink-0 mt-0.5"
                aria-hidden="true"
              />
              <span>
                Esta operación es exclusivamente una demostración funcional. No
                conecta con cuentas reales ni requiere contraseñas.
              </span>
            </div>

            <div className="pt-1 flex flex-col gap-2">
              <button
                type="button"
                onClick={handleAuthorizeSimulatedConnection}
                className="bci-btn-primary w-full"
                autoFocus
              >
                Autorizar conexión ficticia
              </button>
              <button
                type="button"
                onClick={() => setStep('idle')}
                className="bci-btn-secondary w-full"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {step === 'connecting' && (
          <div className="py-10 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-[var(--green-20)] flex items-center justify-center text-[var(--green-normal)]">
              <Loader2 className="w-8 h-8 animate-spin" aria-hidden="true" />
            </div>
            <div className="space-y-1">
              <p className="text-base font-semibold text-[var(--gray-dark)]">
                Cargando perfil financiero demostrativo Bci...
              </p>
              <p className="text-xs text-[var(--gray-semidark)]">
                Preparando tus indicadores de ahorro y capacidad mensual
              </p>
            </div>
          </div>
        )}

        {step === 'summary' && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-2xl bg-[var(--green-20)] border border-[var(--green-60)] flex items-center gap-3">
              <CheckCircle2
                className="w-6 h-6 text-[var(--green-dark)] shrink-0"
                aria-hidden="true"
              />
              <div>
                <p className="text-sm font-bold text-[var(--gray-dark)]">
                  Perfil financiero simulado sincronizado
                </p>
                <p className="text-xs text-[var(--gray-semidark)]">
                  Última actualización simulada: 08 nov 2026 · 18:10 hrs
                </p>
              </div>
            </div>

            {/* Datos financieros simulados (Sección 5) */}
            <div className="rounded-2xl border border-[var(--gray-semilight)] bg-white divide-y divide-[var(--gray-light)]">
              <div className="p-3.5 flex items-center justify-between">
                <span className="text-xs text-[var(--gray-semidark)]">
                  Ingreso mensual líquido
                </span>
                <span className="text-sm font-bold text-[var(--gray-dark)]">
                  {formatCLP(baseMonthlyIncome)}
                </span>
              </div>
              <div className="p-3.5 flex items-center justify-between">
                <span className="text-xs text-[var(--gray-semidark)]">
                  Gastos mensuales estimados
                </span>
                <span className="text-sm font-semibold text-[var(--gray-dark)]">
                  {formatCLP(baseMonthlyExpenses)}
                </span>
              </div>
              <div className="p-3.5 flex items-center justify-between bg-[var(--blue-20)]/45">
                <span className="text-xs font-medium text-[var(--blue-dark)]">
                  Capacidad de ahorro mensual estimada
                </span>
                <span className="text-sm font-bold text-[var(--blue-dark)]">
                  {formatCLP(baseMonthlySavingCapacity)} / mes
                </span>
              </div>
              <div className="p-3.5 flex items-center justify-between bg-[var(--green-20)]/60">
                <span className="text-xs font-semibold text-[var(--green-dark)]">
                  Ahorro inicial destinado a vivienda
                </span>
                <span className="text-base font-bold text-[var(--green-dark)]">
                  {formatCLP(initialSavings)}
                </span>
              </div>
            </div>

            {/* Movimientos y saldos ficticios */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-[var(--gray-dark)] flex items-center gap-1.5">
                  <Wallet className="w-3.5 h-3.5 text-[var(--blue-normal)]" aria-hidden="true" />
                  Movimientos bancarios ficticios recientes
                </p>
                <span className="text-xs text-[var(--gray-neutral)]">
                  Datos referenciales
                </span>
              </div>
              <ul
                role="list"
                className="rounded-xl border border-[var(--gray-semilight)] bg-[var(--gray-light)] divide-y divide-[var(--gray-semilight)] m-0 p-0 list-none"
              >
                {INITIAL_SIMULATED_MOVEMENTS.map((mov) => (
                  <li
                    key={mov.id}
                    className="px-3 py-2 flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-[var(--gray-dark)] truncate">
                        {mov.description}
                      </p>
                      <p className="text-xs text-[var(--gray-semidark)]">
                        {mov.date} · {mov.category}
                      </p>
                    </div>
                    <span
                      className={`font-semibold shrink-0 ${
                        mov.type === 'credit'
                          ? 'text-[var(--green-dark)]'
                          : 'text-[var(--gray-dark)]'
                      }`}
                    >
                      {mov.type === 'credit' ? '+' : '-'}
                      {formatCLP(mov.amountCLP)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <p className="text-xs text-[var(--gray-semidark)] text-center leading-relaxed">
              Prototipo demostrativo · datos ficticios · no es un sitio oficial de Bci. Puedes modificar los valores en cualquier momento con los controles de simulación.
            </p>

            <button
              type="button"
              onClick={handleFinishConnection}
              className="bci-btn-primary w-full"
              autoFocus
            >
              <span>Continuar a definir mi vivienda</span>
              <ArrowRight className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
        )}
      </ModalDialog>
    </div>
  );
};

