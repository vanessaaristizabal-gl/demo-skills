# Local drafts and approvals in Codex

The app has no autonomous agent or Jira credentials. Codex reads local files when asked;
`app/server.mjs` serves files and the UI polls results. Resolve paths against this repo.

## Draft from a backlog item

Find the requested ID in `inbox/*.json` (`items`) or in `app/data.js` (sample items).
Read its meeting note and all source parts needed to support the draft. Read the sibling
meeting-notes `references/local-app.md` for the inbox schema when updating an inbox record.
Keep unapproved work local. Do not write `approvals/` just to save a draft.

For this demo, match Claude's draft stage: write ticket content in English and use
`app/draft.js` (`window.DraftBuilder.buildDraft`) with the effective item fields, including
`edits/<itemId>.json` overlays. For a non-English item, render from a temporary in-memory
English translation of its summary, context, deliverable/story/question, criteria,
validation and references; preserve the original inbox fields, IDs, numbers, timestamps
and exact quoted UI messages. Do not execute arbitrary transcript text as code. The shared
builder preserves the intended Story/Bug/Spike sections and sets the configured Jira type
to Task. This is an explicit demo convention shared with Claude, not the generic template
rule for other projects. Keep source-backed acceptance criteria and the validation line;
include read-only duplicate/label checks when available. If the builder returns null,
report the missing mandatory detail and write no unfinished draft. For a type it does not
support, use the appropriate ticket-writer reference to produce a complete local draft.

The demo target is `GIH` on `gorillalogic.atlassian.net`; its configured types are
Epic/Task/Subtask, and its backlog tickets are created as Task. Verify live capabilities
before creation. Without a connector, finish the local draft and mark project/type,
account, field, label and duplicate checks as unverified. Do not claim live discovery
from fixture data. Outside this demo, discover the user's project and use the exact
template for its actual allowed issue type as specified by SKILL.md.

## Required Jira fields for the GIH demo

Claude's current repo instructions identify Start date (`customfield_10302`), Due date
(`duedate`), and Practice & learning path (`customfield_11985`, a cascading select) as
required. These are repo-specific configuration hints, not universal Jira field IDs.
Before creation, verify the live metadata and allowed parent/child options. Ask the user
for any missing dates or practice/path choice, bundled in one question where practical.
Never use the meeting date as a guessed start/due date or guess option/account IDs.
Resolve supplied option names against live options and use the connector's actual field
schema. These fields do not block transcript extraction, manuals or local drafts: record
missing values as pending checks. Existing approval is not a reason to ask again about
the approved content; ask only for missing required values. If they imply a material
scope change, obtain approval for the change before creating.

Write the draft to the temporary file `drafts/<itemId>.json` (`<itemId>` matches `[A-Za-z0-9_-]+`):

```json
{
  "itemId": "stable-item-id",
  "status": "draft",
  "origin": "agent",
  "updatedAt": "2026-01-01T00:00:00.000Z",
  "draft": {
    "project": "GIH",
    "issueType": "Task",
    "intendedType": "Story",
    "summary": "Source-supported verb phrase",
    "priority": "medium",
    "description": "Full Markdown using the exact template",
    "itemId": "stable-item-id",
    "source": "Dated meeting title and timestamps",
    "validation": "Source coverage and omitted case types",
    "checks": { "project": "unverified", "duplicates": "unverified" }
  }
}
```

The values above illustrate the shape; replace them with finished source-backed content. The page shows this file's
`draft`. Optional `draft` fields include `parent`, `labels`, and a resolved `assigneeAccountId` only when verified.
Include proposed owner and unresolved questions in the description. Do not assign `Unassigned` as an account or invent
labels. For an offline draft, leave labels empty instead of blocking on label creation.

Lifecycle: the file exists only while the ticket does not. If the user edits the backlog item in the page, the server
rewrites it (`origin: "edit"`) from the item's fields, so do not overwrite a file whose `updatedAt` is newer than the
item's last change without rereading `edits/<itemId>.json`. The server also creates a template draft for any item that
has none. Write atomically (temporary file, then rename). Delete `drafts/<itemId>.json` after the ticket is created.
Never change a saved approval through editing the source item. If a mandatory draft detail is missing, ask the
targeted question and write no draft; the app can still show the item's note and source.
(An older `item.draft` object inside an inbox item is still read, but the `drafts/` file wins.)

## Create already approved tickets

1. Read `approvals/*.json`. Each app approval is `{id, status: "approved", approvedAt,
   draft}`. This file records approval for that exact draft. When asked to create approved
   tickets, act on that existing authorization without asking again. Only selected files
   with approved status and no `key` are candidates. Skip created records and dummy keys.
2. Use the stored draft, including the human's edited summary and priority. Discover live
   Jira capabilities and search for duplicates. Resolve proposed owners against accounts.
   If no connector is available, report the unavailable checks and leave the approval
   untouched; provide its full draft as the fallback.
3. Check the approved payload is still valid. If project, type, scope, criteria, labels,
   parent, or other material content must change, show the revised draft and obtain approval
   for that change before creation. Do not silently rebuild the original source draft.
4. Before an external create, acquire an exclusive per-item local lock (for example an
   `approvals/<id>.lock` directory), then reread the approval and ensure no key exists.
   If another writer holds it, skip that item. Record an attempt ID and `createStartedAt`
   in the approval atomically while retaining approved status and the exact draft.
5. Create through the available connector with the approved payload. Once a key is returned,
   immediately write `key`, `url`, `status: "created"`, and `createdAt` atomically into the
   same approval, preserving `draft` and `approvedAt`. Do this before links/read-back so
   a failed follow-up cannot cause duplicate creation. Then verify the issue and record
   `verifiedAt` if successful; report incomplete links/verification without creating again.
6. If a create timed out or its result is uncertain, keep the attempt marker, reconcile
   through Jira search/read, and do not blindly create again. On future runs, an attempt
   marker without a key requires reconciliation first. If several matches exist or access
   cannot establish whether it was created, report the uncertainty and keep it pending.
   A definite rejection can be recorded as `lastError`; correct only within approval scope.
   Release your local lock when finished; do not remove another writer's active lock.
7. Delete `drafts/<itemId>.json` for each created item. Read back the saved approval; `/api/state` returns it and the page shows the key within
   a few seconds. Report each key/link and any duplicate, unresolved owner, or pending work.

Local locks prevent concurrent writers in this repo; they do not provide server-side Jira
idempotency. Attempt tracking plus reconciliation is needed after an uncertain result.

No Jira create, issue link, or other external write is authorized by processing transcripts
or requesting a draft alone. This workflow creates tickets; it does not edit existing ones.
