import { Platform } from 'react-native';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

export type PreparedPhoto = { uri: string; base64?: string };

/** Longest side, in pixels, of a meal photo we keep and send for analysis. */
export const FOOD_PHOTO_MAX_SIDE = 1024;

/**
 * Shrinks a camera or gallery photo before it is shown or sent. Phone cameras can produce
 * 50 MP images; drawing one of those, or holding its base64 in memory for the upload, can close
 * the app on Android. The result is a JPEG at most FOOD_PHOTO_MAX_SIDE on its longest side.
 */
export async function prepareFoodPhoto(uri: string, width?: number, height?: number): Promise<PreparedPhoto> {
  if (Platform.OS === 'web') return { uri };
  const landscape = (width ?? 0) > (height ?? 0);
  const resize = landscape ? { width: FOOD_PHOTO_MAX_SIDE } : { height: FOOD_PHOTO_MAX_SIDE };
  const needsResize = !width || !height || Math.max(width, height) > FOOD_PHOTO_MAX_SIDE;
  const result = await manipulateAsync(uri, needsResize ? [{ resize }] : [], { compress: 0.7, format: SaveFormat.JPEG, base64: true });
  return { uri: result.uri, base64: result.base64 };
}
