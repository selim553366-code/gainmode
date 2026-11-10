/** The parts of a RevenueCat store product that describe a free trial, on either store. */
export type TrialSource = {
  introPrice?: { price: number; periodUnit: string; periodNumberOfUnits: number; cycles?: number } | null;
  defaultOption?: { freePhase?: { billingPeriod?: { unit: string; value: number } | null } | null } | null;
};

const DAYS_PER_UNIT: Record<string, number> = { DAY: 1, WEEK: 7, MONTH: 30, YEAR: 365 };

/**
 * Length of the free trial a product offers, in days, or null when it has none. The paywall only
 * promises a trial the store will actually give: on Google Play that is the default offer's free
 * phase, on the App Store a free introductory price.
 */
export function freeTrialDays(product: TrialSource | null | undefined): number | null {
  const phase = product?.defaultOption?.freePhase?.billingPeriod;
  if (phase && phase.value > 0 && DAYS_PER_UNIT[phase.unit]) return phase.value * DAYS_PER_UNIT[phase.unit];
  const intro = product?.introPrice;
  if (intro && intro.price === 0 && intro.periodNumberOfUnits > 0 && DAYS_PER_UNIT[intro.periodUnit]) {
    return intro.periodNumberOfUnits * Math.max(1, intro.cycles ?? 1) * DAYS_PER_UNIT[intro.periodUnit];
  }
  return null;
}
