# Local manual contract

Resolve the repository containing `app/server.mjs`, `inbox/` and `manual/`. Paths below are relative to
that repository. The server does not call a model: Codex writes files when the user asks, and the browser polls
`/api/manual` every three seconds. The Backlog's **Manual** column and the **Manual** tab render what is there.

This runs automatically as the parallel stage right after meeting-notes (see `AGENTS.md`): the user does not have to
ask. It depends only on the items, so it can run at the same time as the ticket draft step.

## Which items

Items come from `app/data.js` (sample items `BL-001`…`BL-015`) and from every `inbox/*.json` with
`status: "processed"` (`items`). An item without `manual/<itemId>.json` is **Pending** in the UI. Never create a
file for an item that does not exist. Do not touch `approvals/` or Jira.

## One file per item: `manual/<itemId>.json`

`<itemId>` must match `[A-Za-z0-9_-]+` and be the item's `id` exactly.

Section to write (`status: "draft"`):

| Key | Value |
| --- | --- |
| `itemId`, `status` | The item's ID, and `"draft"` |
| `title` | What the user does, as a short noun phrase |
| `audience` | The role that reads it |
| `summary` | One sentence: what the user can do |
| `steps` | Array of strings; empty when the source states none |
| `sees` | Array of strings from the acceptance criteria's expected results; may be empty |
| `notes` | Array of strings: limits and what is not specified yet; may be empty |
| `source` | Item ID, the criteria used (for example `AC1–AC3`) and the meeting date |
| `updatedAt` | `YYYY-MM-DD` |

No section needed (`status: "na"`): only `itemId`, `status`, `reason` (one sentence) and `updatedAt`.

The UI requires `steps`, `sees` and `notes` to be arrays on a draft and shows `reason` for `na`.

## Writing

1. Read the item, its acceptance criteria (`ac`) and its meeting note. Apply the manual-writer rules.
2. Skip items that already have a file unless the item changed since; then update it and keep `source` accurate.
3. Parse and validate the JSON, write a sibling temporary file and rename it atomically so browser polls never see a
   half-written record.
4. If the server is running, check `/api/manual` returns the file. Report how many were `draft` and `na`, and why.
