# Release notes

## v1.0.0 — Full Prototype — 20 October 2026

Full source prototype milestone following v0.01. Includes the React application, Firestore rules, media gateway source, browser verification harnesses, setup notes, change explanations and 27 FAQs.

### Improvements

- Restricted administrator identity/provider combinations and exact role portal access; unknown accounts return to the landing page.
- Saved canonical enrollment names/UIDs and private student-directory projections.
- Real-time peer discovery, saved/reused DMs, correct names, private recency, close/reopen and history preservation.
- Live follows and recipient-approved friend requests; persisted notification, mute and workspace controls.
- Membership-bound channels, expiring invitations, paged history, export and scoped deletion/moderation.
- Saved social profiles/posts/comments and contained, natural-proportion images in the rectangular artifact viewer.
- Truthful empty academic/payment states and cohort/session-bound attendance behavior.
- Authenticated server media signing, no client storage-signing fallback, and deactivation of the previously exposed key.
- Publication hardening: generated faculty starting passwords replace the fixed default in source; private verification captures and local operational history are excluded.

### Validation and boundaries

A fresh source build and Brave app regression run are recorded in [verification.md](docs/verification.md). Earlier checkpoint results include 286/0 app checks, 171/0 isolated Firestore checks and 75/0 local media checks; they are separate suites, not a total of unique production cases.

The hosted application/database remain at checkpoint 40. GitHub publication does not redeploy Firebase Hosting or the media service. The faculty default-password source improvement requires a future verified Hosting deployment.

Known open work includes grade-assignment backend authorization, account deletion lifecycle, historical migration, alternate-identity legacy chat membership, real payments, physical attendance testing, remaining sample modules, broad IAM/private media/capacity review and the latest live global-admin moderation UI.

This release is marked as a prototype pre-release on GitHub. It is not a declaration that every ERP anomaly has been fixed.
