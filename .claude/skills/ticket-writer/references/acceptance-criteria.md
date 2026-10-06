# Acceptance criteria

Condensed from the team's `gl-acceptance-criteria-generator`, self-contained so this skill works outside
any one repository.

## Perspective

Think like a Product Owner: business value over implementation, the smallest set that completely defines
done, language a non-technical stakeholder understands.

## Process

1. List every behaviour the source requires (actor, trigger, rule, failure behaviour). Ignore
   implementation constraints and out-of-scope items — they are not positive behaviour.
2. If a behaviour is ambiguous or contradictory, ask the minimum targeted question. Do not write a
   provisional criterion for it.
3. Draft the smallest set that covers every behaviour. Consolidate equivalent ones; split only when
   conditions differ or outcomes can fail independently.
4. Check every criterion traces back to the source, and every behaviour is covered.

## Quality rules

- Never invent a rule, threshold, actor, trigger, error behaviour or outcome.
- One coherent business scenario per criterion. Conditions apart from expected results.
- Specific, observable, testable. Behaviour, not code or architecture.
- No Gherkin (Given/When/Then). No ticket keys or other criteria's numbers inside a criterion.
- Include happy paths, edge cases and negative cases **only if the source supports them**; if it supports
  no edge or negative case, say so in the validation instead of inventing one.

## Table (working form)

| # | Case type | Scenario | Condition | Expected result |
|---|---|---|---|---|
| AC-1 | Happy path / Edge case / Negative case | Short name | Precondition and triggering action | Observable outcome |

Order: all happy paths, then edge cases, then negative cases. Number without gaps.

## Rendering in the ticket

One bullet per row, `AC-1` becomes `AC1`, case type copied exactly:

`- AC1: **<Scenario>** (<Case type>) — <Condition>. Expected: <Expected result>.`

Do not add, merge or reword while converting.

## Validation line (shown in the draft)

One short paragraph: criteria are testable, specific and traceable; every behaviour in the source is
covered; nothing unsupported was added; and which case types were omitted for lack of source support.
Anything the source leaves open goes in *References, Risks and Dependencies* as an open question with
its owner.

## Example

Source: "A user resets their password from the login screen. For a registered email the system sends a
link within 1 minute and shows 'Check your email'. A link expires after 24 hours; opening it afterwards
shows 'This link expired, request a new one' and does not allow the change. For an unregistered email the
same 'Check your email' message shows, but no email is sent."

- AC1: **Valid password-reset request** (Happy path) — A user enters a registered email on the login screen and selects "Forgot password". Expected: a reset link is sent within 1 minute and "Check your email" is shown.
- AC2: **Expired reset link** (Edge case) — A user opens a reset link after it has expired. Expected: the password cannot be changed and "This link expired, request a new one" is shown.
- AC3: **Unregistered email address** (Negative case) — A user enters an unregistered email and selects "Forgot password". Expected: no email is sent and the same "Check your email" message is shown without revealing whether an account exists.
