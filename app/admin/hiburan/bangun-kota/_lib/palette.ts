export const BLOCK_WIDTH = 96;
export const BLOCK_HEIGHT = 48;
export const TOLERANCE_JAYYID = 0.05;
export const TOLERANCE_MUTAWASITH = 0.25;
export const WIND_MIN_HEIGHT = 20;
export const PENDULUM_AMPLITUDE = 0.6;
export const PENDULUM_PERIOD_MS = 1800;
export const GRAVITY = 2200;

export const CRANE_PIVOT_Y = 96;
export const CRANE_ROPE_LENGTH = 30;
export const GROUND_HEIGHT = 84;
export const MAX_VISIBLE_TOWER_BLOCKS = 6;

export const PALETTE = {
  sky: [
    'linear-gradient(180deg, #FDE68A 0%, #FED7AA 52%, #FFF7ED 100%)',
    'linear-gradient(180deg, #93C5FD 0%, #E0F2FE 55%, #FEF3C7 100%)',
    'linear-gradient(180deg, #7C2D12 0%, #C2410C 42%, #FB923C 80%, #FDE68A 100%)',
    'linear-gradient(180deg, #0F172A 0%, #1E293B 48%, #334155 85%, #475569 100%)',
  ],
  skyBaseFallback: '#FDE68A',
  blocks: [
    '#D97757',
    '#E09F5A',
    '#C86D51',
    '#B5835A',
    '#C97A63',
  ],
  blockRoofs: [
    '#7C2D12',
    '#78350F',
    '#6C2711',
    '#5C3419',
    '#7F291E',
  ],
  blockBorders: [
    '#9A3412',
    '#92400E',
    '#7C2D12',
    '#78350F',
    '#881337',
  ],
  blockWindowLit: '#FEF3C7',
  blockWindowDark: '#431407',
  blockDoor: '#292524',
  blockAwning: '#FDE68A',
  crane: {
    beam: '#292524',
    beamHighlight: '#D97706',
    rope: '#44403C',
    hook: '#1C1917',
    pivot: '#B45309',
  },
  ground: {
    soil: '#44403C',
    curb: '#78716C',
    grass: '#4D7C0F',
    foundationFill: '#57534E',
    foundationBorder: '#292524',
    silhouetteFar: 'rgba(68, 64, 60, 0.14)',
    silhouetteNear: 'rgba(41, 37, 36, 0.22)',
    cloud: 'rgba(255, 251, 235, 0.55)',
    star: '#FEF3C7',
  },
  accentJayyid: '#4ADE80',
  accentMutawasith: '#FBBF24',
  accentRodi: '#F87171',
  ui: {
    surfacePrimary: '#FFFBEB',
    surfaceSecondary: '#FEF3C7',
    surfaceDarkOverlay: 'rgba(28, 25, 23, 0.72)',
    surfaceHud: 'rgba(28, 25, 23, 0.88)',
    textPrimary: '#1C1917',
    textSecondary: '#44403C',
    textMuted: '#57534E',
    textOnDark: '#FFFBEB',
    textSubtleOnDark: '#FDE68A',
    borderStrong: '#78350F',
    ctaPrimaryBg: '#9A3412',
    ctaPrimaryText: '#FFFBEB',
    dangerBg: '#991B1B',
    dangerText: '#FFFBEB',
    neutralBtnBg: '#E7E5E4',
    neutralBtnText: '#1C1917',
    jayyidTextOnLight: '#14532D',
    jayyidBgOnLight: '#DCFCE7',
    mutawasithTextOnLight: '#78350F',
    mutawasithBgOnLight: '#FEF3C7',
    rodiTextOnLight: '#7F1D1D',
    rodiBgOnLight: '#FEE2E2',
  },
} as const;
