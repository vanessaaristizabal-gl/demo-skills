---
name: meeting-notes
description: Turn one or more transcripts of the same meeting into a meeting-notes page in the GIP Confluence format (Date, Participants, Goals, Discussion topics, Action items, Decisions, Related info) and extract the backlog items it produces, in the Client Requested backlog structure. Use when given a transcript, recording summary or raw notes and asked to "write the meeting notes", "extract the backlog items", or "prepare the notes for tickets". Does not create tickets — hand each approved backlog item to ticket-writer.
---

# meeting-notes

A meeting can have several transcript parts. The output is **one** meeting-notes page plus the
backlog items it generated. Tickets are a later, separate step (`ticket-writer`).

Flow: 1 Gather the transcripts → 2 Write the meeting note → 3 Extract backlog items → 4 Show both.

## 1. Gather

Read every part of the same meeting (same date and title) as one source.

**Who is in the room.** Usually stakeholders say what they need, and a developer or analyst mediates:
checks what is feasible, narrows it, and agrees what will be done. Nobody says "this is a Story" or
"add it to the backlog". Read for three things and keep them apart:

* **Needed** — what a stakeholder asked for, in their words.
* **Agreed** — what the mediator and the stakeholder settled on (possibly narrower than the ask).
* **Declined or deferred** — said and set aside. It is not a backlog item; it goes in *Related info*.

Only **agreed** work becomes a backlog item. Do not rely on anyone saying "action", "decision" or
"phase"; infer it from what was settled. Keep each statement's
timestamp so every item can say where it came from. Never invent a participant, date, number or owner;
a missing owner is `Unassigned`, a missing priority is `medium`.

## 2. Meeting note — GIP format

Title: `YYYY-MM-DD <Topic> – <Presenter or facilitator>`. Sections, in this order and with these names:

```markdown
## Date
<YYYY-MM-DD>

## Participants
- @<Name>

## Goals
<One or two sentences: why the meeting happened. Abbreviations defined here.>

## Discussion topics
| Time | Topic | Presenter | Notes |
| --- | --- | --- | --- |
| <mm:ss of the first mention> | **<Topic>** | @<Who led it> | <What was said, in the third person, short> |

## Action items
- [ ] **<Owner>:** <Action>.

## Decisions
- <Decision, one line each>

## Related info
- <Open questions, risks, links>
```

* One row per topic, in the order discussed. Notes describe what was said or agreed, not a transcript.
* Action items are checkboxes, **all unchecked**, each with an owner.
* A decision is something the group closed. An undecided point is an open question, never a decision.
* Open questions and risks go in *Related info*, labelled `Open question:` / `Risk:`.

## 3. Backlog items — Client Requested structure

Each item becomes one row with these columns, in this order:

| Backlog Item | Area | Description | Source/Meeting | Jira Ticket | Notes | Development Notes | Phase |
|---|---|---|---|---|---|---|---|

* **Backlog Item** — a short verb phrase.
* **Area** — the object or part of the product the work touches (Cart, Orders panel, Catalog…).
* **Description** — what is needed and why, complete enough that a ticket can be written without
  reopening the transcript. Never invent detail.
* **Source/Meeting** — the meeting note title and the timestamp(s).
* **Jira Ticket** — `—` until a ticket exists; then the key and type, e.g. `BAK-101 (Task)`.
* **Notes** — `YYYY-MM-DD — <item>: [Requested by: <Name>.]` plus decisions, risks or caveats.
* **Development Notes** — empty at extraction; filled later with what was verified and when.
* **Phase** — the development phase the meeting assigns (`1`, `2`…), usually what must ship first versus
  what can wait. Only if the source states it; otherwise `N/A`. Record the phase decision in *Decisions*.

**Suggested ticket type.** Nobody in the meeting names a type, and the notes' own headings
(*Action items*, *Decisions*) are written by this skill, so they are not evidence. Propose the type from
the **nature of what was agreed**, and mark it as a suggestion:

* a behaviour people will get, that can pass or fail → Story
* one piece of work with a deliverable → Task
* something that should work and does not → Bug
* a question that must be answered before work can be planned → Spike
* an outcome that several items share → Epic (group items; never from one item)

`ticket-writer` confirms or corrects the type when it drafts, using what the project allows, and a person
approves it. Put one line of reasoning in the item's Notes (for example *Suggested type: Story — a
behaviour customers will see*). A risk becomes an item only if someone agreed to act on it. If the same
thing was discussed twice, make **one** item.

Also give each item a **priority** (from the urgency or date a stakeholder gave, else `medium`) and the
**owner** (who took it on in the meeting, else `Unassigned`) — they feed the ticket later.

## 4. Show

Return the meeting note, then the backlog table, then one line per item saying which type of ticket it
would become. Ask nothing unless a mandatory piece is missing. The example output for the sample in
`samples/transcripts/` is `samples/meeting-note-2026-10-06.md`.
