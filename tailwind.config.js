/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Palet Desain Royal Blue & Ice Sky White:
        // 1. Warna Dasar (Dominan): Ice Sky White #F0F9FF (RGB 240, 249, 255)
        // 2. Warna Aksen: Royal Blue #1D4ED8 (RGB 29, 78, 216)
        // 3. Warna Sekunder: Sky Blue #7DD3FC (RGB 125, 211, 252)
        // 4. Warna Ambience: Golden Caramel Crema #D49B5B (Tetap dipertahankan untuk aksen Halwaa)
        // 5. Warna Teks: Deep Royal Navy #0F2C59 (RGB 15, 44, 89)

        // Mocha -> Deep Royal Navy & Blue
        mocha: {
          50: '#F0F9FF',
          100: '#E0F2FE',
          200: '#BAE6FD',
          300: '#7DD3FC',
          400: '#38BDF8',
          500: '#1D4ED8', // Royal Blue
          600: '#1E40AF',
          700: '#1E3A8A',
          800: '#0F2C59', // Exact Dark Navy Text
          900: '#0A192F',
          950: '#050D1A',
          DEFAULT: '#1D4ED8',
        },

        // Warm Oat Cream / Latte -> Ice Sky White
        latte: {
          50: '#F0F9FF',
          100: '#E0F2FE',
          200: '#BAE6FD',
          300: '#7DD3FC',
          400: '#38BDF8',
          500: '#60A5FA',
          600: '#3B82F6',
          700: '#1D4ED8',
          800: '#1E40AF',
          900: '#0F2C59',
          DEFAULT: '#F0F9FF',
        },

        // Biscuit Tan -> Sky Tan
        tan: {
          50: '#F0F9FF',
          100: '#E0F2FE',
          200: '#BAE6FD',
          300: '#7DD3FC',
          DEFAULT: '#38BDF8',
          500: '#38BDF8',
          600: '#0284C7',
          700: '#0369A1',
        },

        // Golden Caramel Crema (Tetap dipertahankan untuk aksen Halwaa / bintang)
        caramel: {
          50: '#FEFAF5',
          100: '#FCF3E4',
          200: '#F8E5C4',
          300: '#F3D29E',
          DEFAULT: '#D49B5B',
          500: '#D49B5B',
          600: '#BE8340',
          700: '#9E6728',
          800: '#7A4D15',
        },

        // Backward-compatible alias ivory -> ice sky white
        ivory: {
          DEFAULT: '#F0F9FF',
          50: '#F0F9FF',
          100: '#E0F2FE',
          200: '#BAE6FD',
          300: '#7DD3FC',
          400: '#38BDF8',
          500: '#60A5FA',
          600: '#1D4ED8',
          700: '#1E40AF',
          800: '#0F2C59',
          900: '#0A192F',
        },

        // Backward-compatible alias chinoiserie / porcelain -> royal blue
        chinoiserie: {
          DEFAULT: '#1D4ED8',
          50: '#F0F9FF',
          100: '#E0F2FE',
          200: '#BAE6FD',
          300: '#7DD3FC',
          400: '#38BDF8',
          500: '#1D4ED8',
          600: '#1E40AF',
          700: '#1E3A8A',
          800: '#0F2C59',
          900: '#0A192F',
          950: '#050D1A',
        },

        porcelain: {
          DEFAULT: '#1D4ED8',
          50: '#F0F9FF',
          100: '#E0F2FE',
          200: '#BAE6FD',
          300: '#7DD3FC',
          400: '#38BDF8',
          500: '#1D4ED8',
          600: '#1E40AF',
          700: '#1E3A8A',
          800: '#0F2C59',
          900: '#0A192F',
          950: '#050D1A',
        },

        // Backward-compatible alias gold / amberGlow -> caramel
        gold: {
          DEFAULT: '#D49B5B',
          50: '#FEFAF5',
          100: '#FCF3E4',
          200: '#F8E5C4',
          300: '#F3D29E',
          400: '#E5B173',
          500: '#D49B5B',
          600: '#BE8340',
          700: '#9E6728',
          800: '#7A4D15',
          900: '#58350B',
        },

        amberGlow: {
          DEFAULT: '#D49B5B',
          50: '#FEFAF5',
          100: '#FCF3E4',
          200: '#F8E5C4',
          300: '#F3D29E',
          400: '#E5B173',
          500: '#D49B5B',
          600: '#BE8340',
          700: '#9E6728',
          800: '#7A4D15',
          900: '#58350B',
        },

        // Backward-compatible alias opera & pesantren -> navy & royal blue
        opera: {
          50: '#F0F9FF',
          100: '#E0F2FE',
          200: '#BAE6FD',
          300: '#7DD3FC',
          400: '#38BDF8',
          500: '#1D4ED8',
          600: '#1E40AF',
          700: '#1E3A8A',
          800: '#0F2C59',
          850: '#0C2346',
          900: '#0A192F',
          950: '#050D1A',
        },

        pesantren: {
          50: '#F0F9FF',
          100: '#E0F2FE',
          200: '#BAE6FD',
          300: '#7DD3FC',
          400: '#38BDF8',
          500: '#1D4ED8',
          600: '#1E40AF',
          700: '#1E3A8A',
          800: '#0F2C59',
          900: '#0A192F',
          950: '#050D1A',
        },
      },
      backgroundImage: {
        'mocha-gradient': 'linear-gradient(135deg, #0F2C59 0%, #1D4ED8 100%)',
        'latte-gradient': 'linear-gradient(180deg, #F0F9FF 0%, #E0F2FE 100%)',
        'caramel-gradient': 'linear-gradient(135deg, #D49B5B 0%, #B87E3E 100%)',
        'stage-gradient': 'linear-gradient(135deg, #0F2C59 0%, #1D4ED8 100%)',
        'opera-gradient': 'linear-gradient(135deg, #0F2C59 0%, #1D4ED8 100%)',
        'ivory-card': 'linear-gradient(180deg, #F0F9FF 0%, #E0F2FE 100%)',
        'amber-glow-card': 'linear-gradient(135deg, #D49B5B 0%, #BE8340 100%)',
        'chinoiserie-card': 'linear-gradient(135deg, #0F2C59 0%, #1D4ED8 100%)',
      }
    },
  },
  plugins: [],
};
