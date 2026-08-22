/**
 * PLENA INTELLIGENCE — PRESET TAILWIND OFICIAL
 *
 * Uso em qualquer projeto Plena (tailwind.config.js):
 *
 *   module.exports = {
 *     presets: [require('./design-system/tailwind-plena-preset.js')],
 *     content: ['./app/**\/*.{ts,tsx}', './components/**\/*.{ts,tsx}'],
 *   }
 *
 * Depende de `plena-tokens.css` importado no globals.css.
 */
module.exports = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        /* ---- MARCA (nomes canônicos — usar SEMPRE estes) ---- */
        'plena-azul':  '#041E42',
        'plena-verde': '#00C19F',
        'plena-cinza': '#D8D8D5',
        'plena-from':  '#00AFEC',
        'plena-to':    '#01EFA1',

        /* ---- Acento do tema ativo (troca com o seletor TEMAS) ---- */
        theme: {
          DEFAULT: 'var(--theme-accent)',
          soft:    'var(--theme-accent-soft)',
          fg:      'var(--theme-accent-fg)',
        },

        /* ---- Superfícies e texto (seguem light/dark automaticamente) ---- */
        surface: {
          app:     'var(--surface-app)',
          card:    'var(--surface-card)',
          sunken:  'var(--surface-sunken)',
          header:  'var(--surface-header)',
          sidebar: 'var(--surface-sidebar)',
        },
        content: {
          strong: 'var(--text-strong)',
          body:   'var(--text-body)',
          muted:  'var(--text-muted)',
          faint:  'var(--text-faint)',
        },
        line: {
          subtle: 'var(--border-subtle)',
          strong: 'var(--border-strong)',
          glass:  'var(--border-glass)',
        },

        /* ---- Compatibilidade com repos legados (DigiSUS) ---- */
        'bg-dark':      '#0f172a',
        'bg-card':      '#1e293b',
        'border-glass': 'rgba(255,255,255,0.1)',
      },

      fontFamily: {
        /* Montserrat = títulos e labels. Roboto = corpo. */
        display: ['var(--font-montserrat)', 'Montserrat', 'sans-serif'],
        sans:    ['var(--font-roboto)', 'Roboto', 'sans-serif'],
      },

      backgroundImage: {
        'plena-gradient': 'linear-gradient(90deg, #00AFEC 0%, #01EFA1 100%)',
        'theme-gradient': 'var(--theme-gradient)',
      },

      borderRadius: {
        card: '16px',
        pill: '9999px',
      },

      spacing: {
        sidebar:           '18rem',   /* 288px */
        'sidebar-collapsed':'5rem',   /* 80px  */
        header:            '4.5rem',  /* 72px  */
      },

      maxWidth: {
        content: '1400px',
      },

      transitionTimingFunction: {
        plena: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },

      boxShadow: {
        'plena-sm': '0 1px 2px rgba(15,23,42,0.05)',
        'plena-md': '0 4px 6px rgba(15,23,42,0.08)',
        'plena-lg': '0 10px 15px rgba(15,23,42,0.10)',
        'plena-xl': '0 20px 25px rgba(15,23,42,0.15)',
        'glow-from':'0 0 15px rgba(0,175,236,0.30)',
        'glow-to':  '0 0 15px rgba(1,239,161,0.30)',
      },
    },
  },
  plugins: [],
};
