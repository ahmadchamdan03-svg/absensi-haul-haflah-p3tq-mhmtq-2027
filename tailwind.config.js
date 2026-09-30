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
        // Palet Desain Warm Latte & Cinnamon Mocha Coffee (Sesuai Gambar Referensi):
        // 1. Warna Dasar (Dominan): Warm Oat Cream #EFE8E1 (RGB 239, 232, 225)
        // 2. Warna Aksen: Rich Cinnamon Mocha #8C6A47 (RGB 140, 106, 71)
        // 3. Warna Sekunder: Biscuit Tan #C4A88E (RGB 196, 168, 142)
        // 4. Warna Ambience: Golden Caramel Crema #D49B5B (RGB 212, 155, 91)
        // 5. Warna Teks: Deep Roasted Espresso #422F21 (RGB 66, 47, 33)

        // Mocha / Cinnamon Coffee Brown
        mocha: {
          50: '#FAF6F2',
          100: '#F4ECE4',
          200: '#E5D6C7',
          300: '#D5C0AB',
          400: '#A47E57',
          500: '#8C6A47', // Exact Coffee Brown
          600: '#735334',
          700: '#5C3E28',
          800: '#422F21', // Exact Dark Text
          900: '#362518',
          950: '#26190E',
          DEFAULT: '#8C6A47',
        },

        // Warm Oat Cream / Latte
        latte: {
          50: '#FAF7F3',
          100: '#EFE8E1', // Exact Base Cream
          200: '#E5DCD2',
          300: '#D5C4B4',
          400: '#C4A88E',
          500: '#B09074',
          600: '#947255',
          700: '#75563D',
          800: '#543C28',
          900: '#382618',
          DEFAULT: '#EFE8E1',
        },

        // Biscuit Tan
        tan: {
          50: '#FAF6F2',
          100: '#F2E9E1',
          200: '#E4D5C8',
          300: '#D4C2B2',
          DEFAULT: '#C4A88E',
          500: '#C4A88E',
          600: '#B09074',
          700: '#947357',
        },

        // Golden Caramel Crema
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

        // Backward-compatible alias ivory -> latte
        ivory: {
          DEFAULT: '#EFE8E1',
          50: '#FAF7F3',
          100: '#EFE8E1',
          200: '#E5DCD2',
          300: '#D5C4B4',
          400: '#C4A88E',
          500: '#B09074',
          600: '#8C6A47',
          700: '#735334',
          800: '#422F21',
          900: '#362518',
        },

        // Backward-compatible alias chinoiserie / porcelain -> mocha
        chinoiserie: {
          DEFAULT: '#8C6A47',
          50: '#FAF6F2',
          100: '#EFE8E1',
          200: '#D5C4B4',
          300: '#C4A88E',
          400: '#A47E57',
          500: '#8C6A47',
          600: '#735334',
          700: '#5C3E28',
          800: '#422F21',
          900: '#362518',
          950: '#26190E',
        },

        porcelain: {
          DEFAULT: '#8C6A47',
          50: '#FAF6F2',
          100: '#EFE8E1',
          200: '#D5C4B4',
          300: '#C4A88E',
          400: '#A47E57',
          500: '#8C6A47',
          600: '#735334',
          700: '#5C3E28',
          800: '#422F21',
          900: '#362518',
          950: '#26190E',
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

        // Backward-compatible alias opera & pesantren -> mocha & espresso
        opera: {
          50: '#FAF6F2',
          100: '#EFE8E1',
          200: '#D5C4B4',
          300: '#C4A88E',
          400: '#A47E57',
          500: '#8C6A47',
          600: '#735334',
          700: '#5C3E28',
          800: '#422F21',
          850: '#362518',
          900: '#26190E',
          950: '#1A1009',
        },

        pesantren: {
          50: '#FAF6F2',
          100: '#EFE8E1',
          200: '#D5C4B4',
          300: '#C4A88E',
          400: '#A47E57',
          500: '#8C6A47',
          600: '#735334',
          700: '#5C3E28',
          800: '#422F21',
          900: '#26190E',
          950: '#1A1009',
        },
      },
      backgroundImage: {
        'mocha-gradient': 'linear-gradient(135deg, #8C6A47 0%, #735334 100%)',
        'latte-gradient': 'linear-gradient(180deg, #FAF7F3 0%, #EFE8E1 100%)',
        'caramel-gradient': 'linear-gradient(135deg, #D49B5B 0%, #B87E3E 100%)',
        'stage-gradient': 'linear-gradient(135deg, #8C6A47 0%, #735334 100%)',
        'opera-gradient': 'linear-gradient(135deg, #8C6A47 0%, #735334 100%)',
        'ivory-card': 'linear-gradient(180deg, #FAF7F3 0%, #EFE8E1 100%)',
        'amber-glow-card': 'linear-gradient(135deg, #D49B5B 0%, #BE8340 100%)',
        'chinoiserie-card': 'linear-gradient(135deg, #8C6A47 0%, #735334 100%)',
      }
    },
  },
  plugins: [],
};
