# CLAUDE.md

Demo: meeting transcripts → backlog items → Jira tickets (fictional bakery data). Skills live in
`.claude/skills/` (`meeting-notes`, `ticket-writer`, `manual-writer`). The user's language is Spanish; tickets are English.

## Start (when the user says "inicia la demo" or similar)

1. If http://localhost:4100 already serves this app, reuse it. Otherwise start it in the background: `node app/server.mjs` (port 4100). Tell the user to open
   http://localhost:4100. Do not use claude.ai: the user cannot open it in a browser.
2. Arm the inbox watcher so a meeting saved from the page wakes you (background Bash, up to 2 h):
   `until find inbox -name '*.json' -exec grep -l '"status": "pending"' {} + 2>/dev/null | grep -q .; do sleep 2; done; echo NEW`
   Never use a bare `inbox/*.json` glob: zsh aborts when it matches nothing. Re-arm after each meeting.

## Pipeline (runs by itself; the only input is a meeting transcript file)

The user never fills in titles, dates or tickets. Everything is derived from the transcript, as sequential stages with
a parallel fan-out. Use the Agent tool for stage 2 so both agents run at the same time.

1. **meeting-notes** (sequential, needs the transcript): writes the meeting note and the backlog items.
2. **In parallel, once the items exist** (both depend only on the items, not on each other):
   - **manual-writer agent:** writes `manual/<itemId>.json` (`draft` or `na`) for every new item.
   - **ticket-draft agent:** follows `ticket-writer` up to the draft (steps 1–6, read-only Jira searches for duplicates
     and existing labels) and writes the temporary file `drafts/<itemId>.json`
     (`{itemId, status: "draft", origin: "agent", updatedAt, draft}`, `draft` as built by `app/draft.js`, plus
     `checks`/`labels` when found). It creates nothing in Jira. If it writes nothing, the server fills the gap
     from the item's fields.
3. Say how many items were extracted, how many manual sections were drafted or `na`, and how many drafts are ready.

**Drafts are temporary local files.** `drafts/<itemId>.json` exists only while the ticket does not. When the user edits
a backlog item in the page, the server rewrites that file (`origin: "edit"`) so the draft always follows the row. Edits
live in `edits/<itemId>.json` and are an overlay; never change them yourself. When a ticket is created (see below),
delete the item's `drafts/` file. Approved items are locked: edits are refused.

## Trigger A: the watcher fires (a file was loaded from the page)

For every `inbox/*.json` with `"status": "pending"`:
1. Read all its `parts` as one meeting and follow the `meeting-notes` skill. The server already read `title` and `date`
   from the file header; you may tidy `title` (drop the company suffix) but never change `id`, `date` or `parts`.
2. Write the result **into the same file**: set `"status": "processed"`, add `"meeting"`
   (`participants`, `goals`, `topics` as `[time, topic, presenter, notes]`, `actions`, `decisions`, `related`)
   and `"items"`.
3. Each item has the shape of `BL-007`…`BL-015` in `app/data.js`: `id, title, type, area, owner, prio, phase,
   desc, source, notes, ctx` plus by type `story`+`rules` (Story), `objective` (Task), `question` (Spike),
   `steps`+`expected`+`current` (Bug), and `ac` (`[scenario, caseType, condition, expected]`), `validation`, `refs`.
   `source` = `<date> <meeting title> · <timestamp>`. Item ids continue after the highest `BL-` id used in
   `app/data.js` and in all `inbox/*.json`. Never invent a rule, owner, number or date; only agreed work becomes an item.
4. Run stage 2 of the pipeline. Do **not** create Jira tickets. Re-arm the watcher.

## Trigger B: a transcript file given in chat (for example "procesa samples/new-meetings/2026-10-09-delivery-zones_part1.txt")

1. Read every file the user names. Files with the same `Date:` and `Meeting:` header are parts of one meeting.
2. Create `inbox/m<epoch-ms>.json` yourself, already `"status": "processed"`: `id`, `title` and `date` from the header
   (`Meeting:` without the company suffix, `Date:`), `parts` as `[{name, text}]`, then `meeting` and `items` exactly as in
   Trigger A (follow the `meeting-notes` skill).
3. Run stage 2 of the pipeline. Do **not** create Jira tickets.

## "write the manual sections"

For every backlog item without a `manual/<itemId>.json` (all items in `app/data.js` and in processed `inbox/*.json`),
follow the `manual-writer` skill: decide `draft` or `na` per item and write the file. The Backlog's *Manual* column
and the *Manual* tab update by themselves. Never overwrite an existing section unless its item changed. Do not create
Jira tickets here.

## "create the approved tickets"

For every `approvals/*.json` with `"status": "approved"` and no `key`:
1. Follow `ticket-writer` against Jira project `GIH` (cloud id: `gorillalogic.atlassian.net`). GIH has only Task,
   Epic and Subtask: create as Task. Use `draft.summary`, `draft.description` (Markdown) as given.
   GIH also requires Start date (`customfield_10302`), Due date (`duedate`) and Practice & learning path
   (`customfield_11985`, cascading select). The meeting never provides them: ask the user, never invent them.
2. Look up the owner named in the description with `lookupJiraAccountId`; assign only on exactly one match.
3. Create with the Atlassian MCP, read it back, then write `"status": "created"`, `"key"` and `"url"`
   into the same approval file, and delete `drafts/<itemId>.json`. Never create an item whose file already has a `key`.
4. Report each key and link.

## Rules

- Jira tickets cannot be deleted. Create only what has an approval file, and only after the user asks.
- Use fictional/dummy data only; never real email addresses or personal data in tickets or samples.
- `samples/transcripts/` is the pre-computed example; `samples/new-meetings/` are transcripts to load with
  **+ Add meeting note**. To start a clean run, delete `inbox/*.json` and `approvals/*.json`.
