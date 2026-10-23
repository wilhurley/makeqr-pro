/**
 * Public Pro price. Checkout charges whatever STRIPE_PRO_PRICE_ID costs;
 * this value is only the number shown in the UI and Offer structured data.
 * Set NEXT_PUBLIC_PRO_PRICE_CENTS=500 for $5.00. Changing it requires a rebuild.
 */
const DEFAULT_PRO_PRICE_CENTS = 500;

export function getProPriceCents(): number {
  const raw = process.env.NEXT_PUBLIC_PRO_PRICE_CENTS;
  if (raw === undefined || raw.trim() === "") return DEFAULT_PRO_PRICE_CENTS;
  const cents = Number(raw);
  if (!Number.isInteger(cents) || cents < 0 || cents > 1_000_000) {
    return DEFAULT_PRO_PRICE_CENTS;
  }
  return cents;
}

/** "$5" when whole dollars, otherwise "$4.99". */
export function formatProPrice(cents = getProPriceCents()): string {
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(cents);
  const dollars = Math.floor(abs / 100);
  const remainder = abs % 100;
  const body = remainder === 0 ? String(dollars) : `${dollars}.${String(remainder).padStart(2, "0")}`;
  return `${sign}$${body}`;
}

/** Schema.org Offer price, always two decimals ("5.00"). */
export function proPriceAmount(cents = getProPriceCents()): string {
  return (Math.abs(cents) / 100).toFixed(2);
}

/** Display price for copy, e.g. "$3.99". Set via NEXT_PUBLIC_PRO_PRICE_CENTS at build time. */
export const PRO_PRICE = formatProPrice();
