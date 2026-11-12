import React, { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';

interface ModalDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

/**
 * Componente de diálogo modal móvil (Bottom Sheet) construido sobre `<dialog>` nativo
 * siguiendo las directrices de Modern Web Guidance (`showModal()`, sin `role="dialog"` ni `aria-modal` redundantes).
 */
export const ModalDialog: React.FC<ModalDialogProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
}) => {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen && !dialog.open) {
      dialog.showModal();
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleClose = () => {
      dialog.returnValue = '';
      onClose();
    };

    // Light dismiss cuando el clic ocurre fuera de la tarjeta del diálogo
    let pressedOutside = false;
    const isOutside = (e: PointerEvent) => {
      const card = dialog.querySelector('[data-dialog-card]');
      if (!card) return false;
      const r = card.getBoundingClientRect();
      return (
        e.clientX < r.left ||
        e.clientX > r.right ||
        e.clientY < r.top ||
        e.clientY > r.bottom
      );
    };

    const handlePointerDown = (e: PointerEvent) => {
      pressedOutside = isOutside(e);
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (pressedOutside && isOutside(e)) {
        dialog.close();
      }
    };

    dialog.addEventListener('close', handleClose);
    dialog.addEventListener('pointerdown', handlePointerDown);
    dialog.addEventListener('pointerup', handlePointerUp);

    return () => {
      dialog.removeEventListener('close', handleClose);
      dialog.removeEventListener('pointerdown', handlePointerDown);
      dialog.removeEventListener('pointerup', handlePointerUp);
    };
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <dialog ref={dialogRef} aria-labelledby={titleId} closedby="any">
      <div
        data-dialog-card
        className="w-full max-w-[430px] mx-auto bg-white rounded-t-3xl shadow-xl border-t border-[var(--gray-semilight)] max-h-[88dvh] flex flex-col overflow-hidden"
      >
        {/* Indicador superior tipo sheet móvil */}
        <div className="pt-2.5 pb-1 flex justify-center">
          <div
            aria-hidden="true"
            className="w-10 h-1.5 rounded-full bg-[var(--gray-semilight)]"
          />
        </div>

        {/* Cabecera del modal */}
        <div className="px-5 pt-2 pb-3.5 border-b border-[var(--gray-light)] flex items-start justify-between gap-3">
          <div>
            <h2
              id={titleId}
              className="h5 font-semibold text-[var(--gray-dark)]"
            >
              {title}
            </h2>
            {subtitle && (
              <p className="text-xs text-[var(--gray-semidark)] mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            aria-label="Cerrar ventana"
            className="min-w-[44px] min-h-[44px] -mr-2 -mt-1 rounded-full flex items-center justify-center text-[var(--gray-semidark)] hover:bg-[var(--gray-light)] transition-colors"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Contenido con scroll vertical contenido */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">{children}</div>
      </div>
    </dialog>
  );
};

