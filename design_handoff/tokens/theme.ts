// SkillLearn theme for React Native (Expo). Source of truth: tokens.json
// Fonts: npx expo install @expo-google-fonts/plus-jakarta-sans @expo-google-fonts/jetbrains-mono expo-font

export const colors = {
  primary: '#0E5E52', primaryHover: '#0B4D43', primaryBusy: '#4F8C82', primaryTint: '#E7F3F0', primaryBorder: '#9FC5BC', primaryOnDark: '#CFE6E0',
  accent: '#F2A93B', accentTint: '#FBF3DF', accentBorder: '#F0E2B8', accentInk: '#7A5510', accentInkStrong: '#5E420C',
  ink: '#16211F', inkBody: '#2E3A38', inkMuted: '#4A5856', inkSubtle: '#8A9693',
  line: '#E3E8E6', lineStrong: '#D5DDDA', lineSoft: '#EEF1F0', lineControl: '#B9C4C1', lineDashed: '#C9D3D0',
  page: '#F6F8F7', card: '#FFFFFF', overlay: 'rgba(22,33,31,0.45)',
  danger: '#C2412D', dangerHover: '#A33522', dangerInk: '#9A3322', dangerTint: '#FBE9E5', dangerField: '#FFF8F6',
  category: {
    programming: { tint: '#DCE8F7', ink: '#1F4E8C' },
    design: { tint: '#F8E3DA', ink: '#A4472A' },
    marketing: { tint: '#F6ECCF', ink: '#7A5510' },
    technology: { tint: '#DCEEE3', ink: '#2D6B4A' },
  },
  code: { bg: '#16211F', text: '#E7F3F0', comment: '#8A9693', string: '#9FD8C6', tag: '#8FB8F0', keyword: '#F2A93B', fn: '#E9D59A', attr: '#F4B9A4', punct: '#B9C4C1', lineNo: '#5E6E6B' },
} as const;

export const fonts = {
  regular: 'PlusJakartaSans_400Regular', medium: 'PlusJakartaSans_500Medium', semibold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold', extrabold: 'PlusJakartaSans_800ExtraBold', mono: 'JetBrainsMono_500Medium',
} as const;

// letterSpacing in RN is absolute px: -0.02em × size
export const type = {
  screenTitle: { fontFamily: fonts.extrabold, fontSize: 28, lineHeight: 34, letterSpacing: -0.56 },
  mobileTitle: { fontFamily: fonts.extrabold, fontSize: 24, lineHeight: 29, letterSpacing: -0.48 },
  display: { fontFamily: fonts.extrabold, fontSize: 36, lineHeight: 40, letterSpacing: -0.72 },
  heading: { fontFamily: fonts.bold, fontSize: 18, lineHeight: 24 },
  title: { fontFamily: fonts.bold, fontSize: 16, lineHeight: 22 },
  bodyLg: { fontFamily: fonts.regular, fontSize: 16, lineHeight: 27 },
  body: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 24 },
  ui: { fontFamily: fonts.semibold, fontSize: 14, lineHeight: 20 },
  small: { fontFamily: fonts.medium, fontSize: 13, lineHeight: 19 },
  caption: { fontFamily: fonts.semibold, fontSize: 12, lineHeight: 17 },
  tab: { fontFamily: fonts.semibold, fontSize: 11, lineHeight: 14 },
  eyebrow: { fontFamily: fonts.mono, fontSize: 10, lineHeight: 13, letterSpacing: 0.8, textTransform: 'uppercase' as const },
  code: { fontFamily: fonts.mono, fontSize: 11.5, lineHeight: 19.5 },
};

export const space = { 1: 4, 1.5: 6, 2: 8, 2.5: 10, 3: 12, 3.5: 14, 4: 16, 4.5: 18, 5: 20, 6: 24, 7: 28, 8: 32, 10: 40, 12: 48 } as const;
export const radius = { xs: 6, sm: 8, md: 10, lg: 12, xl: 14, xxl: 16, sheet: 20, pill: 999 } as const;
export const size = { screenPadding: 20, authPadding: 24, input: 52, button: 54, touchMin: 44, tabBar: 84 } as const;
export const motion = { fast: 150, progress: 300, spinner: 800, toast: 3500 } as const;
