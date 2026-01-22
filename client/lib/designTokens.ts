/**
 * DESIGN SYSTEM TOKENS
 * Professional Execution Governance Platform
 * 
 * Philosophy: Clarity before beauty, Quiet confidence, Minimal not empty
 */

export const designTokens = {
    // ========================================
    // COLOR SYSTEM - Calm + Premium
    // ========================================
    colors: {
        // Primary - Deep Indigo (Trust, Authority)
        primary: {
            50: '#EEF2FF',
            100: '#E0E7FF',
            200: '#C7D2FE',
            300: '#A5B4FC',
            400: '#818CF8',
            500: '#2F3A8F', // Main
            600: '#252E73',
            700: '#1E2459',
            800: '#171A40',
            900: '#0F1229',
        },

        // Accent - Electric Cyan (Action, Focus)
        accent: {
            50: '#E6FEFF',
            100: '#CCFDFF',
            200: '#99FBFF',
            300: '#66F9FF',
            400: '#33F7FF',
            500: '#00E5FF', // Main
            600: '#00B8CC',
            700: '#008A99',
            800: '#005C66',
            900: '#002E33',
        },

        // Support - Soft Mint (Success, Positive)
        support: {
            50: '#F0FFFB',
            100: '#E0FFF7',
            200: '#C2FFEF',
            300: '#A3FFE7',
            400: '#85FFDF',
            500: '#5FF0C7', // Main
            600: '#4CC0A0',
            700: '#399078',
            800: '#266050',
            900: '#133028',
        },

        // Warning - Amber
        warning: {
            50: '#FFFBEB',
            100: '#FFF3C4',
            200: '#FFE58F',
            300: '#FFD666',
            400: '#FFC53D',
            500: '#FFB020', // Main
            600: '#D48806',
            700: '#AD6800',
            800: '#874D00',
            900: '#613400',
        },

        // Error - Rose
        error: {
            50: '#FFF1F2',
            100: '#FFE4E6',
            200: '#FECDD3',
            300: '#FDA4AF',
            400: '#FB7185',
            500: '#FF4D6D', // Main
            600: '#E11D48',
            700: '#BE123C',
            800: '#9F1239',
            900: '#881337',
        },

        // Neutrals - Cool Gray
        neutral: {
            50: '#F8FAFC',  // Background
            100: '#F1F5F9',
            200: '#E2E8F0', // Borders
            300: '#CBD5E1',
            400: '#94A3B8',
            500: '#64748B',
            600: '#475569',
            700: '#334155',
            800: '#1E293B', // Text Primary
            900: '#0F172A',
        },
    },

    // ========================================
    // TYPOGRAPHY
    // ========================================
    typography: {
        fontFamily: {
            heading: '"Inter", "Satoshi", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
            body: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
            mono: '"JetBrains Mono", "Fira Code", monospace',
        },

        fontSize: {
            xs: '12px',
            sm: '14px',
            base: '16px',
            lg: '18px',
            xl: '20px',
            '2xl': '24px',
            '3xl': '32px',
            '4xl': '40px',
            '5xl': '48px',
        },

        fontWeight: {
            normal: 400,
            medium: 500,
            semibold: 600,
            bold: 700,
        },

        lineHeight: {
            tight: 1.25,
            normal: 1.5,
            relaxed: 1.75,
        },

        letterSpacing: {
            tight: '-0.02em',
            normal: '0',
            wide: '0.02em',
        },
    },

    // ========================================
    // SPACING SYSTEM
    // ========================================
    spacing: {
        0: '0',
        1: '4px',
        2: '8px',
        3: '12px',
        4: '16px',
        5: '20px',
        6: '24px',
        8: '32px',
        10: '40px',
        12: '48px',
        16: '64px',
        20: '80px',
        24: '96px',
        32: '128px',
    },

    // ========================================
    // LAYOUT
    // ========================================
    layout: {
        maxWidth: '1200px',
        containerPadding: {
            mobile: '16px',
            tablet: '24px',
            desktop: '32px',
        },
        gridColumns: 12,
        gridGap: '24px',
    },

    // ========================================
    // BORDER RADIUS
    // ========================================
    borderRadius: {
        none: '0',
        sm: '4px',
        base: '8px',
        md: '12px',
        lg: '16px',
        xl: '24px',
        full: '9999px',
    },

    // ========================================
    // SHADOWS - Soft, not heavy
    // ========================================
    shadows: {
        none: 'none',
        sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        glow: '0 0 20px rgba(0, 229, 255, 0.3)', // Accent glow
    },

    // ========================================
    // TRANSITIONS
    // ========================================
    transitions: {
        fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
        base: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
        slow: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
        bounce: '300ms cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    },

    // ========================================
    // Z-INDEX
    // ========================================
    zIndex: {
        base: 0,
        dropdown: 1000,
        sticky: 1100,
        modal: 1200,
        popover: 1300,
        tooltip: 1400,
    },
};

// ========================================
// COMPONENT SPECIFICATIONS
// ========================================

export const componentSpecs = {
    // BUTTONS
    button: {
        sizes: {
            sm: {
                height: '32px',
                padding: '0 12px',
                fontSize: '14px',
            },
            md: {
                height: '40px',
                padding: '0 16px',
                fontSize: '16px',
            },
            lg: {
                height: '48px',
                padding: '0 24px',
                fontSize: '18px',
            },
        },
        variants: {
            solid: {
                bg: 'primary.500',
                color: 'white',
                hover: {
                    bg: 'primary.600',
                    transform: 'scale(1.01)',
                },
                active: {
                    transform: 'translateY(2px)',
                },
            },
            outline: {
                bg: 'transparent',
                border: '1px solid',
                borderColor: 'neutral.200',
                color: 'neutral.800',
                hover: {
                    borderColor: 'primary.500',
                    color: 'primary.500',
                },
            },
            ghost: {
                bg: 'transparent',
                color: 'neutral.700',
                hover: {
                    bg: 'neutral.100',
                },
            },
        },
    },

    // CARDS
    card: {
        bg: 'white',
        border: '1px solid',
        borderColor: 'neutral.200',
        borderRadius: 'md',
        shadow: 'base',
        padding: '24px',
        hover: {
            shadow: 'md',
            transform: 'translateY(-2px)',
        },
    },

    // INPUTS
    input: {
        height: '48px',
        padding: '12px 16px',
        fontSize: '16px',
        border: '1px solid',
        borderColor: 'neutral.200',
        borderRadius: 'base',
        focus: {
            borderColor: 'accent.500',
            shadow: '0 0 0 3px rgba(0, 229, 255, 0.1)',
        },
        error: {
            borderColor: 'error.500',
        },
    },

    // BADGES
    badge: {
        padding: '4px 12px',
        fontSize: '12px',
        fontWeight: 500,
        borderRadius: 'full',
        variants: {
            success: {
                bg: 'support.100',
                color: 'support.700',
            },
            warning: {
                bg: 'warning.100',
                color: 'warning.700',
            },
            error: {
                bg: 'error.100',
                color: 'error.700',
            },
            info: {
                bg: 'accent.100',
                color: 'accent.700',
            },
            neutral: {
                bg: 'neutral.100',
                color: 'neutral.700',
            },
        },
    },

    // ALERTS
    alert: {
        padding: '16px',
        borderRadius: 'md',
        border: '1px solid',
        variants: {
            success: {
                bg: 'support.50',
                borderColor: 'support.200',
                color: 'support.800',
            },
            warning: {
                bg: 'warning.50',
                borderColor: 'warning.200',
                color: 'warning.800',
            },
            error: {
                bg: 'error.50',
                borderColor: 'error.200',
                color: 'error.800',
            },
            info: {
                bg: 'accent.50',
                borderColor: 'accent.200',
                color: 'accent.800',
            },
        },
    },
};

// ========================================
// INTERACTION PATTERNS
// ========================================

export const interactions = {
    hover: {
        scale: 1.01,
        glow: 'shadows.glow',
        transition: 'transitions.base',
    },
    click: {
        translateY: '2px',
        transition: 'transitions.fast',
    },
    focus: {
        outline: '2px solid',
        outlineColor: 'accent.500',
        outlineOffset: '2px',
    },
    loading: {
        opacity: 0.6,
        cursor: 'not-allowed',
    },
};

export default designTokens;
