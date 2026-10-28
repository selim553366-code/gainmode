import { Platform } from 'react-native';
import Constants from 'expo-constants';
import 'expo-router/entry';

// Android renders the home-screen widget through a headless JS task that must be registered at startup.
// Expo Go does not include the native widget module, so keep its entry point out of that runtime.
if (Platform.OS === 'android' && Constants.executionEnvironment !== 'storeClient') {
  const { registerWidgetTaskHandler } = require('react-native-android-widget');
  const { widgetTaskHandler } = require('./widgets/widgetTaskHandler');
  registerWidgetTaskHandler(widgetTaskHandler);
}
