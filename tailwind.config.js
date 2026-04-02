/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          primary:   'var(--bg-primary)',
          secondary: 'var(--bg-secondary)',
          tertiary:  'var(--bg-tertiary)',
          hover:     'var(--bg-hover)',
          active:    'var(--bg-active)',
          input:     'var(--bg-input)',
        },
        accent: {
          primary:          'var(--accent-primary)',
          'primary-hover':  'var(--accent-primary-hover)',
          secondary:        'var(--accent-secondary)',
          'secondary-hover':'var(--accent-secondary-hover)',
          danger:           'var(--accent-danger)',
          'danger-hover':   'var(--accent-danger-hover)',
          warning:          'var(--accent-warning)',
          'warning-hover':  'var(--accent-warning-hover)',
          info:             'var(--accent-info)',
        },
        text: {
          primary:   'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted:     'var(--text-muted)',
          inverse:   'var(--text-inverse)',
        },
        border: {
          DEFAULT:  'var(--border-default)',
          hover:    'var(--border-hover)',
          focus:    'var(--border-focus)',
          error:    'var(--border-error)',
        },
      },
      boxShadow: {
        sm:   'var(--shadow-sm)',
        md:   'var(--shadow-md)',
        lg:   'var(--shadow-lg)',
        glow: 'var(--shadow-glow)',
      },
      fontSize: {
        'display': ['2.25rem', { lineHeight: '2.5rem', fontWeight: '700' }],
        'h1':      ['1.5rem',  { lineHeight: '2rem',   fontWeight: '700' }],
        'h2':      ['1.25rem', { lineHeight: '1.75rem', fontWeight: '600' }],
        'h3':      ['1rem',    { lineHeight: '1.5rem',  fontWeight: '600' }],
        'body':    ['0.875rem',{ lineHeight: '1.25rem', fontWeight: '400' }],
        'small':   ['0.75rem', { lineHeight: '1rem',    fontWeight: '400' }],
        'tiny':    ['0.625rem',{ lineHeight: '0.875rem',fontWeight: '500' }],
      },
      fontFamily: {
        heading: ['JetBrains Mono', 'Fira Code', 'monospace'],
        body:    ['DM Sans', 'Inter', 'sans-serif'],
      },
      animation: {
        'shake':        'shake 0.3s ease-in-out',
        'fade-in-up':   'fadeInUp 0.2s ease-out',
        'slide-in-right': 'slideInRight 0.2s ease-out',
        'scale-in':     'scaleIn 0.2s ease-out',
        'pulse-slow':   'pulse 2s ease-in-out infinite',
        'shimmer':      'shimmer 1.5s ease-in-out infinite',
      },
      keyframes: {
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%':      { transform: 'translateX(-10px)' },
          '75%':      { transform: 'translateX(10px)' },
        },
        fadeInUp: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          from: { opacity: '0', transform: 'translateX(100%)' },
          to:   { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          from: { opacity: '0', transform: 'scale(0.95)' },
          to:   { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
};
