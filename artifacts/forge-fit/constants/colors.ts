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
    tint: '#0B73B5',
    background: '#F7FAFC',
    foreground: '#102238',
    card: '#FFFFFF',
    cardForeground: '#102238',
    primary: '#0B73B5',
    primaryForeground: '#FFFFFF',
    secondary: '#EAF3F8',
    secondaryForeground: '#17334F',
    muted: '#EEF4F8',
    mutedForeground: '#52687D',
    accent: '#6B59C9',
    accentForeground: '#FFFFFF',
    destructive: '#C43D58',
    destructiveForeground: '#FFFFFF',
    border: '#D4E1EA',
    input: '#EAF1F6',
    success: '#087A5C',
    blue: '#0C6FA6',
    orange: '#B85F12',
    plum: '#6952C2',
    black: '#000000',
    white: '#FFFFFF',
    coachMorningGlow: '#EAF3F8',
    coachAfternoonSun: '#F4EFAE',
    coachAfternoonLime: '#DCEFB1',
    coachAfternoonMist: '#FFFEF5',
    coachAfternoonHighlight: '#FFF9C7',
    coachNightPurple: '#51407C',
    coachNightBlack: '#080812',
    coachNightDeep: '#170E31',
    coachStar: '#FFF8D8',
    coachTransparent: 'rgba(255,255,255,0)',
  },
  dark: {
    text: '#F7F8F2',
    tint: '#72C8FF',
    background: '#07111F',
    foreground: '#F4F9FF',
    card: '#0D1C31',
    cardForeground: '#F7F8F2',
    primary: '#67C7FF',
    primaryForeground: '#06101D',
    secondary: '#132B48',
    secondaryForeground: '#F4F9FF',
    muted: '#0B1A2D',
    mutedForeground: '#8EA7C0',
    accent: '#9B8CFF',
    accentForeground: '#06101D',
    destructive: '#FF7187',
    destructiveForeground: '#06101D',
    border: '#1D3B5E',
    input: '#153251',
    success: '#5DE0B1',
    blue: '#72C8FF',
    orange: '#FFB66B',
    plum: '#B39BFF',
    black: '#000000',
    white: '#FFFFFF',
    coachMorningGlow: '#132B48',
    coachAfternoonSun: '#837D42',
    coachAfternoonLime: '#5C743C',
    coachAfternoonMist: '#F5F4D8',
    coachAfternoonHighlight: '#E4D979',
    coachNightPurple: '#51407C',
    coachNightBlack: '#080812',
    coachNightDeep: '#170E31',
    coachStar: '#FFF8D8',
    coachTransparent: 'rgba(255,255,255,0)',
  },
  radius: 18,
};

export default colors;
