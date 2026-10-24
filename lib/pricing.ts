/**
 * Public Pro price. Checkout charges whatever STRIPE_PRO_PRICE_ID costs;
 * this value is only the number shown in the UI and Offer structured data.
 * Defaults to 399 ($3.99/mo, approved by Jason 2026-10-23). Set
 * NEXT_PUBLIC_PRO_PRICE_CENTS to override. Changing it requires a rebuild.
 * Production sets NEXT_PUBLIC_PRO_PRICE_CENTS=399 (changed from 499 on 2026-10-24).
 *
 * Price changes apply to new subscriptions only: existing subscribers keep their
 * current price. (Terms C11.5 also requires 30 days' email notice for any change to an
 * existing subscription.) Changing this display value never touches
 * Stripe Prices or existing subscriptions; billing is unchanged.
 */
const DEFAULT_PRO_PRICE_CENTS = 399;

function centsFromEnv(raw: string | undefined, fallback: number): number {
  if (raw === undefined || raw.trim() === "") return fallback;
  const cents = Number(raw);
  if (!Number.isInteger(cents) || cents < 0 || cents > 1_000_000) return fallback;
  return cents;
}

export function getProPriceCents(): number {
  return centsFromEnv(process.env.NEXT_PUBLIC_PRO_PRICE_CENTS, DEFAULT_PRO_PRICE_CENTS);
}



/** "$5" when whole dollars, otherwise "$3.99". */
export function formatProPrice(cents = getProPriceCents()): string {
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(cents);
  const dollars = Math.floor(abs / 100);
  const remainder = abs % 100;
  const body = remainder === 0 ? String(dollars) : `${dollars}.${String(remainder).padStart(2, "0")}`;
  return `${sign}$${body}`;
}

/** Schema.org Offer price, always two decimals ("3.99"). */
export function proPriceAmount(cents = getProPriceCents()): string {
  return (Math.abs(cents) / 100).toFixed(2);
}

/** Display price for copy, e.g. "$3.99". Set via NEXT_PUBLIC_PRO_PRICE_CENTS at build time. */
export const PRO_PRICE = formatProPrice();
