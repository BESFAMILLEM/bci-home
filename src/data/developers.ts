export const DEVELOPERS = [
  {
    id: 'socovesa',
    name: 'Socovesa',
    initials: 'SO',
  },
  {
    id: 'inmobiliaria-almagro',
    name: 'Inmobiliaria Almagro',
    initials: 'IA',
  },
  {
    id: 'paz-corp',
    name: 'Paz Corp (Inmobiliaria Paz)',
    initials: 'PZ',
  },
  {
    id: 'inmobiliaria-fundamenta',
    name: 'Inmobiliaria Fundamenta',
    initials: 'IF',
  },
  {
    id: 'inmobiliaria-manquehue',
    name: 'Inmobiliaria Manquehue',
    initials: 'IM',
  },
  {
    id: 'inmobiliaria-exxacon',
    name: 'Inmobiliaria Exxacon',
    initials: 'IE',
  },
  {
    id: 'inmobiliaria-actual',
    name: 'Inmobiliaria Actual',
    initials: 'AC',
  },
  {
    id: 'inmobiliaria-siena',
    name: 'Inmobiliaria Siena',
    initials: 'IS',
  },
  {
    id: 'ingevec-inmobiliaria',
    name: 'Ingevec Inmobiliaria',
    initials: 'II',
  },
  {
    id: 'inmobiliaria-aconcagua',
    name: 'Inmobiliaria Aconcagua (Salfacorp)',
    initials: 'AS',
  },
  {
    id: 'activa-inmobiliaria',
    name: 'Activa Inmobiliaria',
    initials: 'AI',
  },
  {
    id: 'inmobiliaria-eurocorp',
    name: 'Inmobiliaria Eurocorp',
    initials: 'EU',
  },
  {
    id: 'inmobiliaria-imagina',
    name: 'Inmobiliaria Imagina',
    initials: 'IG',
  },
  {
    id: 'inmobiliaria-galilea',
    name: 'Inmobiliaria Galilea',
    initials: 'GL',
  },
  {
    id: 'inmobiliaria-rvc',
    name: 'Inmobiliaria RVC',
    initials: 'RV',
  },
] as const;

export type DeveloperId = (typeof DEVELOPERS)[number]['id'];

export interface Developer {
  id: DeveloperId;
  name: string;
  initials: string;
}

export function getDeveloper(developerId: DeveloperId): Developer {
  const found = DEVELOPERS.find((d) => d.id === developerId);
  if (!found) {
    return {
      id: developerId,
      name: 'Inmobiliaria Bci Partner',
      initials: 'IP',
    };
  }
  return found;
}

