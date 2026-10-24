# MakeQR Pro

Free QR code generator at [makeqr.pro](https://makeqr.pro), with a Pro subscription for WiFi, contact, SMS, email, and phone codes, logo overlay, bulk ZIP export, and SVG download. Owned by Ridgeline Apps LLC. QR images are built in the browser and are not stored on the server.

This is a stopgap entitlement check. A later version will add accounts and Postgres for dynamic QR codes. Until then, Stripe is the source of truth and there is no application database.

## Local development

```bash
npm ci
cp .env.example .env.local
# fill in the variable names below
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
npm test
npm run lint
npm run build
```

`scripts/generate-icons.mjs` rewrites `public/icon-192.png` and `public/icon-512.png`.

## Environment variables

Set these in `.env.local` and in the Vercel project (**Production**, and **Preview** if you test checkout there). Names only — do not commit values. `.env*` is gitignored except `.env.example`.

| Name | Scope | Purpose |
| --- | --- | --- |
| `STRIPE_SECRET_KEY` | server | Stripe API key. A restricted key is enough. |
| `STRIPE_PRO_PRICE_ID` | server | Price id used for **new** Checkout sessions. |
| `NEXT_PUBLIC_STRIPE_PRO_PRICE_ID` | — | **Ignored.** It pointed at the old $4.99 Price. Checkout never falls back to it; without `STRIPE_PRO_PRICE_ID` Pro is "coming soon" and nobody is charged. Remove it from Vercel. |
| `STRIPE_BILLING_PORTAL_LOGIN_URL` | server | Optional. Your Stripe customer-portal login link (`https://billing.stripe.com/p/login/...`). Browsers that restored Pro by email are sent here for Manage billing; Stripe emails the customer a code. |
| `STRIPE_WEBHOOK_SECRET` | server | Signing secret for `POST /api/stripe/webhook`. |
| `PRO_COOKIE_SECRET` | server | HMAC secret for the `qr_pro` httpOnly cookie. At least 16 characters; use `openssl rand -base64 32`. |
| `NEXT_PUBLIC_APP_URL` | public | Origin for Checkout and Billing Portal return URLs, e.g. `https://makeqr.pro`. |
| `NEXT_PUBLIC_PRO_PRICE_CENTS` | public | Price shown in the UI and Offer structured data, in US cents. `399` (the default) is `$3.99`. Must match the Stripe Price. Requires a rebuild. |
| `STRIPE_PRO_YEARLY_PRICE_ID` | server | Optional. Recurring **$29 / year** Price. The yearly button only shows when this is set. |
| `NEXT_PUBLIC_PRO_YEARLY_PRICE_CENTS` | public | Optional display price for yearly. Default `2900` = `$29`. Must match the Stripe Price. |
| `STRIPE_PRO_LIFETIME_PRICE_ID` | server | Optional. One-time **$39** Price (not recurring). Shown as "Launch lifetime deal, limited" only when this is set. |
| `NEXT_PUBLIC_PRO_LIFETIME_PRICE_CENTS` | public | Optional display price for lifetime. Default `3900` = `$39`. Must match the Stripe Price. |

**Pro coming soon:** until both `STRIPE_SECRET_KEY` and `STRIPE_PRO_PRICE_ID` are set (the legacy `NEXT_PUBLIC_STRIPE_PRO_PRICE_ID` is never used, so a $3.99 display can't charge the old $4.99 Price), every Get Pro / Upgrade button says "Pro coming soon" and links to a waitlist email (`support@ridgelineapps.us`), and `/api/checkout` returns `503 {comingSoon: true}` instead of an error. The browser reads `GET /api/plans` (no Stripe ids exposed) to decide, so turning Stripe on only needs the env vars and a redeploy. Yearly and lifetime never show without the monthly Price. Pro stays off if `PRO_COOKIE_SECRET` is missing.

## How Pro works

1. **Upgrade** sends `{plan: "monthly" | "yearly" | "lifetime"}` to `/api/checkout`. Monthly and yearly create a Checkout `subscription` session; lifetime creates a Checkout `payment` session (one-time, `customer_creation: always`). The server picks the Price id; the browser only names the plan. Session metadata carries `plan`.
2. The success URL calls `/api/verify-session`, which loads the Checkout Session and its Subscription. A signed httpOnly cookie (`qr_pro`) is set only when the subscription is `active` or `trialing` (or the lifetime payment is recorded), plus a separate billing cookie (`qr_billing`, 30 days, sliding) because the Checkout Session id proves this browser made the purchase. If verification fails (non-2xx, `valid: false`, or a network error) the page keeps the session id and shows **Try again**; reloads and the hourly check retry too.
3. The browser asks `/api/pro` on load and about once an hour. The cookie is trusted for one hour, then the server retrieves that subscription from Stripe and replaces or clears the cookie. Returning from the billing portal forces a fresh check.
4. **Cancel at period end** keeps Pro until Stripe flips the subscription off `active`. **Canceled, unpaid, incomplete, or paused** subscriptions lose Pro on the next check. There is no localStorage flag.
5. **Restore** (`POST /api/restore`) looks up Stripe Customers by email and sets the same cookie when one of them has an entitled subscription. Any Price qualifies, so existing **$4.99** subscribers keep Pro after new sales move to **$3.99**. The lookup is case-insensitive (Stripe's `customers.list` email filter is case-sensitive, so it also uses the typed form and Stripe Search). Restore unlocks Pro features only. It never sets `qr_billing`, because knowing an email does not prove owning it. It is rate-limited per IP and email on a best-effort basis.
6. **Manage billing** opens the Stripe Customer Portal for the customer in `qr_billing`, and still shows when Pro has lapsed (past_due/unpaid) so the customer can fix the card or cancel. Without `qr_billing` (e.g. after an email restore) it redirects to `STRIPE_BILLING_PORTAL_LOGIN_URL` if set. Both cookies reject expired claims on the server, not only via browser `Max-Age`.
7. **Lifetime** has no subscription. When a lifetime Checkout Session is paid, `/api/verify-session` and the `checkout.session.completed` / `checkout.session.async_payment_succeeded` webhook (whichever comes first, idempotent) write Customer metadata `makeqr_pro_lifetime=<payment_intent id>`. The cookie then carries `sub: "lifetime"`, and the hourly `/api/pro` re-check and Restore read that Customer, and the buying browser gets `qr_billing` for Manage billing. Lifetime never expires; it ends only if the Customer is blocked (dispute / early fraud warning) or that payment is fully refunded (`charge.refunded` clears the metadata).
8. **Webhooks** verify `Stripe-Signature` with `STRIPE_WEBHOOK_SECRET`. Subscription updates are not stored locally — the next `/api/pro` read sees them. `charge.dispute.created` and `radar.early_fraud_warning.created` set Customer metadata `makeqr_pro_block`, which blocks the cookie and restore. For subscriptions, `charge.refunded` does not by itself remove Pro; cancel the subscription when a refund should end access. For lifetime, a full refund removes it.

The cookie is a pointer to a Stripe subscription (or a lifetime Customer), not a second billing system. A modified client can still hide the upgrade UI; server routes will not treat a forged cookie as paid.

## Stripe Dashboard steps

Do these before pointing production at this build. Do not delete or migrate the current $4.99 Price.

1. Open the existing Pro Product. Add a new recurring **$3.99 / month** Price. Leave the **$4.99** Price active so current subscriptions renew at $4.99.
2. Copy the new Price id into `STRIPE_PRO_PRICE_ID`. Set `NEXT_PUBLIC_PRO_PRICE_CENTS` to `399`.
   - Optional yearly: on the same Product add a recurring **$29.00 / year** Price → `STRIPE_PRO_YEARLY_PRICE_ID` (`NEXT_PUBLIC_PRO_YEARLY_PRICE_CENTS=2900`).
   - Optional lifetime: on the same Product add a **one-time $39.00** Price → `STRIPE_PRO_LIFETIME_PRICE_ID` (`NEXT_PUBLIC_PRO_LIFETIME_PRICE_CENTS=3900`). The "limited" launch cap (first 300) is not enforced in code; remove the env var to stop selling it.
3. Developers → Webhooks → add endpoint `https://makeqr.pro/api/stripe/webhook`. Subscribe to:
   - `checkout.session.completed`
   - `checkout.session.async_payment_succeeded`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `charge.dispute.created`
   - `charge.refunded`
   - `radar.early_fraud_warning.created`
   Put the signing secret in `STRIPE_WEBHOOK_SECRET`.
4. Settings → Billing → Customer portal: turn the portal on and allow customers to cancel. The app's Manage billing button needs this.
5. For local webhooks, forward with the Stripe CLI to `localhost:3000/api/stripe/webhook` and use that endpoint's signing secret in `.env.local`.
6. If you charge US or EU customers, consider [Stripe Tax for recurring payments](https://docs.stripe.com/billing/taxes/collect-taxes). Tax is not enabled in this app. Do not turn on `automatic_tax` until a registration is active, or Stripe collects nothing while Checkout looks taxed.

Prefer a [restricted API key](https://docs.stripe.com/keys) over a secret key. Roll any key that has been committed or pasted into a log.

## Deploy

The app is a Next.js 16 project on Vercel (`qrmaker-pro`), with Cloudflare proxying `makeqr.pro`. Production traffic is still the **18 March 2026** CLI deploy of commit `1967d30` (privacy page only). Commit `11adcf0` (3 April 2026: `/about`, `/qr-code-best-practices`, `/terms`, sitemap) is on `main` and has **no** Vercel deployment, which is why those URLs 404. GitHub shows no Vercel check runs, and the repo has no GitHub Actions workflow.

That March deployment's source is the **Vercel CLI**, not a Git build. Pushes to `main` are not creating deployments. Reconnect the GitHub repo `wilhurley/makeqr-pro`, production branch `main`, in the Vercel project's Git settings, or deploy from a checkout of `main` after the env vars above are saved on the Vercel project. The env list visible for this project was empty, so confirm Production variables in the dashboard before the next deploy — a CLI deploy from a laptop can succeed with a local env file that was never saved on the project.

Do not change DNS. `/about` and `/qr-code-best-practices` are normal App Router pages; a clean `npm run build` emits them, and the next production deploy of current `main` will serve them.

On-site legal copy (privacy, terms, refund, about, footer, schema) names Ridgeline Apps LLC.
