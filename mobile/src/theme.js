// Theme SkillLearn, disalin dari design_handoff/tokens/theme.ts (versi JS biar nggak perlu TypeScript)

export const colors = {
  primary: '#0E5E52', primaryHover: '#0B4D43', primaryBusy: '#4F8C82', primaryTint: '#E7F3F0', primaryBorder: '#9FC5BC', primaryOnDark: '#CFE6E0',
  primaryDisabled: '#9FB5B0',
  accent: '#F2A93B', accentTint: '#FBF3DF', accentBorder: '#F0E2B8', accentInk: '#7A5510', accentInkStrong: '#5E420C',
  ink: '#16211F', inkBody: '#2E3A38', inkMuted: '#4A5856', inkSubtle: '#8A9693',
  line: '#E3E8E6', lineStrong: '#D5DDDA', lineSoft: '#EEF1F0', lineControl: '#B9C4C1', lineDashed: '#C9D3D0',
  page: '#F6F8F7', card: '#FFFFFF', white: '#FFFFFF', overlay: 'rgba(22,33,31,0.45)',
  danger: '#C2412D', dangerHover: '#A33522', dangerInk: '#9A3322', dangerTint: '#FBE9E5', dangerField: '#FFF8F6',
  category: {
    programming: { tint: '#DCE8F7', ink: '#1F4E8C' },
    design: { tint: '#F8E3DA', ink: '#A4472A' },
    marketing: { tint: '#F6ECCF', ink: '#7A5510' },
    technology: { tint: '#DCEEE3', ink: '#2D6B4A' },
  },
  code: { bg: '#16211F', text: '#E7F3F0', comment: '#8A9693', string: '#9FD8C6', tag: '#8FB8F0', keyword: '#F2A93B', fn: '#E9D59A', attr: '#F4B9A4', punct: '#B9C4C1', lineNo: '#5E6E6B' },
};

// JetBrains Mono punya ligatur (=> jadi panah, === jadi garis). Untuk kode belajar, simbol asli lebih jelas.
export const NO_LIGATURES = ['no-contextual', 'no-common-ligatures'];

export const fonts = {
  regular: 'PlusJakartaSans_400Regular', medium: 'PlusJakartaSans_500Medium', semibold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold', extrabold: 'PlusJakartaSans_800ExtraBold', mono: 'JetBrainsMono_500Medium',
};

// letterSpacing di RN pakai px absolut: -0.02em × ukuran font
export const type = {
  screenTitle: { fontFamily: fonts.extrabold, fontSize: 28, lineHeight: 34, letterSpacing: -0.56, color: colors.ink },
  mobileTitle: { fontFamily: fonts.extrabold, fontSize: 24, lineHeight: 29, letterSpacing: -0.48, color: colors.ink },
  display: { fontFamily: fonts.extrabold, fontSize: 36, lineHeight: 40, letterSpacing: -0.72 },
  heading: { fontFamily: fonts.bold, fontSize: 18, lineHeight: 24, color: colors.ink },
  title: { fontFamily: fonts.bold, fontSize: 16, lineHeight: 22, color: colors.ink },
  bodyLg: { fontFamily: fonts.regular, fontSize: 16, lineHeight: 27, color: colors.inkBody },
  body: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 24, color: colors.inkBody },
  ui: { fontFamily: fonts.semibold, fontSize: 14, lineHeight: 20, color: colors.ink },
  small: { fontFamily: fonts.medium, fontSize: 13, lineHeight: 19, color: colors.inkMuted },
  caption: { fontFamily: fonts.semibold, fontSize: 12, lineHeight: 17 },
  tab: { fontFamily: fonts.semibold, fontSize: 11, lineHeight: 14 },
  eyebrow: { fontFamily: fonts.mono, fontSize: 10, lineHeight: 13, letterSpacing: 0.8, textTransform: 'uppercase' },
  code: { fontFamily: fonts.mono, fontSize: 11.5, lineHeight: 19.5 },
};

export const space = { 1: 4, 1.5: 6, 2: 8, 2.5: 10, 3: 12, 3.5: 14, 4: 16, 4.5: 18, 5: 20, 6: 24, 7: 28, 8: 32, 10: 40, 12: 48 };
export const radius = { xs: 6, sm: 8, md: 10, lg: 12, xl: 14, xxl: 16, sheet: 20, pill: 999 };
export const size = { screenPadding: 20, authPadding: 24, input: 52, button: 54, touchMin: 44, tabBar: 84 };
export const motion = { fast: 150, progress: 300, spinner: 800, toast: 3500, pulse: 1400 };

export const shadow = {
  toast: { shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 12, shadowOffset: { width: 0, height: 8 }, elevation: 8 },
};

// Fallback kalau API mengirim kategori yang belum dikenal
export function categoryColors(id) {
  return colors.category[id] || { tint: colors.lineSoft, ink: colors.inkMuted };
}
