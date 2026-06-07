/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Tema Lumine — velas artesanais (creme, marrom, verde-oliva)
        'lumine-bg': '#FEF9F0',       // fundo creme (cera)
        'lumine-ink': '#5C4033',       // textos marrom escuro
        primary: '#6B7B3A',            // verde-oliva (botões de ação)
        'primary-dark': '#55632E',     // verde-oliva escuro (hover)
        accent: '#8B6914',             // marrom terroso (destaques)
        'accent-light': '#D4B896',     // marrom claro (bordas, detalhes)
        success: '#4A7C59',            // verde suave (confirmações)
        warning: '#D4A017',            // amarelo mostarda (alertas)
        danger: '#C0392B',             // vermelho terroso (cancelar/excluir)
        card: '#FFFBF5',               // fundo de cards (levemente mais claro)
      },
    },
  },
  plugins: [],
}