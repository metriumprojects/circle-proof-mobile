/**
 * CircleProof Design System & Brand Palette
 * Aligned 1-to-1 with the Web Application (Figma-aligned)
 */

export const THEME = {
  colors: {
    // Brand Primary & Accents
    brandInk: '#191c1f',
    brandGreen: '#57b915',
    brandYellow: '#ece85f',
    brandRed: '#ff0031',
    brandBlue: '#3b82f6',

    // Neutrals & Greys
    brandGreyOne: '#f5f5f5',
    brandGreyTwo: '#e9eaee',
    brandGreyThree: '#7e7e7e',
    textSecondary: '#667085',
    textMuted: '#98a2b3',
    white: '#ffffff',
    black: '#000000',

    // Component Tokens
    cardBg: '#ffffff',
    cardBorder: '#e9eaee',
    subtleBg: '#fafafa',
    inputBg: '#ffffff',
    inputBorder: '#d0d5dd',

    // Social / Integration
    whatsapp: '#25D366',
  },
  radius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    full: 9999,
  },
  typography: {
    title: {
      fontSize: 22,
      fontWeight: '700' as const,
      color: '#191c1f',
    },
    subtitle: {
      fontSize: 16,
      fontWeight: '600' as const,
      color: '#191c1f',
    },
    body: {
      fontSize: 14,
      fontWeight: '400' as const,
      color: '#191c1f',
    },
    caption: {
      fontSize: 12,
      fontWeight: '400' as const,
      color: '#7e7e7e',
    },
    label: {
      fontSize: 13,
      fontWeight: '600' as const,
      color: '#344054',
    },
  },
};

export default THEME;
