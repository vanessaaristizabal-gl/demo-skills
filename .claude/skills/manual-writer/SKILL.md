---
name: manual-writer
description: Write the user-manual section for a backlog item, or record that it needs none. Use when asked to "write the manual sections", "document this item for users", or after meeting-notes has produced backlog items. Works from the item's agreed behaviour and acceptance criteria only; never invents screens, labels or steps. Output is one file per item in manual/.
---

# manual-writer

Every backlog item ends in one of two states. Decide which, per item, and write `manual/<itemId>.json`.

## 1. Does the item change what a user sees or does?

* **Yes** — a Story or Task that gives customers, staff or another role a behaviour or a procedure → write a section.
* **No** → `status: "na"` with a one-line `reason`. Typical cases: a Bug fix (the documented behaviour lives in the
  item that introduced it), a Spike or open question (nothing to document until answered), internal work such as test
  cases, and an item that *is* documentation (its output feeds the manual).

## 2. Write the section (status `draft`)

```json
{ "itemId": "BL-007", "status": "draft", "title": "Using a coupon at checkout", "audience": "Customers",
  "summary": "One sentence: what the user can do.",
  "steps": ["What the user does, in order."],
  "sees": ["What they see or get, from the acceptance criteria."],
  "notes": ["Limits, open questions, what is not specified yet."],
  "source": "BL-007 · acceptance criteria AC1–AC3 · 2026-10-06 meeting", "updatedAt": "YYYY-MM-DD" }
```

* **Audience** is the role that reads it, named by the item (customers, counter staff, Finance…).
* **Only from the source.** Steps come from what the criteria say the user does; `sees` from the expected results.
  Never invent a screen name, button label, menu path or step. If the source does not say, leave `steps` empty and
  say in `notes` what is not specified yet.
* Write in the user's terms and the second person for steps; one sentence each; quote messages and labels exactly
  as the criteria give them.
* Every section is a **draft written before release**. It is verified against the running app before publishing, the
  same way the Development Notes record what was verified and when. Never mark it verified.
* A manual section never contains credentials, personal data or internal ticket discussion.

## 3. Show

List each item as `draft` or `na` with its reason, and say how many sections were written. Do not rewrite a section
that already exists unless its item changed; update it and keep `source` pointing at the new criteria.
