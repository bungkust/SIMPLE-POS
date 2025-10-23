/**
 * Design System - Centralized design tokens for consistency
 * This file contains all design standards for colors, typography, spacing, etc.
 */

import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

// Color Palette
export const colors = {
  // Primary Brand Colors
  primary: {
    DEFAULT: 'hsl(221.2 83.2% 53.3%)', // Blue
    foreground: 'hsl(210 20% 98%)', // White
  },
  secondary: {
    DEFAULT: 'hsl(220 14.3% 95.9%)', // Light Gray
    foreground: 'hsl(220.9 39.3% 11%)', // Dark Gray
  },
  
  // Accent Colors
  accent: {
    DEFAULT: 'hsl(220 14.3% 95.9%)',
    foreground: 'hsl(220.9 39.3% 11%)',
  },

  // Destructive Colors
  destructive: {
    DEFAULT: 'hsl(0 84.2% 60.2%)', // Red
    foreground: 'hsl(210 20% 98%)', // White
  },

  // Muted Colors
  muted: {
    DEFAULT: 'hsl(220 14.3% 95.9%)',
    foreground: 'hsl(220 8.9% 46.1%)',
  },

  // Border Colors
  border: 'hsl(220 13% 91%)',

  // Input Colors
  input: 'hsl(220 13% 91%)',

  // Ring Colors
  ring: 'hsl(221.2 83.2% 53.3%)', // Primary Blue

  // Background Colors
  background: {
    DEFAULT: 'hsl(0 0% 100%)', // White
    muted: 'hsl(220 14.3% 95.9%)', // Light Gray
  },

  // Foreground Colors
  foreground: 'hsl(220.9 39.3% 11%)', // Dark Gray

  // Text Colors
  text: {
    primary: 'text-gray-900',
    secondary: 'text-gray-600',
    muted: 'text-gray-500',
    white: 'text-white',
    blue: 'text-blue-600',
    red: 'text-red-600',
    green: 'text-green-600',
    yellow: 'text-yellow-600',
  },

  // Status Colors
  status: {
    success: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-700',
      icon: 'text-green-600',
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-700',
      icon: 'text-red-600',
    },
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-700',
      icon: 'text-yellow-600',
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-700',
      icon: 'text-blue-600',
    },
  },
  
  // Button Colors
  button: {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-900',
    outline: 'border-gray-200 hover:bg-gray-50 text-gray-700',
    ghost: 'hover:bg-gray-100 text-gray-700',
    link: 'text-blue-600 hover:text-blue-700',
    destructive: 'bg-red-600 hover:bg-red-700 text-white',
    destructiveOutline: 'border-red-200 hover:bg-red-50 text-red-600 hover:text-red-700',
  }
} as const;

// Typography Scale
export const typography = {
  // Mobile Typography
  mobile: {
    h1: 'text-2xl font-bold text-gray-900',
    h2: 'text-xl font-bold text-gray-900',
    h3: 'text-lg font-semibold text-gray-900',
    h4: 'text-base font-semibold text-gray-900',
    body: {
      large: 'text-base text-gray-900',
      medium: 'text-sm text-gray-900',
      small: 'text-xs text-gray-600',
    },
    label: {
      large: 'text-sm font-semibold text-gray-700',
      medium: 'text-sm font-medium text-gray-600',
      small: 'text-xs font-medium text-gray-500',
    },
    price: {
      large: 'text-lg font-bold text-gray-900',
      medium: 'text-base font-semibold text-gray-900',
      small: 'text-sm font-medium text-gray-600',
    },
  },
  
  // Desktop Typography
  desktop: {
    h1: 'text-3xl font-bold text-gray-900',
    h2: 'text-2xl font-bold text-gray-900',
    h3: 'text-xl font-semibold text-gray-900',
    h4: 'text-lg font-semibold text-gray-900',
    body: {
      large: 'text-lg text-gray-900',
      medium: 'text-base text-gray-900',
      small: 'text-sm text-gray-600',
    },
    label: {
      large: 'text-base font-semibold text-gray-700',
      medium: 'text-sm font-medium text-gray-600',
      small: 'text-xs font-medium text-gray-500',
    },
    price: {
      large: 'text-2xl font-bold text-gray-900',
      medium: 'text-xl font-semibold text-gray-900',
      small: 'text-base font-medium text-gray-600',
    },
  },
  
  // Responsive Typography (combines mobile and desktop)
  h1: 'text-2xl sm:text-3xl font-bold text-gray-900',
  h2: 'text-xl sm:text-2xl font-bold text-gray-900',
  h3: 'text-lg sm:text-xl font-semibold text-gray-900',
  h4: 'text-base sm:text-lg font-semibold text-gray-900',
  
  // Body Text
  body: {
    large: 'text-base sm:text-lg text-gray-900',
    medium: 'text-sm sm:text-base text-gray-900',
    small: 'text-xs sm:text-sm text-gray-600',
  },
  
  // Labels
  label: {
    large: 'text-sm sm:text-base font-semibold text-gray-700',
    medium: 'text-sm font-medium text-gray-600',
    small: 'text-xs font-medium text-gray-500',
  },
  
  // Prices
  price: {
    large: 'text-lg sm:text-2xl font-bold text-gray-900',
    medium: 'text-base sm:text-xl font-semibold text-gray-900',
    small: 'text-sm sm:text-base font-medium text-gray-600',
  },
} as const;

// Spacing Scale
export const spacing = {
  // Mobile Spacing
  mobile: {
    xs: 'space-y-1',
    sm: 'space-y-2',
    md: 'space-y-3',
    lg: 'space-y-4',
    xl: 'space-y-5',
    '2xl': 'space-y-6',
  },
  
  // Desktop Spacing
  desktop: {
    xs: 'space-y-1',
    sm: 'space-y-2',
    md: 'space-y-4',
    lg: 'space-y-6',
    xl: 'space-y-8',
    '2xl': 'space-y-10',
  },
  
  // Responsive Spacing
  xs: 'space-y-1',
  sm: 'space-y-2',
  md: 'space-y-3 sm:space-y-4',
  lg: 'space-y-4 sm:space-y-6',
  xl: 'space-y-5 sm:space-y-8',
  '2xl': 'space-y-6 sm:space-y-10',
} as const;

// Component Sizes
export const sizes = {
  // Mobile Sizes
  mobile: {
    button: {
      sm: 'h-8 px-3 text-sm',
      md: 'h-10 px-4 text-sm',
      lg: 'h-12 px-5 text-base',
    },
    input: {
      sm: 'h-8 px-3 text-sm',
      md: 'h-10 px-4 text-sm',
      lg: 'h-12 px-4 text-base',
    },
    card: {
      sm: 'p-3',
      md: 'p-4',
      lg: 'p-5',
    },
    icon: {
      sm: 'h-4 w-4',
      md: 'h-5 w-5',
      lg: 'h-6 w-6',
    },
  },
  
  // Desktop Sizes
  desktop: {
    button: {
      sm: 'h-8 px-3 text-sm',
      md: 'h-10 px-4 text-sm',
      lg: 'h-12 px-6 text-base',
    },
    input: {
      sm: 'h-8 px-3 text-sm',
      md: 'h-10 px-4 text-sm',
      lg: 'h-12 px-4 text-base',
    },
    card: {
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8',
    },
    icon: {
      sm: 'h-4 w-4',
      md: 'h-5 w-5',
      lg: 'h-6 w-6',
    },
  },
  
  // Responsive Sizes
  button: {
    sm: 'h-8 px-3 text-sm',
    md: 'h-10 px-4 text-sm',
    lg: 'h-12 px-5 sm:px-6 text-base',
  },
  
  input: {
    sm: 'h-8 px-3 text-sm',
    md: 'h-10 px-4 text-sm',
    lg: 'h-12 px-4 text-base',
  },
  
  card: {
    sm: 'p-3 sm:p-4',
    md: 'p-4 sm:p-6',
    lg: 'p-5 sm:p-8',
  },
  
  icon: {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  },
} as const;

// Border Radius
export const borderRadius = {
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  '2xl': 'rounded-2xl',
  full: 'rounded-full',
} as const;

// Shadows
export const shadows = {
  sm: 'shadow-sm',
  md: 'shadow-md',
  lg: 'shadow-lg',
  xl: 'shadow-xl',
  '2xl': 'shadow-2xl',
} as const;

// Animation Durations
export const animations = {
  fast: 'duration-150',
  normal: 'duration-200',
  slow: 'duration-300',
} as const;

// Common Component Classes
export const components = {
  // Mobile Components
  mobile: {
    // Card
    card: 'bg-white border border-gray-200 rounded-lg shadow-sm',
    cardHover: 'hover:shadow-md transition-shadow',
    
    // Button
    buttonPrimary: `${colors.button.primary} ${sizes.mobile.button.md} ${borderRadius.lg} font-medium transition-colors`,
    buttonSecondary: `${colors.button.secondary} ${sizes.mobile.button.md} ${borderRadius.lg} font-medium transition-colors`,
    buttonOutline: `${colors.button.outline} ${sizes.mobile.button.md} ${borderRadius.lg} font-medium transition-colors border`,
    buttonGhost: `${colors.button.ghost} ${sizes.mobile.button.md} ${borderRadius.lg} font-medium transition-colors`,
    
    // Input
    input: `bg-white ${sizes.mobile.input.md} ${borderRadius.lg} border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500`,
    
    // Badge
    badge: 'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
    
    // Alert
    alert: 'p-3 rounded-lg border',
    
    // Sheet/Modal
    sheet: 'bg-white border border-gray-200 rounded-lg shadow-xl',
    sheetHeader: 'p-4 pb-0',
    sheetContent: 'p-4',
    
    // Form
    formGroup: 'space-y-2',
    formLabel: 'text-sm font-medium text-gray-700',
    formInput: 'w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
    formTextarea: 'w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none',
    formSelect: 'w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
    
    // Navigation
    navItem: 'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
    navItemActive: 'bg-blue-100 text-blue-700',
    navItemInactive: 'text-gray-600 hover:text-gray-900 hover:bg-gray-100',
    
    // Layout
    container: 'max-w-full mx-auto px-4',
    containerSm: 'max-w-full mx-auto px-4',
    containerXs: 'max-w-full mx-auto px-4',
    
    // Grid
    grid: {
      cols1: 'grid grid-cols-1',
      cols2: 'grid grid-cols-1',
      cols3: 'grid grid-cols-1',
      cols4: 'grid grid-cols-1',
    },
  },
  
  // Desktop Components
  desktop: {
    // Card
    card: 'bg-white border border-gray-200 rounded-lg shadow-sm',
    cardHover: 'hover:shadow-md transition-shadow',
    
    // Button
    buttonPrimary: `${colors.button.primary} ${sizes.desktop.button.md} ${borderRadius.lg} font-medium transition-colors`,
    buttonSecondary: `${colors.button.secondary} ${sizes.desktop.button.md} ${borderRadius.lg} font-medium transition-colors`,
    buttonOutline: `${colors.button.outline} ${sizes.desktop.button.md} ${borderRadius.lg} font-medium transition-colors border`,
    buttonGhost: `${colors.button.ghost} ${sizes.desktop.button.md} ${borderRadius.lg} font-medium transition-colors`,
    
    // Input
    input: `bg-white ${sizes.desktop.input.md} ${borderRadius.lg} border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500`,
    
    // Badge
    badge: 'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
    
    // Alert
    alert: 'p-4 rounded-lg border',
    
    // Sheet/Modal
    sheet: 'bg-white border border-gray-200 rounded-lg shadow-xl',
    sheetHeader: 'p-6 pb-0',
    sheetContent: 'p-6',
    
    // Form
    formGroup: 'space-y-3',
    formLabel: 'text-sm font-medium text-gray-700',
    formInput: 'w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
    formTextarea: 'w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none',
    formSelect: 'w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
    
    // Navigation
    navItem: 'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
    navItemActive: 'bg-blue-100 text-blue-700',
    navItemInactive: 'text-gray-600 hover:text-gray-900 hover:bg-gray-100',
    
    // Layout
    container: 'max-w-7xl mx-auto px-6 lg:px-8',
    containerSm: 'max-w-5xl mx-auto px-6',
    containerXs: 'max-w-3xl mx-auto px-6',
    
    // Grid
    grid: {
      cols1: 'grid grid-cols-1',
      cols2: 'grid grid-cols-2',
      cols3: 'grid grid-cols-3',
      cols4: 'grid grid-cols-4',
    },
  },
  
  // Responsive Components (combines mobile and desktop)
  // Card
  card: 'bg-white border border-gray-200 rounded-lg shadow-sm',
  cardHover: 'hover:shadow-md transition-shadow',
  
  // Button
  button: {
    sm: `${colors.button.primary} ${sizes.button.sm} ${borderRadius.lg} font-medium transition-colors`,
    md: `${colors.button.primary} ${sizes.button.md} ${borderRadius.lg} font-medium transition-colors`,
    lg: `${colors.button.primary} ${sizes.button.lg} ${borderRadius.lg} font-medium transition-colors`,
  },
  buttonPrimary: `${colors.button.primary} ${sizes.button.md} ${borderRadius.lg} font-medium transition-colors`,
  buttonSecondary: `${colors.button.secondary} ${sizes.button.md} ${borderRadius.lg} font-medium transition-colors`,
  buttonOutline: `${colors.button.outline} ${sizes.button.md} ${borderRadius.lg} font-medium transition-colors border`,
  buttonGhost: `${colors.button.ghost} ${sizes.button.md} ${borderRadius.lg} font-medium transition-colors`,
  
  // Input
  input: `bg-white ${sizes.input.md} ${borderRadius.lg} border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500`,
  
  // Badge
  badge: 'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
  
  // Alert
  alert: 'p-3 sm:p-4 rounded-lg border',
  
  // Sheet/Modal
  sheet: 'bg-white border border-gray-200 rounded-lg shadow-xl',
  sheetHeader: 'p-4 sm:p-6 pb-0',
  sheetContent: 'p-4 sm:p-6',
  
  // Form
  formGroup: 'space-y-2 sm:space-y-3',
  formLabel: 'text-sm font-medium text-gray-700',
  formInput: 'w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
  formTextarea: 'w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none',
  formSelect: 'w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
  
  // Navigation
  navItem: 'px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-colors',
  navItemActive: 'bg-blue-100 text-blue-700',
  navItemInactive: 'text-gray-600 hover:text-gray-900 hover:bg-gray-100',
  
  // Status Badges
  statusBadge: {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    paid: 'bg-green-100 text-green-800 border-green-200',
    cancelled: 'bg-red-100 text-red-800 border-red-200',
  },
  
  // Loading States
  skeleton: 'animate-pulse bg-gray-200 rounded',
  spinner: 'animate-spin rounded-full border-2 border-gray-300 border-t-blue-600',
  
  // Layout
  container: 'max-w-full sm:max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
  containerSm: 'max-w-full sm:max-w-5xl mx-auto px-4 sm:px-6',
  containerXs: 'max-w-full sm:max-w-3xl mx-auto px-4 sm:px-6',
  
  // Grid
  grid: {
    cols1: 'grid grid-cols-1',
    cols2: 'grid grid-cols-1 sm:grid-cols-2',
    cols3: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    cols4: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  },
  
  // Flex
  flex: {
    center: 'flex items-center justify-center',
    between: 'flex items-center justify-between',
    start: 'flex items-center justify-start',
    end: 'flex items-center justify-end',
    col: 'flex flex-col',
    row: 'flex flex-row',
  },
} as const;

// Theme Variants
export const themes = {
  light: {
    background: 'bg-white',
    foreground: 'text-gray-900',
    card: 'bg-white border-gray-200',
    primary: 'bg-blue-600 text-white',
  },
  dark: {
    background: 'bg-gray-900',
    foreground: 'text-white',
    card: 'bg-gray-800 border-gray-700',
    primary: 'bg-blue-500 text-white',
  },
} as const;

// Utility Functions
export const utils = {
  // Spacing utilities
  spacing: (size: keyof typeof spacing) => spacing[size],
  
  // Color utilities
  getTextColor: (variant: keyof typeof colors.text) => colors.text[variant],
  getBackgroundColor: (variant: keyof typeof colors.background) => colors.background[variant],
  
  // Component utilities
  getButtonVariant: (variant: keyof typeof colors.button) => colors.button[variant],
  getStatusVariant: (status: keyof typeof colors.status) => colors.status[status],
  
  // Layout utilities
  getContainerSize: (size: 'sm' | 'md' | 'lg') => {
    const sizes = {
      sm: components.containerXs,
      md: components.containerSm,
      lg: components.container,
    };
    return sizes[size];
  },
  
  // Responsive utilities
  responsive: {
    hideOnMobile: 'hidden sm:block',
    hideOnDesktop: 'block sm:hidden',
    mobileOnly: 'sm:hidden',
    desktopOnly: 'hidden sm:block',
  },
  
  // Animation utilities
  getTransition: (duration: keyof typeof animations) => `transition-all ${animations[duration]}`,
  
  // Focus utilities
  focus: {
    ring: 'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
    visible: 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
  },
} as const;

// Component Variants
export const variants = {
  // Button variants
  button: {
    default: 'bg-blue-600 hover:bg-blue-700 text-white',
    secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-900',
    outline: 'border border-gray-200 hover:bg-gray-50 text-gray-700',
    ghost: 'hover:bg-gray-100 text-gray-700',
    destructive: 'bg-red-600 hover:bg-red-700 text-white',
  },
  
  // Card variants
  card: {
    default: 'bg-white border border-gray-200 shadow-sm',
    elevated: 'bg-white border border-gray-200 shadow-lg',
    flat: 'bg-white border border-gray-200',
  },
  
  // Input variants
  input: {
    default: 'border-gray-200 focus:border-blue-500 focus:ring-blue-500',
    error: 'border-red-300 focus:border-red-500 focus:ring-red-500',
    success: 'border-green-300 focus:border-green-500 focus:ring-green-500',
  },
  
  // Badge variants
  badge: {
    default: 'bg-gray-100 text-gray-800',
    primary: 'bg-blue-100 text-blue-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    error: 'bg-red-100 text-red-800',
  },
} as const;

// Helper function to combine classes with proper merging
export function cn(...inputs: (string | undefined | null | false)[]): string {
  return twMerge(clsx(inputs));
}

// Export all design tokens
export const designSystem = {
  colors,
  typography,
  spacing,
  sizes,
  borderRadius,
  shadows,
  animations,
  components,
  themes,
  utils,
  variants,
  cn,
} as const;
