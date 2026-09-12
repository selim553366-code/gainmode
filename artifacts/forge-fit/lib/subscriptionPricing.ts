type SubscriptionProduct = { price: number; currencyCode: string };

function isValidProduct(product?: SubscriptionProduct | null): product is SubscriptionProduct {
  return Boolean(
    product
      && Number.isFinite(product.price)
      && product.price >= 0
      && /^[A-Z]{3}$/.test(product.currencyCode),
  );
}

/** Use the store's numeric price and currency, never parse its display string. */
export function formatAnnualMonthlyPrice(product?: SubscriptionProduct | null, locale?: string): string | null {
  if (!isValidProduct(product)) {
    return null;
  }
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: product.currencyCode,
  }).format(product.price / 12);
}

/** Compare plans only when the store reports matching currencies. */
export function calculateAnnualSavingsPercent(
  monthlyProduct?: SubscriptionProduct | null,
  annualProduct?: SubscriptionProduct | null,
): number | null {
  if (
    !isValidProduct(monthlyProduct)
    || !isValidProduct(annualProduct)
    || monthlyProduct.currencyCode !== annualProduct.currencyCode
    || monthlyProduct.price <= 0
  ) {
    return null;
  }

  const monthlyForYear = monthlyProduct.price * 12;
  if (annualProduct.price >= monthlyForYear) return null;
  return Math.round(((monthlyForYear - annualProduct.price) / monthlyForYear) * 100);
}