import AsyncStorage from '@react-native-async-storage/async-storage';
import Purchases from 'react-native-purchases';
import { apiUrl } from '@/lib/api';

const AI_CLIENT_ID_KEY = 'forge-fit-ai-client-id';
const AI_ACCESS_TOKEN_KEY = 'forge-fit-ai-access-token';
let cachedClientId: string | null = null;
let cachedAccessToken: { token: string; expiresAt: number } | null = null;

export async function getAiClientId() {
  if (cachedClientId) return cachedClientId;
  const stored = await AsyncStorage.getItem(AI_CLIENT_ID_KEY);
  if (stored) {
    cachedClientId = stored;
    return stored;
  }
  const generated = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
  cachedClientId = generated;
  await AsyncStorage.setItem(AI_CLIENT_ID_KEY, generated);
  return generated;
}

export async function getAiAccessToken() {
  const now = Date.now();
  if (cachedAccessToken && cachedAccessToken.expiresAt > now + 30_000) return cachedAccessToken.token;

  const stored = await AsyncStorage.getItem(AI_ACCESS_TOKEN_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored) as { token?: unknown; expiresAt?: unknown };
      if (typeof parsed.token === 'string' && typeof parsed.expiresAt === 'number' && parsed.expiresAt > now + 30_000) {
        cachedAccessToken = { token: parsed.token, expiresAt: parsed.expiresAt };
        return parsed.token;
      }
    } catch {
      // Request a fresh access token below.
    }
  }

  let appUserId: string;
  try {
    appUserId = await Purchases.getAppUserID();
  } catch {
    return null;
  }
  if (!appUserId) return null;

  const response = await fetch(apiUrl('/api/ai/access'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ appUserId }),
  });
  if (!response.ok) throw new Error('AI access verification failed');
  const result = await response.json() as { accessToken?: unknown; expiresIn?: unknown };
  if (typeof result.accessToken !== 'string' || typeof result.expiresIn !== 'number') {
    throw new Error('AI access verification returned an invalid token');
  }

  const expiresAt = Date.now() + result.expiresIn * 1000;
  cachedAccessToken = { token: result.accessToken, expiresAt };
  await AsyncStorage.setItem(AI_ACCESS_TOKEN_KEY, JSON.stringify({ token: result.accessToken, expiresAt }));
  return result.accessToken;
}