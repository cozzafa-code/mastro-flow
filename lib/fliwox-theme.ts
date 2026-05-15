// lib/fliwox-theme.ts
// ═══════════════════════════════════════════════════════════════════════════
// FLIWOX THEME — FONTE UNICA DI VERITÀ
// Sostituisce le 5 "teal" diverse e i 28 bg sparsi nel codebase.
// Importa SEMPRE da qui. Mai dichiarare DS locali in un componente.
// ═══════════════════════════════════════════════════════════════════════════

export const FLIWOX = {
  // BASE SURFACES
  bg:         '#8B9BB0',  // sfondo app (grey-blue)
  surface:    '#FFFFFF',  // card / pannelli
  surfaceDim: '#F1F4F7',  // card secondarie
  divider:    '#E5EAF0',

  // NAVY (header, primary actions)
  navy:       '#1A2A47',
  navyDeep:   '#243558',
  navyHi:     '#324870',  // hover

  // TEXT
  text:       '#1A2A47',
  textDim:    '#5A6478',
  textMute:   '#8893A6',
  textOnNavy: '#FFFFFF',

  // SEMANTIC
  amber:      '#E8B05C',
  amberSoft:  '#FBF0DC',
  green:      '#1F5A3F',
  greenSoft:  '#D8EBDF',
  red:        '#C44545',
  redSoft:    '#F5DADA',
  blue:       '#3B7FE0',
  blueSoft:   '#DBEAFE',

  // FASE COLORS — usati ovunque per badge fase commessa
  fase: {
    sopralluogo:     { bg: '#DBEAFE', fg: '#1E40AF', label: 'Sopralluogo' },
    preventivo:      { bg: '#FBF0DC', fg: '#8B5A1C', label: 'Preventivo'  },
    conferma_ordine: { bg: '#FEF3C7', fg: '#92400E', label: 'Conferma'    },
    confermata:      { bg: '#D8EBDF', fg: '#1F5A3F', label: 'Confermata'  },
    acconto_pagato:  { bg: '#D1FAE5', fg: '#065F46', label: 'Acconto OK'  },
    ordine:          { bg: '#FED7AA', fg: '#7A2E00', label: 'Ordine'      },
    produzione:      { bg: '#FECACA', fg: '#7A1818', label: 'Produzione'  },
    montaggio:       { bg: '#FEE2E2', fg: '#7A1818', label: 'Montaggio'   },
    fatturata:       { bg: '#E0E7FF', fg: '#3730A3', label: 'Fatturata'   },
    pagata:          { bg: '#D8EBDF', fg: '#1F5A3F', label: 'Pagata'      },
    persa:           { bg: '#F3F4F6', fg: '#6B7280', label: 'Persa'       },
    annullata:       { bg: '#F3F4F6', fg: '#6B7280', label: 'Annullata'   },
    chiusa:          { bg: '#E0E7FF', fg: '#3730A3', label: 'Chiusa'      },
  } as const,
};

// Tipo per autocomplete sulle fasi
export type FliwoxFase = keyof typeof FLIWOX.fase;

// Font stack standard fliwoX
export const FLIWOX_FONT = "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif";
export const FLIWOX_MONO = "'JetBrains Mono', monospace";

// Shadow scale unica
export const FLIWOX_SHADOW = {
  none: 'none',
  sm:   '0 1px 2px rgba(26, 42, 71, 0.06)',
  md:   '0 4px 12px rgba(26, 42, 71, 0.08)',
  lg:   '0 8px 24px rgba(26, 42, 71, 0.12)',
  xl:   '0 16px 40px rgba(26, 42, 71, 0.16)',
};

// Radius scale unica
export const FLIWOX_RADIUS = {
  sm:    6,
  md:   10,
  lg:   14,
  xl:   20,
  pill: 999,
};
