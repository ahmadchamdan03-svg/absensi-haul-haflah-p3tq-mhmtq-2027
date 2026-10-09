export interface TosFoto {
  src: string;
  caption: string;
  handRelX?: number;
  handRelY?: number;
}

export const TOS_FOTOS: TosFoto[] = [
  // Existing Tos (6 foto)
  { src: '/images/halwaa/tos/tos-1.webp', caption: 'Yuk, mulai!', handRelX: 0.28, handRelY: 0.38 },
  { src: '/images/halwaa/tos/tos-2.webp', caption: 'Siap Tos!', handRelX: 0.28, handRelY: 0.35 },
  { src: '/images/halwaa/tos/tos-3.webp', caption: 'Tos Dulu!', handRelX: 0.28, handRelY: 0.36 },
  { src: '/images/halwaa/tos/tos-4.webp', caption: 'Ayo Tos!', handRelX: 0.26, handRelY: 0.32 },
  { src: '/images/halwaa/tos/tos-5.webp', caption: 'Yuk Tos!', handRelX: 0.26, handRelY: 0.28 },
  { src: '/images/halwaa/tos/tos-6.webp', caption: 'Semangat, Us!', handRelX: 0.72, handRelY: 0.26 },

  // Foto Baru Ekspresi & Gestur (8 foto)
  { src: '/images/halwaa/warning.webp', caption: 'Hati-hati ya, Us!', handRelX: 0.35, handRelY: 0.5 },
  { src: '/images/halwaa/serius.webp', caption: 'Fokus ya, Us!', handRelX: 0.32, handRelY: 0.45 },
  { src: '/images/halwaa/cemberut.webp', caption: 'Jangan nakal ya!', handRelX: 0.5, handRelY: 0.5 },
  { src: '/images/halwaa/tegas.webp', caption: 'Perhatikan ini, Us!', handRelX: 0.2, handRelY: 0.4 },
  { src: '/images/halwaa/welcoming.webp', caption: 'Ayo gabung, Us!', handRelX: 0.15, handRelY: 0.65 },
  { src: '/images/halwaa/senyum.webp', caption: 'Ini loh, Us!', handRelX: 0.72, handRelY: 0.4 },
  { src: '/images/halwaa/doa.webp', caption: 'Barakallahu fiik, Us!', handRelX: 0.5, handRelY: 0.55 },
  { src: '/images/halwaa/melambai.webp', caption: 'Hai Us! Semangat!', handRelX: 0.2, handRelY: 0.45 },
];
