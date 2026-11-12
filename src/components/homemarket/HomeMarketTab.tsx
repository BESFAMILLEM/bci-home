import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  Bath,
  BedDouble,
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Heart,
  Info,
  Landmark,
  Lock,
  MapPin,
  Maximize2,
  PiggyBank,
  Share2,
  Sliders,
  Sparkles,
  Target,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getDeveloper } from '../../data/developers';
import {
  createPropertySvgDataUri,
  getFallbackImage,
} from '../../data/mockProperties';
import { MortgageApplication, ScoredProperty } from '../../types/app';
import {
  formatCLP,
  formatUF,
  findSmartRelaxationSuggestions,
  findAlmostMatchingProperties,
} from '../../utils/financialEngine';
import { ModalDialog } from '../common/ModalDialog';

export const HomeMarketTab: React.FC = () => {
  const {
    archetype,
    metrics,
    compatibleProperties,
    unlockThresholdPercent,
    favoritePropertyIds,
    toggleFavoriteProperty,
    setActiveTab,
    setTagPriority,
    selectPropertyAsNewGoal,
    submitMortgageSimulation,
    showToast,
  } = useApp();

  // Permite explorar el feed TikTok incluso si el usuario entra antes del 85% y activa vista previa
  const [previewFeedOverride, setPreviewFeedOverride] = useState(false);

  // Índice vertical del Reel inmobiliario activo
  const [currentIndex, setCurrentIndex] = useState(0);
  // Mapa de índice de foto activa por propiedad para mantener la galería de cada slide durante el deslizamiento vertical
  const [photoIdxByProp, setPhotoIdxByProp] = useState<Record<string, number>>(
    {}
  );
  // Filtro rápido Todos vs Guardados (Likes)
  const [onlyFavorites, setOnlyFavorites] = useState(false);

  // Vista flotante tipo perfil ("Ver más") sobre la propiedad
  const [isDetailProfileOpen, setIsDetailProfileOpen] = useState(false);

  // Modal de Simulación de Evaluación Hipotecaria Bci
  const [mortgageTargetProp, setMortgageTargetProp] =
    useState<ScoredProperty | null>(null);
  const [submittedApplication, setSubmittedApplication] =
    useState<MortgageApplication | null>(null);

  // Estado de arrastre vertical en vivo para la animación táctil 1:1 entre propiedades
  const [dragOffsetY, setDragOffsetY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  // Referencias para gestos táctiles y rueda de mouse/trackpad
  const touchStartRef = useRef<{
    x: number;
    y: number;
    lockedAxis: 'vertical' | 'horizontal' | null;
  } | null>(null);
  const wheelCooldownRef = useRef<number>(0);

  const feedList = onlyFavorites
    ? compatibleProperties.filter((item) =>
        favoritePropertyIds.includes(item.property.id)
      )
    : compatibleProperties;

  // Asegurar que el índice actual esté siempre dentro de rango cuando cambian filtros
  useEffect(() => {
    if (currentIndex >= feedList.length && feedList.length > 0) {
      setCurrentIndex(0);
    }
    setDragOffsetY(0);
    setIsDragging(false);
  }, [feedList.length, currentIndex]);

  const activeItem: ScoredProperty | undefined = feedList[currentIndex];

  const getPhotosForItem = (item: ScoredProperty): string[] =>
    item.property.gallery.length > 0
      ? item.property.gallery
      : [item.property.image];

  const getPhotoIndex = (propertyId: string, totalPhotos: number): number => {
    const raw = photoIdxByProp[propertyId] ?? 0;
    return totalPhotos > 0 ? raw % totalPhotos : 0;
  };

  const setPhotoIndexForProperty = (propertyId: string, nextIdx: number) => {
    setPhotoIdxByProp((prev) => ({
      ...prev,
      [propertyId]: nextIdx,
    }));
  };

  const goToPreviousProperty = () => {
    setDragOffsetY(0);
    setIsDragging(false);
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    } else if (feedList.length > 1) {
      setCurrentIndex(feedList.length - 1);
    }
  };

  const goToNextProperty = () => {
    setDragOffsetY(0);
    setIsDragging(false);
    if (currentIndex < feedList.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else if (feedList.length > 1) {
      setCurrentIndex(0);
    }
  };

  // Soporte de desplazamiento vertical con rueda / trackpad con animación suave entre propiedades
  const handleWheel = (e: React.WheelEvent) => {
    if (isDetailProfileOpen || Boolean(mortgageTargetProp)) return;
    if (Math.abs(e.deltaY) < 28) return;

    const now = Date.now();
    if (now - wheelCooldownRef.current < 560) return;
    wheelCooldownRef.current = now;

    if (e.deltaY > 0) {
      if (currentIndex < feedList.length - 1) {
        goToNextProperty();
      }
    } else {
      if (currentIndex > 0) {
        goToPreviousProperty();
      }
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isDetailProfileOpen || Boolean(mortgageTargetProp)) return;
    const touch = e.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      lockedAxis: null,
    };
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartRef.current || isDetailProfileOpen) return;
    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;

    if (!touchStartRef.current.lockedAxis) {
      if (Math.abs(deltaY) > 8 || Math.abs(deltaX) > 8) {
        touchStartRef.current.lockedAxis =
          Math.abs(deltaY) >= Math.abs(deltaX) ? 'vertical' : 'horizontal';
      }
    }

    if (touchStartRef.current.lockedAxis === 'vertical') {
      // Aplicar resistencia elástica en el primer y último elemento del feed
      const isPullingPastStart = currentIndex === 0 && deltaY > 0;
      const isPullingPastEnd =
        currentIndex === feedList.length - 1 && deltaY < 0;
      const dampedDeltaY =
        isPullingPastStart || isPullingPastEnd ? deltaY * 0.28 : deltaY;
      setDragOffsetY(dampedDeltaY);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current || isDetailProfileOpen) {
      setIsDragging(false);
      setDragOffsetY(0);
      return;
    }

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    const lockedAxis = touchStartRef.current.lockedAxis;
    touchStartRef.current = null;

    setIsDragging(false);
    setDragOffsetY(0);

    // Si el gesto vertical es dominante (> 45px), deslizar verticalmente a la propiedad siguiente o anterior
    if (
      (lockedAxis === 'vertical' || Math.abs(deltaY) > Math.abs(deltaX)) &&
      Math.abs(deltaY) > 45
    ) {
      if (deltaY < 0 && currentIndex < feedList.length - 1) {
        setCurrentIndex((prev) => prev + 1);
      } else if (deltaY > 0 && currentIndex > 0) {
        setCurrentIndex((prev) => prev - 1);
      }
      return;
    }

    // Si el gesto horizontal es dominante (> 40px), cambiar foto de la galería interna de la propiedad activa
    if (
      activeItem &&
      (lockedAxis === 'horizontal' || Math.abs(deltaX) > Math.abs(deltaY)) &&
      Math.abs(deltaX) > 40
    ) {
      const photos = getPhotosForItem(activeItem);
      if (photos.length > 1) {
        const curPhoto = getPhotoIndex(activeItem.property.id, photos.length);
        if (deltaX < 0) {
          setPhotoIndexForProperty(
            activeItem.property.id,
            (curPhoto + 1) % photos.length
          );
        } else {
          setPhotoIndexForProperty(
            activeItem.property.id,
            (curPhoto - 1 + photos.length) % photos.length
          );
        }
      }
    }
  };

  const handleShareProperty = async (item: ScoredProperty) => {
    const shareText = `${item.property.title} en ${item.property.commune} · ${formatUF(
      item.property.priceUF
    )} (${item.matchScore}% compatible con tu pie ahorrado)`;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(window.location.href);
      }
    } catch {
      // Ignorar restricciones de portapapeles en sandbox
    }
    showToast(
      'Enlace listo para compartir',
      `Copiamos la ficha de "${shareText}".`,
      'info'
    );
  };

  const handleToggleLike = (item: ScoredProperty) => {
    const isCurrentlyLiked = favoritePropertyIds.includes(item.property.id);
    toggleFavoriteProperty(item.property.id);
    showToast(
      isCurrentlyLiked
        ? 'Eliminado de guardados'
        : 'Propiedad guardada en favoritos',
      isCurrentlyLiked
        ? `Quitaste "${item.property.title}" de tu lista.`
        : `Guardaste "${item.property.title}" para compararla más tarde.`,
      isCurrentlyLiked ? 'info' : 'success'
    );
  };

  const handleOpenMortgageFlow = (item: ScoredProperty) => {
    setSubmittedApplication(null);
    setMortgageTargetProp(item);
  };

  const handleSendMortgageDemo = () => {
    if (!mortgageTargetProp) return;
    const app = submitMortgageSimulation(mortgageTargetProp.property);
    setSubmittedApplication(app);
  };

  const handleImageError = (
    e: React.SyntheticEvent<HTMLImageElement>,
    item?: { property: ScoredProperty['property'] }
  ) => {
    if (item?.property) {
      e.currentTarget.src = getFallbackImage(item.property);
    } else {
      e.currentTarget.src = createPropertySvgDataUri(
        'departamento',
        'Vivienda Bci'
      );
    }
  };

  // Pantalla de desbloqueo si aún no llega al 85% ni ha activado vista previa
  if (!metrics.isHomeMarketUnlocked && !previewFeedOverride) {
    const missingFor85 = Math.max(
      0,
      Math.ceil(
        (metrics.downPaymentTargetCLP * unlockThresholdPercent) / 100 -
          metrics.currentSavings
      )
    );

    return (
      <div className="flex-1 w-full bg-black text-white px-5 py-6 flex flex-col justify-between min-h-full relative overflow-hidden">
        {/* Imagen de fondo difuminada */}
        {compatibleProperties[0] && (
          <img
            src={compatibleProperties[0].property.image}
            alt=""
            aria-hidden="true"
            onError={(e) => handleImageError(e, compatibleProperties[0])}
            className="inset-0 w-full h-full object-cover opacity-25 blur-sm scale-105 pointer-events-none"
            style={{ position: 'absolute' }}
          />
        )}
        <div
          className="inset-0 bg-gradient-to-b from-black/85 via-black/80 to-black/95 pointer-events-none"
          style={{ position: 'absolute' }}
        />

        <div className="relative z-10 space-y-2.5">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-[var(--yellow-normal)] text-[var(--gray-dark)] px-3 py-1 rounded-full">
            <Lock className="w-3.5 h-3.5" aria-hidden="true" />
            Paso 3 de 3 · Bloqueado
          </span>
          <h1 className="text-2xl font-bold leading-tight">
            Explorar casas se activa al llegar al {unlockThresholdPercent}% de tu pie
          </h1>
          <p className="text-xs text-white/80 leading-relaxed">
            Mantenemos el foco en tu ahorro para que descubras casas reales cuando tu meta esté verdaderamente a tu alcance.
          </p>
        </div>

        <div className="relative z-10 rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 p-5 space-y-4">
          <div className="flex items-center justify-between text-xs">
            <span className="text-white/85 font-semibold">
              Tu progreso actual hacia el pie
            </span>
            <span className="text-[var(--green-40)] font-bold text-sm">
              {metrics.savingsProgress}% / {unlockThresholdPercent}%
            </span>
          </div>

          <div className="h-3 w-full rounded-full bg-white/15 overflow-hidden">
            <div
              className="h-full bg-[var(--green-normal)] rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(
                  100,
                  Math.round(
                    (metrics.savingsProgress / unlockThresholdPercent) * 100
                  )
                )}%`,
              }}
            />
          </div>

          <div className="space-y-1 text-xs text-white/85 leading-relaxed">
            <p>
              Te faltan <strong>{formatCLP(missingFor85)}</strong> para desbloquear el catálogo.
            </p>
            <p className="text-white/70">
              Hay <strong>{compatibleProperties.length} casas compatibles</strong> esperándote cuando alcances este hito.
            </p>
          </div>

          <div className="flex flex-col gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => setActiveTab('ahorro')}
              className="bci-btn-primary w-full text-sm font-bold cursor-pointer"
            >
              <PiggyBank className="w-4 h-4" aria-hidden="true" />
              <span>Ir a depositar para desbloquear</span>
            </button>
            <button
              type="button"
              onClick={() => setPreviewFeedOverride(true)}
              className="text-xs font-semibold text-white/70 hover:text-white py-2 text-center underline cursor-pointer"
            >
              Ver vista previa sin desbloquear
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Estado vacío si no hay propiedades compatibles con el arquetipo o filtro de favoritos
  if (feedList.length === 0 || !activeItem) {
    const relaxationSuggestions = !onlyFavorites
      ? findSmartRelaxationSuggestions(
          archetype,
          metrics.currentSavings,
          metrics.ufValueCLP
        )
      : [];

    const almostMatching = !onlyFavorites
      ? findAlmostMatchingProperties(
          archetype,
          metrics.currentSavings,
          metrics.ufValueCLP
        )
      : [];

    return (
      <div className="flex-1 w-full bg-black text-white px-5 py-6 flex flex-col items-center justify-center text-center min-h-[640px] overflow-y-auto space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-[var(--green-60)] shrink-0">
          <Building2 className="w-7 h-7" aria-hidden="true" />
        </div>

        <div className="space-y-1">
          <h1 className="text-lg font-bold">
            {onlyFavorites
              ? 'Aún no tienes propiedades guardadas con Me gusta'
              : 'No encontramos casas con todos tus requisitos imprescindibles'}
          </h1>
          <p className="text-xs text-white/75 max-w-xs leading-relaxed mx-auto">
            {onlyFavorites
              ? 'Toca el ícono de corazón en el feed para guardar tus viviendas favoritas.'
              : 'Puedes flexibilizar una preferencia con un toque para ver alternativas disponibles ahora mismo:'}
          </p>
        </div>

        {/* Sugerencias inteligentes de relajación de 1 toque */}
        {!onlyFavorites && relaxationSuggestions.length > 0 && (
          <div className="w-full max-w-sm space-y-2">
            <span className="text-xs font-bold text-white/80 block text-left">
              Sugerencias para ampliar tus resultados:
            </span>
            <div className="space-y-2">
              {relaxationSuggestions.map(({ tag, resultCount }) => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => {
                    setTagPriority(tag.label, tag.category, 'preferible');
                    showToast(
                      'Preferencia flexibilizada',
                      `Cambiamos «${tag.label}» a «Me gustaría»`,
                      'success'
                    );
                  }}
                  className="w-full min-h-[48px] px-3.5 py-2.5 rounded-xl bg-white text-[var(--gray-dark)] text-xs font-bold flex items-center justify-between hover:bg-[var(--gray-light)] transition-colors text-left border border-white/20 cursor-pointer shadow-xs"
                >
                  <span className="truncate pr-2">
                    Pasar «{tag.label}» a «Me gustaría»
                  </span>
                  <span className="text-[var(--green-dark)] bg-[var(--green-20)] px-2.5 py-1 rounded-full shrink-0 font-extrabold text-xs">
                    +{resultCount} {resultCount === 1 ? 'casa' : 'casas'}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Fila Opcional: Casi cumplen tu casa ideal */}
        {!onlyFavorites && almostMatching.length > 0 && (
          <div className="w-full max-w-sm pt-1 space-y-2 text-left">
            <span className="text-xs font-bold text-white/80 block">
              Casi cumplen tu casa ideal:
            </span>
            <div className="space-y-2">
              {almostMatching.map(({ property, missingTag }) => (
                <div
                  key={property.id}
                  className="rounded-2xl bg-white/10 border border-white/20 p-2.5 flex items-center gap-3"
                >
                  <img
                    src={property.image}
                    alt={property.title}
                    onError={(e) => {
                      e.currentTarget.src = getFallbackImage(property);
                    }}
                    className="w-12 h-12 rounded-xl object-cover shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-white truncate">
                      {property.title}
                    </p>
                    <p className="text-xs text-white/70 truncate">
                      {property.commune} · {formatUF(property.priceUF)}
                    </p>
                    <p className="text-xs text-[var(--yellow-normal)] font-semibold truncate mt-0.5">
                      Falta flexibilizar: {missingTag.label}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {onlyFavorites ? (
          <button
            type="button"
            onClick={() => setOnlyFavorites(false)}
            className="bci-btn-primary min-h-[44px]"
          >
            Ver todas las propiedades compatibles
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setActiveTab('mi-casa')}
            className="bci-btn-primary min-h-[44px]"
          >
            <Sliders className="w-4 h-4" aria-hidden="true" />
            <span>Ajustar mi casa ideal</span>
          </button>
        )}
      </div>
    );
  }

  const activePhotos = getPhotosForItem(activeItem);
  const activePhotoIdx = getPhotoIndex(
    activeItem.property.id,
    activePhotos.length
  );
  const activePhotoUrl =
    activePhotos[activePhotoIdx] || activeItem.property.image;

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onWheel={handleWheel}
      className="w-full h-full min-h-[640px] bg-black text-white relative overflow-hidden select-none touch-pan-x"
    >
      {/* Cinta permanente de vista previa demostrativa cuando aún no se desbloquea */}
      {previewFeedOverride && !metrics.isHomeMarketUnlocked && (
        <aside
          aria-label="Aviso de vista previa"
          className="inset-x-0 top-0 z-30 bg-[var(--yellow-normal)] text-[var(--gray-dark)] px-4 py-1.5 flex items-center justify-between text-xs font-bold shadow-md"
          style={{ position: 'absolute' }}
        >
          <span>Vista previa demostrativa · Aún no alcanzas el 85%</span>
          <button
            type="button"
            onClick={() => setPreviewFeedOverride(false)}
            className="underline text-xs font-bold hover:text-black cursor-pointer"
          >
            Salir de vista previa
          </button>
        </aside>
      )}

      {/* BARRA SUPERIOR FLOTANTE DEL FEED */}
      <div
        className="inset-x-0 z-20 px-4 pt-3 flex items-center justify-between gap-2"
        style={{
          position: 'absolute',
          top: previewFeedOverride && !metrics.isHomeMarketUnlocked ? '32px' : '0px',
        }}
      >
        <div className="inline-flex items-center rounded-full bg-black/50 backdrop-blur-md border border-white/20 p-1">
          <button
            type="button"
            onClick={() => setOnlyFavorites(false)}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-colors cursor-pointer ${
              !onlyFavorites
                ? 'bg-white text-[var(--gray-dark)]'
                : 'text-white/80 hover:text-white'
            }`}
          >
            Para ti ({compatibleProperties.length})
          </button>
          <button
            type="button"
            onClick={() => setOnlyFavorites(true)}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer ${
              onlyFavorites
                ? 'bg-white text-[var(--gray-dark)]'
                : 'text-white/80 hover:text-white'
            }`}
          >
            <Heart
              className="w-3 h-3 fill-current text-[var(--red-80)]"
              aria-hidden="true"
            />
            <span>Guardados ({favoritePropertyIds.length})</span>
          </button>
        </div>

        {/* Indicador de posición vertical en el feed */}
        <span className="px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-md border border-white/20 text-xs font-bold text-white/90">
          {currentIndex + 1} / {feedList.length}
        </span>
      </div>

      {/* =====================================================================
          PISTA VERTICAL ANIMADA ESTILO REELS / TIKTOK INMOBILIARIO
          Desplazamiento vertical fluido (translate3d) entre una propiedad y otra
         ===================================================================== */}
      <div
        aria-live="polite"
        className="w-full h-full flex flex-col will-change-transform"
        style={{
          transform: `translate3d(0, calc(-${
            currentIndex * 100
          }% + ${dragOffsetY}px), 0)`,
          transition: isDragging
            ? 'none'
            : 'transform 520ms cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      >
        {feedList.map((item, slideIdx) => {
          const itemPhotos = getPhotosForItem(item);
          const itemPhotoIdx = getPhotoIndex(
            item.property.id,
            itemPhotos.length
          );
          const itemPhotoUrl =
            itemPhotos[itemPhotoIdx] || item.property.image;
          const isItemLiked = favoritePropertyIds.includes(item.property.id);
          const isCurrentSlide = slideIdx === currentIndex;

          return (
            <article
              key={item.property.id}
              aria-hidden={!isCurrentSlide}
              className="w-full h-full shrink-0 relative overflow-hidden flex flex-col justify-between"
            >
              {/* 1. FONDO DE PANTALLA COMPLETA CON FOTO REAL Y DEGRADADOS OSCUROS ARRIBA Y ABAJO */}
              <div
                className="inset-0 w-full h-full"
                style={{ position: 'absolute' }}
              >
                <img
                  key={`${item.property.id}-photo-${itemPhotoIdx}`}
                  src={itemPhotoUrl}
                  alt={`${item.property.title} - Foto ${itemPhotoIdx + 1}`}
                  onError={(e) => handleImageError(e, item)}
                  className={`w-full h-full object-cover transition-transform duration-700 ease-out ${
                    isCurrentSlide ? 'scale-100' : 'scale-105'
                  }`}
                />
                {/* Degradado oscuro superior para legibilidad de controles superiores */}
                <div
                  aria-hidden="true"
                  className="inset-x-0 top-0 h-36 bg-gradient-to-b from-black/85 via-black/35 to-transparent pointer-events-none"
                  style={{ position: 'absolute' }}
                />
                {/* Degradado oscuro inferior pronunciado para resaltar textos blancos */}
                <div
                  aria-hidden="true"
                  className="inset-x-0 bottom-0 h-80 bg-gradient-to-t from-black/95 via-black/70 to-transparent pointer-events-none"
                  style={{ position: 'absolute' }}
                />
              </div>

              {/* Espaciador superior para respetar la barra fija */}
              <div className="h-14 shrink-0" />

              {/* ZONA CENTRAL INTERACTIVA (Toque izquierdo/derecho para cambiar foto secundaria) */}
              {itemPhotos.length > 1 ? (
                <div className="relative z-10 flex-1 flex items-center justify-between px-2 pointer-events-none">
                  <button
                    type="button"
                    tabIndex={isCurrentSlide ? 0 : -1}
                    onClick={() =>
                      setPhotoIndexForProperty(
                        item.property.id,
                        (itemPhotoIdx - 1 + itemPhotos.length) %
                          itemPhotos.length
                      )
                    }
                    aria-label="Foto anterior de la propiedad"
                    className="pointer-events-auto w-8 h-8 rounded-full bg-black/35 backdrop-blur-xs border border-white/20 text-white/80 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    tabIndex={isCurrentSlide ? 0 : -1}
                    onClick={() =>
                      setPhotoIndexForProperty(
                        item.property.id,
                        (itemPhotoIdx + 1) % itemPhotos.length
                      )
                    }
                    aria-label="Siguiente foto de la propiedad"
                    className="pointer-events-auto w-8 h-8 rounded-full bg-black/35 backdrop-blur-xs border border-white/20 text-white/80 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              ) : (
                <div className="flex-1" />
              )}

              {/* ZONA INFERIOR: SUPERPOSICIÓN IZQUIERDA + BARRA DE ACCIONES VERTICAL DERECHA */}
              <div className="relative z-20 px-4 pb-4 pt-6 flex items-end justify-between gap-3">
                {/* 2. ELEMENTOS SUPERPUESTOS (ESQUINA INFERIOR IZQUIERDA) */}
                <div className="flex-1 min-w-0 space-y-2.5 pr-1">
                  {/* Insignia de compatibilidad en Verde Bci + Estado del Pie */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--green-normal)] text-white text-xs font-bold shadow-sm">
                      <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>{item.matchScore}% compatible</span>
                    </span>

                    <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/25 text-xs font-semibold text-white">
                      {item.financialStatus === 'available'
                        ? 'Pie 100% cubierto'
                        : `Pie ${item.coveragePercent}% cubierto`}
                    </span>
                  </div>

                  {/* Título y Ubicación + características rápidas */}
                  <div className="space-y-1">
                    <h2
                      className="text-lg font-bold !text-white leading-snug drop-shadow-md"
                      style={{ color: '#FFFFFF' }}
                    >
                      {item.property.title}
                    </h2>

                    <p className="text-xs font-semibold text-white/90 flex items-center gap-1.5 flex-wrap">
                      <MapPin
                        className="w-3.5 h-3.5 text-[var(--green-60)] shrink-0"
                        aria-hidden="true"
                      />
                      <span>{item.property.commune}</span>
                      <span className="text-white/50">·</span>
                      <span className="capitalize">
                        {item.property.propertyType}
                      </span>
                      {item.property.propertyType !== 'terreno' && (
                        <>
                          <span className="text-white/50">·</span>
                          <span>{item.property.bedrooms}D</span>
                          <span className="text-white/50">/</span>
                          <span>{item.property.bathrooms}B</span>
                        </>
                      )}
                      <span className="text-white/50">·</span>
                      <span>
                        {item.property.surface.toLocaleString('es-CL')} m²
                      </span>
                    </p>
                  </div>

                  {/* Precio destacado en UF y equivalencia referencial en CLP */}
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="text-2xl font-bold text-white tracking-tight">
                      {formatUF(item.property.priceUF)}
                    </span>
                    <span className="text-xs font-semibold text-white/80">
                      ({formatCLP(item.priceCLP)} ref.)
                    </span>
                  </div>

                  {/* Descripción breve limitada a 2 líneas con texto claro */}
                  <p className="text-xs text-white/85 leading-relaxed line-clamp-2">
                    {item.property.description}
                  </p>

                  {/* Paginador interno de fotos secundarias deslizables */}
                  <div
                    role="group"
                    aria-label="Paginador de fotos de la propiedad"
                    className="flex items-center gap-1.5 pt-1"
                  >
                    {itemPhotos.map((_, idx) => {
                      const isCurrentPhoto = idx === itemPhotoIdx;
                      return (
                        <button
                          key={idx}
                          type="button"
                          tabIndex={isCurrentSlide ? 0 : -1}
                          onClick={() =>
                            setPhotoIndexForProperty(item.property.id, idx)
                          }
                          aria-label={`Ver fotografía ${idx + 1} de ${
                            itemPhotos.length
                          }`}
                          aria-current={isCurrentPhoto ? 'true' : undefined}
                          className={`h-1.5 rounded-full transition-all cursor-pointer ${
                            isCurrentPhoto
                              ? 'w-7 bg-[var(--green-normal)]'
                              : 'w-2.5 bg-white/40 hover:bg-white/70'
                          }`}
                        />
                      );
                    })}
                    <span className="text-xs text-white/70 ml-1">
                      Foto {itemPhotoIdx + 1}/{itemPhotos.length}
                    </span>
                  </div>
                </div>

                {/* 3. BARRA DE ACCIONES VERTICAL (ESQUINA INFERIOR DERECHA + NAVEGACIÓN REELS) */}
                <div className="flex flex-col items-center gap-3 shrink-0">
                  {/* Botones laterales de flecha arriba/abajo para cambiar de propiedad una a una con animación */}
                  <div className="flex flex-col items-center gap-1.5 bg-black/45 backdrop-blur-md border border-white/20 rounded-full p-1">
                    <button
                      type="button"
                      tabIndex={isCurrentSlide ? 0 : -1}
                      onClick={goToPreviousProperty}
                      aria-label="Propiedad anterior"
                      className="w-9 h-9 rounded-full flex items-center justify-center text-white hover:bg-white/20 active:scale-95 transition-all cursor-pointer"
                    >
                      <ChevronUp className="w-5 h-5" aria-hidden="true" />
                    </button>
                    <div className="w-4 h-[1px] bg-white/20" />
                    <button
                      type="button"
                      tabIndex={isCurrentSlide ? 0 : -1}
                      onClick={goToNextProperty}
                      aria-label="Siguiente propiedad"
                      className="w-9 h-9 rounded-full flex items-center justify-center text-white hover:bg-white/20 active:scale-95 transition-all cursor-pointer"
                    >
                      <ChevronDown className="w-5 h-5" aria-hidden="true" />
                    </button>
                  </div>

                  {/* Botón de Guardar / Like (Corazón) */}
                  <button
                    type="button"
                    tabIndex={isCurrentSlide ? 0 : -1}
                    onClick={() => handleToggleLike(item)}
                    aria-pressed={isItemLiked}
                    aria-label={
                      isItemLiked
                        ? 'Quitar de favoritos'
                        : 'Guardar propiedad en favoritos'
                    }
                    className="flex flex-col items-center gap-1 group cursor-pointer"
                  >
                    <span
                      className={`w-12 h-12 rounded-full flex items-center justify-center border transition-all active:scale-90 ${
                        isItemLiked
                          ? 'bg-[var(--red-normal)]/20 border-[var(--red-normal)] text-[var(--red-normal)]'
                          : 'bg-black/50 backdrop-blur-md border-white/25 text-white hover:bg-white/15'
                      }`}
                    >
                      <Heart
                        className={`w-6 h-6 transition-transform ${
                          isItemLiked
                            ? 'fill-[var(--red-normal)] scale-110'
                            : ''
                        }`}
                        aria-hidden="true"
                      />
                    </span>
                    <span className="text-xs font-semibold text-white drop-shadow-xs">
                      {isItemLiked ? 'Guardado' : 'Guardar'}
                    </span>
                  </button>

                  {/* Botón de Enviar / Compartir */}
                  <button
                    type="button"
                    tabIndex={isCurrentSlide ? 0 : -1}
                    onClick={() => handleShareProperty(item)}
                    aria-label="Compartir enlace de la propiedad"
                    className="flex flex-col items-center gap-1 cursor-pointer"
                  >
                    <span className="w-12 h-12 rounded-full bg-black/50 backdrop-blur-md border border-white/25 text-white hover:bg-white/15 flex items-center justify-center transition-all active:scale-90">
                      <Share2 className="w-5 h-5" aria-hidden="true" />
                    </span>
                    <span className="text-xs font-semibold text-white drop-shadow-xs">
                      Enviar
                    </span>
                  </button>

                  {/* Botón "Ver más" (Info) circular destacado */}
                  <button
                    type="button"
                    tabIndex={isCurrentSlide ? 0 : -1}
                    onClick={() => setIsDetailProfileOpen(true)}
                    aria-label="Ver más información y perfil de la propiedad"
                    className="flex flex-col items-center gap-1 cursor-pointer"
                  >
                    <span className="w-12 h-12 rounded-full bg-[var(--green-normal)] hover:bg-[var(--green-dark)] border-2 border-white text-white shadow-lg flex items-center justify-center transition-all active:scale-95">
                      <Info className="w-6 h-6" aria-hidden="true" />
                    </span>
                    <span className="text-xs font-bold text-[var(--green-40)] drop-shadow-xs">
                      Ver más
                    </span>
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {/* =====================================================================
          4. VISTA DE DETALLE / PERFIL FLOTANTE DE LA PROPIEDAD ("VER MÁS")
         ===================================================================== */}
      {isDetailProfileOpen && (
        <div
          role="region"
          aria-label={`Perfil detallado de ${activeItem.property.title}`}
          className="inset-0 z-30 bg-black/75 backdrop-blur-xs flex flex-col justify-end"
          style={{ position: 'absolute' }}
        >
          <div className="w-full h-[92%] bg-white text-[var(--gray-dark)] rounded-t-3xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200">
            {/* Cabecera superior de la vista de perfil con botón "Volver al feed" */}
            <div className="px-4 py-3 border-b border-[var(--gray-light)] flex items-center justify-between gap-2 shrink-0 bg-white">
              <button
                type="button"
                onClick={() => setIsDetailProfileOpen(false)}
                className="min-h-[40px] px-3 rounded-xl bg-[var(--gray-light)] hover:bg-[var(--gray-semilight)] text-xs font-bold text-[var(--gray-dark)] inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                <span>Volver al feed</span>
              </button>

              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[var(--green-20)] text-[var(--green-dark)] text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                {activeItem.matchScore}% compatible
              </span>

              <button
                type="button"
                onClick={() => setIsDetailProfileOpen(false)}
                aria-label="Cerrar vista de detalle"
                className="w-9 h-9 rounded-full flex items-center justify-center text-[var(--gray-semidark)] hover:bg-[var(--gray-light)] cursor-pointer"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            {/* Contenido deslizable del Perfil de la Propiedad */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Galería de fotos interactiva */}
              <div className="space-y-2">
                <div className="relative h-52 w-full rounded-2xl overflow-hidden bg-[var(--gray-light)] border border-[var(--gray-semilight)]">
                  <img
                    src={activePhotoUrl}
                    alt={activeItem.property.title}
                    onError={(e) => handleImageError(e, activeItem)}
                    className="w-full h-full object-cover"
                  />
                  <span
                    className="bottom-2.5 right-2.5 px-2.5 py-1 rounded-full bg-black/70 text-white text-xs font-semibold"
                    style={{ position: 'absolute' }}
                  >
                    Foto {activePhotoIdx + 1} de {activePhotos.length}
                  </span>
                </div>

                {activePhotos.length > 1 && (
                  <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                    {activePhotos.map((url, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() =>
                          setPhotoIndexForProperty(activeItem.property.id, idx)
                        }
                        className={`h-14 w-24 rounded-xl overflow-hidden border-2 shrink-0 transition-all cursor-pointer ${
                          activePhotoIdx === idx
                            ? 'border-[var(--green-normal)] scale-[1.02]'
                            : 'border-transparent opacity-65 hover:opacity-100'
                        }`}
                      >
                        <img
                          src={url}
                          alt={`Miniatura ${idx + 1}`}
                          onError={(e) => handleImageError(e, activeItem)}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Título, comuna y descripción completa */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[var(--blue-20)] text-[var(--blue-dark)] capitalize">
                    {activeItem.property.propertyType}
                  </span>
                  <span className="text-xs font-semibold text-[var(--gray-semidark)] flex items-center gap-1">
                    <MapPin
                      className="w-3.5 h-3.5 text-[var(--blue-normal)]"
                      aria-hidden="true"
                    />
                    {activeItem.property.commune} ·{' '}
                    {activeItem.property.neighborhood}
                  </span>
                </div>

                <h2 className="text-xl font-bold text-[var(--gray-dark)]">
                  {activeItem.property.title}
                </h2>

                {/* Fila Inmobiliaria */}
                {(() => {
                  const activeDeveloper = getDeveloper(activeItem.property.developerId);
                  return (
                    <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[var(--blue-20)]/40 border border-[var(--blue-40)]">
                      <div
                        className="w-8 h-8 rounded-full bg-[var(--blue-20)] text-[var(--blue-dark)] flex items-center justify-center text-xs font-bold shrink-0 border border-[var(--blue-40)]"
                        aria-hidden="true"
                      >
                        {activeDeveloper.initials}
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-[12px] text-[var(--gray-semidark)] block leading-tight">
                          Inmobiliaria
                        </span>
                        <span
                          className="text-sm font-bold text-[var(--gray-dark)] truncate block"
                          aria-label={`Propiedad vendida por ${activeDeveloper.name}`}
                        >
                          {activeDeveloper.name}
                        </span>
                      </div>
                    </div>
                  );
                })()}

                <div className="flex items-center gap-3 text-xs text-[var(--gray-dark)] font-semibold bg-[var(--gray-light)] rounded-xl px-3 py-2">
                  {activeItem.property.propertyType !== 'terreno' && (
                    <>
                      <span className="inline-flex items-center gap-1">
                        <BedDouble
                          className="w-4 h-4 text-[var(--blue-normal)]"
                          aria-hidden="true"
                        />
                        {activeItem.property.bedrooms} dormitorios
                      </span>
                      <span className="text-[var(--gray-semilight)]">|</span>
                      <span className="inline-flex items-center gap-1">
                        <Bath
                          className="w-4 h-4 text-[var(--blue-normal)]"
                          aria-hidden="true"
                        />
                        {activeItem.property.bathrooms} baños
                      </span>
                      <span className="text-[var(--gray-semilight)]">|</span>
                    </>
                  )}
                  <span className="inline-flex items-center gap-1">
                    <Maximize2
                      className="w-4 h-4 text-[var(--blue-normal)]"
                      aria-hidden="true"
                    />
                    {activeItem.property.surface.toLocaleString('es-CL')} m²
                  </span>
                </div>

                <p className="text-xs text-[var(--gray-semidark)] leading-relaxed">
                  {activeItem.property.description}
                </p>
              </div>

              {/* Desglose financiero: Precio UF, Pie requerido (20%) y Estado del ahorro actual */}
              <div className="rounded-2xl bg-[var(--green-20)]/60 border border-[var(--green-60)] p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[var(--gray-dark)]">
                    Desglose financiero y estado de tu ahorro
                  </h3>
                  <span className="text-xs font-bold text-[var(--green-dark)]">
                    {activeItem.coveragePercent}% del pie
                  </span>
                </div>

                <div className="h-2.5 w-full rounded-full bg-white overflow-hidden border border-[var(--green-40)]">
                  <div
                    className="h-full bg-[var(--green-normal)] rounded-full transition-all"
                    style={{ width: `${activeItem.coveragePercent}%` }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5 text-xs">
                  <div className="bg-white rounded-xl p-2.5 border border-[var(--gray-semilight)]">
                    <span className="text-xs text-[var(--gray-semidark)] block">
                      Precio propiedad
                    </span>
                    <span className="text-sm font-bold text-[var(--gray-dark)] block">
                      {formatUF(activeItem.property.priceUF)}
                    </span>
                    <span className="text-xs text-[var(--gray-semidark)]">
                      {formatCLP(activeItem.priceCLP)}
                    </span>
                  </div>

                  <div className="bg-white rounded-xl p-2.5 border border-[var(--gray-semilight)]">
                    <span className="text-xs text-[var(--green-dark)] font-semibold block">
                      Pie requerido ({activeItem.property.downPaymentPercent}%)
                    </span>
                    <span className="text-sm font-bold text-[var(--green-dark)] block">
                      {formatUF(activeItem.property.downPaymentUF)}
                    </span>
                    <span className="text-xs font-semibold text-[var(--gray-dark)]">
                      {formatCLP(activeItem.downPaymentCLP)}
                    </span>
                  </div>

                  <div className="bg-white rounded-xl p-2.5 border border-[var(--gray-semilight)]">
                    <span className="text-xs text-[var(--gray-semidark)] block">
                      Tu ahorro actual Bci
                    </span>
                    <span className="text-sm font-bold text-[var(--blue-dark)] block">
                      {formatCLP(metrics.currentSavings)}
                    </span>
                    <span className="text-xs text-[var(--gray-semidark)]">
                      {activeItem.remainingForPieCLP === 0
                        ? 'Pie 100% cubierto'
                        : `Faltan ${formatCLP(activeItem.remainingForPieCLP)}`}
                    </span>
                  </div>

                  <div className="bg-white rounded-xl p-2.5 border border-[var(--gray-semilight)]">
                    <span className="text-xs text-[var(--gray-semidark)] block">
                      Dividendo estimado
                    </span>
                    <span className="text-sm font-bold text-[var(--gray-dark)] block">
                      {formatUF(activeItem.property.estimatedDividendUF, 1)}
                    </span>
                    <span className="text-xs text-[var(--gray-semidark)]">
                      {formatCLP(activeItem.estimatedDividendCLP)} / mes
                    </span>
                  </div>
                </div>

                <p className="text-[12px] text-[var(--gray-semidark)] text-center font-medium pt-1">
                  Oferta referencial de demostración
                </p>
              </div>

              {/* Etiquetas de equipamiento y entorno */}
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-[var(--gray-dark)] block">
                  Características y conectividad
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    ...activeItem.property.features,
                    ...activeItem.property.connectivity,
                  ].map((feat, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-lg bg-[var(--gray-light)] text-xs font-medium text-[var(--gray-dark)]"
                    >
                      {feat}
                    </span>
                  ))}
                </div>
              </div>

              {/* Botones de acción del Perfil */}
              <div className="pt-2 pb-4 flex flex-col gap-2.5">
                <button
                  type="button"
                  onClick={() => handleOpenMortgageFlow(activeItem)}
                  className="bci-btn-primary w-full"
                >
                  <Landmark className="w-4 h-4" aria-hidden="true" />
                  <span>Solicitar evaluación hipotecaria Bci</span>
                </button>

                {archetype.targetPropertyId !== activeItem.property.id && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsDetailProfileOpen(false);
                      selectPropertyAsNewGoal(activeItem.property);
                    }}
                    className="bci-btn-secondary w-full"
                  >
                    <Target
                      className="w-4 h-4 text-[var(--blue-normal)]"
                      aria-hidden="true"
                    />
                    <span>Elegir esta propiedad como mi meta en RoadHome</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setIsDetailProfileOpen(false)}
                  className="bci-btn-secondary w-full"
                >
                  <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                  <span>Volver al feed</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL SECCIÓN 17: SIMULACIÓN DE SOLICITACIÓN HIPOTECARIA BCI */}
      <ModalDialog
        isOpen={Boolean(mortgageTargetProp)}
        onClose={() => {
          setMortgageTargetProp(null);
          setSubmittedApplication(null);
        }}
        title="Evaluación hipotecaria Bci"
        subtitle="Simulación demostrativa RoadHome + HomeMarket"
      >
        {mortgageTargetProp && !submittedApplication && (
          <div className="space-y-4">
            <div className="rounded-2xl bg-[var(--blue-20)] border border-[var(--blue-40)] p-3.5 flex items-center gap-3">
              <img
                src={mortgageTargetProp.property.image}
                alt={mortgageTargetProp.property.title}
                onError={(e) => handleImageError(e, mortgageTargetProp)}
                className="w-16 h-14 rounded-xl object-cover shrink-0 border border-white"
              />
              <div className="min-w-0">
                <span className="text-xs font-bold text-[var(--blue-dark)] uppercase">
                  Propiedad seleccionada
                </span>
                <p className="text-sm font-bold text-[var(--gray-dark)] truncate">
                  {mortgageTargetProp.property.title}
                </p>
                <p className="text-xs text-[var(--gray-semidark)]">
                  {mortgageTargetProp.property.commune} ·{' '}
                  {formatUF(mortgageTargetProp.property.priceUF)}
                </p>

                {(() => {
                  const targetDev = getDeveloper(mortgageTargetProp.property.developerId);
                  return (
                    <div className="mt-1.5 pt-1.5 border-t border-[var(--blue-40)] flex items-center gap-1.5">
                      <div
                        className="w-5 h-5 rounded-full bg-[var(--blue-40)] text-[var(--blue-dark)] flex items-center justify-center text-xs font-bold shrink-0"
                        aria-hidden="true"
                      >
                        {targetDev.initials}
                      </div>
                      <span
                        className="text-[12px] font-medium text-[var(--gray-dark)] truncate"
                        aria-label={`Propiedad vendida por ${targetDev.name}`}
                      >
                        Inmobiliaria: <strong>{targetDev.name}</strong>
                      </span>
                    </div>
                  );
                })()}
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--gray-semilight)] divide-y divide-[var(--gray-light)] text-xs">
              <div className="p-3 flex justify-between">
                <span className="text-[var(--gray-semidark)]">
                  Precio referencial
                </span>
                <span className="font-bold text-[var(--gray-dark)]">
                  {formatUF(mortgageTargetProp.property.priceUF)} (
                  {formatCLP(mortgageTargetProp.priceCLP)})
                </span>
              </div>
              <div className="p-3 flex justify-between bg-[var(--green-20)]/45">
                <span className="text-[var(--green-dark)] font-semibold">
                  Pie disponible en tu ahorro
                </span>
                <span className="font-bold text-[var(--green-dark)]">
                  {formatCLP(metrics.currentSavings)}
                </span>
              </div>
              <div className="p-3 flex justify-between">
                <span className="text-[var(--gray-semidark)]">
                  Pie requerido ({mortgageTargetProp.property.downPaymentPercent}
                  %)
                </span>
                <span className="font-semibold text-[var(--gray-dark)]">
                  {formatUF(mortgageTargetProp.property.downPaymentUF)} (
                  {formatCLP(mortgageTargetProp.downPaymentCLP)})
                </span>
              </div>
              <div className="p-3 flex justify-between">
                <span className="text-[var(--gray-semidark)]">
                  Monto estimado a financiar (80%)
                </span>
                <span className="font-bold text-[var(--blue-dark)]">
                  {formatUF(
                    mortgageTargetProp.property.priceUF -
                      mortgageTargetProp.property.downPaymentUF
                  )}{' '}
                  (
                  {formatCLP(
                    (mortgageTargetProp.property.priceUF -
                      mortgageTargetProp.property.downPaymentUF) *
                      metrics.ufValueCLP
                  )}
                  )
                </span>
              </div>
              <div className="p-3 flex justify-between">
                <span className="text-[var(--gray-semidark)]">
                  Dividendo mensual referencial
                </span>
                <span className="font-bold text-[var(--gray-dark)]">
                  {formatUF(
                    mortgageTargetProp.property.estimatedDividendUF,
                    1
                  )}{' '}
                  ({formatCLP(mortgageTargetProp.estimatedDividendCLP)}/mes)
                </span>
              </div>
            </div>

            <p className="text-[12px] text-[var(--gray-semidark)] text-center font-medium">
              Oferta referencial de demostración
            </p>

            <div className="rounded-2xl bg-[var(--yellow-20)] border border-[var(--yellow-60)] p-3 text-xs text-[var(--gray-dark)] flex items-start gap-2">
              <Info
                className="w-4 h-4 text-[var(--yellow-normal)] shrink-0 mt-0.5"
                aria-hidden="true"
              />
              <span>
                Esta operación es una simulación demostrativa de cómo Bci
                conecta tu ahorro con una evaluación hipotecaria. No constituye
                preaprobación ni compra real.
              </span>
            </div>

            <button
              type="button"
              onClick={handleSendMortgageDemo}
              className="bci-btn-primary w-full"
              autoFocus
            >
              Enviar solicitud de demostración
            </button>
          </div>
        )}

        {submittedApplication && (
          <div className="space-y-4 py-2 text-center">
            <div className="w-16 h-16 rounded-full bg-[var(--green-20)] text-[var(--green-dark)] flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-9 h-9" aria-hidden="true" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-bold text-[var(--gray-dark)]">
                Tu solicitud de demostración fue registrada
              </h3>
              <p className="text-xs text-[var(--gray-semidark)] leading-relaxed">
                Registramos tu interés simulado por{' '}
                <strong>{submittedApplication.propertyTitle}</strong> (
                {formatUF(submittedApplication.priceUF)}) con un ahorro
                acumulado de{' '}
                <strong>
                  {formatCLP(submittedApplication.downPaymentAvailableCLP)}
                </strong>
                .
              </p>
            </div>

            <div className="rounded-2xl bg-[var(--gray-light)] border border-[var(--gray-semilight)] p-3.5 text-left text-xs space-y-1 text-[var(--gray-dark)]">
              <p className="font-bold">Nota de demostración:</p>
              <p className="text-[var(--gray-semidark)]">
                No se ha iniciado una operación bancaria real ni otorgado una
                aprobación crediticia.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setMortgageTargetProp(null);
                setSubmittedApplication(null);
                setIsDetailProfileOpen(false);
              }}
              className="bci-btn-primary w-full"
            >
              Volver a Explorar casas
            </button>
          </div>
        )}
      </ModalDialog>
    </div>
  );
};
