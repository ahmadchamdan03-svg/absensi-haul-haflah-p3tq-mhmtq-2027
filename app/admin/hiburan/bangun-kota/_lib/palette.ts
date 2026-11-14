export const BLOCK_WIDTH = 96;
export const BLOCK_HEIGHT = 48;
export const TOLERANCE_JAYYID = 0.05;
export const TOLERANCE_MUTAWASITH = 0.25;
export const WIND_MIN_HEIGHT = 20;
export const PENDULUM_AMPLITUDE = 0.6;
export const PENDULUM_PERIOD_MS = 1800;
export const GRAVITY = 2200;

export const CRANE_PIVOT_Y = 92;
export const CRANE_ROPE_LENGTH = 116;
export const GROUND_HEIGHT = 84;
export const MAX_VISIBLE_TOWER_BLOCKS = 5;

export const PALETTE = {
  sky: [
    'linear-gradient(180deg, #07142B 0%, #0F2C59 52%, #1E3A8A 100%)',
    'linear-gradient(180deg, #061024 0%, #0C2348 50%, #173475 100%)',
    'linear-gradient(180deg, #040B1A 0%, #091B3B 50%, #12295E 100%)',
    'linear-gradient(180deg, #020617 0%, #07132B 52%, #0F2C59 100%)',
  ],
  skyBaseFallback: '#07142B',
  blocks: [
    '#0F2C59',
    '#1E3A8A',
    '#0B2247',
    '#173475',
    '#0F2C59',
  ],
  blockRoofs: [
    '#D49B5B',
    '#F5C56B',
    '#D49B5B',
    '#F5C56B',
    '#D49B5B',
  ],
  blockBorders: [
    '#D49B5B',
    '#F5C56B',
    '#D49B5B',
    '#F5C56B',
    '#D49B5B',
  ],
  blockWindowLit: '#FEF3C7',
  blockWindowDark: '#091936',
  blockDoor: '#091936',
  blockAwning: '#F5C56B',
  crane: {
    beam: '#091936',
    beamHighlight: '#F5C56B',
    rope: '#E2E8F0',
    hook: '#F5C56B',
    pivot: '#F5C56B',
  },
  ground: {
    soil: '#07142B',
    curb: '#1E3A8A',
    grass: '#D49B5B',
    foundationFill: '#0F2C59',
    foundationBorder: '#F5C56B',
    silhouetteFar: 'rgba(15, 44, 89, 0.35)',
    silhouetteNear: 'rgba(9, 25, 54, 0.5)',
    cloud: 'rgba(240, 249, 255, 0.14)',
    star: '#F5C56B',
  },
  accentJayyid: '#F5C56B',
  accentMutawasith: '#FFFFFF',
  accentRodi: '#FDA4AF',
  ui: {
    surfacePrimary: 'rgba(15, 44, 89, 0.78)',
    surfaceSecondary: 'rgba(255, 255, 255, 0.10)',
    surfaceDarkOverlay: 'rgba(4, 11, 26, 0.78)',
    surfaceHud: 'rgba(15, 44, 89, 0.55)',
    textPrimary: '#FFFFFF',
    textSecondary: '#E0F2FE',
    textMuted: 'rgba(255, 255, 255, 0.25)',
    textOnDark: '#FFFFFF',
    textSubtleOnDark: '#F5C56B',
    borderStrong: 'rgba(212, 155, 91, 0.55)',
    ctaPrimaryBg: '#1D4ED8',
    ctaPrimaryText: '#FFFFFF',
    dangerBg: 'rgba(255, 255, 255, 0.12)',
    dangerText: '#FFFFFF',
    neutralBtnBg: 'rgba(255, 255, 255, 0.10)',
    neutralBtnText: '#FFFFFF',
    jayyidTextOnLight: '#F5C56B',
    jayyidBgOnLight: 'rgba(245, 197, 107, 0.14)',
    mutawasithTextOnLight: '#FFFFFF',
    mutawasithBgOnLight: 'rgba(255, 255, 255, 0.12)',
    rodiTextOnLight: '#FDA4AF',
    rodiBgOnLight: 'rgba(253, 164, 175, 0.14)',
  },
} as const;
