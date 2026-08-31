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
    text: '#F4F9FF',
    tint: '#67C7FF',
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
    accent: '#FFB66B',
    accentForeground: '#06101D',
    destructive: '#FF7187',
    destructiveForeground: '#06101D',
    border: '#1D3B5E',
    input: '#153251',
    success: '#5DE0B1',
  },
  dark: {
    text: '#F4F9FF',
    tint: '#67C7FF',
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
    accent: '#FFB66B',
    accentForeground: '#06101D',
    destructive: '#FF7187',
    destructiveForeground: '#06101D',
    border: '#1D3B5E',
    input: '#153251',
    success: '#5DE0B1',
  },
  radius: 18,
};

export default colors;
