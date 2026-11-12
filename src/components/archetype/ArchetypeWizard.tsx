import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  CheckCircle2,
  Home,
  Info,
  LandPlot,
  MapPin,
  MessageSquare,
  Minus,
  Plus,
  Search,
  Sparkles,
  Trees,
  Zap,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getFallbackImage } from '../../data/mockProperties';
import {
  HousingArchetype,
  PreferenceCategory,
  PreferencePriority,
  PreferenceTag,
  PropertyType,
} from '../../types/app';
import {
  calculateArchetypeEstimatedUF,
  formatCLP,
  formatUF,
  syncArchetypeFromTags,
} from '../../utils/financialEngine';
import { ModalDialog } from '../common/ModalDialog';
import { ArchetypeChatbot } from './ArchetypeChatbot';

interface ArchetypeWizardProps {
  initialStep?: number;
  onFinish: () => void;
  onCancel?: () => void;
}

const POPULAR_COMMUNES = [
  'Ñuñoa',
  'Providencia',
  'La Florida',
  'Santiago Centro',
  'Las Condes',
  'Macul',
  'Puente Alto',
  'Vitacura',
  'Valparaíso',
  'Biobío',
];

const FEATURES_CATALOG: {
  id: string;
  label: string;
  category: PreferenceCategory;
}[] = [
  { id: 'metro', label: 'Cerca del metro', category: 'conectividad' },
  { id: 'transporte', label: 'Cerca de transporte público', category: 'conectividad' },
  { id: 'parques', label: 'Cerca de parques', category: 'conectividad' },
  { id: 'supermercado', label: 'Cerca de supermercados', category: 'conectividad' },
  { id: 'colegios', label: 'Cerca de colegios', category: 'conectividad' },
  { id: 'terraza', label: 'Terraza', category: 'exterior' },
  { id: 'patio', label: 'Patio', category: 'exterior' },
  { id: 'estacionamiento', label: 'Estacionamiento', category: 'exterior' },
  { id: 'bodega', label: 'Bodega', category: 'exterior' },
  { id: 'piscina', label: 'Piscina', category: 'exterior' },
  { id: 'quincho', label: 'Quincho', category: 'exterior' },
  { id: 'escritorio', label: 'Espacio de escritorio', category: 'interior' },
  { id: 'cocina-cerrada', label: 'Cocina independiente', category: 'interior' },
  { id: 'living-amplio', label: 'Living amplio', category: 'interior' },
];

export const ArchetypeWizard: React.FC<ArchetypeWizardProps> = ({
  initialStep = 1,
  onFinish,
  onCancel,
}) => {
  const {
    archetype,
    updateArchetypeTags,
    saveArchetypeAsGoal,
    metrics,
    compatibleProperties,
  } = useApp();

  // Paso actual (1: Tipo, 2: Comuna, 3: Ambientes, 4: Características, 5: Revisión)
  const [currentStep, setCurrentStep] = useState<number>(initialStep);

  // Modo conversacional (Chatbot)
  const [isChatMode, setIsChatMode] = useState<boolean>(false);

  // Modal explicativo "¿Qué es el pie?"
  const [isPieHelpOpen, setIsPieHelpOpen] = useState(false);

  // Búsqueda de comunas
  const [communeSearch, setCommuneSearch] = useState('');

  // Valores locales del wizard
  const selectedType: PropertyType = archetype.propertyType || 'departamento';
  const selectedCommunes: string[] = archetype.communes.length > 0 ? archetype.communes : ['Ñuñoa'];
  const bedrooms: number = archetype.bedrooms ?? (selectedType === 'terreno' ? 0 : 2);
  const bathrooms: number = archetype.bathrooms ?? (selectedType === 'terreno' ? 0 : 2);

  // Etiquetas adicionales (excluyendo tipo, ubicación y dorms/baños)
  const featureTags = useMemo(
    () =>
      archetype.tags.filter(
        (t) =>
          t.category !== 'tipo' &&
          t.category !== 'ubicacion' &&
          !t.label.toLowerCase().includes('dormitorio') &&
          !t.label.toLowerCase().includes('baño')
      ),
    [archetype.tags]
  );

  const indispensableFeaturesCount = useMemo(
    () => featureTags.filter((t) => t.priority === 'indispensable').length,
    [featureTags]
  );

  // Sincronizador de cambios hacia el arquetipo central
  const applyTagsUpdate = (
    nextType: PropertyType,
    nextCommunes: string[],
    nextBeds: number,
    nextBaths: number,
    nextFeatures: PreferenceTag[]
  ) => {
    const typeTag: PreferenceTag = {
      id: `tipo-${nextType}`,
      label:
        nextType === 'departamento'
          ? 'Departamento'
          : nextType === 'casa'
          ? 'Casa'
          : nextType === 'parcela'
          ? 'Parcela'
          : 'Terreno vacío',
      category: 'tipo',
      priority: 'indispensable',
    };

    const locationTags: PreferenceTag[] = nextCommunes.map((c) => ({
      id: `ubicacion-${c.toLowerCase().replace(/\s+/g, '-')}`,
      label: c,
      category: 'ubicacion',
      priority: 'indispensable',
    }));

    const roomTags: PreferenceTag[] = [];
    if (nextType !== 'terreno') {
      if (nextBeds > 0) {
        roomTags.push({
          id: `interior-${nextBeds}-dormitorios`,
          label:
            nextBeds >= 4 ? '4 o más dormitorios' : `${nextBeds} ${nextBeds === 1 ? 'dormitorio' : 'dormitorios'}`,
          category: 'interior',
          priority: 'indispensable',
        });
      }
      if (nextBaths > 0) {
        roomTags.push({
          id: `interior-${nextBaths}-banos`,
          label: nextBaths >= 3 ? '3 o más baños' : `${nextBaths} ${nextBaths === 1 ? 'baño' : 'baños'}`,
          category: 'interior',
          priority: 'indispensable',
        });
      }
    }

    const allTags = [typeTag, ...locationTags, ...roomTags, ...nextFeatures];
    updateArchetypeTags(allTags);
  };

  // Manejo de plantillas rápidas (Quick Templates)
  const handleApplyTemplate = (templateType: 'nunoa' | 'florida' | 'providencia') => {
    if (templateType === 'nunoa') {
      applyTagsUpdate('departamento', ['Ñuñoa'], 2, 2, [
        {
          id: 'conectividad-cerca-del-metro',
          label: 'Cerca del metro',
          category: 'conectividad',
          priority: 'preferible',
        },
      ]);
    } else if (templateType === 'florida') {
      applyTagsUpdate('casa', ['La Florida'], 3, 2, [
        {
          id: 'exterior-patio',
          label: 'Patio',
          category: 'exterior',
          priority: 'preferible',
        },
      ]);
    } else {
      applyTagsUpdate('departamento', ['Providencia'], 1, 1, [
        {
          id: 'conectividad-cerca-del-metro',
          label: 'Cerca del metro',
          category: 'conectividad',
          priority: 'indispensable',
        },
      ]);
    }
    setCurrentStep(5); // Salta directamente a la revisión
  };

  // Paso 1: Cambiar tipo
  const handleSelectType = (type: PropertyType) => {
    applyTagsUpdate(type, selectedCommunes, bedrooms, bathrooms, featureTags);
  };

  // Paso 2: Toggle comuna (máximo 3)
  const [communeLimitMessage, setCommuneLimitMessage] = useState(false);
  const handleToggleCommune = (commune: string) => {
    let nextCommunes: string[];
    if (selectedCommunes.includes(commune)) {
      if (selectedCommunes.length === 1) return; // Mínimo 1 comuna
      nextCommunes = selectedCommunes.filter((c) => c !== commune);
      setCommuneLimitMessage(false);
    } else {
      if (selectedCommunes.length >= 3) {
        setCommuneLimitMessage(true);
        window.setTimeout(() => setCommuneLimitMessage(false), 3000);
        return;
      }
      nextCommunes = [...selectedCommunes, commune];
      setCommuneLimitMessage(false);
    }
    applyTagsUpdate(selectedType, nextCommunes, bedrooms, bathrooms, featureTags);
  };

  // Paso 3: Steppers
  const handleBedroomsChange = (delta: number) => {
    const next = Math.max(1, Math.min(5, bedrooms + delta));
    applyTagsUpdate(selectedType, selectedCommunes, next, bathrooms, featureTags);
  };

  const handleBathroomsChange = (delta: number) => {
    const next = Math.max(1, Math.min(4, bathrooms + delta));
    applyTagsUpdate(selectedType, selectedCommunes, bedrooms, next, featureTags);
  };

  // Paso 4: Características con control segmentado visible (Imprescindible / Me gustaría)
  const handleToggleFeature = (featureItem: (typeof FEATURES_CATALOG)[0]) => {
    const exists = featureTags.find((t) => t.label === featureItem.label);
    let nextFeatures: PreferenceTag[];
    if (exists) {
      nextFeatures = featureTags.filter((t) => t.label !== featureItem.label);
    } else {
      nextFeatures = [
        ...featureTags,
        {
          id: `${featureItem.category}-${featureItem.id}`,
          label: featureItem.label,
          category: featureItem.category,
          priority: 'preferible', // Inicia en "Me gustaría"
        },
      ];
    }
    applyTagsUpdate(selectedType, selectedCommunes, bedrooms, bathrooms, nextFeatures);
  };

  const handleChangeFeaturePriority = (
    label: string,
    priority: PreferencePriority
  ) => {
    const nextFeatures = featureTags.map((t) =>
      t.label === label ? { ...t, priority } : t
    );
    applyTagsUpdate(selectedType, selectedCommunes, bedrooms, bathrooms, nextFeatures);
  };

  // Guardado final
  const handleFinalSave = () => {
    saveArchetypeAsGoal();
    onFinish();
  };

  // Si el usuario eligió el modo conversacional, mostrar el Chatbot
  if (isChatMode) {
    return (
      <div className="flex flex-col h-full">
        <div className="px-4 py-2 bg-[var(--gray-light)] border-b border-[var(--gray-semilight)] flex items-center justify-between">
          <button
            type="button"
            onClick={() => setIsChatMode(false)}
            className="text-xs font-semibold text-[var(--blue-dark)] flex items-center gap-1 min-h-[44px]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver al paso a paso</span>
          </button>
          <span className="text-xs font-bold text-[var(--gray-semidark)]">
            Asistente conversacional
          </span>
        </div>
        <div className="flex-1 p-2">
          <ArchetypeChatbot
            onSwitchToTags={() => setIsChatMode(false)}
            onRequestSaveArchetype={() => {
              saveArchetypeAsGoal();
              onFinish();
            }}
          />
        </div>
      </div>
    );
  }

  // Resumen en vivo de la barra inferior
  const liveEstimatedUF = calculateArchetypeEstimatedUF(archetype);
  const liveEstimatedCLP = liveEstimatedUF * metrics.ufValueCLP;
  const liveDownPaymentUF = Math.round((liveEstimatedUF * metrics.downPaymentPercentage) / 100);
  const liveDownPaymentCLP = liveDownPaymentUF * metrics.ufValueCLP;

  const typeName =
    selectedType === 'casa'
      ? 'Casa'
      : selectedType === 'parcela'
      ? 'Parcela'
      : selectedType === 'terreno'
      ? 'Terreno'
      : 'Depto';

  const previewDistribution =
    selectedType === 'terreno' ? '' : ` · ${bedrooms}D/${bathrooms}B`;

  return (
    <div className="flex flex-col min-h-full justify-between pb-4">
      {/* Encabezado del Asistente con Barra de Progreso */}
      <div className="px-4 pt-3 pb-2 space-y-2 border-b border-[var(--gray-light)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => prev - 1)}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-[var(--gray-semidark)] hover:bg-[var(--gray-light)] active:bg-[var(--gray-semilight)] min-h-[44px] min-w-[44px] cursor-pointer"
                aria-label="Paso anterior"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            ) : onCancel ? (
              <button
                type="button"
                onClick={onCancel}
                className="text-xs font-semibold text-[var(--gray-semidark)] hover:text-[var(--gray-dark)] min-h-[44px] flex items-center cursor-pointer"
              >
                Cerrar
              </button>
            ) : null}
            <span className="text-xs font-bold text-[var(--green-dark)] bg-[var(--green-20)] px-2.5 py-0.5 rounded-full">
              Paso 1 de 3 · Tu casa ideal
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsPieHelpOpen(true)}
            className="text-xs font-semibold text-[var(--blue-dark)] flex items-center gap-1 hover:underline min-h-[44px] cursor-pointer"
          >
            <Info className="w-3.5 h-3.5" />
            <span>¿Qué es el pie?</span>
          </button>
        </div>

        {/* Barra de progreso de 4 pasos */}
        <div className="space-y-1">
          <div className="flex justify-between items-center text-xs font-semibold text-[var(--gray-semidark)]">
            <span>
              {currentStep === 5 ? 'Resumen final' : `Paso ${currentStep} de 4`}
            </span>
            <span className="text-xs">
              {currentStep === 1
                ? '¿Qué buscas?'
                : currentStep === 2
                ? '¿Dónde?'
                : currentStep === 3
                ? 'Ambientes'
                : currentStep === 4
                ? 'Preferencias'
                : 'Confirmar'}
            </span>
          </div>
          <div className="h-2 w-full bg-[var(--gray-light)] rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--green-dark)] transition-all duration-300 rounded-full"
              style={{
                width: `${Math.min(100, (currentStep / 4) * 100)}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* CUERPO DEL PASO ACTUAL */}
      <div className="px-4 py-4 flex-1">
        {/* =================================================================== */}
        {/* PASO 1: ¿Qué tipo de propiedad buscas? */}
        {/* =================================================================== */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold text-[var(--gray-dark)]">
                ¿Qué tipo de casa buscas?
              </h2>
              <p className="text-xs text-[var(--gray-semidark)] mt-0.5">
                Elige la opción que mejor represente tu objetivo inicial.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  id: 'departamento',
                  label: 'Departamento',
                  desc: 'En altura y bien conectado',
                  icon: <Building2 className="w-6 h-6" />,
                },
                {
                  id: 'casa',
                  label: 'Casa',
                  desc: 'Espacio propio o condominio',
                  icon: <Home className="w-6 h-6" />,
                },
                {
                  id: 'parcela',
                  label: 'Parcela',
                  desc: 'Terreno amplio y naturaleza',
                  icon: <Trees className="w-6 h-6" />,
                },
                {
                  id: 'terreno',
                  label: 'Terreno vacío',
                  desc: 'Sitio listo para construir',
                  icon: <LandPlot className="w-6 h-6" />,
                },
              ].map((opt) => {
                const isSelected = selectedType === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleSelectType(opt.id as PropertyType)}
                    className={`p-4 rounded-2xl border text-left flex flex-col justify-between min-h-[120px] transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[var(--green-dark)] bg-[var(--green-20)] text-[var(--green-dark)] shadow-xs ring-2 ring-[var(--green-dark)]/20'
                        : 'border-[var(--gray-semilight)] bg-white text-[var(--gray-dark)] hover:bg-[var(--gray-light)]'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span
                        className={
                          isSelected ? 'text-[var(--green-dark)]' : 'text-[var(--blue-dark)]'
                        }
                      >
                        {opt.icon}
                      </span>
                      {isSelected && (
                        <CheckCircle2 className="w-5 h-5 text-[var(--green-dark)]" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-bold">{opt.label}</p>
                      <p className="text-xs text-[var(--gray-semidark)] mt-0.5 leading-tight">
                        {opt.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Accesos rápidos / Plantillas */}
            <div className="pt-2 border-t border-[var(--gray-light)] space-y-2">
              <span className="text-xs font-bold text-[var(--gray-semidark)] flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-[var(--yellow-normal)]" />
                O elige una plantilla recomendada:
              </span>
              <div className="space-y-1.5">
                <button
                  type="button"
                  onClick={() => handleApplyTemplate('nunoa')}
                  className="w-full p-2.5 rounded-xl border border-[var(--gray-semilight)] bg-[var(--gray-light)]/60 text-left hover:bg-[var(--blue-20)] hover:border-[var(--blue-40)] transition-colors flex items-center justify-between min-h-[44px] cursor-pointer"
                >
                  <span className="text-xs font-semibold text-[var(--gray-dark)]">
                    Depto 2D/2B en Ñuñoa (cerca del metro)
                  </span>
                  <span className="text-xs font-bold text-[var(--blue-dark)]">
                    4.500 UF
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyTemplate('florida')}
                  className="w-full p-2.5 rounded-xl border border-[var(--gray-semilight)] bg-[var(--gray-light)]/60 text-left hover:bg-[var(--blue-20)] hover:border-[var(--blue-40)] transition-colors flex items-center justify-between min-h-[44px] cursor-pointer"
                >
                  <span className="text-xs font-semibold text-[var(--gray-dark)]">
                    Casa 3D/2B en La Florida (con patio)
                  </span>
                  <span className="text-xs font-bold text-[var(--blue-dark)]">
                    4.650 UF
                  </span>
                </button>
              </div>

              {/* Opción secundaria: Chatbot */}
              <button
                type="button"
                onClick={() => setIsChatMode(true)}
                className="w-full min-h-[44px] mt-2 py-2 text-xs font-semibold text-[var(--blue-dark)] hover:bg-[var(--blue-20)] rounded-xl border border-dashed border-[var(--blue-40)] flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Prefiero contarlo con mis palabras (Asistente)</span>
              </button>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* PASO 2: ¿Dónde te gustaría vivir? */}
        {/* =================================================================== */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold text-[var(--gray-dark)]">
                ¿En qué comuna o sector?
              </h2>
              <p className="text-xs text-[var(--gray-semidark)] mt-0.5">
                Elige hasta 3 comunas para ampliar tus opciones compatibles.
              </p>
            </div>

            {/* Buscador de comuna */}
            <div className="relative">
              <Search className="w-4 h-4 text-[var(--gray-neutral)] absolute left-3 top-3.5" />
              <input
                type="text"
                placeholder="Buscar comuna..."
                value={communeSearch}
                onChange={(e) => setCommuneSearch(e.target.value)}
                className="bci-input !pl-9 !text-sm"
              />
            </div>

            {/* Aviso si intenta elegir más de 3 */}
            {communeLimitMessage && (
              <div className="rounded-xl bg-[var(--yellow-20)] border border-[var(--yellow-60)] p-2.5 text-xs text-[var(--gray-dark)] flex items-center gap-2 animate-shake">
                <Info className="w-4 h-4 text-[var(--yellow-normal)] shrink-0" />
                <span>Puedes seleccionar un máximo de 3 comunas a la vez.</span>
              </div>
            )}

            {/* Comunas seleccionadas */}
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-[var(--gray-dark)]">
                Seleccionadas ({selectedCommunes.length}/3):
              </span>
              <div className="flex flex-wrap gap-2">
                {selectedCommunes.map((c) => (
                  <span
                    key={c}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--green-20)] border border-[var(--green-dark)] text-[var(--green-dark)] text-xs font-bold"
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{c}</span>
                    {selectedCommunes.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleToggleCommune(c)}
                        aria-label={`Quitar ${c}`}
                        className="ml-1 text-[var(--gray-semidark)] hover:text-[var(--red-normal)]"
                      >
                        ×
                      </button>
                    )}
                  </span>
                ))}
              </div>
            </div>

            {/* Lista de comunas populares filtradas */}
            <div className="space-y-2 pt-2">
              <span className="text-xs font-bold text-[var(--gray-semidark)]">
                Comunas sugeridas:
              </span>
              <div className="flex flex-wrap gap-2 max-h-56 overflow-y-auto">
                {POPULAR_COMMUNES.filter((c) =>
                  c.toLowerCase().includes(communeSearch.toLowerCase())
                ).map((commune) => {
                  const isChecked = selectedCommunes.includes(commune);
                  return (
                    <button
                      key={commune}
                      type="button"
                      onClick={() => handleToggleCommune(commune)}
                      className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
                        isChecked
                          ? 'bg-[var(--green-dark)] text-white border-[var(--green-dark)]'
                          : 'bg-white text-[var(--gray-dark)] border-[var(--gray-semilight)] hover:bg-[var(--gray-light)]'
                      }`}
                    >
                      {isChecked && <Check className="w-3.5 h-3.5" />}
                      <span>{commune}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* PASO 3: ¿Cómo la quieres? (Dormitorios y Baños) */}
        {/* =================================================================== */}
        {currentStep === 3 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-bold text-[var(--gray-dark)]">
                ¿Cómo te gustaría la distribución?
              </h2>
              <p className="text-xs text-[var(--gray-semidark)] mt-0.5">
                Usa los controles para definir la cantidad de dormitorios y baños.
              </p>
            </div>

            {selectedType === 'terreno' ? (
              <div className="rounded-2xl bg-[var(--blue-20)] border border-[var(--blue-40)] p-4 text-xs text-[var(--gray-dark)]">
                Para un terreno vacío no se requieren dormitorios ni baños. Puedes continuar al siguiente paso.
              </div>
            ) : (
              <div className="space-y-4">
                {/* Stepper Dormitorios */}
                <div className="rounded-2xl border border-[var(--gray-semilight)] p-4 bg-white flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-[var(--gray-dark)]">
                      Dormitorios
                    </p>
                    <p className="text-xs text-[var(--gray-semidark)]">
                      {bedrooms === 1
                        ? '1 dormitorio principal'
                        : `${bedrooms} dormitorios`}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleBedroomsChange(-1)}
                      disabled={bedrooms <= 1}
                      aria-label="Reducir dormitorios"
                      className="w-11 h-11 rounded-xl border border-[var(--gray-semilight)] bg-[var(--gray-light)] text-[var(--gray-dark)] flex items-center justify-center font-bold disabled:opacity-35 disabled:cursor-not-allowed hover:bg-[var(--gray-semilight)] transition-colors cursor-pointer"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-8 text-center text-lg font-bold text-[var(--gray-dark)]">
                      {bedrooms}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleBedroomsChange(1)}
                      disabled={bedrooms >= 5}
                      aria-label="Aumentar dormitorios"
                      className="w-11 h-11 rounded-xl border border-[var(--gray-semilight)] bg-[var(--gray-light)] text-[var(--gray-dark)] flex items-center justify-center font-bold disabled:opacity-35 disabled:cursor-not-allowed hover:bg-[var(--gray-semilight)] transition-colors cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Stepper Baños */}
                <div className="rounded-2xl border border-[var(--gray-semilight)] p-4 bg-white flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-[var(--gray-dark)]">
                      Baños
                    </p>
                    <p className="text-xs text-[var(--gray-semidark)]">
                      {bathrooms === 1 ? '1 baño completo' : `${bathrooms} baños`}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleBathroomsChange(-1)}
                      disabled={bathrooms <= 1}
                      aria-label="Reducir baños"
                      className="w-11 h-11 rounded-xl border border-[var(--gray-semilight)] bg-[var(--gray-light)] text-[var(--gray-dark)] flex items-center justify-center font-bold disabled:opacity-35 disabled:cursor-not-allowed hover:bg-[var(--gray-semilight)] transition-colors cursor-pointer"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-8 text-center text-lg font-bold text-[var(--gray-dark)]">
                      {bathrooms}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleBathroomsChange(1)}
                      disabled={bathrooms >= 4}
                      aria-label="Aumentar baños"
                      className="w-11 h-11 rounded-xl border border-[var(--gray-semilight)] bg-[var(--gray-light)] text-[var(--gray-dark)] flex items-center justify-center font-bold disabled:opacity-35 disabled:cursor-not-allowed hover:bg-[var(--gray-semilight)] transition-colors cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* =================================================================== */}
        {/* PASO 4: Preferencias adicionales con control segmentado visible */}
        {/* =================================================================== */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold text-[var(--gray-dark)]">
                ¿Qué más te importa en tu casa?
              </h2>
              <p className="text-xs text-[var(--gray-semidark)] mt-0.5">
                Elige características y define si son imprescindibles o solo una preferencia.
              </p>
            </div>

            {/* Contador de imprescindibles */}
            <div className="rounded-xl bg-[var(--gray-light)] p-3 border border-[var(--gray-semilight)] flex items-center justify-between text-xs">
              <span className="text-[var(--gray-dark)] font-semibold">
                Características elegidas: {featureTags.length}
              </span>
              <span
                className={`font-bold px-2.5 py-0.5 rounded-full ${
                  indispensableFeaturesCount > 3
                    ? 'bg-[var(--yellow-20)] text-[var(--yellow-normal)] border border-[var(--yellow-60)]'
                    : 'bg-[var(--green-20)] text-[var(--green-dark)]'
                }`}
              >
                Imprescindibles: {indispensableFeaturesCount}
              </span>
            </div>

            {indispensableFeaturesCount > 3 && (
              <p className="text-xs text-[var(--gray-semidark)] leading-relaxed bg-[var(--yellow-20)]/50 p-2.5 rounded-xl border border-[var(--yellow-60)]">
                Consejo: si marcas demasiadas como <strong>Imprescindibles</strong>, el catálogo de casas compatibles será más reducido.
              </p>
            )}

            {/* Lista interactiva con selector segmentado visible */}
            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {FEATURES_CATALOG.map((feat) => {
                const activeTag = featureTags.find((t) => t.label === feat.label);
                const isSelected = Boolean(activeTag);
                const currentPriority = activeTag?.priority || 'preferible';

                return (
                  <div
                    key={feat.id}
                    className={`p-3 rounded-2xl border transition-all ${
                      isSelected
                        ? currentPriority === 'indispensable'
                          ? 'bg-[var(--green-20)]/40 border-[var(--green-dark)]'
                          : 'bg-[var(--blue-20)]/40 border-[var(--blue-dark)]'
                        : 'bg-white border-[var(--gray-semilight)]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => handleToggleFeature(feat)}
                        className="flex items-center gap-2 text-left flex-1 min-h-[44px] cursor-pointer"
                      >
                        <span
                          className={`w-5 h-5 rounded-md flex items-center justify-center border text-white ${
                            isSelected
                              ? currentPriority === 'indispensable'
                                ? 'bg-[var(--green-dark)] border-[var(--green-dark)]'
                                : 'bg-[var(--blue-dark)] border-[var(--blue-dark)]'
                              : 'border-[var(--gray-semilight)] bg-white'
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </span>
                        <span className="text-xs font-bold text-[var(--gray-dark)]">
                          {feat.label}
                        </span>
                      </button>

                      <span className="text-xs text-[var(--gray-semidark)] uppercase tracking-wider font-semibold">
                        {feat.category}
                      </span>
                    </div>

                    {/* CONTROL SEGMENTADO VISIBLE cuando está seleccionado */}
                    {isSelected && (
                      <div className="mt-2.5 pt-2 border-t border-[var(--gray-semilight)]/60 flex items-center gap-2">
                        <span className="text-xs font-semibold text-[var(--gray-semidark)] shrink-0">
                          Nivel:
                        </span>
                        <div className="grid grid-cols-2 gap-1.5 flex-1 bg-[var(--gray-light)] p-1 rounded-xl">
                          <button
                            type="button"
                            onClick={() =>
                              handleChangeFeaturePriority(feat.label, 'indispensable')
                            }
                            className={`min-h-[44px] py-1 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              currentPriority === 'indispensable'
                                ? 'bg-[var(--green-dark)] text-white shadow-xs'
                                : 'text-[var(--gray-semidark)] hover:text-[var(--gray-dark)]'
                            }`}
                          >
                            Imprescindible
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleChangeFeaturePriority(feat.label, 'preferible')
                            }
                            className={`min-h-[44px] py-1 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              currentPriority === 'preferible'
                                ? 'bg-[var(--blue-dark)] text-white shadow-xs'
                                : 'text-[var(--gray-semidark)] hover:text-[var(--gray-dark)]'
                            }`}
                          >
                            Me gustaría
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* PASO 5: Revisión final antes de guardar */}
        {/* =================================================================== */}
        {currentStep === 5 && (
          <div className="space-y-4">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold bg-[var(--green-20)] text-[var(--green-dark)]">
                <Sparkles className="w-3.5 h-3.5" />
                Resumen de tu casa ideal
              </span>
              <h2 className="text-xl font-bold text-[var(--gray-dark)] mt-1">
                ¡Así se ve tu meta inmobiliaria!
              </h2>
            </div>

            {/* Tarjeta de desglose por secciones con enlaces Editar */}
            <div className="rounded-2xl border border-[var(--gray-semilight)] bg-white p-4 space-y-3 divide-y divide-[var(--gray-light)]">
              {/* Sección Tipo */}
              <div className="flex items-center justify-between pt-1">
                <div>
                  <span className="text-xs text-[var(--gray-semidark)] block">
                    Tipo de propiedad
                  </span>
                  <p className="text-sm font-bold text-[var(--gray-dark)] capitalize">
                    {selectedType}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="text-xs font-bold text-[var(--blue-dark)] hover:underline min-h-[44px] px-2 flex items-center cursor-pointer"
                >
                  Editar
                </button>
              </div>

              {/* Sección Comunas */}
              <div className="flex items-center justify-between pt-2">
                <div>
                  <span className="text-xs text-[var(--gray-semidark)] block">
                    Comunas elegidas
                  </span>
                  <p className="text-sm font-bold text-[var(--gray-dark)]">
                    {selectedCommunes.join(', ')}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="text-xs font-bold text-[var(--blue-dark)] hover:underline min-h-[44px] px-2 flex items-center cursor-pointer"
                >
                  Editar
                </button>
              </div>

              {/* Sección Ambientes */}
              {selectedType !== 'terreno' && (
                <div className="flex items-center justify-between pt-2">
                  <div>
                    <span className="text-xs text-[var(--gray-semidark)] block">
                      Distribución
                    </span>
                    <p className="text-sm font-bold text-[var(--gray-dark)]">
                      {bedrooms} dormitorios · {bathrooms} baños
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(3)}
                    className="text-xs font-bold text-[var(--blue-dark)] hover:underline min-h-[44px] px-2 flex items-center cursor-pointer"
                  >
                    Editar
                  </button>
                </div>
              )}

              {/* Sección Preferencias */}
              <div className="flex items-center justify-between pt-2">
                <div>
                  <span className="text-xs text-[var(--gray-semidark)] block">
                    Características especiales
                  </span>
                  <p className="text-xs text-[var(--gray-dark)] font-medium">
                    {featureTags.length > 0
                      ? featureTags.map((t) => t.label).join(', ')
                      : 'Ninguna adicional seleccionada'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setCurrentStep(4)}
                  className="text-xs font-bold text-[var(--blue-dark)] hover:underline min-h-[44px] px-2 flex items-center cursor-pointer"
                >
                  Editar
                </button>
              </div>
            </div>

            {/* Ejemplos compatibles preliminares */}
            {compatibleProperties.length > 0 && (
              <div className="space-y-2 pt-1">
                <span className="text-xs font-bold text-[var(--gray-semidark)]">
                  Ejemplos que encajan con tu meta ({compatibleProperties.length} casas):
                </span>
                <div className="space-y-2">
                  {compatibleProperties.slice(0, 2).map(({ property, matchScore }) => (
                    <div
                      key={property.id}
                      className="rounded-xl border border-[var(--gray-semilight)] p-2.5 flex items-center gap-3 bg-[var(--gray-light)]/40"
                    >
                      <img
                        src={property.image}
                        alt=""
                        onError={(e) => {
                          e.currentTarget.src = getFallbackImage(property);
                        }}
                        className="w-14 h-12 rounded-lg object-cover shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold text-[var(--gray-dark)] truncate">
                            {property.title}
                          </p>
                          <span className="text-xs font-bold text-[var(--green-dark)] bg-[var(--green-20)] px-2 py-0.5 rounded-full shrink-0">
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
          </div>
        )}
      </div>

      {/* BARRA RESUMEN FIJA SOBRE EL BOTÓN (Feedback inmediato; principio de Tesler) */}
      <div className="sticky bottom-0 bg-white/95 backdrop-blur-sm border-t border-[var(--gray-semilight)] px-4 pt-2.5 pb-2 space-y-2 z-10">
        <div className="flex items-center justify-between text-xs">
          <div className="truncate">
            <span className="font-bold text-[var(--gray-dark)] truncate block">
              {typeName} en {selectedCommunes[0]}
              {previewDistribution}
            </span>
            <span className="text-xs text-[var(--gray-semidark)]">
              Pie aprox. {formatUF(liveDownPaymentUF)} ({formatCLP(liveDownPaymentCLP)})
            </span>
          </div>

          <span className="text-xs font-bold text-[var(--blue-dark)] bg-[var(--blue-20)] px-2.5 py-1 rounded-xl shrink-0">
            Total {formatUF(liveEstimatedUF)}
          </span>
        </div>

        {/* Botón de avance según el paso */}
        {currentStep < 5 ? (
          <button
            type="button"
            onClick={() => setCurrentStep((prev) => prev + 1)}
            className="bci-btn-primary w-full cursor-pointer"
          >
            <span>Continuar al paso {currentStep + 1}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleFinalSave}
            className="bci-btn-primary w-full cursor-pointer"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>Guardar y empezar a ahorrar</span>
          </button>
        )}
      </div>

      {/* Modal "¿Qué es el pie?" */}
      <ModalDialog
        isOpen={isPieHelpOpen}
        onClose={() => setIsPieHelpOpen(false)}
        title="¿Qué es el pie de una casa?"
        subtitle="Concepto clave para tu primera vivienda"
      >
        <div className="space-y-3 pt-1 text-xs text-[var(--gray-dark)] leading-relaxed">
          <div className="p-3.5 rounded-2xl bg-[var(--blue-20)] border border-[var(--blue-40)] space-y-1.5">
            <p className="font-bold text-sm text-[var(--blue-dark)]">
              Tu aporte inicial con fondos propios
            </p>
            <p>
              El <strong>pie</strong> es el dinero que pones tú al comprar (normalmente el <strong>20% del valor total</strong>). El 80% restante se financia mediante un crédito hipotecario.
            </p>
          </div>
          <p>
            En este prototipo, si tu casa ideal tiene un valor referencial de <strong>4.500 UF</strong>, tu meta de pie es reunir <strong>900 UF</strong> (aproximadamente $36.000.000 con una UF de $40.000).
          </p>
          <button
            type="button"
            onClick={() => setIsPieHelpOpen(false)}
            className="bci-btn-primary w-full mt-2 cursor-pointer"
          >
            Entendido
          </button>
        </div>
      </ModalDialog>
    </div>
  );
};
