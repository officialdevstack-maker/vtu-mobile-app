This is an Expo/React Native mobile application. Prioritize mobile-first patterns, performance, and cross-platform compatibility.

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

## Commands

Use `bunx` instead of `npx` if the project uses bun (`bun.lock` present).

```bash
npx expo install <package>  # ALWAYS use instead of npm/yarn/pnpm/bun add — resolves SDK-compatible versions
npx expo start              # start the dev server
npx expo lint               # lint
npx tsc --noEmit            # typecheck
npx expo-doctor             # diagnose dependency and config issues
npx expo install --fix      # fix incompatible package versions
```

Run lint and typecheck before declaring any task done.

## Navigation & Routing

- Use **Expo Router** for all navigation. Routes live in `src/app/` — every file there is a screen, `_layout.tsx` files define navigators. Keep non-route code (components, hooks, utils) outside `src/app/`.
- Import `Link`, `router`, and `useLocalSearchParams` from `expo-router`.
- Docs: https://docs.expo.dev/router/introduction.md

## Building with EAS

Use EAS to build, sign, and submit the app in the cloud (`eas build`, `eas submit`) and to ship over-the-air updates (`eas update`) — no local Xcode or Android Studio required. Run EAS CLI as `bunx eas-cli <command>` in Bun projects, or `npx eas-cli@latest <command>` otherwise; substitute that for bare `eas` in docs examples.
Docs: https://docs.expo.dev/eas/index.md

## Rules

- If `ios/` and `android/` directories do not exist, they are generated (Continuous Native Generation). Never create or edit them by hand — configure native behavior in `app.json` and config plugins.
- Expo Go only includes its bundled native modules. After adding a library with native code, the app needs a development build: `npx expo run:ios|android` locally, or `eas build --profile development`.
- Prefer recommended Expo modules over third-party libraries, and check your available skills before adding dependencies. Docs: https://docs.expo.dev/versions/latest/index.md


Here is `AGENTS.md` for the Expo repo. It covers the API as the Next.js app serves it today, so an agent working on the app won't invent endpoints or flows that don't exist.

````md
<!-- AGENTS.md  (repo root of the Expo app) -->

# Spur VTU mobile app: agent guide

Expo (React Native) app for Spur VTU. Customers buy airtime, data, cable TV and electricity from a wallet. The backend is the Spur VTU Next.js app, reached only through `/api/v1`. This app never talks to the database, Flutterwave or any provider directly.

Read this file before writing code. If something here conflicts with what you see in the repo, say so instead of guessing.

## Rules

1. **Always give complete code.** No "rest unchanged" placeholders.
2. **Start every code block with a comment containing its file path**, so the owner knows where to paste it. Use `// path` in TS/TSX, `# path` in env/shell, `<!-- path -->` in Markdown.
3. **Stay consistent with the existing code.** Match the patterns below before introducing anything new. Don't add a dependency when the pattern already covers the need.
4. **Never invent an endpoint.** Only use the ones under "API contract". If a feature needs something missing, list it under "Not available yet" and tell the owner the web app needs a new route first.
5. **The server is the source of truth for money.** Prices, discounts and balances shown in the app are display values. Never compute what a customer is charged.
6. **Never log or persist** the transaction PIN, tokens, or full phone/meter numbers.

## Stack and layout

- Expo SDK (current), TypeScript `strict`, `expo-router` (file-based routes).
- Tokens: `expo-secure-store`. Sign-in: `expo-auth-session` (PKCE). IDs: `expo-crypto`.
- Server state: TanStack Query. Local UI state: React state. No Redux.

```
app/                  routes (expo-router)
  (auth)/login.tsx
  (tabs)/index.tsx    home: wallet, quick services, recent orders
  (tabs)/history.tsx
  buy/airtime.tsx | data.tsx | cable.tsx | electricity.tsx
  order/[reference].tsx
src/api/
  client.ts           the only place that calls fetch
  types.ts            response types, mirrors the contract below
  endpoints.ts        one function per endpoint
  errors.ts           ApiError and helpers
src/auth/             session, token storage, refresh
src/components/       shared UI
src/lib/format.ts     formatNaira, phone grouping
src/theme.ts          colors and fonts
```

## Brand (match the web app)

| Token | Value | Use |
|---|---|---|
| petrol | `#12343B` | ink, headers, dark surfaces |
| mist | `#EEF3F4` | screen background |
| paper | `#F7F8F3` | receipts, cards |
| marigold | `#F2B632` | primary buttons, accents |
| green | `#1E8E4F` | success |
| coral | `#C8432B` | errors only |

Fonts: Familjen Grotesk (500, 700) for headings, Figtree for body. Money uses tabular numerals. Support light and dark. Primary buttons are marigold with petrol text, 48 to 52 px tall, radius 12.

## Environment

```bash
# .env  (Expo public variables are bundled into the app. Never put secrets here.)
EXPO_PUBLIC_API_URL=https://yourdomain.com
EXPO_PUBLIC_SPURS_ISSUER=https://node-accounts-backend.onrender.com/api/oidc
EXPO_PUBLIC_SPURS_CLIENT_ID=
```

`EXPO_PUBLIC_SPURS_CLIENT_ID` must also be listed in the web app's `SPURS_MOBILE_CLIENT_IDS`, otherwise every call returns 401.

## Auth

- Sign in with Spurs using `expo-auth-session` (authorization code + PKCE) against `EXPO_PUBLIC_SPURS_ISSUER`.
- Store the access and refresh tokens in `expo-secure-store` only.
- Send `Authorization: Bearer <access token>` on every request, from `src/api/client.ts` only.
- On `401`, refresh once and retry the request once. If that fails, clear the session and go to login.
- On `403 account_suspended`, show a suspended screen. Don't retry.
- Mobile users are subject to the transaction PIN. API keys (resellers) are a different credential and must never be used in this app.

## API contract

Base: `${EXPO_PUBLIC_API_URL}/api/v1`. All responses are JSON.

```ts
// src/api/types.ts

export type ApiSuccess<T> = { ok: true; data: T };
export type ApiFailure = { ok: false; error: { code: string; message: string } };
export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;
```

Error `message` is written for customers and can be shown as is. Branch on `code`, never on the message text.

| HTTP | `code` | Meaning and what to do |
|---|---|---|
| 400 | `invalid_request` | Bad input. Fix the form. |
| 401 | `unauthorized` | Refresh token once, else sign out. |
| 403 | `account_suspended` | Show suspended screen. |
| 403 | `pin_required` | Wrong, locked or missing PIN. Show the message. If it says to set up a PIN, see "Not available yet". |
| 404 | `not_found` | Unknown order reference. |
| 422 | `purchase_failed` | Order refused. Show the message. Money was not kept. |
| 429 | `rate_limited` | 60 requests per minute. Wait for `Retry-After` seconds. |
| 503 | `unavailable` | Lookup or balance can't be read now. Offer retry. |
| 500 | `server_error` | Retry reads. For purchases, see "Purchases". |

### Read endpoints

| Method and path | Success `data` |
|---|---|
| `GET /balance` | `{ balance: number, currency: "NGN" }` |
| `GET /catalog/airtime` | `{ networks: [{ id, name, types: [{ id, label, ranges: [{ min, max, discount }] }] }] }` |
| `GET /catalog/data` | `{ networks: [{ id, name, types: [{ id, label }], plans: [{ id, typeId, size, validity, price }] }] }` |
| `GET /catalog/cable` | `{ operators: [{ id, name, plans: [{ id, name, validity, price }] }] }` |
| `GET /catalog/electricity` | `{ discos: [{ id, name, min, max, discount }] }` |
| `POST /verify/smartcard` body `{ operatorId, smartcard }` | `{ valid: true, name } or { valid: false }` |
| `POST /verify/meter` body `{ discoId, meterType, meter }` | `{ valid: true, name, address } or { valid: false }` |
| `GET /notifications?limit=50` | `{ items: [{ id, title, body, read, at }] }` |
| `GET /transactions?q=&status=&service=&page=` | `{ page, pageSize, total, items: [{ reference, service, title, amount, direction, status, at, detail?, failureReason?, refunded?, cashbackUsed? }] }` |
| `GET /transactions/:reference` | `{ reference, status, title, failureReason }` |
| `POST /notifications/read` | `{ read: true }` |
| `POST /transactions/:reference/receipt` | `{ page, image }` for a successful debit purchase |
| `POST /support` body `{ subject, body, transactionId? }` | `{ id }` |

Notes:
- Amounts are plain numbers in naira. Catalog prices are already priced for the customer's package.
- `discount` is a percent. Airtime display price is `amount * (1 - discount / 100)` rounded to 2 decimals. The server decides the real charge.
- `status` is `"pending" | "success" | "failed"`. `service` is `"airtime" | "data" | "cable" | "electricity" | "wallet"`. `direction` is `"debit" | "credit"`.
- Transaction history includes wallet funding rows (`service: "wallet"`). Call `/transactions/:reference` only for UUIDs and documented `flw-` funding references.
- Shared receipt URLs are public. Only offer receipt sharing for successful debit purchases.
- Notification history is limited to 50 items in the app; the unread filter is local and `POST /notifications/read` marks all loaded notifications read.
- `status` and `service` filters accept the values above or `"all"`. Pages are 20 items.
- Smartcard checks can return `503 unavailable`. Treat that as "can't verify right now" and let the customer continue, since the server re-checks at purchase time.

### Purchases

All are `POST`. Success returns `{ reference, status: "success" | "pending", message }`.

| Path | Body |
|---|---|
| `/purchase/airtime` | `{ networkId, typeId, amount, phone, reference, pin, useCashback?, promoCode? }` |
| `/purchase/data` | `{ planId, phone, reference, pin, useCashback?, promoCode? }` |
| `/purchase/cable` | `{ planId, smartcard, phone, reference, pin, useCashback?, promoCode? }` |
| `/purchase/electricity` | `{ discoId, meterType, meter, amount, phone, reference, pin, useCashback?, promoCode? }` |

Input rules (validate in the app, the server re-validates):
- `phone`: Nigerian, 11 digits like `08031234567`. Strip spaces and convert `+234` / `234` to a leading `0`.
- `amount`: whole naira, 1 to 1,000,000. Airtime must fall inside a range from the catalog.
- `smartcard`: 10 or 11 digits. `meter`: 10 to 13 digits. `meterType`: `"prepaid"` or `"postpaid"`.
- `pin`: exactly 4 digits.

Purchase behaviour you must implement:
1. **One `reference` per purchase attempt.** Generate a UUID with `expo-crypto` when the confirm screen opens, and keep it until the order reaches a final state or the customer backs out.
2. **Never create a new reference to retry.** On a network error, timeout or `500`, retry with the **same** reference or look the order up with `GET /transactions/:reference`. The server returns the original result for a repeated reference and never charges twice.
3. **Disable the confirm button while a request is in flight** to avoid double taps.
4. **`pending` is not a failure.** The customer's money is held. Show "Being confirmed", then poll `GET /transactions/:reference` every 5 seconds for up to 2 minutes. After that, stop polling and point to history. The status updates on its own later.
5. On `failed`, show the failure reason. The server refunds automatically.
6. Never ask for the PIN more than once per purchase, and clear it from state as soon as the request is sent.

## Not available yet (do not build against these)

These flows are not currently available in the app. Verify the API contract before implementing them:
- Setting, changing or resetting the transaction PIN. A customer with no PIN gets `pin_required` with a "set up your PIN" message. Until a PIN route exists, show a message that sends them to the website.
- Funding the wallet (Flutterwave virtual accounts).
- Profile, packages and upgrades, cashback balance and history, referrals.
- Expo push token registration: `/devices` is documented, but compatibility with Expo token formats needs confirmation.

If asked to build one of these, verify the documented route and required response first; if a route is missing, write down what the web app needs.

## Conventions

- `src/api/client.ts` is the only place that calls `fetch`. It adds the base URL and token, parses the envelope, and throws `ApiError { status, code, message }` on `ok: false` or a non-JSON response. Use a 15 second timeout.
- One function per endpoint in `src/api/endpoints.ts`, typed with the types above. Screens call these through TanStack Query hooks, never `fetch`.
- Query keys: `["balance"]`, `["catalog", service]`, `["transactions", filters]`, `["order", reference]`. After a successful purchase, invalidate `["balance"]` and `["transactions"]`.
- Format money with `formatNaira` in `src/lib/format.ts` (`en-NG`, NGN, 2 decimals). Dates use the `Africa/Lagos` time zone, matching the web app.
- Every screen needs loading, empty and error states. Errors show the API message and a retry button.
- Accessibility: every touchable has an `accessibilityLabel`, minimum 44 px touch target, no information conveyed by color alone.
- Respect reduced motion. No animation that blocks a purchase flow.
- Keep components small and typed. No `any`. No default exports except route files.

## Before you finish a task

- It type-checks (`npx tsc --noEmit`) and lints.
- No secret, token, PIN or full phone number appears in code, logs or error reports.
- Any new API call exists in the contract above. If not, you've listed what the web app needs instead.
````

Notes:
- The sign-in section assumes a standard OIDC code + PKCE flow. I haven't seen how node-accounts handles mobile redirect URIs, so check that part against its docs.
- The "Not available yet" list is what keeps the agent honest. Delete a line when you add the matching route. The PIN routes are the most urgent, because a mobile user with no PIN can't buy anything.
- Also add a short "Mobile API" section to the web repo's `AGENTS.md`, so changes to `/api/v1` get checked against this contract. I can write that next if you want it.