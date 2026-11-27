# Spur VTU mobile app

Expo (React Native) app for Spur VTU. Customers buy airtime, data, cable TV and electricity
from a wallet. It talks to the Spur VTU web app only through `/api/v1` (see `api-docs.md`).

## Get started

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env` and fill in the values.
3. Start the dev server: `npx expo start`

Run a development build (`npx expo run:android` or `npx expo run:ios`), not Expo Go.

## Connect to VTU

Set `EXPO_PUBLIC_API_URL` to the VTU backend origin (`http://localhost:3700` for local
development), and configure the Spurs OIDC issuer and mobile client ID. The client ID must be
registered in the backend's `SPURS_MOBILE_CLIENT_IDS`. The app uses the live `/api/v1` API and
requires sign-in; use a host reachable from your device or emulator when testing locally.

## Checks before a PR

```bash
npx tsc --noEmit
npx expo lint
npx expo-doctor
```

## Releasing

Builds run on EAS (`npx eas-cli@latest build --profile production`). Public variables live in
EAS environments, not in the repo. See `AGENTS.md` for architecture and rules.
