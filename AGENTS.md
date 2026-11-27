# Spur VTU mobile app: agent guide

Expo (React Native) app for Spur VTU. Customers buy airtime, data, cable TV and electricity from a wallet. The backend is the Spur VTU Next.js app, reached only through `/api/v1`. This app never talks to the database, Flutterwave or any provider directly.

Read this file before writing code. If something here conflicts with what you see in the repo, say so instead of guessing.

## Expo has changed: do not trust your training data

Expo ships breaking changes every SDK release. Before writing code that touches an Expo, EAS or React Native API:

1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt and follow its links. Never answer from memory.

## Commands

```bash
npx expo install <package>  # ALWAYS use instead of npm add, resolves SDK-compatible versions
npx expo start
npx expo lint
npx tsc --noEmit
npx expo-doctor
```

Run lint and typecheck before declaring any task done. Use `bunx` instead of `npx` if `bun.lock` exists.

## Rules

1. **Always give complete code.** No "rest unchanged" placeholders for new or rewritten files. Edits to large existing screens may use exact find-and-replace blocks.
2. **Start every code block with a comment containing its file path.**
3. **Stay consistent with the existing code.** Match the patterns below before introducing anything new. Don't add a dependency when a pattern already covers the need.
4. **Never invent an endpoint.** Use only endpoints documented in `api-docs.md`. If a feature needs something missing, list it under "Not built yet" and tell the owner the web app needs a new route first.
5. **The server is the source of truth for money.** Prices, discounts and balances in the app are display values. Never compute what a customer is charged.
6. **Never log or persist** the transaction PIN, tokens, BVN, or full phone/meter numbers.
7. `ios/` and `android/` are generated (Continuous Native Generation). Never create or edit them by hand. Configure native behavior in `app.json` and config plugins.
8. Expo Go only has its bundled native modules. After adding a library with native code, rebuild the dev client.

## Stack and layout

Expo SDK, TypeScript `strict`, `expo-router`, TanStack Query for server state, React state for UI state. Tokens in `expo-secure-store`. Sign-in with `expo-auth-session` (PKCE). IDs from `expo-crypto`. No Redux. System fonts only.

```
src/app/                routes only (expo-router)
  _layout.tsx           providers, AppGate, auth/onboarding guards
  onboarding.tsx        first-run slides (signed-out only)
  (auth)/login.tsx
  (tabs)/               index, services, rewards, history, me
  buy/                  airtime, data, cable, electricity
  order/[reference].tsx fund, pin, packages, cashback, referrals, notifications, help
src/api/                client (the only fetch), endpoints, types, errors, account, receipts, query-client
src/auth/               session, secure token storage
src/onboarding/         "seen" flag store
src/purchases/          pending-store (unfinished purchase references), reconcile
src/hooks/              use-purchase-flow, use-app-gate, use-pending-reconciler, use-network-status, use-slow-loading
src/components/         shared UI (state-view, states, app-gate, network-banner, splash-overlay, ...)
src/lib/                format, version, group-by-day, find-transaction, service-icons
src/theme.ts            colors, radius, font sizes, useColors()
src/constants/theme.ts  Spacing, BottomTabInset, MaxContentWidth
```

Keep non-route code outside `src/app/`.

## Brand

| Token | Value | Use |
|---|---|---|
| petrol | `#12343B` | ink, headers, dark surfaces |
| mist | `#EEF3F4` | screen background |
| paper | `#F7F8F3` | receipts, cards |
| marigold | `#F2B632` | primary buttons, accents |
| green | `#1E8E4F` | success |
| coral | `#C8432B` | errors only |

Always read colors through `useColors()` from `@/theme`. Money uses tabular numerals. Support light and dark. Primary buttons are marigold with petrol text, at least 44 px tall, radius 12.

## Environment

```bash
EXPO_PUBLIC_API_URL=
EXPO_PUBLIC_SPURS_ISSUER=
EXPO_PUBLIC_SPURS_CLIENT_ID=
EXPO_PUBLIC_SPURS_REDIRECT_URI=vtuapp://redirect
EXPO_PUBLIC_IOS_STORE_URL=
EXPO_PUBLIC_ANDROID_STORE_URL=
```

Expo public variables are bundled into the app. Never put secrets here. Release values live in EAS environments. `EXPO_PUBLIC_SPURS_CLIENT_ID` must also be listed in the web app's `SPURS_MOBILE_CLIENT_IDS`, otherwise every call returns 401.

## Auth

- Authorization code + PKCE against `EXPO_PUBLIC_SPURS_ISSUER`. Tokens only in `expo-secure-store`.
- `Authorization: Bearer <access token>` is added in `src/api/client.ts` only.
- On `401`, refresh once and retry once. If that fails, clear the session. `Stack.Protected` then moves the user to onboarding or login.
- On `403 account_suspended`, show the suspended state. Don't retry.
- Mobile users are subject to the transaction PIN. API keys are for resellers and must never be used in this app.

## API contract

`api-docs.md` is the source of truth for endpoints, bodies and responses. Responses use `{ ok, data }` or `{ ok: false, error: { code, message } }`. Branch on `code`, never on message text. Error messages are written for customers and can be shown as is.

| HTTP | `code` | What to do |
|---|---|---|
| 400 | `invalid_request` | Fix the form. |
| 401 | `unauthorized` | Refresh once, else sign out. |
| 403 | `account_suspended` | Suspended state. |
| 403 | `pin_required` / `pin_invalid` | Show the message. No PIN set: send to the PIN screen. |
| 404 | `not_found` | Unknown order reference. |
| 422 | `purchase_failed` | Order refused. Money was not kept. |
| 429 | `rate_limited` | Wait `Retry-After` seconds. 60 requests per minute. |
| 503 | `unavailable` | Offer retry. Smartcard checks may continue without verification. |
| 500 | `server_error` | Retry reads. For purchases see below. |

Notes: amounts are plain naira numbers; `discount` is a percent and the server decides the real charge; pages are 20 items; call `/transactions/:reference` only for UUIDs and `flw-` funding references. Shared receipt URLs are public, so offer sharing only for successful debit purchases.

## Purchases

Bodies and validation are in `api-docs.md`. Behavior you must keep:

1. **One `reference` per purchase attempt.** `usePurchaseFlow.begin()` generates a UUID when the confirm screen opens. Keep it until the order reaches a final state or the customer backs out.
2. **Never create a new reference to retry.** After a network error, timeout or `500`, look the order up with `GET /transactions/:reference`, or retry with the same reference.
3. **Persist unfinished references.** `pay()` stores the reference in `src/purchases/pending-store` before sending (reference and time only, no PII). It is removed on success, failure, a definite 4xx refusal, or when `usePendingReconciler` finds a final status or an old `not_found`. Do not bypass this.
4. **`pending` is not a failure.** Money is held. Show "Being confirmed", poll every 5 seconds for up to 2 minutes, then point to History.
5. On `failed`, show the reason. The server refunds automatically.
6. Ask for the PIN once per purchase and clear it from state as soon as the request is sent.
7. **Ported-number override.** The mobile UI only offers "Buy anyway" when the API returns `network_mismatch`. The current web API wraps it as `purchase_failed`, so the override remains unavailable until the web contract is updated. When enabled, it starts a new purchase with a new reference and `skipNetworkCheck: true`, and asks for the PIN again.
8. Disable the pay button while a request is in flight.

## Startup, gate and state screens

- `AppGate` (in `_layout.tsx`) reads `GET /config`. During maintenance it replaces the app with a maintenance screen and rechecks every 30 seconds. If the app version is below `minimumVersion` it shows a forced-update screen. If config can't be read, the gate fails open.
- `NetworkBanner` shows offline and slow-connection status app-wide.
- Every screen that loads data must show: `LoadingState` (pass `slow` from `useSlowLoading`), `ErrorState` (pass the error, it routes network, timeout, suspension and rate-limit cases), `EmptyState` or `NoSearchResultsState`, and `SuccessState` for completions. All live in `@/components/states`.

## Not built yet (do not build against these without checking `api-docs.md`)

- Profile and settings: `PATCH /me` (phone, notification toggles, theme, `confirmPurchases`, `useCashbackDefault`)
- Push notifications: `POST /devices` (confirm Expo token compatibility with the web app first)
- Remove PIN: `POST /pin/remove`
- Support tickets: list, view, reply, close (create exists)
- `GET /transactions/:reference/receipt`
- A distinct `network_mismatch` error code for ported-number mismatches. The web API currently returns generic `purchase_failed`; add and document the distinct code before enabling the mobile override.

## Conventions

- `src/api/client.ts` is the only place that calls `fetch`. It adds the base URL and token, parses the envelope and throws `ApiError`. 15 second timeout.
- One function per endpoint in `src/api/endpoints.ts` (or `account.ts`), typed. Screens call them through TanStack Query, never `fetch`.
- Query keys: `["balance"]`, `["me"]`, `["config"]`, `["catalog", service]`, `["transactions", filters]`, `["order", reference]`. After a purchase, invalidate `["balance"]`, `["transactions"]` and `["me"]`.
- Money goes through `formatNaira`. Dates use the `Africa/Lagos` time zone.
- Accessibility: every touchable has an `accessibilityLabel`, at least a 44 px touch target, no information conveyed by color alone. Respect reduced motion.
- Keep components small and typed. No `any`. No default exports except route files and `app-tabs`.

## Before you finish a task

- It type-checks and lints.
- No secret, token, PIN, BVN or full phone number appears in code, logs or error reports.
- Any new API call exists in `api-docs.md`. If not, list what the web app needs instead.
