/**
 * Public Pro price. Checkout charges whatever STRIPE_PRO_PRICE_ID costs;
 * this value is only the number shown in the UI and Offer structured data.
 * Defaults to 499 ($4.99/mo). Set
 * NEXT_PUBLIC_PRO_PRICE_CENTS to override. Changing it requires a rebuild.
 */
const DEFAULT_PRO_PRICE_CENTS = 499;
/** Yearly ($39) and lifetime ($79 one-time) display prices. Only shown when their Stripe Price ids are set. */
const DEFAULT_PRO_YEARLY_PRICE_CENTS = 3900;
const DEFAULT_PRO_LIFETIME_PRICE_CENTS = 7900;

function centsFromEnv(raw: string | undefined, fallback: number): number {
  if (raw === undefined || raw.trim() === "") return fallback;
  const cents = Number(raw);
  if (!Number.isInteger(cents) || cents < 0 || cents > 1_000_000) return fallback;
  return cents;
}

export function getProPriceCents(): number {
  return centsFromEnv(process.env.NEXT_PUBLIC_PRO_PRICE_CENTS, DEFAULT_PRO_PRICE_CENTS);
}

export function getProYearlyPriceCents(): number {
  return centsFromEnv(process.env.NEXT_PUBLIC_PRO_YEARLY_PRICE_CENTS, DEFAULT_PRO_YEARLY_PRICE_CENTS);
}

export function getProLifetimePriceCents(): number {
  return centsFromEnv(process.env.NEXT_PUBLIC_PRO_LIFETIME_PRICE_CENTS, DEFAULT_PRO_LIFETIME_PRICE_CENTS);
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

/** Schema.org Offer price, always two decimals ("4.99"). */
export function proPriceAmount(cents = getProPriceCents()): string {
  return (Math.abs(cents) / 100).toFixed(2);
}

/** Display price for copy, e.g. "$4.99". Set via NEXT_PUBLIC_PRO_PRICE_CENTS at build time. */
export const PRO_PRICE = formatProPrice();
export const PRO_YEARLY_PRICE = formatProPrice(getProYearlyPriceCents());
export const PRO_LIFETIME_PRICE = formatProPrice(getProLifetimePriceCents());
