# Partner Payment Integration — Stripe (Visa) + CinetPay (DRC Mobile Money)

Wires real payment processing into the existing Partner → `CandidatureProjet` project-funding
flow. Today `finances.payment_initiate`/`payment_confirm` only create/flip a `Transaction` row
manually — no gateway is ever called (confirmed: no `stripe` package in `requirements.txt`, no
`STRIPE_*`/`CINETPAY_*` env vars, `PaymentProvider.config` unused). The phase1 design doc
explicitly deferred this "once the user supplies provider credentials" — this is that phase.
Requirements gathered via conversation on 2026-07-18.

## Scope

1. **New Django app `payments`** (alongside `children`, `communications`, `projets`, etc. —
   matches the codebase's one-app-per-domain convention rather than growing `finances` with an
   unrelated external-API/webhook concern).
   - `gateways/stripe_gateway.py`: thin wrapper — create a Checkout Session for a given amount
     (USD) + metadata (candidature id), verify webhook signature, parse `checkout.session.completed`.
   - `gateways/cinetpay_gateway.py`: thin wrapper — initiate a CinetPay payment (USD, mobile
     money method scoped to DRC: Orange Money, Airtel Money only — drop mpesa/mtn_money from the
     selectable list for this flow even though they remain in the `PaymentProvider` enum),
     verify webhook/notification signature, parse the notification payload.
   - `views.py`: `POST /api/payments/candidatures/<id>/checkout/` — body `{method: "visa"|"mobile_money", amount, operator?}`;
     creates a `finances.Transaction` (`status="pending"`, generic FK to the `CandidatureProjet`,
     `payment_method`, `payment_provider`) and returns a client secret / payment link depending on
     method. `POST /api/payments/webhooks/stripe/` and `POST /api/payments/webhooks/cinetpay/` —
     signature-verified, idempotent, flip the `Transaction` to `completed`/`failed`, and on
     success increment `projets.Project.montant_collecte` by the paid amount.
   - Amount validation server-side: reject if `amount < candidature.montant_propose`.
   - Real credentials: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `CINETPAY_API_KEY`,
     `CINETPAY_SITE_ID`, `CINETPAY_SECRET_KEY` — added to `.env.example` as empty placeholders;
     user supplies real values later, no code changes needed at that point. Until real keys are
     present, gateway calls should fail loudly (not silently fake success) so this is never
     mistaken for working in production.

2. **Frontend (web only)** — the Partner's Réponses/response-board view already renders accepted
   candidatures (`partnerResponseBoard` in `App.jsx`). Add a "Payer" action that opens a payment
   step reusing the app's *existing* modal, button, form-input, and icon conventions (existing
   `CIcon`/`ES_ICON_PATHS` icon system, existing `apiFetch` helper, existing toast/feedback
   pattern if one exists from phase5) — no new visual system, no new component library. Amount
   field defaults to `montant_propose`, enforces a minimum (can increase, not decrease). Two
   payment method options (Visa via Stripe, Mobile Money via CinetPay — Orange/Airtel only). On
   failure, stay on the same step, show the real error, allow immediate retry. On success, reflect
   the new funded total wherever the candidature/project is displayed.

3. **Federation + Supermaster transaction/failure visibility** — extend the existing
   `PaymentManagementPage.jsx` "Transactions" tab (currently supermaster-only) so `role==='federation'`
   also has access, and surface the failure reason (`Transaction.metadata`/provider error) inline
   or in a detail view. Orphanage director gets no access to this view.

4. **No mock data anywhere** — every screen reads/writes real backend state through real
   endpoints. Gateway credentials are the only placeholders (env vars), and are treated as
   "not configured yet" (explicit error), never faked.

## Explicitly out of scope (separate features/specs)

- Fund Dispatch & Follow-up ("Suivi") — separate spec, builds on top of this once payments work.
- 4-language / i18n support — separate spec.
- Mobile/desktop clients (web only for now).
- Recurring/subscription billing — every payment here is a one-time charge against a candidature.
- Currency conversion (USD only).
- Automatic project-closing logic on `date_fin` — belongs to the Fund Dispatch spec.
