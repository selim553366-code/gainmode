import { Platform } from 'react-native';
import { registerWidgetTaskHandler } from 'react-native-android-widget';
import { widgetTaskHandler } from './widgets/widgetTaskHandler';
import 'expo-router/entry';

// Android renders the home-screen widget through a headless JS task that must be registered at startup.
if (Platform.OS === 'android') registerWidgetTaskHandler(widgetTaskHandler);
