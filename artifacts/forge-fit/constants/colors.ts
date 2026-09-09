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
    text: '#102238',
    tint: '#2563EB',
    background: '#F7FAFF',
    foreground: '#102238',
    card: '#FFFFFF',
    cardForeground: '#102238',
    primary: '#2563EB',
    primaryForeground: '#FFFFFF',
    secondary: '#EDF5FF',
    secondaryForeground: '#17334F',
    muted: '#F2F7FC',
    mutedForeground: '#60738A',
    accent: '#5B6FE8',
    accentForeground: '#FFFFFF',
    destructive: '#C43D58',
    destructiveForeground: '#FFFFFF',
    border: '#DCE8F5',
    input: '#EFF5FB',
    success: '#087A5C',
    blue: '#4D9BFF',
    orange: '#B85F12',
    plum: '#6952C2',
    black: '#000000',
    white: '#FFFFFF',
    glass: 'rgba(255,255,255,0.78)',
    glassBorder: 'rgba(255,255,255,0.92)',
    glassHighlight: 'rgba(255,255,255,0.56)',
    surfaceSoft: '#F8FBFF',
    coachMorningGlow: '#EAF3F8',
    coachNightPurple: '#51407C',
    coachNightBlack: '#080812',
    coachNightDeep: '#170E31',
    coachStar: '#FFF8D8',
    coachTransparent: 'rgba(255,255,255,0)',
  },
  dark: {
    text: '#08243D',
    tint: '#0759D5',
    background: '#73C4EE',
    foreground: '#08243D',
    card: '#FFFFFF',
    cardForeground: '#08243D',
    primary: '#0759D5',
    primaryForeground: '#FFFFFF',
    secondary: '#69BDF0',
    secondaryForeground: '#08243D',
    muted: '#64B5E5',
    mutedForeground: '#164361',
    accent: '#4C7CFF',
    accentForeground: '#FFFFFF',
    destructive: '#B63E58',
    destructiveForeground: '#FFFFFF',
    border: '#9CDCF9',
    input: '#A8E0FA',
    success: '#5DE0B1',
    blue: '#1268E8',
    orange: '#D26B17',
    plum: '#6C57C9',
    black: '#000000',
    white: '#FFFFFF',
    glass: 'rgba(6,31,54,0.84)',
    glassBorder: 'rgba(122,210,255,0.46)',
    glassHighlight: 'rgba(255,255,255,0.2)',
    surfaceSoft: '#8BD1F5',
    coachMorningGlow: '#D9F3FF',
    coachNightPurple: '#51407C',
    coachNightBlack: '#080812',
    coachNightDeep: '#170E31',
    coachStar: '#FFF8D8',
    coachTransparent: 'rgba(255,255,255,0)',
  },
  radius: 18,
};

export default colors;
