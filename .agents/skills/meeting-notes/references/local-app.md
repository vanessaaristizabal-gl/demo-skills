# Local app contract

Resolve the repository containing `app/server.mjs`, `inbox/`, and `samples/`. Paths below
are relative to that repository. Read `app/app.js` and `app/data.js` if the contract changes.
The server does not call a model: Codex processes files when the user asks, and the browser
polls them every three seconds. The sample's **Process transcripts** button reveals a
precomputed extraction; it does not run Codex.

## Process pending meetings

1. Read `inbox/*.json` with `status: "pending"`. Process all parts of each record together;
   separate meetings stay separate. Skip processed records unless reprocessing was requested.
2. Preserve `id`, `date`, `createdAt`, and `parts` verbatim. `title` and `date` were read by the server from the
   file's `Meeting:` / `Date:` header (the user supplies only the file); you may tidy `title` (drop a company suffix).
   Each part has `name` and `text`. Use the transcript as evidence; report contradictions.
3. Apply the meeting-notes workflow. Only agreed work becomes an item. An agreed investigation
   can be a Spike; an unanswered question without an agreed action remains Related info.
4. Add `meeting` and `items` below. For new items, continue consecutive `BL-` IDs after the
   highest numeric suffix in `app/data.js` and every `inbox/*.json` (including records awaiting
   processing if they already have items). Check draft, manual, edit and approval filenames
   too so an existing handoff ID is never reused. Recheck before writing when another writer
   may be active. Use at least three digits, e.g. `BL-018` after `BL-017`, and at most 40
   characters matching `[A-Za-z0-9_-]+`. Preserve existing IDs on reprocessing, even if an
   older item uses a meeting-based ID. Set each item's `meeting` to the record ID. Never
   renumber items with approvals or existing Jira keys.
5. Fill the item fields the draft generator needs (below) only when supported by the source. Meeting extraction
   must not be blocked by a missing mandatory ticket detail: leave `ac` absent and record the missing detail in `refs`.
   The full ticket draft is written to `drafts/<itemId>.json` by the ticket draft step, not inside this record.
6. Parse and validate the complete JSON before replacing the file. Write a sibling temporary
   file and rename it atomically so browser polls never see half a record. Set `status` to
   `processed` and add `processedAt` only after the output is complete. Preserve other keys.
7. Automatically start the parallel stage: **manual-writer** (`manual/<itemId>.json`) and the **ticket draft**
   (`drafts/<itemId>.json`) for every new item, as described in `AGENTS.md`. Do not wait to be asked.
8. Read back the file. If the server is running, check `/api/meetings` returns the result.
   Report the note, backlog, IDs and anything needed before drafting.

## Meeting schema

`meeting` contains:

| Key | Value |
| --- | --- |
| `id` | Original record ID |
| `date` | Original date |
| `title` | Topic plus ` – Facilitator` when known, without the date (UI adds it) |
| `participants` | Array of source-supported names, without `@` |
| `goals` | String |
| `topics` | Array of `[timestamp, topic, presenter, notes]`, each exactly four strings |
| `actions` | Array of `**Owner:** Action.` strings; the UI renders unchecked items |
| `decisions` | Array of strings containing only closed decisions |
| `related` | Array of labelled open questions, risks, deferred work and links |

Use `Unassigned` for an unknown owner/presenter; leave a timestamp empty when absent.
Never fabricate a facilitator to satisfy the title convention.

## Backlog schema

Each member of `items` contains these fields:

| Key | Value |
| --- | --- |
| `id`, `meeting` | Stable item ID and original meeting ID |
| `title`, `area`, `desc` | Backlog verb phrase, product area, self-contained agreed requirement |
| `source` | Full dated meeting title and available timestamps; identify part if needed |
| `notes` | Dated notes, requester if known, decisions and suggested type with reasoning |
| `type` | Suggested `Epic`, `Story`, `Task`, `Subtask`, `Spike`, `Technical Debt`, or `Bug` |
| `owner`, `prio` | Source-supported owner or `Unassigned`; `high`, `medium`, or `low` |
| `phase` | String: assigned phase, or `N/A` |
| `ticket`, `dev` | `null` and `""` for newly extracted work |
| `refs` | Source-backed risks, dependencies, unresolved questions and their owners |

Do not reuse `BL-001` through `BL-015`: these belong to the sample data.

For a draft ready for the existing UI generator, also supply:

- `ctx`: source-backed context; `validation`: acceptance-criteria validation paragraph.
- `ac`: arrays of exactly `[scenario, caseType, condition, expectedResult]`, all strings.
  Case types are `Happy path`, `Edge case`, `Negative case`, ordered as in ticket-writer.
- Story: `story`, and `rules` if supported. Task / Technical Debt: `objective`.
  Bug: `steps` (string array), `expected`, `current`. Spike: `question`.
- Do not add a new `item.draft` to the inbox record. The ticket-draft stage writes the
  complete draft to `drafts/<itemId>.json`, including types the shared generator cannot
  build. Existing legacy `item.draft` values may be preserved, but are not the output
  format for new work. Drafts stay local and do not authorize creation.

## Transcript files supplied in chat

A request such as “procesa samples/new-meetings/...txt” runs the same full pipeline as
uploading through the page; it is not a request for chat-only output.

1. Read all named files. Group matching `Date:` and `Meeting:` headers into one meeting;
   different headers produce separate records. Derive date/title from those headers, or
   a dated filename if absent, as the server does. Drop a company suffix for display only.
   Do not invent missing metadata; ask the minimum question when it cannot be derived.
2. Create one record per meeting at `inbox/m<epoch-ms>.json`, choosing a unique ID and
   checking that its path does not exist. Include `id`, `status: "processed"`, `createdAt`,
   `processedAt` (actual processing timestamps), `title`, `date`, `parts: [{name, text}]`,
   `meeting`, and `items` from the schemas above. Preserve the original transcript text.
   Compare existing records first; reuse an identical pending source rather than creating
   it twice, and report an already processed source instead of duplicating it.
3. Validate and write atomically, then run manual-writer and the ticket-draft stage for
   every new item without waiting for another request. Return counts and missing details.

For pasted raw notes explicitly intended for the app, use the same local record contract.
If using `POST /api/meetings`, send `{parts: [{name, text}]}` with a source-supported
`Meeting:` / `Date:` header or dated filename; the endpoint derives metadata and returns
`{meetings: [...]}`. Top-level `title` and `date` are ignored by the current endpoint.
Do not alter original source text to manufacture headers; use a local atomic write when
metadata was supplied separately in chat. An explicit chat-only request writes no files.

## Active demo watcher

`AGENTS.md` defines when to run `scripts/watch-inbox.mjs`. It reads pending JSON records,
waits at most 60 seconds per call, and returns a JSON status for the active Codex turn.
It neither processes transcripts nor invokes a model, and it does not wake an ended turn.
Re-arm only during a user-requested demo watch; use the pipeline when it reports pending.
