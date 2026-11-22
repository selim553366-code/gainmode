import { Alert, Platform } from 'react-native';
import type { Language } from '@/lib/i18n';

const IOS_UPDATE_COPY: Record<Language, { title: string; body: string; update: string; later: string }> = {
  tr: { title: 'Yeni sürüm hazır', body: 'GainMode’un yeni sürümü App Store’da. Şimdi güncellemek ister misin?', update: 'Güncelle', later: 'Sonra' },
  en: { title: 'Update available', body: 'A new version of GainMode is on the App Store. Update now?', update: 'Update', later: 'Later' },
  de: { title: 'Update verfügbar', body: 'Eine neue Version von GainMode ist im App Store. Jetzt aktualisieren?', update: 'Aktualisieren', later: 'Später' },
  fr: { title: 'Mise à jour disponible', body: 'Une nouvelle version de GainMode est sur l’App Store. Mettre à jour maintenant ?', update: 'Mettre à jour', later: 'Plus tard' },
  es: { title: 'Actualización disponible', body: 'Hay una nueva versión de GainMode en la App Store. ¿Actualizar ahora?', update: 'Actualizar', later: 'Más tarde' },
};

let checkedThisLaunch = false;

/**
 * Asks the store once per launch whether a newer build exists.
 * Android: Google Play's own in-app update sheet (flexible; immediate when the
 * release is given priority 4+ in Play Console). iOS has no system update sheet,
 * so a short alert opens the App Store page for the app.
 */
export async function promptStoreUpdateIfAvailable(language: Language) {
  if (checkedThisLaunch || __DEV__ || Platform.OS === 'web') return;
  checkedThisLaunch = true;
  try {
    const InAppUpdates = await import('expo-in-app-updates');
    if (Platform.OS === 'android') {
      await InAppUpdates.checkAndStartUpdate();
      return;
    }
    const info = await InAppUpdates.checkForUpdate();
    if (!info.updateAvailable) return;
    const copy = IOS_UPDATE_COPY[language] ?? IOS_UPDATE_COPY.en;
    Alert.alert(copy.title, copy.body, [
      { text: copy.later, style: 'cancel' },
      { text: copy.update, onPress: () => { InAppUpdates.startUpdate().catch(() => undefined); } },
    ]);
  } catch (error) {
    // Sideloaded/dev builds and devices without Play Store can't be checked; skip quietly.
    console.warn('Store update check skipped.', error);
  }
}
