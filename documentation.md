# ERP changes, explanation and FAQs

Updated: 19 October 2026. Covers the repair work through application checkpoint 40 and Firestore rules checkpoint 40. These are release-tracking labels, not package-version changes.

Live application: [ERP](https://erp-system-mit.web.app). Developer continuation: [handoff.md](handoff.md). Original checkpoint records: `handoff-history.md` (local archive; excluded from the public source release).

## Purpose and status

The work began with unreliable student discovery, temporary direct messages, incorrect names, conflicting live updates and sign-in/URL access problems. Investigation also found false save acknowledgments, fabricated academic data and reusable storage signing credentials delivered to browsers.

The released repairs connect visible actions to acknowledged database/storage operations and consistently use enrolled account identity. The messaging and media milestones are released. The wider ERP audit remains incomplete; passing checks do not establish that every feature or security boundary has been audited.

## Changes and reasons

### Authentication and portal isolation

| Previous problem | Change | Reason |
| --- | --- | --- |
| Extra identities, cached roles or profile claims could influence administrator access. | Centralized exact email and active-token provider checks. | Local storage and profile edits must not grant administrator authority. |
| Unknown accounts followed inconsistent portal routes. | Unenrolled identities resolve to guests and return to the landing page. | Identity-provider authentication is separate from campus enrollment. |
| URL editing could reach another role's portal. | Every portal requires its exact role; backend permissions independently protect operations. | A UI redirect alone cannot protect data. |
| Existing sessions or browser origin state disrupted Google sign-in. | Added fixed first-party entry/continuation handling and authoritative auth readiness. | Account selection should finish without a stale restored session overriding it. |

Only these administrator combinations are accepted:

| Email | Required active sign-in method |
| --- | --- |
| `chinmayc3003@gmail.com` | Verified Google sign-in |
| `admin@krc.edu` | Email/password sign-in |

A linked provider is not sufficient when the current token used another method. Administrators use their own moderation route rather than entering student dashboards.

Sources: [auth policy](src/utils/authPolicy.js), [role guard](src/guards/RoleGuard.jsx), [auth context](src/contexts/AuthContext.jsx), [Google entry](src/utils/googleSignInEntry.js), [rules](firestore.rules).

### Enrollment and full names

Creation requires a real authentication UID and commits related database enrollment records atomically. Names are normalized and persisted in canonical enrollment/profile records, and Firebase Auth receives the display name. Student/faculty forms wait for successful persistence instead of reporting an unsaved enrollment.

Auth and Firestore remain separate services. If Auth succeeds but the database save fails, the error is visible and the created UID is retained for retry. This is not one atomic transaction across both services. Existing UIDs and occupied PRNs cannot silently reset an established student.

New profile writes exclude plaintext starting passwords. New enrollment no longer seeds invented grades, courses, attendance, payments, receipts or an allocated encrypted vault. Historical data was not indiscriminately purged. Google linking updates identity records without reprovisioning academic/social data; the simulated mail-OTP flow was removed, and ownership is proved by verified Google login.

Sources: [provisioning](src/services/studentAuthProvisioningService.js), [folder provisioning](src/services/studentFolderService.js), [enrollment persistence](src/utils/enrollmentPersistence.js), [admin students](src/pages/admin/Students.jsx), [admin faculty](src/pages/admin/Faculty.jsx).

### Student discovery and search

The directory uses eligible enrollments rather than demo search seeds or social-only profiles. Search no longer overwrites enrollment storage. Filters run before result limits, relevance is preserved while typing, and late responses cannot replace a newer query.

Peers are published through an allowlisted `student_directory` projection. Finding a classmate no longer requires reading that student's private enrollment document. Canonical account identity determines who exists; social metadata can enrich appearance but cannot create a peer or fabricated DM identity. Enrollment, clearance, name and photo changes synchronize directory records, with visible errors.

A shared authoritative clearance stream prevents old callbacks from reopening revoked rooms. Appearance updates and unrelated storage events no longer tear down a valid conversation and its draft. Loading, empty and failed directory states are distinct.

Sources: [directory repository](src/services/studentDirectoryRepository.js), [search](src/services/studentSearchService.js), [projection](src/utils/studentDirectoryProjection.js), [clearance](src/hooks/useStudentChatClearance.js).

### Persistent direct messages and correct identity

Opening a student resolves or creates a saved conversation. An existing thread offers **Open chat**, reuses its history and moves to the top of that user's list. Recency and close state are owner-private workspace records, not public activity labels.

Peer names resolve from canonical participants and the directory. The signed-in student's own identity receives the self label; the peer is no longer incorrectly labeled “Classmate (You).” Closing a DM hides its row for that account without deleting shared history. Reopening restores the same thread.

Shared action ordering prevents a slow open/close/leave operation from overriding a newer selection. Unstable peer-object effects and conflicting clearance callbacks were repaired to avoid repeated renders and draft loss.

Sources: [identity](src/services/conversationIdentity.js), [workspace preferences](src/services/chatWorkspacePreferences.js), [conversation list](src/components/chat/ConversationList.jsx), [chat room](src/components/chat/ChatRoom.jsx).

### Follows, friends and notifications

Follow/unfollow and friend requests are saved and subscribed to in real time. Friendship requires recipient acceptance; a follow does not create friendship. Failed writes do not become a false success. Incoming requests resolve actual directory names.

Notification preferences now control sounds, in-app banners and name hiding. Old history is baselined instead of generating false alerts. Channel mutes suppress notifications while messages continue arriving; timed mutes expire and mentions use student identity. These controls describe their browser/device scope, not an operating-system push service.

Sources: [relationships](src/services/studentRelationshipService.js), [notification preferences](src/services/chatNotificationPreferences.js), [notification hook](src/hooks/useChatNotifications.js).

### Channels and secondary controls

Channel authority uses canonical UIDs and active membership instead of names, PRNs or default-allow checks. Messages require membership. Management, invite use and ordinary own join/leave operations have distinct validation. Invites are persisted, expiring records rather than editable encoded strings.

Leaving/rejoining preserves history. Failed member/description changes are visible. Joined channels use account-scoped queries instead of a campus-wide newest-50 window that could hide a student's memberships. Private favorites, lists, stars and history visibility are separate from shared messages.

Channel call/video controls, the Enterprise Pro badge, fabricated presence indicators and unsupported channel encryption claims were removed because they implied capabilities the project did not substantiate.

Sources: [channel policy](src/services/channelPolicy.js), [joined channels](src/services/joinedChannelRepository.js), [chat service](src/services/studentChatService.js).

### History, export and message deletion

Cursor-based history preserves earlier pages and stable ordering for equal timestamps. Older-message reading retains a scroll anchor; incoming messages follow only when appropriate. Export reads saved pages and reports failed/canceled reads instead of claiming incomplete history is complete.

| Action | Result |
| --- | --- |
| Close conversation | Hides the owner's DM row; shared messages remain. |
| Delete for me | Privately hides a message for that account; restoration is available. |
| Delete own message for everyone | Retracts shared body/media references through a validated tombstone. |
| Authorized channel moderation | Managers can retract within their authorized channel. |
| Exact global-admin moderation | Separate admin route can moderate conversation records across the system. |

Retraction retains original sender/time and deletion actor/time, removes content references and repairs the matching last-message preview. Firestore validates authority. Removing a reference does not promise deletion of the underlying stored file or copies exported elsewhere.

Sources: [history](src/services/chatHistoryRepository.js), [deletion](src/services/messageDeletionRepository.js), [delete action](src/components/chat/MessageDeleteAction.jsx), [moderation](src/pages/admin/ChatModeration.jsx).

### Profiles, artifacts and comments

Names, biographies, posts, likes and comments use acknowledged saved data and live subscriptions. Author identity is account-bound; peers cannot submit another UID to rewrite an author's content. Failed operations retain the appropriate draft or selection.

The artifact viewer is a wider straight rectangle with square corners and a 1240px maximum width. Images preserve natural proportions and shrink to fit instead of stretching or overflowing. Discussion scrolls separately on desktop and stacks on narrow screens. Long content wraps, and the composer stays reachable. Earlier desktop/mobile and live-comment checks are preserved in the history.

Profile-photo uploads wait for remote acknowledgment. The dedicated profile uploader also saves the uploaded image as the active avatar; selecting an existing library photo uses **Save Avatar**. Failed storage operations remain visible.

Sources: [profile/viewer](src/components/chat/views/DedicatedProfileView.jsx), [photo manager](src/components/profile/ProfilePhotoManager.jsx), [posts](src/services/socialPostRepository.js).

### Academic data, scheduling and attendance

Repaired student pages read actual account-scoped records. Missing totals remain **Not published**; empty history remains empty. Invented attendance, marks, fees and receipts were removed from these paths, along with simulated payment success. Missing dates no longer crash summaries.

Schedules use actual faculty identity and student cohort. After-hours logic no longer invents an active lecture. Unassigned faculty do not borrow a default colleague's QR/grade interface. Grade save failures are visible, but assignment-bound backend grade/audit authorization still needs review.

Attendance uses assigned sessions and short-lived server-timed QR challenges. Matching personal history and central audit are saved atomically after validating identity, session and cohort. Expired, replayed, spoofed or one-sided writes are rejected. A current QR does not independently establish physical presence; camera and classroom-latency validation remain unfinished.

Sources: [academic repository](src/services/studentAcademicRepository.js), [academic records](src/utils/academicRecords.js), [attendance repository](src/services/classroomAttendanceRepository.js), [session manager](src/components/attendance/AttendanceSessionManager.jsx).

### Media backend and exposed-key replacement

Previously, browsers could recover reusable storage signing keys from encoded payloads. Client-side encoding or a static master key did not make those credentials secret. A database also cannot replace a trusted signing service merely by returning credentials to the client.

The released design retains Firebase Auth/Firestore/Hosting on Spark and uses a Node-compatible Cloudflare Worker for media operations. Its account was verified on Workers Free. The prepared Firebase Functions alternative stays inactive; no Blaze upgrade was made.

1. The app sends its Firebase ID token and requested operation to the Worker.
2. The Worker checks signature, project, provider, enrollment and applicable membership.
3. It assigns an allowed object key and returns a short-lived upload grant restricted to declared image type/size.
4. The browser requires the expected storage acknowledgment. Profile listing/removal is restricted to the authenticated account's namespace.

Browser signing payloads, the browser SDK signing fallback and the static vault master key were removed. Legacy credential documents deny all browser roles, including administrators. Account-switch guards prevent late requests or retries from attaching one account's operation to another.

The owner created a replacement for the same storage IAM user. Its explicitly provided CSV was processed locally into the Worker secret without printing contents or copying it into the repository. The owner disabled the old key. Provider verification returned **403 / InvalidClientTokenId** for the old key and **200** for the expected replacement identity. The old key was deactivated, not permanently deleted; IAM/bucket least-privilege review remains separate.

An SDK XML-parser incompatibility was fixed for the Worker runtime. Generated Worker files were excluded from Vite's watcher to avoid development reloads. Temporary loopback verification origins and the one-time credential-entry server/source were removed after use. The app defaults to the verified Worker; `VITE_MEDIA_API_URL` is an optional override. Errors never fall back to browser signing.

Public media URLs remain observable. Upload authorization does not make existing asset URLs private.

Sources: [media adapter](src/services/mediaApiTransport.js), [configured transport](src/services/cloudMediaTransport.js), [storage service](src/services/cloudStorageService.js), [Worker](server/media/worker.js), [handler](server/media/handler.js), [media runbook](server/media/README.md).

## Recorded verification

These are implementation-checkpoint results, not suites rerun for this documentation-only task.

| Check | Recorded result | Evidence and scope |
| --- | --- | --- |
| Native Brave application suite | 286 passed, 0 failed | [Actual modules/components with controlled fixtures](docs/verification.md). |
| Isolated database suite via Brave | 171 passed, 0 failed | [Actual Firestore allow/deny checks in a demo database](docs/verification.md). |
| Local media suite | 75 passed, 0 failed | [Worker/adapter fixtures](docs/verification.md); five retained checks exercise the inactive Firebase wrapper. |
| Owned application build | PASS, 5.96 seconds | [Checkpoint evidence](docs/verification.md); a compile result, not a performance benchmark. |
| Rules and Hosting release | PASS | [Deployment log](docs/verification.md). |
| Current client bundle | 88 JS files inspected | [Old signing arrays, static master and storage signer absent](docs/verification.md). |
| Credential replacement | Old rejected, replacement verified | [Provider probe](docs/verification.md). |
| Post-rotation library and history | PASS | [Fresh hosted listing](docs/verification.md), [saved conversation](docs/verification.md). |

The suites overlap and run in different environments. Do not add their counts and present them as unique live production scenarios. Earlier checkpoints recorded actual two-student delivery, follow/friend transitions, close/reopen, channels and comments. Those detailed proofs remain in the archive.

During the last upload check, normal upload behavior temporarily selected a tiny test image as avatar; the existing photo was restored. The owner confirmed removing both verification images. Their later absence was expected manual cleanup, not a retention bug. No agent production photo/message deletion occurred in that checkpoint.

## FAQs

### Q1. Why are there no classmates in search?

Only actual eligible enrollments appear; the current student is excluded. With one student, an empty peer list is correct. Check enrollment, saved cohort, filters, directory synchronization and chat clearance. Failed subscriptions should show an error rather than sample students.

### Q2. Were real student records deleted to remove demo peers?

The directory stopped treating search seeds and social-only records as enrollments. That does not mean genuine profiles were bulk-deleted. Historical cleanup is a separate reviewed migration.

### Q3. Does unknown Google sign-in automatically enroll a student?

No. Identity authentication and enrollment are separate. An unenrolled identity remains a guest and returns to the landing page.

### Q4. Can either administrator email use either login method?

No. The Gmail administrator requires verified Google sign-in; the institutional administrator requires email/password. The active token's provider matters, not merely a linked method.

### Q5. What happens if someone modifies the URL?

Signed-out users go to login, guests to the landing page, and authenticated wrong-role users to their own dashboard. Backend permissions independently protect data and operations.

### Q6. Are full names actually stored?

New enrollment persists normalized names in related database records and the authentication display name. Directory/chat labels use canonical identity. This does not prove every malformed historical record has been migrated.

### Q7. What if Auth succeeds but enrollment persistence fails?

The failure is reported, and the created UID is retained for retry instead of claiming success or creating an unrelated account. Cross-service account deletion/cleanup still needs a complete lifecycle design.

### Q8. Why does search show Open chat?

A saved conversation already exists. Open chat restores that same thread and history, including its private DM row and recent ordering.

### Q9. Can another student see my recently viewed chats?

Recency and close state are owner-private workspace data, not a public activity feed. This does not establish a complete audit of every operational metadata path.

### Q10. Does closing a DM delete history?

No. Closing hides the row for that account. Reopening from search restores the existing conversation. Message deletion is separate.

### Q11. How do the two delete options differ?

Delete for me privately hides a message and is restorable. Delete for everyone retracts shared content and requires authorship or authorized moderation. Ordinary members cannot retract someone else's message for everyone.

### Q12. How can administrators moderate without entering student dashboards?

They use the separate admin moderation route. Backend authority passed isolated database tests; the latest checkpoint did not live-verify that admin screen. Moderation authority does not imply readable plaintext access to every encrypted message.

### Q13. Does following make two people friends?

No. Follows and friendships are separate saved relationships. Friendship requires recipient acceptance, and the UI subscribes to the resulting state.

### Q14. Does Saved mean the recipient read the message?

No. It indicates acknowledged persistence. Earlier misleading double ticks were replaced; persistence is not a read receipt.

### Q15. Do notifications work after the browser closes?

The controls implement sounds and in-app banners while messaging is open. They do not establish background operating-system push delivery.

### Q16. Is everything end-to-end encrypted?

No blanket claim is made. Direct text uses the existing client encryption path; channel text is not protected by that same path. Historical public media URLs remain observable. Crypto/key-lifecycle and private-download guarantees need separate review.

### Q17. Why remove calls and Enterprise Pro?

They implied capabilities or a product tier the project did not substantiate. Controls and labels should describe behavior actually implemented.

### Q18. Why does the artifact image leave empty space?

The viewer preserves natural proportions and contains the image within its allocated bounds. It avoids stretching, unwanted cropping and overflow while leaving discussion readable.

### Q19. Why do academic pages show Not published?

Missing totals are no longer replaced with invented attendance, grades, fees or receipts. Actual records remain visible. A real payment-provider integration has not been implemented by removing simulated success.

### Q20. Does an attendance QR prove physical presence?

It validates a current authorized session, enrolled identity and matching saved records. Physical camera, location and classroom network behavior still need validation.

### Q21. Why add a media server when Firebase stores data?

Trusted code must validate identity/membership and sign narrowly scoped operations. Returning reusable credentials from Firestore or encoding them in JavaScript does not create that boundary.

### Q22. Was Firebase upgraded to Blaze, and is everything free now?

No Blaze upgrade was made. The verified compute account uses Workers Free and Firebase remains Spark. Existing object storage is separate and provider quotas apply; unlimited capacity or zero charges across all services is not promised.

### Q23. Can an older bundle still use the leaked key?

The old key was disabled and independently rejected by the provider. This is why deleting it from the current bundle alone was insufficient. It was not permanently deleted, so an owner must not casually reactivate it.

### Q24. Why is a provider hostname still visible in a media URL?

User-facing placeholders were removed, but network destinations and public asset URLs remain observable. Credential secrecy is different from hiding provider identity; a hostname-hiding proxy was not introduced.

### Q25. Why did development refreshes or draft loss happen?

Investigation separated module reloads from subscription/render loops. Generated Worker files are ignored by Vite's watcher; stale clearance and appearance-only updates no longer tear down a valid room/draft. Source edits can still reload development pages, so credential entry must be protected from concurrent edits/navigation.

### Q26. Why can Brave ask me to sign in after closing the site?

The recorded Brave session had Forget me when I close this site enabled. Closing the final ERP tab cleared its stored session; an in-site reload preserved it. The app did not change the user's privacy setting.

### Q27. Are all ERP anomalies fixed?

No. The released work and its evidence are documented here; the remaining priorities below still need investigation. Passing checks are not a universal guarantee.

## Remaining work and limits

| Priority | Item | Required boundary |
| --- | --- | --- |
| High | Assignment-bound faculty grade/audit backend authorization. | UI filtering alone is insufficient. |
| High | Student/faculty deletion and cross-service lifecycle. | Test disposable records before genuine account/history deletion. |
| High | Historical credential/alias records and shared-browser caches. | New-write sanitization does not prove old data has been purged. |
| Medium | Alternate Google/password UID conversation identity and legacy memberships. | Preserve established threads; do not infer authority from names/PRNs. |
| Medium | Payment integration, remaining sample modules and GPS simulation widgets. | Do not invent metrics or payment success. |
| Medium | Physical camera, classroom latency and location checks. | Preserve challenge expiry and replay protection. |
| Medium | IAM/bucket policy, private media downloads, crypto review and production capacity. | Key rotation does not establish all these guarantees. |
| Medium | Admin report-inbox and latest live moderation-screen verification. | Saved reports do not promise review or response. |

The user canceled new video recording. Historical recording notes do not authorize resuming it. See the current [handoff](handoff.md) for source locations, verification workflow and next actions.
