/**
 * Semantic design tokens for the mobile app.
 *
 * These tokens mirror the naming conventions used in web artifacts (index.css)
 * so that multi-artifact projects share a cohesive visual identity.
 *
 * Replace the placeholder values below with values that match the project's
 * brand. If a sibling web artifact exists, read its index.css and convert the
 * HSL values to hex so both artifacts use the same palette.
 *
 * To add dark mode, add a `dark` key with the same token names.
 * The useColors() hook will automatically pick it up.
 */

const colors = {
  light: {
    text: '#0A1023',
    tint: '#6F52FF',
    background: '#F5F6FF',
    foreground: '#0A1023',
    card: '#FFFFFF',
    cardForeground: '#0A1023',
    primary: '#6F52FF',
    primaryForeground: '#FFFFFF',
    secondary: '#E9E7FF',
    secondaryForeground: '#241B56',
    muted: '#EFF0FA',
    mutedForeground: '#5D6680',
    accent: '#00CFA8',
    accentForeground: '#FFFFFF',
    destructive: '#D64065',
    destructiveForeground: '#FFFFFF',
    border: '#D5D8F1',
    input: '#EEF0FF',
    success: '#00A982',
    blue: '#287DFF',
    orange: '#FF824D',
    plum: '#A452F5',
    black: '#000000',
    white: '#FFFFFF',
    coachMorningGlow: '#EAF3F8',
    coachNightPurple: '#51407C',
    coachNightBlack: '#080812',
    coachNightDeep: '#170E31',
    coachStar: '#FFF8D8',
    coachTransparent: 'rgba(255,255,255,0)',
  },
  dark: {
    text: '#F5F7FF',
    tint: '#8B6CFF',
    background: '#050816',
    foreground: '#F5F7FF',
    card: '#0C1024',
    cardForeground: '#F5F7FF',
    primary: '#8B6CFF',
    primaryForeground: '#FFFFFF',
    secondary: '#151B3A',
    secondaryForeground: '#F5F7FF',
    muted: '#090E20',
    mutedForeground: '#99A6CB',
    accent: '#00E6BE',
    accentForeground: '#031412',
    destructive: '#FF6F91',
    destructiveForeground: '#19040B',
    border: '#293263',
    input: '#111936',
    success: '#32E2B1',
    blue: '#5EB8FF',
    orange: '#FF9D67',
    plum: '#D27AFF',
    black: '#000000',
    white: '#FFFFFF',
    coachMorningGlow: '#132B48',
    coachNightPurple: '#51407C',
    coachNightBlack: '#080812',
    coachNightDeep: '#170E31',
    coachStar: '#FFF8D8',
    coachTransparent: 'rgba(255,255,255,0)',
  },
  radius: 18,
};

export default colors;
