# v1.0.0 verification scope

This public summary intentionally excludes raw browser captures, account details, provider console output, credential CSV files and local operational logs. Original evidence remains in the development workspace; it is not bundled with the public source.

## Earlier implementation evidence (checkpoint 40)

| Check | Recorded result | Scope |
| --- | --- | --- |
| Native Brave app regression suite | 286 passed, 0 failed | Actual modules/components, controlled fixtures. |
| Firestore suite through Brave | 171 passed, 0 failed | Actual allow/deny operations against an isolated demo emulator. |
| Local media suite | 75 passed, 0 failed | Local Worker/adapter fixtures; five checks cover the inactive Firebase wrapper. |
| App build | PASS, 5.96 seconds | Compilation, not a performance benchmark. |
| Firestore rules and Hosting | Released | Implementation checkpoint 40, not a new deployment for GitHub. |
| Bundle inspection | 88 JS files | Removed legacy signing arrays, browser signer and static vault master. |
| Credential replacement | Old rejected; replacement identity verified | Old key deactivated, not deleted. Secrets remain server-side. |
| Live hosted flows | Observed | Acknowledged upload/list, original avatar restored, saved conversation history and wrong-role route redirects. Owner later removed disposable test images. |

These suites overlap. Do not add their counts and describe them as unique live production scenarios. Full two-user delivery and earlier channel/comment checks were recorded during prior milestones. The latest global-admin moderation UI was not live-verified; isolated backend rules were tested.

## Source release verification — 20 October 2026

- Fresh native Brave application regression run: **286 passed, 0 failed**.
- Independent source snapshot: clean `npm ci --ignore-scripts` succeeded; owned production build **PASS in 7.46 seconds (Node 22)** without the development workspace environment file.
- Gateway clean dependency installation and production Worker dry-run bundling: **PASS on Node 22**; no deployment or secret access.
- Current workspace owned build: **PASS in 4.56 seconds**.
- Release source scan: Gitleaks found **no leaks** with default rules and redacted reporting. Pattern scans also checked known test passwords, provider tokens and private-key headers. This is automated evidence, not a guarantee against all secret encodings or every historical exposure.
- Relative documentation/source links resolve inside the release snapshot.
- The release uses the existing GitHub `Root` history as parent. Local historical commits containing obsolete signing payloads, Graphify caches, raw browser artifacts, recordings and the local handoff archive are excluded.

The source-only faculty change uses the existing temporary-password generator instead of a fixed initial password. Existing accounts and production data are unchanged. Builds retain a vendor chunk-size advisory; the installed Recharts 2.x dependency also reports deprecation. Neither warning prevented installation/build. Dependency upgrades and broader performance/security auditing were not performed for this publication.

## Unfinished validation and engineering

- Assignment-bound grade/audit backend policy and complete account deletion lifecycle.
- Historical credential/data caches, alternate provider UIDs and legacy channel memberships.
- Physical camera/classroom latency/location validation and real payment integration.
- Remaining sample modules, report review and the latest admin moderation UI.
- Comprehensive IAM/bucket least privilege, private-download, cryptography and capacity review.

Passing compilation/fixtures does not certify these areas. Public asset URLs remain observable; a media-reference tombstone does not erase the underlying file or exported copies.
