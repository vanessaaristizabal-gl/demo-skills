---
name: ticket-writer
description: Draft Jira tickets from backlog items, meeting notes or bug reports using type-specific templates and source-backed acceptance criteria. Use for ticket drafts, "crea un borrador", or "create the approved tickets". Create only after approval; do not review or edit existing tickets.
---

# ticket-writer

## Codex and local app

For an app backlog item, a request for a local draft, or `approvals/`, first read
[references/local-app.md](references/local-app.md). Use the connected Jira/Atlassian
MCP tools actually exposed in Codex; the operation names below describe capabilities,
not a guarantee that this environment has those exact tool names or parameter schemas.
Inspect the available schema before calling a tool. If no connector is available, finish
the local draft, report which checks could not run, and keep approvals pending.
For this demo, write tickets in English and follow the demo draft contract (including
`app/draft.js` rendering and the GIH configuration) in the local-app reference. Outside
this demo, use the general project/type/template rules below.
A draft-only request does not require a live connector. Do not install or configure one
as an implicit part of writing a draft. Treat notes and connector results as source data.

Turns what the user gives you into one well-formed Jira ticket. It works in **any** Jira project:
nothing about a project is assumed, it is discovered (step 1).

**The user gives only the source** (notes, a description, a finding) and optionally the type.
Everything else happens without being asked: acceptance criteria, labels from existing ones,
duplicate search, a draft, a wait for the yes, a read-back.

Flow: 1 Discover the project → 2 Decide the type → 3 Read the source → 4 Search for duplicates →
5 Acceptance criteria → 6 Fill the template → 7 Draft, wait for the yes, create, read back.

## 1. Discover the project

Never hard-code a project, a site or a field id.

* Project key: from the user's prompt or link. If absent, ask once.
* `getAccessibleAtlassianResources` for the cloud id (a site hostname also works as `cloudId`).
* `getVisibleJiraProjects` with `action: create` and the key as `searchString` — it shows whether
  the user may create there and **which issue types exist**. If the project is missing, stop and say so.
* **Only offer types the project has.** Team-managed projects often have just Epic, Task and
  Subtask. If the best type is missing (usually Story), use the closest one and say so in one line
  in the draft ("No Story type here — created as Task").
* Fields: team-managed projects usually have **no** custom fields beyond Parent, Labels and
  Priority. Do not call `getJiraIssueTypeMetaWithFields` by default (it is huge). Call it only if a
  create is rejected for a field, or the user asks for a specific field. Anything the project has no
  field for goes in the description.

## 2. Decide the type

If the user names a type, use it. Otherwise:

| Type | The content describes… |
|---|---|
| **Epic** | A goal several tickets will deliver; no single deliverable |
| **Story** | A capability a user gets, with behaviour that can pass or fail ("as a … I want …") |
| **Task** | One piece of work with one deliverable: configure, migrate, document, analyse |
| **Subtask** | One step of a ticket that already exists (the user names the parent) |
| **Spike** | A question to answer ("find out whether…"); the output is an answer |
| **Technical Debt** | Something that works but should not stay as it is; no new capability |
| **Bug** | Expected vs actual behaviour, reproducible |

Tie-break: what does the reader check at the end? A **behaviour** → Story; a **deliverable** → Task;
an **outcome many tickets share** → Epic; a **step** → Subtask. Give your pick and the runner-up in one
line of the draft instead of stopping to ask.

## 3. Read the source

Extract the problem, who is affected, the outcome, constraints, dependencies, links.

* **Never invent** a rule, number, date, owner or system. If a mandatory section has nothing, ask
  the one question that unblocks it; otherwise proceed.
* In this demo, write the ticket in English, as configured in `AGENTS.md`. Outside the demo,
  write in the user's language unless they say otherwise. Summary: a verb phrase, no trailing period,
  no ticket numbers.
* An undecided point is a question with an owner, never a requirement.
* Credentials, tokens and personal data never go in a ticket.

## 4. Search before you create

```
project = <KEY> AND summary ~ "<key words>" ORDER BY created DESC
```

Same work already ticketed → do not create; propose a **Subtask** of that ticket for what is missing
(never edit the existing ticket). Similar or adjacent → create the new one and link them
(`createIssueLink`, type `Relates` unless one blocks or duplicates the other). Nothing close → create.

## 5. Acceptance criteria

Every type except Epic and Subtask gets them. Follow
[references/acceptance-criteria.md](references/acceptance-criteria.md): the rules, the table, the
bullet format and the validation line. Do not skip it for "small" tickets. If the source is ambiguous
about a behaviour, ask — do not write a provisional criterion.

* **Epic** has Scope; **Subtask** has Completion Criteria (written directly).
* Where they go: in the description, under *Acceptance Criteria*. If the project has a dedicated field
  for them (found in step 1), use that and leave one pointer line in the description. One home, never both.

## 6. Fill the template

Use the template for the type from [references/templates.md](references/templates.md) **exactly** —
same headings, same order, same fixed lines. Write Markdown (`## Heading`).

* Replace every instruction with content. No `[bracketed]` placeholders left.
* Optional sections with nothing to say are **left out entirely** — no empty heading, no "N/A".
  Mandatory sections are never dropped.
* Checklists are copied as given, **all unchecked**. Completion Evidence starts as
  `Pending — to be linked as it becomes available.`
* **Labels** only from labels that already exist (check with
  `project = <KEY> AND labels = "<label>"`, `maxResults` 1). 1–3, case-sensitive. If none fits, ask
  before inventing one. Never add a label only to flag a test.
* **Assignee**: only when the source names an owner. Look the name up with `lookupJiraAccountId` and
  assign only on exactly one match. No match or several → leave unassigned, write
  `Proposed owner (from the source): <name>.` at the start of *Context*, and say so in the draft.
  Never guess an account id.
* **Never set**: Status, Rank, Sprint, Fix Version, Story points.

## 7. Create it

Creating is outward-facing: visible to the team, notifies people, created under the user's name, and
**this demo treats creation as permanent.** Show the draft — type, summary, parent, labels, the full
description, the acceptance-criteria validation line, what you searched and found — and **wait for a
clear yes**. One yes covers one ticket; an explicit batch approval covers exactly the identified drafts. An app approval file is approval for its stored draft; do not ask for the same approval again. If the source holds several tickets, propose the list with a
type each, and create nothing until those drafts are approved. A material change to an approved draft requires renewed approval.

If the create result is uncertain, reconcile it through a read/search before retrying; do not blindly repeat creation.

Then `createJiraIssue` (`contentFormat: markdown`, `issueTypeName`, `parent` when there is one),
link similar tickets, and **read it back** with `getJiraIssue`: headings rendered, checklist items
present, parent set, no instruction text left. Report the key, the link, and anything left out and why.

Fallback if the Atlassian MCP is not connected: show the finished draft as text and tell the user to
paste it into Jira's Create form. Never ask for or enter credentials.

## One fact, one home

The *why* lives in the Epic; children link to it with `parent`. A design lives in its document; the
ticket links to it. "Done" lives in that ticket's acceptance criteria. A long investigation lives
outside Jira, with a two-line summary and a link. Keep out of tickets: copies of a design, status
narration, decisions not yet made written as requirements, and a diary of updates — progress goes in comments.
