# Cross-Galaxy Social Media Capability

Status: implementation contract
Date: 2026-08-22

## Decision

Social-media strategy and management is a coordinated ZCOS capability set. It is not a new agent, galaxy, content store, scheduler, or credential authority.

| Concern | Canonical owner |
| --- | --- |
| Objective intake, brand/audience context, coordination, approval/result presentation | ZAR |
| Campaign records, Project references, routing, provenance, governance, analytics links, outcome candidates | ZCOS |
| Briefs, copy, assets, layouts, platform variants, approved publish execution | ZYNC Canvas → Build → Design/Publish |
| Schedules, recurring jobs, monitoring, retries and triggers | ZYLO Automate |
| Account connections and scopes | Settings → Integrations |
| Permission checks, credential protection, action monitoring and audit evidence | ZENA |
| Authorized trend, culture, UGC and discovery signals | ZWAP! Discovery |

`projectRef`, `sourceBindings`, `assetRefs`, and `credentialRef` bind to their canonical systems. This capability does not duplicate those records. Credentials are never stored in social records; `credentialRef` must use an approved `zena-secret://`, `vault://`, `secret://`, `kms://`, or `keyring://` reference. Connection metadata rejects credential-like fields recursively.

## Baseline audit

The implementation was preceded by inspection of the governing ZAR behavior/specification, ZCOS architecture and repository migration contracts, plus the current repository sources.

| Area | Existing evidence | Reuse decision |
| --- | --- | --- |
| ZAR social flow | `server/seeds/flows/006-social-media-management.json` in `xoclonholdings/ZedAI` is a text-planning flow and contains no verified provider publish operation | Retain only as coordinator/migration evidence; do not turn it into a scheduler or provider authority |
| ZAR social UI | `SocialFeed.tsx` is a disabled coming-soon surface | Preserve UI; no replacement social console in this change |
| Content/flow execution | ZAR stages generate text and use a file-backed FlowStore | Do not treat generated text as provider execution evidence |
| Automation | ZAR deferred scheduler is file-backed and has no execution loop | Use one canonical ZYLO-owned `AutomationJob` model; do not add another timer |
| Integrations | Legacy ZAR settings can hold raw tokens and browser credentials/session state | Do not reuse credential storage; accept only protected `credentialRef` values |
| Approval | ZAR settings include `postToSocial`/`publishContent`, but the legacy seed marks Schedule & Publish as not requiring approval | Enforce approval at the canonical service boundary regardless of presentation defaults |
| Projects | ZAR filing is file-backed; ZCOS specification owns cross-galaxy project visibility | Bind campaigns through `projectRef`; do not create a competing Project store |
| Analytics | Existing ZAR analytics is generic and not campaign/content/window/objective linked | Add evidence-linked immutable snapshots and separate candidate insights |
| ZYNC | The inspected legacy ZYNC repository has no canonical Design/Publish social subsystem | Define the ZYNC adapter boundary here without absorbing it into ZAR |

Audit revisions inspected: `xoclonholdings/ZedAI@adabe10cb0f0f63c7210c6fbe15a9f326acbb2b2` and `xoclonholdings/zebulon-hub@6339bc7`.

## Canonical records

- `SocialConnection`: account reference, protected credential reference, platform list, scopes, lifecycle state and revocation evidence.
- `SocialCampaign`: objective, brand/audience context, platform objectives, distinct strategies and optional Project binding.
- `SocialResearchSignal`: platform signal, source locator, access/publication dates, freshness and provenance.
- `SocialContent`: ZYNC-authored brief and canonical source/asset bindings.
- `SocialVariant`: platform-specific copy, assets, adaptation rationale, revision chain, approval, schedule and provider result.
- `SocialApprovalPolicy`: scoped Ask, Auto or Never policy with effective period and revocation.
- `AutomationJob`: the single ZYLO-owned schedule record for social work.
- `SocialPublishAttempt`: idempotent provider attempt with explicit success, partial, failed, blocked or unknown state.
- `SocialMetricSnapshot`: campaign/content/variant/platform/objective/time-window analytics evidence.
- `SocialOutcomeInsight`: a candidate recommendation derived from named metric snapshots.
- `SocialModerationItem`: engagement/moderation review and verified provider action evidence.

All records are owner-scoped. Public operations emit ZENA-attributed `AuditEvent` evidence.

## Lifecycle and invariants

1. ZAR coordinates a campaign containing one or more materially distinct strategic alternatives.
2. ZWAP! or another authorized contributor records research signals with provenance and freshness.
3. ZYNC creates a brief and explicit platform variants. Generic cross-posting is not a publishable artifact.
4. A human approves a variant, or a matching, active, scoped Auto policy authorizes `publish`. A matching Never policy fails closed.
5. ZYLO owns future execution through an idempotent `AutomationJob`. Users can reschedule or cancel non-terminal work.
6. ZYNC Design/Publish invokes a certified provider adapter. No adapter means `blocked`; an exception means `unknown`; success without a provider post identifier is downgraded to `unknown`.
7. Analytics snapshots retain objective, time window and provider/source bindings.
8. Outcome learning remains `candidate`. It never creates Memory or canonical Knowledge implicitly.

Terminal or unresolved provider states prevent accidental duplicate scheduling/publishing. Revision creates a new variant version, supersedes the prior version, and cancels its outstanding scheduled jobs atomically.

## HTTP boundary

Authenticated, owner-scoped routes are mounted under `/api/zcos/social`:

- Integrations: create, disconnect, revoke.
- Approval policies: create, revoke.
- Campaigns: create, list, snapshot, select strategy, add research, add content, add outcome candidate.
- Content: create platform variant.
- Variants: review, approve, revise, schedule, reschedule, cancel, publish.
- Analytics: record immutable metric snapshot.
- Moderation: queue and advance through controlled states.

No provider adapter is enabled by default. The empty adapter registry is deliberate fail-closed behavior, not simulated success.

## Provider activation gate

A provider can be registered only after all of the following exist:

- Settings → Integrations creates a protected credential reference and the minimum required scopes.
- ZENA validates the connection, permission and revocation behavior.
- The adapter uses the supplied idempotency key and maps provider responses to the canonical result states.
- A successful publish returns a provider post identifier; partial and ambiguous outcomes retain reconciliation evidence.
- Contract tests cover timeout-after-accept, duplicate request, permission loss, account disconnect and provider partial failure.
- A separate authorized deployment/migration action activates the schema and runtime.

## Verification scenarios

- Human approval blocks both scheduling and immediate publishing when no scoped Auto policy exists.
- A scoped Auto policy cannot authorize a different campaign, platform, connection or operation.
- Disconnect/revoke stops later side effects, and revoke removes the credential reference.
- Idempotency keys replay an existing schedule/publish attempt and cannot be reused for another target.
- A provider result cannot be marked successful without its post identifier.
- Cancellation and rescheduling update both the ZYLO job and variant state.
- Analytics cannot be attached across owner/campaign boundaries.
- Outcome candidates cite existing campaign snapshots and do not write Memory or Knowledge.

## Deliberate exclusions

- No Social Media Agent.
- No replacement social UI or change to the approved Dock/galaxy design.
- No raw token, username, password, browser session or cookie persistence.
- No live provider calls, account connections, database migration execution or production deployment in this implementation change.
- No automatic conversion of engagement signals into personal Memory or canonical Knowledge.
