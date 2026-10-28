import { Platform } from 'react-native';

/**
 * True only inside the hosted web design preview, whose page sets `window.__GAINMODE_DESIGN_PREVIEW`.
 * The preview cannot reach the API, so flows that need the server simulate success there.
 * Native apps and any other web build always return false.
 */
export function isDesignPreview() {
  return Platform.OS === 'web'
    && typeof globalThis !== 'undefined'
    && (globalThis as { __GAINMODE_DESIGN_PREVIEW?: unknown }).__GAINMODE_DESIGN_PREVIEW === true;
}
