# KRC Campus ERP — v1.0.0 Full Prototype

An MIT-licensed campus ERP prototype with separate administrator, faculty and student portals, real-time student messaging, social profiles and an authenticated media gateway.

[Live prototype](https://erp-system-mit.web.app) · [Changes and 27 FAQs](documentation.md) · [Developer handoff](handoff.md) · [Release notes](CHANGELOG.md) · [Verification and limitations](docs/verification.md)

## Included

- Exact administrator identities, enrollment-aware sign-in and strict portal routing backed by Firestore rules.
- Student/faculty enrollment with saved full names and acknowledged database writes.
- Live eligible-student search, persistent direct messages, private recency, close/reopen, follow and friend requests.
- Channels with membership, invitations, history, private preferences and scoped message moderation.
- Profiles, posts, comments and a responsive rectangular artifact viewer.
- Account-scoped academic records, scheduling and challenge-bound attendance flows.
- Firebase Auth/Firestore/Hosting with a Node-compatible Cloudflare Workers media gateway. Storage signing credentials stay on the server.

## Run locally

Use Node.js 22 or newer and npm.

```sh
npm ci
npm run dev
```

Open the URL printed by Vite. `npm run build` creates `dist/`; `npm run preview` previews that build. This repository contains no enrolled account passwords or server signing credentials.

The prototype currently contains public configuration for its original Firebase project and media endpoint. An empty database or an unaffiliated account does not create campus enrollment. For an independent installation, change the public Firebase project configuration in `src/services/securityVault.js`, both administrator identities in the shared policy/rules/server configuration, `firebase.json` hosting site and the media configuration. The current Firebase resolver uses its bundled public project configuration; the template Firebase environment values alone do not switch projects. Set `VITE_MEDIA_API_URL` to your own HTTPS gateway and configure its allowed origins and server-only secrets as described in [the media runbook](server/media/README.md). Never use `VITE_` variables for private credentials.

## Browser checks

Run functional checks in Brave. The app harness is `/browser-regressions.html`; database checks are `/browser-rules-checks.html` and require an isolated Firestore emulator on `127.0.0.1:8088` using project `demo-erp-auth-rules`. Never point fixture tests at a real campus database. Media fixture setup is in [server/media/README.md](server/media/README.md). Harnesses are development pages and are not included in the application Hosting build.

[Verification scope](docs/verification.md) distinguishes earlier browser/live checks from the fresh source-release build. These checks do not certify every ERP screen or deployment.

## Prototype limits

This is the **full prototype milestone**, with further engineering required before unrestricted institutional use. Assignment-bound grade authorization, account deletion lifecycle, historical data/cache migration, physical camera/location validation, payment integration and a broader IAM/private-download/capacity review remain open. Some ancillary modules still contain sample content. Public media URLs are observable. Read the handoff before continuing development.

Firebase remains on Spark; the current gateway uses Workers Free. This repository does not enable billing, deploy cloud resources or change existing accounts automatically.

## License

[MIT](LICENSE), Copyright (c) 2026 Chinmay Chaudhari.
