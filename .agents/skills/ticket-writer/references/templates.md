# Ticket templates

Same headings, same order, same fixed lines. Optional sections are dropped when empty.

## Epic

```markdown
## Business Goal
<The business problem and the outcome the initiative should achieve.>

## Scope
- In scope: <…>
- Out of scope: <only if needed — omit this line otherwise>

## References, Risks and Dependencies
<Key links, risks, constraints, dependencies. Omit the section if there are none.>
```

The Epic says *why* and *what outcome*. No field-by-field requirements, technical analysis or per-story
criteria — those live in the child tickets.

## Story

```markdown
## Context
<The current situation, the problem, and why the change is needed.>

## User Story
As <role>, I want <capability>, so that <benefit>.

## Acceptance Criteria
- AC1: …

## Business Rules
<Rules not already covered by the acceptance criteria. Optional.>

## References, Risks and Dependencies
<Links, risks, constraints, dependencies. Optional.>

## Definition of Done
- [ ] Acceptance criteria met.
- [ ] Developer testing and sanity check completed.
- [ ] Peer review approved.
- [ ] QA validation approved.
- [ ] Demo completed.
- [ ] Documentation updated, if applicable.
- [ ] Release status and evidence recorded.

## Completion Evidence
Pending — to be linked as it becomes available.
```

## Task

```markdown
## Context
<The current situation and why this work is needed.>

## Objective and Deliverable
<What must be completed and the expected deliverable.>

## Acceptance Criteria
- AC1: …

## References, Risks and Dependencies
<Links, risks, constraints, dependencies. Optional.>

## Completion Checklist
- [ ] Deliverable completed.
- [ ] Acceptance criteria met.
- [ ] Required validation completed.
- [ ] Review and approval recorded.
- [ ] Documentation updated, if applicable.

## Completion Evidence
Pending — to be linked as it becomes available.
```

## Subtask

```markdown
## Objective and Deliverable
<The specific work to complete and the expected deliverable.>

## Completion Criteria
- <Verifiable condition required to complete this subtask.>

## References and Dependencies
<Links, constraints, blockers. Optional.>

## Completion Evidence
Pending — to be linked as it becomes available.
```

## Spike

The output is **an answer**, not a feature. Findings do not go in the ticket: Completion Evidence links to
wherever they are recorded.

```markdown
## Context
<What triggered the question, with evidence.>

## Question and Deliverable
<The question, phrased so it can be answered ("Decide whether…", "Determine which…"), and the expected
deliverable: a recommendation, a decision, options with consequences, follow-up tickets.>

## Acceptance Criteria
- AC1: …

## References, Risks and Dependencies
<Documentation, related tickets. Optional.>

## Completion Checklist
- [ ] Question answered.
- [ ] Findings documented.
- [ ] Decision or recommendation recorded.
- [ ] Follow-up tickets created, if applicable.

## Completion Evidence
Pending — to be linked as it becomes available.
```

## Technical Debt

Works but should not stay as it is: no new capability, no defect. If users are affected it is a Bug; if
someone gains a capability it is a Story.

```markdown
## Context
<What exists today and why it is a problem: maintenance cost, risk, noise, a limit that will be hit.>

## Objective and Deliverable
<The state to reach, and the behaviour that must not change.>

## Acceptance Criteria
- AC1: …

## References, Risks and Dependencies
<Links, risks, dependencies. Optional.>

## Completion Checklist
- [ ] Deliverable completed.
- [ ] Acceptance criteria met.
- [ ] Required validation completed.
- [ ] Review and approval recorded.
- [ ] Documentation updated, if applicable.

## Completion Evidence
Pending — to be linked as it becomes available.
```

## Bug

A difference between what should happen and what happens, reproducible without asking anyone. When the
project has no fields for them, steps, expected and actual behaviour go in the description.

```markdown
## Context
<What the user was doing and where it was found.>

## Steps to Reproduce
1. <From a state the reader can reach.>

## Expected Behavior
<…>

## Current Behavior
<Literal error text in code formatting.>

## Acceptance Criteria
- AC1: …

## Workaround
<What people do today. Optional.>

## References, Risks and Dependencies
<Evidence — screenshots, record IDs — links, dependencies. Optional.>

## Completion Checklist
- [ ] Fix completed.
- [ ] Acceptance criteria met.
- [ ] Fix verified in the environment where it failed.
- [ ] Review and approval recorded.
- [ ] Documentation updated, if applicable.

## Completion Evidence
Pending — to be linked as it becomes available.
```
