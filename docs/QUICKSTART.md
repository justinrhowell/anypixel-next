# Local installation and first review

Use Node 24+. These commands apply to the local alpha; they do not assume npm publication.

## Install packed artifacts into a consumer project

From the AnyPixel Next checkout:

```sh
npm ci
npm pack --pack-destination /tmp
npm pack --workspace extensions/web --pack-destination /tmp
```

From the consumer project:

```sh
npm install --save-dev /tmp/anypixel-next-0.1.0-alpha.0.tgz
npx anypixel-next init
```

For optional browser tools:

```sh
npm install --save-dev /tmp/anypixel-next-web-0.1.0-alpha.0.tgz
npx playwright install chromium
```

Add `anypixel-next-web` as a trusted extension and your exact preview origin to `design/project.json`, following the root README. Use `"channel":"chrome"` in an observation request to use installed Google Chrome instead of downloading Chromium. Loading a preview can contact its normal subresources. No browser package is required for context, decisions, or non-browser extensions.

## Review a preview

Create a context:

```sh
npx anypixel-next context --task "Help people complete the invitation form" --scope src/invite.tsx --json
```

Keep the returned context ID. Save this as `observe.json`:

```json
{
  "observer": "web/browser",
  "input": {
    "url": "http://localhost:3000/invite",
    "state": "invitation form, signed out",
    "viewport": { "width": 900, "height": 800 }
  }
}
```

```sh
npx anypixel-next observe --input observe.json --json
```

Save the returned capture ID. Create `review.json` with the actual IDs:

```json
{
  "contextId": "REPLACE_WITH_CONTEXT_ID",
  "captureIds": ["REPLACE_WITH_CAPTURE_ID"],
  "ci": false
}
```

```sh
npx anypixel-next review --input review.json
```

Open the emitted HTML file. Your existing agent can read the screenshot through `design_read`, interpret it, and make authorized code changes. Run the same observation again, and include `baseReviewId` in the next review to compare matching capture requests. Matching requests do not establish identical dynamic state or verified source-revision association.

Host assessments passed to `review` use the finding schema and basis `inferred` or `human`; they cannot impersonate a measured check. A source-only review supplies an empty capture list and clearly reports unassessed configured checks.

## Record a decision

Save a proposed decision to JSON, then run `record --input decision.json`:

```json
{
  "key": "content/invitation-action",
  "scope": ["src/invite.tsx"],
  "status": "proposed",
  "text": "Use a visible Send invitation action label.",
  "reason": "The action should be understandable without interpreting an icon."
}
```

Use accepted status only after the owner makes that choice, supplying `acceptance.actor` and `acceptance.source`. The acceptance is an attestation, not authenticated proof. To replace an accepted decision, record a new accepted decision with the same key/scope and its predecessor's ID in `supersedes`. The old file remains readable. Direct file edits are supported and validated on the next context request.

Use a concrete source path for `context --scope`; decisions are matched against that path. Root scope `.` does not stand for every file in the project. This alpha supports source globs, not route-based decision scopes.

## Recovery and return codes

`0` means the operation completed and any requested policy passed. `1` means a completed CI review found a high-priority measured finding. `2` means incomplete assessment or an operational/input error. `130` means cancellation. Reports remain available when an individual check fails.

An interrupted process can leave an exclusive lock in `.anypixel/`. Its JSON includes the owning PID. After verifying that the process is no longer running, remove only that stale lock and retry. This alpha deliberately does not guess whether another process's lock is safe to delete. Evidence bundles publish through temporary directories; unfinished bundles are never returned as complete.
