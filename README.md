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
| `NEXT_PUBLIC_PRO_PRICE_CENTS` | public | Price shown in the UI and Offer structured data, in US cents. `500` is `$5`. Must match the Stripe Price. Requires a rebuild. |

Checkout fails closed (HTTP 503 `comingSoon`, no charge) if `STRIPE_SECRET_KEY` or `STRIPE_PRO_PRICE_ID` is missing. Pro stays off if `PRO_COOKIE_SECRET` is missing.

## How Pro works

1. **Upgrade** creates a Stripe Checkout subscription session for `STRIPE_PRO_PRICE_ID` and redirects to Stripe.
2. The success URL calls `/api/verify-session`, which loads the Checkout Session and its Subscription. A signed httpOnly cookie (`qr_pro`) is set only when the subscription is `active` or `trialing`, plus a separate billing cookie (`qr_billing`, 30 days, sliding) because the Checkout Session id proves this browser made the purchase. If verification fails (non-2xx, `valid: false`, or a network error) the page keeps the session id and shows **Try again**; reloads and the hourly check retry too.
3. The browser asks `/api/pro` on load and about once an hour. The cookie is trusted for one hour, then the server retrieves that subscription from Stripe and replaces or clears the cookie. Returning from the billing portal forces a fresh check.
4. **Cancel at period end** keeps Pro until Stripe flips the subscription off `active`. **Canceled, unpaid, incomplete, or paused** subscriptions lose Pro on the next check. There is no localStorage flag.
5. **Restore** (`POST /api/restore`) looks up Stripe Customers by email and sets the same cookie when one of them has an entitled subscription. Any Price qualifies, so existing **$4.99** subscribers keep Pro after new sales move to **$5**. The lookup is case-insensitive (Stripe's `customers.list` email filter is case-sensitive, so it also uses the typed form and Stripe Search). Restore unlocks Pro features only. It never sets `qr_billing`, because knowing an email does not prove owning it. It is rate-limited per IP and email on a best-effort basis.
6. **Manage billing** opens the Stripe Customer Portal for the customer in `qr_billing`, and still shows when Pro has lapsed (past_due/unpaid) so the customer can fix the card or cancel. Without `qr_billing` (e.g. after an email restore) it redirects to `STRIPE_BILLING_PORTAL_LOGIN_URL` if set. Both cookies reject expired claims on the server, not only via browser `Max-Age`.
7. **Webhooks** verify `Stripe-Signature` with `STRIPE_WEBHOOK_SECRET`. Subscription updates are not stored locally — the next `/api/pro` read sees them. `charge.dispute.created` and `radar.early_fraud_warning.created` set Customer metadata `makeqr_pro_block`, which blocks the cookie and restore. `charge.refunded` is acknowledged and does not by itself remove Pro; cancel the subscription when a refund should end access.

The cookie is a pointer to a Stripe subscription, not a second billing system. A modified client can still hide the upgrade UI; server routes will not treat a forged cookie as paid.

## Stripe Dashboard steps

Do these before pointing production at this build. Do not delete or migrate the current $4.99 Price.

1. Open the existing Pro Product. Add a new recurring **$5 / month** Price. Leave the **$4.99** Price active so current subscriptions renew at $4.99.
2. Copy the new Price id into `STRIPE_PRO_PRICE_ID`. Set `NEXT_PUBLIC_PRO_PRICE_CENTS` to `500`.
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

On-site legal copy still names ARC Technologies LLC. This README does not change that.
