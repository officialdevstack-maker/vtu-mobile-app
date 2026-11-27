# Spur VTU mobile app

Expo (React Native) app for Spur VTU. Customers buy airtime, data, cable TV and electricity
from a wallet. It talks to the Spur VTU web app only through `/api/v1` (see `api-docs.md`).

## Get started

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env` and fill in the values.
3. Start the dev server: `npx expo start`

Run a development build (`npx expo run:android` or `npx expo run:ios`), not Expo Go.

## Demo mode

Development builds use sample data and skip sign-in by default. Demo mode blocks live API
requests and purchases. Set `EXPO_PUBLIC_USE_MOCK_DATA=false` and restart Expo to test the
real OAuth flow, onboarding and live API.

## Checks before a PR

```bash
npx tsc --noEmit
npx expo lint
npx expo-doctor
```

## Releasing

Builds run on EAS (`npx eas-cli@latest build --profile production`). Public variables live in
EAS environments, not in the repo. See `AGENTS.md` for architecture and rules.
