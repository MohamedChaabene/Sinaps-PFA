export const LIGHT_COLORS = {
  primary: '#7c3aed', // Sinaps violet
  primaryDark: '#6d28d9',
  primaryLight: '#8b5cf6',
  primaryBg: '#ede9fe',
  primaryFg: '#ffffff',

  background: '#f8fafc',
  card: '#ffffff',
  border: '#e2e8f0',
  inputBorder: '#cbd5e1',

  textPrimary: '#0f172a',
  textSecondary: '#475569',
  textMuted: '#94a3b8',
  textLight: '#ffffff',

  success: '#10b981',
  successLight: '#d1fae5',
  warning: '#f59e0b',
  warningLight: '#fef3c7',
  danger: '#ef4444',
  dangerLight: '#fee2e2',
  info: '#3b82f6',
  infoLight: '#dbeafe',

  clientBubble: '#7c3aed',
  clientBubbleText: '#ffffff',
  aiBubble: '#f1f5f9',
  aiBubbleText: '#0f172a',
  humanBubble: '#eff6ff',
  humanBubbleText: '#1e3a8a',
  humanBubbleBorder: '#bfdbfe',

  tabBarBg: '#ffffff',
  tabBarBorder: '#e2e8f0',
  overlay: 'rgba(15, 23, 42, 0.6)',
  isDark: false,
};

export const DARK_COLORS = {
  primary: '#8b5cf6', // slightly brighter violet for dark mode
  primaryDark: '#7c3aed',
  primaryLight: '#a78bfa',
  primaryBg: '#2e1065',
  primaryFg: '#ffffff',

  background: '#0f172a', // deep slate/zinc
  card: '#1e293b',
  border: '#334155',
  inputBorder: '#475569',

  textPrimary: '#f8fafc',
  textSecondary: '#cbd5e1',
  textMuted: '#94a3b8',
  textLight: '#ffffff',

  success: '#34d399',
  successLight: '#064e3b',
  warning: '#fbbf24',
  warningLight: '#78350f',
  danger: '#f87171',
  dangerLight: '#7f1d1d',
  info: '#60a5fa',
  infoLight: '#1e3a8a',

  clientBubble: '#7c3aed',
  clientBubbleText: '#ffffff',
  aiBubble: '#1e293b',
  aiBubbleText: '#f8fafc',
  humanBubble: '#172554',
  humanBubbleText: '#bfdbfe',
  humanBubbleBorder: '#1d4ed8',

  tabBarBg: '#1e293b',
  tabBarBorder: '#334155',
  overlay: 'rgba(0, 0, 0, 0.75)',
  isDark: true,
};

// Default export alias for backwards compatibility
export const COLORS = LIGHT_COLORS;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const RADIUS = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 18,
  full: 9999,
};

export const FONTS = {
  regular: {
    fontWeight: '400' as const,
  },
  medium: {
    fontWeight: '500' as const,
  },
  semibold: {
    fontWeight: '600' as const,
  },
  bold: {
    fontWeight: '700' as const,
  },
};
