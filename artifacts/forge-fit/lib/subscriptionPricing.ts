type AnnualProduct = { price: number; currencyCode: string };

/** Use the store's numeric price and currency, never parse its display string. */
export function formatAnnualMonthlyPrice(product?: AnnualProduct | null, locale?: string): string | null {
  if (!product || !Number.isFinite(product.price) || product.price < 0 || !/^[A-Z]{3}$/.test(product.currencyCode)) {
    return null;
  }
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: product.currencyCode,
  }).format(product.price / 12);
}