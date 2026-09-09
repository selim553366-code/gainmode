import AsyncStorage from '@react-native-async-storage/async-storage';

const AI_CLIENT_ID_KEY = 'forge-fit-ai-client-id';
let cachedClientId: string | null = null;

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