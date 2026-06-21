export const theme = {
  bg: {
    app: '#0d0d0d',
    surface: '#161616',
    elevated: '#1f1f1f',
    hover: '#252525',
  },
  border: {
    subtle: '#2a2a2a',
    default: '#333333',
  },
  text: {
    primary: '#e8e8e8',
    secondary: '#8c8c8c',
    muted: '#595959',
  },
  accent: {
    primary: '#1677ff',
    primaryHover: '#4096ff',
  },
  severity: {
    trace: { bg: '#1a1a1a', text: '#8c8c8c', border: '#2a2a2a' },
    debug: { bg: '#1a1228', text: '#b37feb', border: '#391085' },
    info: { bg: '#001d57', text: '#69b1ff', border: '#003eb3' },
    warn: { bg: '#2b2111', text: '#ffc53d', border: '#614700' },
    error: { bg: '#2a1215', text: '#ff7875', border: '#58181c' },
    fatal: { bg: '#1f0000', text: '#ff4d4f', border: '#7f1d1d' },
  },
  status: {
    success: '#52c41a',
    danger: '#ff4d4f',
    warning: '#faad14',
  },
  auth: {
    bg: '#ffffff',
    bgAlt: '#f5f7fa',
    accent: '#3730a3',
    accentHover: '#4338ca',
    text: '#111827',
    textSecondary: '#6b7280',
  },
  app: {
    bg: '#ffffff',
    surface: '#f5f7fa',
    elevated: '#e5e7eb',
    border: '#d1d5db',
    text: '#111827',
    textSecondary: '#6b7280',
  },
} as const;

export type Theme = typeof theme;
