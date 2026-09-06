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
    text: '#12243A',
    tint: '#168BD2',
    background: '#F4F8FC',
    foreground: '#102238',
    card: '#FFFFFF',
    cardForeground: '#102238',
    primary: '#168BD2',
    primaryForeground: '#FFFFFF',
    secondary: '#E8F2FA',
    secondaryForeground: '#17334F',
    muted: '#EDF3F8',
    mutedForeground: '#61778D',
    accent: '#9B8CFF',
    accentForeground: '#FFFFFF',
    destructive: '#D9435F',
    destructiveForeground: '#FFFFFF',
    border: '#D6E2EC',
    input: '#E6EFF7',
    success: '#168B68',
    blue: '#167DBB',
    orange: '#D87518',
    plum: '#7661D5',
    black: '#000000',
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
  },
  radius: 18,
};

export default colors;
