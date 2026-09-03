import Constants from 'expo-constants';

type ExpoExtra = {
  apiBaseUrl?: unknown;
};

function configuredBaseUrl() {
  const environmentDomain = process.env.EXPO_PUBLIC_DOMAIN?.trim();
  const extra = Constants.expoConfig?.extra as ExpoExtra | undefined;
  const configured = environmentDomain || (typeof extra?.apiBaseUrl === 'string' ? extra.apiBaseUrl.trim() : '');

  if (!configured || configured.toLowerCase() === 'undefined') return null;
  const withProtocol = /^https?:\/\//i.test(configured) ? configured : `https://${configured}`;
  return withProtocol.replace(/\/+$/, '');
}

export function getApiBaseUrl() {
  return configuredBaseUrl();
}

export function apiUrl(path: string) {
  const baseUrl = configuredBaseUrl();
  if (!baseUrl) {
    throw new Error('Forge Fit API is not configured.');
  }
  return `${baseUrl}/${path.replace(/^\/+/, '')}`;
}