/**
 * Banner shown at the top of every archived Terms page, above the old text (Legal Review ruling 2026-10-24).
 * The archived text below it is never edited; see lib/terms-archive.test.ts.
 */
/** Legal Review 2026-10-24 (revised banner for d3): exact text, no claim about purchases. */
export const D3_BANNER =
  "Past version (2026-10-24-d3), replaced by version 2026-10-24-d4 on October 24, 2026. It is kept for the record and is not an offer.";

export function ArchivedTermsD3Banner() {
  return (
    <p data-archive-banner="" className="mt-4 rounded bg-amber-50 px-3 py-2 text-sm text-amber-800">
      {D3_BANNER}
    </p>
  );
}

export function ArchivedTermsBanner({ plans }: { plans: boolean }) {
  const lead = plans
    ? "Archived version, no longer in effect. Kept for our records only. The plans and prices below are not offered. Only the monthly Pro plan was ever sold. Current Terms: "
    : "Archived version, no longer in effect. Kept for our records only. Current Terms: ";
  return (
    <p data-archive-banner="" className="mt-4 rounded bg-amber-50 px-3 py-2 text-sm text-amber-800">
      {lead}<a href="https://makeqr.pro/terms" className="underline">https://makeqr.pro/terms</a>
    </p>
  );
}
