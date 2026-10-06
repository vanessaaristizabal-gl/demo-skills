# Demo workflow in Codex

This local app turns a meeting transcript into notes, backlog items, manual sections and reviewable Jira drafts.
The user's only input is the transcript file; titles, dates, items, manuals and drafts are derived from it.
Talk to the user in Spanish; write Jira ticket summaries and descriptions in English, as in Claude's demo.

## Start and watch (when asked to start the demo)

1. Reuse `http://localhost:4100` if it serves this app; otherwise run `node app/server.mjs`
   and open the local page. Read meeting-notes and its local-app reference.
2. During the active demo turn, watch for pending meetings with:
   `node .agents/skills/meeting-notes/scripts/watch-inbox.mjs --timeout-ms 55000`.
   This read-only helper returns structured JSON: `pending` with file paths, `waiting` on
   timeout, or `error` with details. Use short tool yields and resume a running shell session
   to receive its result; do not launch a detached process and assume it wakes the model.
3. On `pending`, process those records and run the pipeline below, then re-arm the watcher.
   On `waiting`, re-arm while the requested demo watch remains active; limit one watch
   session to two hours and stop when the user asks. Explain an error before retrying.
   Give concise progress updates at least every 60 seconds during an active turn.
4. The helper does not wake a finished Codex chat. If the turn has ended, the user can say
   “procesa las reuniones pendientes” to resume. Future scheduled wakeups require a
   separately requested Codex automation; do not claim a background shell provides them.
   Updating these instructions alone does not start a watch session.
5. Enumerate files with filesystem tools or `rg --files inbox -g '*.json'`, rather than a
   bare `inbox/*.json` shell glob that fails in zsh when the directory is empty.

## Skills are the know-how, agents run them

Skills in `.agents/skills/` are instruction folders; they do not run by themselves. Codex (the agent) reads a skill when
a stage needs it. The pipeline below is how the stages are sequenced; when Codex can spawn subagents, run stage 2 as two
parallel subagents, otherwise run the two parts one after the other (the result is identical).

1. **meeting-notes** (sequential): for a transcript file named in chat, or `inbox/*.json` with `status: "pending"`
   (the page saves a loaded file there; the server already read `title` and `date` from the file header), read
   `.agents/skills/meeting-notes/SKILL.md` and its local-app reference. Write the note and items into the same record.
   For a file supplied in chat, first group all named parts by `Date:` and `Meeting:`;
   create one new `inbox/m<epoch-ms>.json` per meeting, preserving the original parts.
   Allocate new item IDs consecutively after the highest `BL-` ID in sample and inbox data.
   The local-app reference defines the full record; a file-processing request includes saving it in this app.
2. **In parallel, once the items exist** (they depend only on the items, not on each other):
   - **manual-writer**: read `.agents/skills/manual-writer/SKILL.md` and its local-app reference. Write
     `manual/<itemId>.json` (`draft` or `na`) for every new item.
   - **ticket draft**: read `.agents/skills/ticket-writer/SKILL.md` and its references, stopping before creation. Write
     the temporary file `drafts/<itemId>.json`. Read-only Jira searches only; nothing is created.
3. Report items extracted, manual sections (`draft`/`na`) and drafts ready. Do not wait to be asked for stage 2.

## Files and who owns them

- `inbox/*.json` holds transcripts and processed output; `approvals/*.json` holds human-approved drafts and eventual
  Jira keys. Preserve source records, item IDs and existing approvals.
- `drafts/<itemId>.json` is a temporary local draft that exists only until the ticket does. When the user edits a backlog
  item in the page, the server rewrites that file; edits live in `edits/<itemId>.json` as an overlay: never change them.
  Delete an item's `drafts/` file once its ticket is created. Approved items are locked.
- `manual/<itemId>.json` is written by manual-writer; it never writes `approvals/` or Jira.

## Rules

- Processing transcripts or drafting does not authorize Jira creation. Existing app approval plus a request to
  create approved tickets (“create the approved tickets” / “crea los tickets aprobados”) does; do not request it again.
- The demo target is project `GIH` on `gorillalogic.atlassian.net`. Create its approved
  backlog tickets as Task, preserving the approved summary and Markdown description.
  The latest Claude configuration records required Start date (`customfield_10302`), Due date
  (`duedate`) and Practice & learning path (`customfield_11985`, cascading select).
  Read the ticket-writer local-app reference: obtain missing values from the user, verify
  the live field schema/options, and never infer those values from a meeting date.
- Without an available Jira connector, finish local drafts and report unverified checks.
  Keep pending approvals intact and never invent Jira keys, IDs or successful tool results.
- Run the dependency-free app with `node app/server.mjs` at `http://localhost:4100`.
  Reuse an existing instance if that port already serves this app. The sample extraction
  in `app/data.js` is precomputed; it is not evidence of live model execution.
- Keep the original Claude skills in `.claude/skills/` available alongside the Codex skills.
- Use fictional/dummy data for this demo; do not add real email addresses or personal data to tickets or samples.
