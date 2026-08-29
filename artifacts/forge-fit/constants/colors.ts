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
    text: '#F7F8F2',
    tint: '#D7F34A',
    background: '#0B0D0C',
    foreground: '#F7F8F2',
    card: '#151916',
    cardForeground: '#F7F8F2',
    primary: '#D7F34A',
    primaryForeground: '#0B0D0C',
    secondary: '#222923',
    secondaryForeground: '#F7F8F2',
    muted: '#1A201C',
    mutedForeground: '#929B91',
    accent: '#A8C52C',
    accentForeground: '#0B0D0C',
    destructive: '#FF6F61',
    destructiveForeground: '#0B0D0C',
    border: '#2B332D',
    input: '#242C26',
    success: '#78D6A3',
    blue: '#82B7FF',
    orange: '#F2A65A',
    plum: '#B79AFF',
  },
  dark: {
    text: '#F7F8F2',
    tint: '#D7F34A',
    background: '#0B0D0C',
    foreground: '#F7F8F2',
    card: '#151916',
    cardForeground: '#F7F8F2',
    primary: '#D7F34A',
    primaryForeground: '#0B0D0C',
    secondary: '#222923',
    secondaryForeground: '#F7F8F2',
    muted: '#1A201C',
    mutedForeground: '#929B91',
    accent: '#A8C52C',
    accentForeground: '#0B0D0C',
    destructive: '#FF6F61',
    destructiveForeground: '#0B0D0C',
    border: '#2B332D',
    input: '#242C26',
    success: '#78D6A3',
    blue: '#82B7FF',
    orange: '#F2A65A',
    plum: '#B79AFF',
  },
  radius: 18,
};

export default colors;
