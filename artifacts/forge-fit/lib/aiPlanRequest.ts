import type { Profile } from '@/context/FitContext';
import { apiUrl } from '@/lib/api';
import { aiPlanRequestBody, parseAiPlan, type AiPlan, type AiPlanResponse } from '@/lib/aiPlan';
import { getAiClientId } from '@/lib/aiUsage';
import { translate, type Language } from '@/lib/i18n';
import { buildPlanSlots } from '@/lib/workoutPlan';

const PLAN_TIMEOUT_MS = 45_000;

/**
 * Send the onboarding answers to the AI planner and return the checked plan, or null when the
 * server is not configured, unreachable, slow or returns something unusable; the app then
 * keeps its own calculated plan.
 */
export async function requestAiPlan(profile: Profile, language: Language): Promise<AiPlan | null> {
  const slots = buildPlanSlots(profile);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PLAN_TIMEOUT_MS);
  try {
    const clientId = await getAiClientId().catch(() => undefined);
    const response = await fetch(apiUrl('/api/ai/onboarding-plan'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...aiPlanRequestBody(profile, slots, (key) => translate('en', key), language), clientId }),
      signal: controller.signal,
    });
    if (!response.ok) return null;
    return parseAiPlan(await response.json() as AiPlanResponse, slots);
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
