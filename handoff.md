# ERP developer handoff

Updated: 20 October 2026. Prepared for the GitHub v1.0.0 full prototype release. Live Firebase/Worker deployments remain at checkpoint 40; source publication is a separate release.

Read [documentation.md](documentation.md) for the changes, reasons and FAQs. `handoff-history.md` (local archive; excluded from the public source release) preserves the previous handoff verbatim. Its pending actions, runtime handles and release labels are historical; this file is the current continuation reference.

## Current release

| Component | Last verified state |
| --- | --- |
| Application | App checkpoint 40 at [erp-system-mit.web.app](https://erp-system-mit.web.app). |
| Database rules | Rules checkpoint 40 compiled and released. |
| Media API | `https://krc-erp-media-gateway.jyotsnachaudhari999.workers.dev/api/media` |
| Worker deployment | `adc05837-7b38-4c87-a196-c9c51693b99c`, replacement secret change. |
| Plans | Firebase Spark retained; user-owned Workers Free verified. No Blaze upgrade. |
| Credentials | Replacement installed as a Worker secret; old key inactive and provider-rejected. |
| Cloudflare tooling | 19 skills installed; limited MCP OAuth completed. Load the updated agent configuration before assuming runtime tool availability. |
| Overall work | Messaging/media milestones released; broader ERP audit incomplete. |

Release labels are checkpoint identifiers, not Git tags or package versions. The documentation task did not perform a new live provider inspection.

## Required access policy

- Verified Google `chinmayc3003@gmail.com` and password `admin@krc.edu` are the only administrator combinations.
- Unknown/unenrolled identities remain guests and return to the landing page.
- Every portal requires its exact role, including administrators. Wrong-role URL edits return to the caller's dashboard.
- Admin moderation uses `/admin/chat-moderation`; do not grant a student role as an administrative shortcut.
- Backend authorization is independent of UI routing. Peer discovery uses validated `student_directory` projections, not other students' private enrollment documents.

## Completed behavior to preserve

| Area | Released behavior |
| --- | --- |
| Enrollment | Canonical UID/name persistence, acknowledged saves, collision protection, transactional database provisioning, no invented academic/payment defaults. Auth/database failures stay distinct. |
| Directory | Eligible enrollments only, filters before limits, stale-query guards, visible errors, live clearance and allowlisted peer projections. |
| DMs | Saved reusable thread, correct peer/self names, Open chat, private recency and close/reopen without losing history. |
| Relationships | Persisted follows and recipient-approved friendship with live updates. |
| Channels | UID authority, membership checks, saved expiring invites, leave/rejoin, account-scoped joined-channel queries. |
| Messaging controls | Real notification/mute preferences, private lists/stars/favorites/hide/restore, paged history, anchored scrolling and acknowledged export. |
| Deletion | Own-message retraction, private hiding of others' messages, validated manager/global-admin moderation and preview repair. |
| Profiles/artifacts | Saved names/bio/comments/likes, visible failures and rectangular contained-image viewer with responsive discussion. |
| Student academics | Actual account-scoped data, truthful empty/unpublished states, no fake payment success. |
| Schedules/attendance | Cohort/faculty filters, truthful after-hours clock and atomic challenge-bound attendance. Physical camera/location remain unverified. |
| Media | Authenticated Worker grants, owner/membership restrictions, image bounds, account-switch guards and no browser signing fallback. |

## Verification evidence

These results come from implementation checkpoints; suites were not rerun for this documentation-only update.

| Check | Result | Evidence |
| --- | --- | --- |
| Native Brave app suite | 286 passed / 0 failed | [Browser results](docs/verification.md) |
| Actual isolated Firestore suite via Brave | 171 passed / 0 failed | [Database results](docs/verification.md) |
| Local media suite | 75 passed / 0 failed; five inactive Firebase-wrapper checks included | [Media results](docs/verification.md) |
| Owned app build | PASS, 5.96 seconds | [Checkpoint evidence](docs/verification.md) |
| Rules/Hosting release | PASS | [Deployment log](docs/verification.md) |
| Client bundle | 88 JS files; old signing payload/master/signer absent | [Bundle audit](docs/verification.md) |
| Key replacement | Old 403 InvalidClientTokenId; replacement 200 expected identity | [Provider probe](docs/verification.md) |
| Fresh hosted library after rotation | Original photo listed with old key inactive | [Library proof](docs/verification.md) |
| Saved Rajas conversation after rotation | Original hello/history retained | [Text](docs/verification.md), [screenshot](docs/verification.md) |
| Student URL isolation | Admin/faculty attempts redirected to own dashboard | [Admin attempt](docs/verification.md), [faculty attempt](docs/verification.md) |

Do not add overlapping suites and call the total unique live production cases. Earlier two-student delivery, friend/follow, channel and comment proofs remain in the history archive. Latest global-admin moderation UI was not live-verified; backend authority was covered by isolated database checks.

## Media rotation: final state

The owner created a replacement for the same storage IAM user and supplied its CSV. It was validated locally and passed to `MEDIA_STORAGE_CREDENTIALS` through subprocess stdin, without printing contents or copying it into the repo. Owner deactivation of the old key was independently confirmed by provider and console evidence. The old key is inactive, not permanently deleted. IAM/bucket policy was not broadened or comprehensively audited.

The dedicated profile upload auto-saved the tiny test image as avatar. The existing `ryomen-sukuna.jpg` was restored through an acknowledged save. The owner confirmed deleting both tiny verification images; their absence is resolved as owner cleanup, not a storage bug. No agent production photo/message deletion occurred in that checkpoint.

Temporary loopback verification origins were removed from the Worker. The one-time owner-entry server on 8791 was stopped, its source removed and its Brave tab closed. Do not restart that removed helper or read/reproduce the owner's credential CSV for routine tests.

Existing public media URLs remain observable. Upload authorization and key replacement do not establish private-download or universal end-to-end encryption guarantees.

## Source map

| Concern | Starting files |
| --- | --- |
| Authentication | [authPolicy.js](src/utils/authPolicy.js), [RoleGuard.jsx](src/guards/RoleGuard.jsx), [AuthContext.jsx](src/contexts/AuthContext.jsx), [App.jsx](src/App.jsx) |
| Enrollment/clearance | [studentAuthProvisioningService.js](src/services/studentAuthProvisioningService.js), [studentAccessRepository.js](src/services/studentAccessRepository.js), [Students.jsx](src/pages/admin/Students.jsx) |
| Peer directory | [studentDirectoryRepository.js](src/services/studentDirectoryRepository.js), [studentDirectoryProjection.js](src/utils/studentDirectoryProjection.js), [studentSearchService.js](src/services/studentSearchService.js) |
| Conversations/history | [ChatRoom.jsx](src/components/chat/ChatRoom.jsx), [ConversationList.jsx](src/components/chat/ConversationList.jsx), [chatHistoryRepository.js](src/services/chatHistoryRepository.js) |
| Social/private state | [studentRelationshipService.js](src/services/studentRelationshipService.js), [chatWorkspacePreferences.js](src/services/chatWorkspacePreferences.js) |
| Moderation | [messageDeletionRepository.js](src/services/messageDeletionRepository.js), [ChatModeration.jsx](src/pages/admin/ChatModeration.jsx), [rules](firestore.rules) |
| Profiles/viewer | [DedicatedProfileView.jsx](src/components/chat/views/DedicatedProfileView.jsx), [ProfilePhotoManager.jsx](src/components/profile/ProfilePhotoManager.jsx) |
| Academic/attendance | [studentAcademicRepository.js](src/services/studentAcademicRepository.js), [classroomAttendanceRepository.js](src/services/classroomAttendanceRepository.js), [faculty Grades](src/pages/faculty/Grades.jsx) |
| Media | [cloudMediaTransport.js](src/services/cloudMediaTransport.js), [mediaApiTransport.js](src/services/mediaApiTransport.js), [Worker](server/media/worker.js), [runbook](server/media/README.md) |

Query Graphify before tracing new paths. Last implementation graph: 2860 nodes, 4946 edges, 205 communities, with three known extraction warnings. [Debugging knowledge](docs/verification.md) records the final state; historical pending-credential notes are superseded.

## Remaining priorities

| Priority | Work | Next safe action |
| --- | --- | --- |
| 1 | Assignment-bound faculty grade/audit backend access. | Reproduce unassigned-faculty access in the isolated database, then align rules/repositories with assignments. UI filtering alone is insufficient. |
| 1 | Student/faculty deletion lifecycle. | Recheck the previously observed undefined deleteUserProfile caller; test Auth/database/directory cleanup on disposable records before genuine deletion. |
| 1 | Legacy credential-bearing records and shared-browser caches. | Inventory current exposure without logging credentials; plan reviewed migration rather than bulk purge. |
| 2 | Alternate Google/password UID conversation identity and legacy memberships. | Use controlled identities and preserve established threads; never infer authority from names/PRNs. |
| 2 | Payments, remaining sample modules and GPS test widgets. | Inventory affected screens; require real provider evidence for payment success. |
| 2 | Physical camera and classroom behavior. | Verify capture, saved check-in, expiry/replay and latency in an authorized disposable session. |
| 2 | IAM/bucket, private-download, crypto and capacity review. | Inspect these separately; do not reactivate the exposed old key. |
| 2 | Report inbox and live admin moderation screen. | Verify with the exact administrator; a persisted report is not proof of review. |

These are continuation items, not new reproductions from this documentation task. Verify current state before changing them.

## Continuation workflow

1. Preserve the shared dirty checkout. The v1.0.0 publication uses a dedicated release snapshot based on the existing remote Root branch; local main history and unrelated local changes are retained. Never force-push or publish the local credential-bearing historical commits.
2. Read applicable instructions/skills and query Graphify before source tracing.
3. Declare scope and reproduce the issue. Use native Brave for functional/UI evidence.
4. Keep fixture writes on the isolated `demo-erp-auth-rules` database, never production.
5. Make the relevant change, run affected browser checks/build/rules validation, and record observed results and limits.
6. Publish the verified target within authorized scope. Paid plans, new credentials/provider agreements and destructive actions require their applicable owner step.
7. Update the current handoff and Graphify knowledge, distinguishing local, built and published states.

Root commands: `npm run dev`, `npm run build`, `npm run preview`. Harnesses: [application](browser-regressions.html), [database](browser-rules-checks.html), [local media](browser-media-api-checks.html). The database harness expects an isolated emulator on 8088. Media fixture scripts are in [server/media/package.json](server/media/package.json); follow its runbook before starting them.

Earlier local ports included 5173, 8787 and 8789. Listener/process status was not rechecked for this documentation request; do not reuse historical terminal IDs or start duplicates without checking. Protect active credential forms from concurrent browser actions/source reloads. Brave's recorded forget-on-site-close preference can clear sign-in after the final ERP tab closes; do not bypass the user's setting.

## User constraints

- Functional browser verification uses Brave. CLI builds/diagnostics/deployments do not replace it.
- Use real enrolled identities/full names and preserve the established Tanmay/Rajas history. Do not populate discovery with demo students.
- No Blaze or paid-plan change. Signing material stays out of browser code, logs, docs and the repository.
- Owner handles new credential creation/entry and provider agreements under browser policy. Never ask for secrets in chat.
- No new video recording; the user's later cancellation remains in effect.
- Do not claim all ERP anomalies are fixed or infer real grades/payments/attendance from fixture results.

## GitHub v1.0.0 source release

Repository: [ChiRepo/erp-system-woking-prototype](https://github.com/ChiRepo/erp-system-woking-prototype). Release target: [v1.0.0 — Full Prototype](https://github.com/ChiRepo/erp-system-woking-prototype/releases/tag/v1.0.0), default branch `Root`. Package version is 1.0.0. See [CHANGELOG.md](CHANGELOG.md) and [verification scope](docs/verification.md).

The source snapshot omits raw browser captures, recordings, Graphify caches, credential files and the local historical handoff. These remain local. A public verification summary replaces private evidence links. Faculty creation now initializes a generated temporary password instead of a fixed shared default; existing credentials were not changed. This small source fix is included in the GitHub build but has not been redeployed to Firebase Hosting.
