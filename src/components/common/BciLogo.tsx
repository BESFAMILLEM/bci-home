import React from 'react';

export interface BciLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  variant?: 'light' | 'dark';
}

export const BciLogo: React.FC<BciLogoProps> = ({
  size = 'md',
  className = '',
  variant = 'light',
}) => {
  const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');
  const logoBlanco = `${base}/brand/logo_bci_blanco.svg`;
  const logoPng = `${base}/brand/LOGO.png`;
  const logoPng2x = `${base}/brand/LOGO@2x.png`;

  // Proporción original del logo oficial (904 x 197 px, relación aprox 4.588:1)
  const dimensions = {
    sm: { width: 110, height: 24 },
    md: { width: 128, height: 28 },
    lg: { width: 165, height: 36 },
    xl: { width: 220, height: 48 },
  }[size];

  // Si se requiere sobre fondo oscuro, usamos el logo oficial blanco de Bci
  if (variant === 'dark') {
    return (
      <div className={`inline-flex items-center select-none ${className}`}>
        <img
          src={logoBlanco}
          alt="Bci Home"
          width={dimensions.width}
          height={dimensions.height}
          className="h-auto object-contain max-h-full"
          loading="eager"
          decoding="async"
        />
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center select-none ${className}`}>
      <img
        src={logoPng}
        srcSet={`${logoPng} 1x, ${logoPng2x} 2x`}
        alt="Bci Home"
        width={dimensions.width}
        height={dimensions.height}
        className="h-auto object-contain max-h-full"
        loading="eager"
        decoding="async"
      />
    </div>
  );
};
