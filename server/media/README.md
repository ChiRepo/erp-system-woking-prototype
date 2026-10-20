## Current rollout — checkpoint 40, 19 October 2026

Production API: `https://krc-erp-media-gateway.jyotsnachaudhari999.workers.dev/api/media`. User-owned Workers Free account verified in native Brave; Firebase Auth/Firestore/Hosting remain Spark. Current Worker deployment is `adc05837-7b38-4c87-a196-c9c51693b99c` (replacement secret change). App40/rules40 are published.

Reusable storage signing payloads, browser SDK signing fallback and static vault master key were removed. Both old credential document collections deny browser roles. The owner created a replacement for the same existing IAM user and provided its CSV explicitly; it was processed locally into Worker secret stdin without content output or a repo copy. Owner deactivated the old key. Independent provider probes: old403InvalidClientTokenId; replacement200 with the expected IAM identity. Native console confirms oldInactive/newActive. This is deactivation, not permanent deletion; IAM/bucket policy was not broadened or audited as part of key rotation.

Native published app checks: real identity, acknowledged tiny image upload, fresh own-photo listing with old key inactive, original avatar restored, existing Rajas hello/history preserved, and student URL modification to admin/faculty redirects to own dashboard. Owner confirmed manually removing both tiny verification images; their later absence was expected cleanup, not a retention bug. No production photo or message was deleted by the agent. Temporary local origin access and the one-time owner-entry server/source/tab were removed.

Verification: native app286/0; isolated actual database171/0; local Worker75/0; owned app buildPASS5.96s; current bundle88JSfiles contains no old signing arrays, static vault master or storage signer. Graphify2860nodes/4946edges/205communities, same3prior extraction warnings. Full ERP audit remains broader than this media checkpoint.

Cloudflare19skills installed; limited MCP OAuth succeeded with Background Access, User Read, Account Read, Workers Scripts Read and Workers Scripts Write. Optional cf CLI skipped because this project uses Wrangler. Tools load with the updated agent configuration.

# Authenticated media gateway — free Cloudflare Workers target

The published ERP uses the authenticated Worker gateway. The user declined Blaze. Firebase stays on Spark; no billing or bucket policy changes were made. The Firebase Functions adapter remains inactive source and its codebase is absent from firebase.json.

## Cloudflare Workers Free deployment

`worker.js` reuses the tested Node HTTP handler through Cloudflare's supported HTTP bridge. No frontend framework migration, database migration or Firebase upgrade is required. `wrangler.jsonc` declares only public configuration variables and the Worker; there are no paid R2, D1, KV, Durable Object, Container or service bindings. Keep the account on Workers Free; current limits include 100,000 requests/day and10ms CPU per request, excluding network waiting. Actual production CPU/quota behavior remains to be measured; local passing tests do not guarantee unlimited capacity or a zero bill on an already-paid account.

The encrypted `MEDIA_STORAGE_CREDENTIALS` Worker secret uses the same JSON fields as the prepared server function. Never put its real value in wrangler.jsonc, .dev.vars, source, artifacts or a public browser setting. Runtime creates an explicit-credential storage client with the Workers-compatible Fetch HTTP transport. Wrangler aliases the SDK XML builder to its pure-JS server parser because Workers does not provide browser DOMParser.

Wrangler is authenticated to the verified user-owned Free account using minimal publishing scopes. Server credentials are configured through Worker secret bindings. Future publishing must keep that stable ownership and Free plan; do not use anonymous preview ownership for production credentials.

Local verification: start `npm run fixtures` on8787 and `npm run worker:fixtures` on8789; open the Vite page `/browser-media-api-checks.html?worker=1` in Brave. The separate Worker fixture entry uses a demo issuer/public key and SDK-signed requests against disposable local RAM objects. It cannot use production credentials. Final75/0 native browser checks passed after fixing the XML parser; initial71/4 listing failures are retained as before evidence. `npm run worker:check` performs a local deployment bundle check; `npm run worker:deploy` is for the authenticated, verified Free account only.

Future deployment sequence: confirm account plan/ownership, configure server secret, publish Worker, verify real Firebase identity and allowed upload/list, configure the client HTTPS endpoint, rebuild/inspect/publish and recheck. During future rotations, verify the replacement before disabling the previous key. Existing public media URLs/history remain valid. The deployed client defaults to the current verified Worker; VITE_MEDIA_API_URL is an optional override.

Primary references: [Free limits](https://developers.cloudflare.com/workers/platform/limits/), [HTTP bridge](https://developers.cloudflare.com/workers/runtime-apis/nodejs/http/), [Worker secrets](https://developers.cloudflare.com/workers/configuration/secrets/).

## Inactive Firebase Functions alternative (do not deploy without a new user request)

`firebase.js` exports the Node 22 second-generation HTTPS function `mediaGateway` in `asia-south1`. The root Firebase configuration does not activate this codebase. It must remain inactive unless the user explicitly requests that alternative and completes its prerequisites. Firestore remains the enrollment/membership database; reusable object-store credentials must never be stored in its client-readable documents.

The function reads `MEDIA_STORAGE_CREDENTIALS` from Secret Manager at runtime, bound only to this function. Its JSON object uses `accessKeyId`, `secretAccessKey` and optional `sessionToken`; no real values belong in source, ordinary env files, browser settings, fixtures or documentation. `MEDIA_BUCKET` and `MEDIA_REGION` are non-secret deployment parameters.

Function settings: zero minimum instances, one maximum instance, eight concurrent requests, 256 MiB memory and 30-second timeout. These control scaling; they are not a guaranteed billing cap. Request/byte limits are per warm instance and can reset on restart.

Deployment sequence:

1. The owner enables Blaze in Firebase Console and completes billing/payment terms personally. The 18 October read-only Cloud Billing check returned `billingEnabled:false`.
2. Configure a restricted object-store identity and store its secret JSON through Firebase Secret Manager. Bind only the object operations required by this gateway, without IAM or bucket-administration permissions. Rotate/revoke previously browser-exposed keys during reviewed cutover.
3. Deploy the `media` codebase and verify the actual authenticated endpoint. The client base is `https://asia-south1-erp-system-mit.cloudfunctions.net/mediaGateway/api/media`.
4. Verify bucket POST CORS for both official ERP origins and perform an allowed real upload/list smoke check.
5. Remove legacy browser credential payloads and database fallbacks, set `VITE_MEDIA_API_URL` to the verified function base, rebuild/inspect output, publish Hosting and confirm real uploads/history. Tighten legacy client-readable credential documents. Keep the published uploader unchanged until this sequence is ready.

The common handler supports Firebase's consumed `rawBody` with the same 4096-byte JSON bound and ordinary Node streaming. Native browser fixtures exercise the actual Firebase HTTPS SDK wrapper with demo identities/RAM storage; they do not deploy a function or prove cloud storage access.

## Server configuration

Run Node 22 or newer. Install with `npm ci --omit=dev --ignore-scripts` in this folder. Provide `FIREBASE_PROJECT_ID`, `MEDIA_BUCKET`, `MEDIA_REGION` and exact `MEDIA_ALLOWED_ORIGINS` using the server environment. Supply storage credentials through a server secret store or an instance role, never through `VITE_` variables. The example contains no credential values. Run `npm start` behind HTTPS; standalone binding defaults to loopback. The Dockerfile is available for an existing trusted container host.

The server validates RS256 Firebase ID tokens against Google's public signing keys, exact project issuer/audience and token times. Each request then reads enrollment or conversation/channel membership through Firestore REST using the caller's token, so existing database rules remain effective. No Firebase service-account key is needed for this caller-authorized REST design. Provider restrictions match the ERP: the named Gmail administrator requires verified Google sign-in; admin@krc.edu requires password sign-in. Student/faculty enrollment and their matching provider/email are checked on every request. These checks do not claim instant Firebase Auth token revocation.

## API

All operations use POST JSON and `Authorization: Bearer <Firebase ID token>`, with no token in URLs or ambient cookie authorization. Only the configured origins are accepted. Errors never include credentials or raw upstream exceptions.

| Path | Operation |
| --- | --- |
| `/api/media/identity` | Read-only verified caller UID and portal role |
| `/api/media/upload` | Server-generated profile/artifact/chat object key and a 60-second POST grant |
| `/api/media/profile/list` | Own profile-photo prefix only, including all object-list pages |
| `/api/media/profile/remove` | Acknowledged deletion of a key in the caller's own profile-photo prefix |

Image MIME types are JPEG, PNG, WebP, GIF and AVIF. Profile images are limited to 10 MiB; artifact/chat images to 20 MiB. The signed POST policy binds the exact byte count and MIME metadata. Faculty/admin can manage their own profile photos; artifact/chat grants require an enrolled student with chat access, and chat grants require current membership or canonical creator authority. Grants reserve up to 100 MiB per account per hour; requests are limited to 30 per minute. Limits are per process and need a shared limiter if deployed with multiple instances.

Grant signing needs object creation permissions for users/artifacts/chats namespaces; listing is limited to users prefixes and deletion to users objects. Do not grant bucket-administration or IAM permissions. Bucket CORS must allow POST from the actual ERP origins. Public media URLs preserve the existing application behavior; this gateway alone does not make previously public objects private. A private attachment delivery migration is separate.

The client adapter is `src/services/mediaApiTransport.js`. It binds each operation to its starting Firebase UID, refreshes an expired token once for that same UID, validates the upload origin/fields, requires a204 object-store acknowledgment, and reports list/delete failures. `cloudMediaTransport` defaults to the verified HTTPS Worker endpoint; VITE_MEDIA_API_URL optionally overrides it. There is no browser SDK signing fallback. Invalid configured endpoints/errors fail closed. `CloudStorageService` consumes server-assigned keys/URLs for profile, artifact and chat uploads. The previous browser-exposed key has been deactivated and independently rejected by the provider. Keep replacement keys only in the server secret store.

## Browser verification

`npm run fixtures` binds only 127.0.0.1:8787. Its separate demo JWT issuer, disposable RAM objects and dummy signing credentials never connect to production storage. It uses the actual JWT verifier, HTTP handler, storage SDK policy generation and frontend transport. Open the local Vite page `/browser-media-api-checks.html` in Brave and run its checks. Restart the fixture process before repeating a complete run, because request/byte budgets intentionally persist in RAM for that process.

The optional read-only live identity check uses a separate loopback gateway on port 8788 and the current local ERP session. It verifies a real Firebase token and reads that user's own enrollment only; it performs no storage operation. The page is development-only and is not included in the Hosting build.

Primary references: [Firebase ID-token verification](https://firebase.google.com/docs/auth/admin/verify-id-tokens), [Functions deployment requirements](https://firebase.google.com/docs/functions/get-started), [AWS SDK POST policies](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/Package/-aws-sdk-s3-presigned-post/Function/createPresignedPost3).
