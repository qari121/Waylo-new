// Waylo.ai Theme Configuration
export const theme = {
  colors: {
    // Primary colors
    primary: '#DC2626', // Red
    primaryLight: '#EF4444',
    primaryDark: '#B91C1C',
    
    // Background colors
    background: '#FFFFFF',
    backgroundSecondary: '#F8FAFC',
    
    // Text colors
    textPrimary: '#1F2937',
    textSecondary: '#6B7280',
    textMuted: '#9CA3AF',
    
    // Input colors
    inputBackground: '#F2F2F2',
    inputBorder: '#E5E7EB',
    inputFocus: '#DC2626',
    
    // Button colors
    buttonPrimary: '#DC2626',
    buttonPrimaryHover: '#B91C1C',
    buttonSecondary: '#F3F4F6',
    
    // Status colors
    success: '#10B981',
    error: '#EF4444',
    warning: '#F59E0B',
    info: '#3B82F6',
    
    // Decorative colors (from original design)
    decorativeBlue: '#AE9FFF',
    decorativeDarkBlue: '#1E40AF',
    decorativeLightBlue: '#3B82F6',
  },
  
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
  },
  
  typography: {
    fontSizes: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 20,
      '2xl': 24,
      '3xl': 28,
      '4xl': 32,
    },
    fontWeights: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
  },
  
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    red: '0 4px 6px -1px rgba(220, 38, 38, 0.3)',
  },
}

export type Theme = typeof theme 