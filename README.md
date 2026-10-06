# demo-skills

Local demo: meeting transcripts → backlog items → manual sections and Jira ticket drafts (fictional bakery data).
Works offline and with any coding agent harness that reads project instructions and skills
(see [Harnesses](#harnesses)). The page never calls a model or Jira; every handoff is a file you can open.

## Run the demo

```bash
node app/server.mjs        # then open http://localhost:4100
```

Ask your assistant to **start the demo**: it reuses the server if the port already serves this app.

## The flow

The only input is a transcript file. Title and date are read from its header (`Meeting:` / `Date:`).

1. **Hand over the file**: name it in the chat (for example `process samples/new-meetings/2026-10-12-customer-feedback_part1.txt`)
   or load it with **+ Add meeting note** in the page. It lands in `inbox/`.
2. **meeting-notes** runs first and writes the meeting note and the backlog items into the same file.
3. **In parallel**, for every new item (no extra request):
   - **manual-writer** writes `manual/<id>.json` (a draft section, or `na` with the reason).
   - **ticket-writer** writes the temporary draft `drafts/<id>.json`.
4. **Review**: the Backlog shows each item with a *Draft ready* chip and its *Manual* status. Open an item to read its
   ticket draft or to edit the item: saving rewrites the draft, and your edits are kept as an overlay in `edits/`.
5. **Approve**: *Approve and create ticket* saves `approvals/<id>.json` and locks the item. Nothing reaches Jira yet.
6. **Create**: ask the assistant to **create the approved tickets**. With a connected Jira/Atlassian MCP it creates
   each approved draft in Jira project `GIH`, writes the key into the approval file and deletes the temporary draft.
   Without a connector the drafts stay local and approvals remain pending.

The demo treats Jira creation as permanent: tickets cannot be deleted by the user. Approve only what you want to exist.
Keep approval records for created tickets: their keys prevent a second creation. When resetting a local run, remove only
uncreated test approvals.

The sample button **Process transcripts** shows a pre-computed extraction of the pre-loaded meeting; it does not run a model.

## Skills, agents and harnesses

- A **skill** is a folder with a `SKILL.md`: the know-how for one stage. It does not run by itself.
- A **harness** (Claude Code, Codex…) is the program that gives a model tools and permissions.
- An **agent** is an LLM acting through a harness's tools until the task is done.

The pipeline above is defined once per harness in its instruction file. Where a harness can run subagents, stage 3 runs as
two parallel subagents; otherwise the two parts run one after the other with the same result.

## Harnesses

| Harness | Instruction file | Skills |
|---|---|---|
| Claude Code | `CLAUDE.md` | `.claude/skills/` |
| Codex | `AGENTS.md` | `.agents/skills/` (each adds `agents/openai.yaml` and `references/local-app.md`) |

Each harness reads only its own copy, so a change to a skill or to the pipeline must be made in both. To support another
harness, add its instruction file and skills folder with the same pipeline and the file contracts below.

## What is where

| Path | What |
|---|---|
| `app/` | The local demo: `server.mjs` (no dependencies, no credentials), `index.html`, `app.js`, `data.js`, `draft.js` (item → ticket draft, shared by page and server) |
| `CLAUDE.md`, `AGENTS.md` | Per-harness instructions: how to start, the pipeline, what each phrase means |
| `.claude/skills/`, `.agents/skills/` | `meeting-notes`, `ticket-writer`, `manual-writer` for each harness |
| `samples/transcripts/` | The pre-loaded fictional meeting (2026-10-06, two parts) |
| `samples/new-meetings/` | Transcripts to hand to the assistant (several scenarios) |
| `samples/meeting-note-2026-10-06.md` | The note and backlog table `meeting-notes` produces from the pre-loaded meeting |
| `inbox/` | A meeting from a loaded file, then its note and items once processed |
| `manual/` | One file per backlog item: the section, or `na` with its reason. Shown in the Manual tab and the Backlog's Manual column |
| `drafts/` | Temporary ticket drafts, one per item without a ticket; rewritten on item edit, deleted after creation |
| `edits/` | Your edits to backlog items, one overlay per item |
| `approvals/` | Approved drafts waiting for creation, then the created key |
| `artifact/` | Local copy of the earlier claude.ai artifact (not needed for the demo) |

Jira project for tests: `GIH` (Gorilla Impact Hub), a shared team board with Epic, Task and Subtask only. It also requires
Start date, Due date and Practice & learning path, which the meeting never provides: the assistant asks for them.
