import React, { useMemo, useState } from 'react';
import {
  Building2,
  Check,
  ChevronDown,
  ChevronUp,
  Compass,
  Home,
  LandPlot,
  LayoutGrid,
  MapPin,
  Plus,
  RotateCcw,
  Search,
  Sparkles,
  Trees,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  ALL_LOCATION_TAGS,
  BEDROOM_TAGS,
  BATHROOM_TAGS,
  INTERIOR_TAGS,
  CONNECTIVITY_TAGS,
  EXTERIOR_TAGS,
} from '../../data/preferenceVocabulary';
import { PreferencePriority, PreferenceTag } from '../../types/app';

type VisualCategoryKey = 'tipo' | 'ubicacion' | 'distribucion' | 'entorno';

const PROPERTY_TYPE_OPTIONS: {
  label: string;
  description: string;
  icon: React.ReactNode;
}[] = [
  {
    label: 'Departamento',
    description: 'En altura y conectado',
    icon: <Building2 className="w-4 h-4" aria-hidden="true" />,
  },
  {
    label: 'Casa',
    description: 'Independiente o condominio',
    icon: <Home className="w-4 h-4" aria-hidden="true" />,
  },
  {
    label: 'Parcela',
    description: 'Terreno amplio y naturaleza',
    icon: <Trees className="w-4 h-4" aria-hidden="true" />,
  },
  {
    label: 'Terreno vacío',
    description: 'Sitio para construir',
    icon: <LandPlot className="w-4 h-4" aria-hidden="true" />,
  },
];

const LOCATION_OPTIONS: readonly string[] = ALL_LOCATION_TAGS;

const DISTRIBUTION_BED_BATH: readonly string[] = [
  ...BEDROOM_TAGS,
  ...BATHROOM_TAGS,
];

const DISTRIBUTION_INTERIOR: readonly string[] = INTERIOR_TAGS;

const ENVIRONMENT_CONNECTIVITY: readonly string[] = CONNECTIVITY_TAGS;

const ENVIRONMENT_EXTERIOR: readonly string[] = EXTERIOR_TAGS;

interface InteractiveChipProps {
  label: string;
  priority: PreferencePriority | null;
  onTap: () => void;
  subtitle?: string;
  leadingIcon?: React.ReactNode;
  fullWidth?: boolean;
}

/**
 * Chip Interactivo de 3 Estados diseñado para pantallas móviles de 390px:
 * - Estado 0: No seleccionado (Blanco con borde sutil)
 * - Estado 1: Indispensable (Verde Bci)
 * - Estado 2: Preferible (Azul Bci)
 */
const InteractiveThreeStateChip: React.FC<InteractiveChipProps> = ({
  label,
  priority,
  onTap,
  subtitle,
  leadingIcon,
  fullWidth = false,
}) => {
  const isIndispensable = priority === 'indispensable';
  const isPreferible = priority === 'preferible' || priority === 'opcional';

  const containerStyle = isIndispensable
    ? 'bg-[var(--green-20)] border-[var(--green-normal)] text-[var(--green-dark)] shadow-2xs'
    : isPreferible
    ? 'bg-[var(--blue-20)] border-[var(--blue-normal)] text-[var(--blue-dark)] shadow-2xs'
    : 'bg-white border-[var(--gray-semilight)] text-[var(--gray-dark)] hover:border-[var(--gray-neutral)] hover:bg-[var(--gray-light)]/50';

  const stateLabel = isIndispensable
    ? 'Indispensable'
    : isPreferible
    ? 'Preferible'
    : 'No seleccionado';

  return (
    <button
      type="button"
      onClick={onTap}
      aria-pressed={priority !== null}
      aria-label={`${label}: ${stateLabel}. Toca para cambiar estado.`}
      className={`${
        fullWidth ? 'w-full justify-between' : 'inline-flex'
      } min-h-[46px] px-3.5 py-2 rounded-2xl border-[1.5px] transition-all duration-150 active:scale-[0.98] flex items-center gap-2 text-left cursor-pointer select-none ${containerStyle}`}
    >
      <div className="flex items-center gap-2 min-w-0">
        {isIndispensable ? (
          <span
            aria-hidden="true"
            className="w-5 h-5 rounded-full bg-[var(--green-normal)] text-white flex items-center justify-center shrink-0"
          >
            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
          </span>
        ) : isPreferible ? (
          <span
            aria-hidden="true"
            className="w-5 h-5 rounded-full bg-[var(--blue-normal)] text-white flex items-center justify-center shrink-0"
          >
            <Sparkles className="w-3 h-3" />
          </span>
        ) : leadingIcon ? (
          <span
            aria-hidden="true"
            className="text-[var(--gray-semidark)] shrink-0"
          >
            {leadingIcon}
          </span>
        ) : (
          <span
            aria-hidden="true"
            className="w-4 h-4 rounded-full border border-[var(--gray-semilight)] bg-[var(--gray-light)] shrink-0"
          />
        )}

        <div className="min-w-0">
          <span className="text-[13px] leading-snug font-semibold block truncate">
            {label}
          </span>
          {subtitle && (
            <span className="text-xs text-[var(--gray-semidark)] font-normal block truncate">
              {subtitle}
            </span>
          )}
        </div>
      </div>

      {isIndispensable && (
        <span className="shrink-0 text-xs font-bold tracking-tight px-2 py-0.5 rounded-full bg-[var(--green-normal)] text-white">
          Indispensable
        </span>
      )}
      {isPreferible && (
        <span className="shrink-0 text-xs font-bold tracking-tight px-2 py-0.5 rounded-full bg-[var(--blue-normal)] text-white">
          Preferible
        </span>
      )}
    </button>
  );
};

interface CollapsibleCategoryCardProps {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  accentColor: 'green' | 'blue';
  isOpen: boolean;
  onToggle: () => void;
  activeTags: PreferenceTag[];
  children: React.ReactNode;
}

const CollapsibleCategoryCard: React.FC<CollapsibleCategoryCardProps> = ({
  title,
  subtitle,
  icon,
  accentColor,
  isOpen,
  onToggle,
  activeTags,
  children,
}) => {
  const indCount = activeTags.filter(
    (t) => t.priority === 'indispensable'
  ).length;
  const prefCount = activeTags.filter(
    (t) => t.priority !== 'indispensable'
  ).length;

  return (
    <div
      className={`rounded-3xl bg-white border transition-all overflow-hidden ${
        isOpen
          ? 'border-[var(--gray-neutral)] shadow-xs'
          : 'border-[var(--gray-semilight)]'
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className="w-full min-h-[68px] px-4 py-3.5 flex items-center justify-between gap-3 text-left hover:bg-[var(--gray-light)]/50 transition-colors cursor-pointer"
      >
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div
            className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 mt-0.5 ${
              accentColor === 'green'
                ? 'bg-[var(--green-20)] text-[var(--green-dark)]'
                : 'bg-[var(--blue-20)] text-[var(--blue-dark)]'
            }`}
          >
            {icon}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[15px] font-bold text-[var(--gray-dark)] leading-snug">
                {title}
              </span>
              {indCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[var(--green-20)] text-[var(--green-dark)] border border-[var(--green-60)]">
                  {indCount} Indisp.
                </span>
              )}
              {prefCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[var(--blue-20)] text-[var(--blue-dark)] border border-[var(--blue-60)]">
                  {prefCount} Pref.
                </span>
              )}
            </div>

            {!isOpen && activeTags.length > 0 ? (
              <p className="text-xs font-medium text-[var(--gray-dark)] mt-0.5 truncate">
                {activeTags.map((t) => t.label).join(' · ')}
              </p>
            ) : (
              <p className="text-xs text-[var(--gray-semidark)] mt-0.5 truncate">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        <div className="w-8 h-8 rounded-full bg-[var(--gray-light)] flex items-center justify-center text-[var(--gray-semidark)] shrink-0">
          {isOpen ? (
            <ChevronUp className="w-4 h-4" aria-hidden="true" />
          ) : (
            <ChevronDown className="w-4 h-4" aria-hidden="true" />
          )}
        </div>
      </button>

      {isOpen && (
        <div className="px-4 pb-5 pt-3 border-t border-[var(--gray-light)] space-y-4">
          {children}
        </div>
      )}
    </div>
  );
};

export const ArchetypeTagBuilder: React.FC = () => {
  const { archetype, cycleTagState, clearAllTags } = useApp();

  // Todos los contenedores de categorías inician colapsados por defecto y se despliegan al interactuar con ellos
  const [openCategories, setOpenCategories] = useState<
    Record<VisualCategoryKey, boolean>
  >({
    tipo: false,
    ubicacion: false,
    distribucion: false,
    entorno: false,
  });

  const [locationQuery, setLocationQuery] = useState('');
  const [showAllLocations, setShowAllLocations] = useState(false);

  const toggleCategory = (key: VisualCategoryKey) => {
    setOpenCategories((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const getTagPriority = (label: string): PreferencePriority | null => {
    const found = archetype.tags.find(
      (t) => t.label.toLowerCase() === label.toLowerCase()
    );
    return found ? found.priority : null;
  };

  const allLocations = useMemo(() => {
    const customLocs = archetype.tags
      .filter(
        (t) =>
          t.category === 'ubicacion' &&
          !LOCATION_OPTIONS.some(
            (opt) => opt.toLowerCase() === t.label.toLowerCase()
          )
      )
      .map((t) => t.label);
    return [...customLocs, ...LOCATION_OPTIONS];
  }, [archetype.tags]);

  const filteredLocations = useMemo(() => {
    const q = locationQuery.trim().toLowerCase();
    if (!q) {
      if (showAllLocations) return allLocations;
      const selected = allLocations.filter(
        (loc) => getTagPriority(loc) !== null
      );
      const unselected = allLocations.filter(
        (loc) => getTagPriority(loc) === null
      );
      return [...selected, ...unselected].slice(0, 9);
    }
    return allLocations.filter((loc) => loc.toLowerCase().includes(q));
  }, [allLocations, locationQuery, showAllLocations, archetype.tags]);

  const canAddCustomCommune =
    locationQuery.trim().length >= 2 &&
    !allLocations.some(
      (loc) => loc.toLowerCase() === locationQuery.trim().toLowerCase()
    );

  const handleCreateCustomCommune = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = locationQuery.trim();
    if (!clean) return;
    cycleTagState(clean, 'ubicacion', true);
    setLocationQuery('');
  };

  // Agrupación de etiquetas activas por contenedor visual
  const tipoTags = archetype.tags.filter((t) => t.category === 'tipo');
  const ubicacionTags = archetype.tags.filter(
    (t) => t.category === 'ubicacion'
  );
  const distribucionTags = archetype.tags.filter(
    (t) => t.category === 'interior'
  );
  const entornoTags = archetype.tags.filter(
    (t) => t.category === 'conectividad' || t.category === 'exterior'
  );

  const indispensableCount = archetype.tags.filter(
    (t) => t.priority === 'indispensable'
  ).length;
  const preferibleCount = archetype.tags.filter(
    (t) => t.priority !== 'indispensable'
  ).length;

  return (
    <div className="space-y-4">
      {/* Guía rápida de los 3 estados del Chip Interactivo */}
      <div className="rounded-3xl bg-white border border-[var(--gray-semilight)] p-4 space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold text-[var(--gray-dark)]">
            Chips interactivos de 3 estados
          </span>
          <span className="text-xs text-[var(--gray-semidark)]">
            Toca una categoría para desplegar
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-2xl bg-[var(--gray-light)]/70 border border-[var(--gray-semilight)] px-2.5 py-2">
            <span className="w-2.5 h-2.5 rounded-full border border-[var(--gray-neutral)] bg-white inline-block mb-1" />
            <span className="text-xs font-bold text-[var(--gray-dark)] block">
              No seleccionado
            </span>
            <span className="text-xs text-[var(--gray-semidark)] block">
              Estado base
            </span>
          </div>

          <div className="rounded-2xl bg-[var(--green-20)] border border-[var(--green-normal)] px-2.5 py-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--green-normal)] inline-block mb-1" />
            <span className="text-xs font-bold text-[var(--green-dark)] block">
              1 toque: Indisp.
            </span>
            <span className="text-xs text-[var(--gray-dark)] block">
              Verde Bci
            </span>
          </div>

          <div className="rounded-2xl bg-[var(--blue-20)] border border-[var(--blue-normal)] px-2.5 py-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--blue-normal)] inline-block mb-1" />
            <span className="text-xs font-bold text-[var(--blue-dark)] block">
              2 toques: Pref.
            </span>
            <span className="text-xs text-[var(--gray-dark)] block">
              Azul Bci
            </span>
          </div>
        </div>
      </div>

      {/* CONTENEDOR 1: TIPO DE PROPIEDAD (Colapsable) */}
      <CollapsibleCategoryCard
        title="Tipo de Propiedad"
        subtitle="Departamento, Casa, Parcela o Terreno vacío"
        icon={<Building2 className="w-5 h-5" aria-hidden="true" />}
        accentColor="green"
        isOpen={openCategories.tipo}
        onToggle={() => toggleCategory('tipo')}
        activeTags={tipoTags}
      >
        <div className="grid grid-cols-1 gap-2.5">
          {PROPERTY_TYPE_OPTIONS.map((opt) => (
            <InteractiveThreeStateChip
              key={opt.label}
              label={opt.label}
              subtitle={opt.description}
              leadingIcon={opt.icon}
              priority={getTagPriority(opt.label)}
              onTap={() => cycleTagState(opt.label, 'tipo')}
              fullWidth
            />
          ))}
        </div>
      </CollapsibleCategoryCard>

      {/* CONTENEDOR 2: UBICACIÓN / COMUNAS (Colapsable con barra de búsqueda rápida) */}
      <CollapsibleCategoryCard
        title="Ubicación / Comunas"
        subtitle="Busca y selecciona comunas o regiones"
        icon={<MapPin className="w-5 h-5" aria-hidden="true" />}
        accentColor="blue"
        isOpen={openCategories.ubicacion}
        onToggle={() => toggleCategory('ubicacion')}
        activeTags={ubicacionTags}
      >
        {/* Barra de búsqueda rápida de comunas */}
        <form onSubmit={handleCreateCustomCommune} className="relative">
          <label htmlFor="quick-commune-search" className="visually-hidden">
            Buscar o agregar comuna
          </label>
          <Search
            className="w-4 h-4 text-[var(--gray-semidark)] left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ position: 'absolute' }}
            aria-hidden="true"
          />
          <input
            id="quick-commune-search"
            type="text"
            value={locationQuery}
            onChange={(e) => setLocationQuery(e.target.value)}
            placeholder="Buscar comuna o sector (ej. Ñuñoa, La Florida)..."
            className="bci-input !pl-10 !pr-9 text-xs"
          />
          {locationQuery && (
            <button
              type="button"
              onClick={() => setLocationQuery('')}
              aria-label="Limpiar búsqueda de comuna"
              className="right-2.5 top-1/2 -translate-y-1/2 min-w-[32px] min-h-[32px] rounded-full flex items-center justify-center text-[var(--gray-semidark)] hover:bg-[var(--gray-light)]"
              style={{ position: 'absolute' }}
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          )}
        </form>

        {canAddCustomCommune && (
          <button
            type="button"
            onClick={handleCreateCustomCommune}
            className="w-full min-h-[44px] px-3.5 py-2 rounded-2xl bg-[var(--green-20)] border border-[var(--green-normal)] text-[var(--green-dark)] text-xs font-bold flex items-center justify-between"
          >
            <span className="flex items-center gap-1.5">
              <Plus className="w-4 h-4" aria-hidden="true" />
              Sumar &ldquo;{locationQuery.trim()}&rdquo; como nueva comuna
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--green-normal)] text-white">
              Indispensable
            </span>
          </button>
        )}

        <div className="flex flex-wrap gap-2">
          {filteredLocations.map((locLabel) => (
            <InteractiveThreeStateChip
              key={locLabel}
              label={locLabel}
              priority={getTagPriority(locLabel)}
              onTap={() => cycleTagState(locLabel, 'ubicacion')}
            />
          ))}
        </div>

        {!locationQuery && allLocations.length > 9 && (
          <button
            type="button"
            onClick={() => setShowAllLocations((prev) => !prev)}
            className="text-xs font-semibold text-[var(--blue-dark)] hover:underline cursor-pointer"
          >
            {showAllLocations
              ? 'Mostrar menos ubicaciones'
              : `Ver todas las comunas y regiones (${allLocations.length})`}
          </button>
        )}
      </CollapsibleCategoryCard>

      {/* CONTENEDOR 3: DISTRIBUCIÓN (Colapsable) */}
      <CollapsibleCategoryCard
        title="Distribución"
        subtitle="Dormitorios, baños y ambientes interiores"
        icon={<LayoutGrid className="w-5 h-5" aria-hidden="true" />}
        accentColor="green"
        isOpen={openCategories.distribucion}
        onToggle={() => toggleCategory('distribucion')}
        activeTags={distribucionTags}
      >
        <div className="space-y-2">
          <span className="text-xs font-bold text-[var(--gray-dark)] block">
            Dormitorios y baños
          </span>
          <div className="flex flex-wrap gap-2">
            {DISTRIBUTION_BED_BATH.map((item) => (
              <InteractiveThreeStateChip
                key={item}
                label={item}
                priority={getTagPriority(item)}
                onTap={() => cycleTagState(item, 'interior')}
              />
            ))}
          </div>
        </div>

        <div className="space-y-2 pt-2 border-t border-[var(--gray-light)]">
          <span className="text-xs font-bold text-[var(--gray-dark)] block">
            Ambientes interiores
          </span>
          <div className="flex flex-wrap gap-2">
            {DISTRIBUTION_INTERIOR.map((item) => (
              <InteractiveThreeStateChip
                key={item}
                label={item}
                priority={getTagPriority(item)}
                onTap={() => cycleTagState(item, 'interior')}
              />
            ))}
          </div>
        </div>
      </CollapsibleCategoryCard>

      {/* CONTENEDOR 4: ENTORNO (Colapsable) */}
      <CollapsibleCategoryCard
        title="Entorno"
        subtitle="Conectividad, cercanía y vida exterior"
        icon={<Compass className="w-5 h-5" aria-hidden="true" />}
        accentColor="blue"
        isOpen={openCategories.entorno}
        onToggle={() => toggleCategory('entorno')}
        activeTags={entornoTags}
      >
        <div className="space-y-2">
          <span className="text-xs font-bold text-[var(--gray-dark)] block">
            Conectividad y cercanía
          </span>
          <div className="flex flex-wrap gap-2">
            {ENVIRONMENT_CONNECTIVITY.map((item) => (
              <InteractiveThreeStateChip
                key={item}
                label={item}
                priority={getTagPriority(item)}
                onTap={() => cycleTagState(item, 'conectividad')}
              />
            ))}
          </div>
        </div>

        <div className="space-y-2 pt-2 border-t border-[var(--gray-light)]">
          <span className="text-xs font-bold text-[var(--gray-dark)] block">
            Atributos exteriores y equipamiento
          </span>
          <div className="flex flex-wrap gap-2">
            {ENVIRONMENT_EXTERIOR.map((item) => (
              <InteractiveThreeStateChip
                key={item}
                label={item}
                priority={getTagPriority(item)}
                onTap={() => cycleTagState(item, 'exterior')}
              />
            ))}
          </div>
        </div>
      </CollapsibleCategoryCard>

      {/* CONTADOR DINÁMICO DE PREFERENCIAS SELECCIONADAS EN LA PARTE INFERIOR */}
      <div
        role="region"
        aria-label="Contador dinámico de preferencias seleccionadas"
        className="rounded-3xl bg-white border-[1.5px] border-[var(--gray-semilight)] p-4 shadow-xs space-y-3"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-[var(--gray-dark)] text-white text-xs font-bold flex items-center justify-center shrink-0">
              {archetype.tags.length}
            </span>
            <div>
              <p className="text-sm font-bold text-[var(--gray-dark)] leading-tight">
                {archetype.tags.length === 1
                  ? '1 preferencia seleccionada'
                  : `${archetype.tags.length} preferencias seleccionadas`}
              </p>
              <p className="text-xs text-[var(--gray-semidark)]">
                Toca cualquier chip activo abajo para cambiar su estado
              </p>
            </div>
          </div>

          {archetype.tags.length > 0 && (
            <button
              type="button"
              onClick={clearAllTags}
              className="min-h-[36px] px-2.5 rounded-xl text-xs font-semibold text-[var(--gray-semidark)] hover:bg-[var(--gray-light)] flex items-center gap-1 shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Limpiar</span>
            </button>
          )}
        </div>

        {/* Desglose por color Bci (Verde Indispensable vs Azul Preferible) */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-2xl bg-[var(--green-20)] border border-[var(--green-60)] px-3 py-2 flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--green-dark)] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[var(--green-normal)]" />
              Indispensables
            </span>
            <span className="text-sm font-bold text-[var(--green-dark)]">
              {indispensableCount}
            </span>
          </div>

          <div className="rounded-2xl bg-[var(--blue-20)] border border-[var(--blue-60)] px-3 py-2 flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--blue-dark)] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[var(--blue-normal)]" />
              Preferibles
            </span>
            <span className="text-sm font-bold text-[var(--blue-dark)]">
              {preferibleCount}
            </span>
          </div>
        </div>

        {/* Resumen compacto de chips activos */}
        {archetype.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {archetype.tags.map((tag) => {
              const isInd = tag.priority === 'indispensable';
              return (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => cycleTagState(tag.label, tag.category)}
                  className={`min-h-[34px] px-2.5 py-1 rounded-xl text-xs font-semibold border inline-flex items-center gap-1.5 transition-all cursor-pointer ${
                    isInd
                      ? 'bg-[var(--green-20)] border-[var(--green-normal)] text-[var(--green-dark)]'
                      : 'bg-[var(--blue-20)] border-[var(--blue-normal)] text-[var(--blue-dark)]'
                  }`}
                >
                  <span>{tag.label}</span>
                  <span
                    className={`text-xs px-1.5 py-0.2 rounded-full text-white font-bold ${
                      isInd
                        ? 'bg-[var(--green-normal)]'
                        : 'bg-[var(--blue-normal)]'
                    }`}
                  >
                    {isInd ? 'Ind.' : 'Pref.'}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
