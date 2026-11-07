import AsyncStorage from '@react-native-async-storage/async-storage';
import { COACH_KICKOFF_KEY } from './coachKickoff';

/** After a purchase: ask FitBud to open with the personal kickoff message on its next load. */
export function queueCoachKickoff() {
  void AsyncStorage.setItem(COACH_KICKOFF_KEY, '1').catch(() => undefined);
}

/** Reads and clears the kickoff request, so the message is posted exactly once. */
export async function takeCoachKickoff() {
  try {
    if (!(await AsyncStorage.getItem(COACH_KICKOFF_KEY))) return false;
    await AsyncStorage.removeItem(COACH_KICKOFF_KEY);
    return true;
  } catch {
    return false;
  }
}
