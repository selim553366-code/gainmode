import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Register the headless widget task before Expo Router initializes the app entry.
// Expo Go does not include the native widget module.
if (Platform.OS === 'android' && Constants.executionEnvironment !== 'storeClient') {
  const { registerWidgetTaskHandler } = require('react-native-android-widget');
  const { widgetTaskHandler } = require('./widgets/widgetTaskHandler');
  registerWidgetTaskHandler(widgetTaskHandler);
}

require('expo-router/entry');
