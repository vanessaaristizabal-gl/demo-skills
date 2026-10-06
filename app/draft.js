// Ticket draft builder, shared by the page (window.DraftBuilder) and the local server (evaluated with a fake window).
// Given a backlog item it returns the Jira draft ticket-writer would produce, or null when the item lacks details.
(function (root) {
const acLine = (a, n) => {
  const cond = a[2].replace(/\.$/, ""), res = a[3].replace(/\.$/, "");
  return "- AC" + (n + 1) + ": **" + a[0] + "** (" + a[1] + ") — " + cond + ". Expected: " + res + ".";
};
function buildDraft(it) {
  it = { ctx: it.desc, ac: [], steps: [], refs: "", validation: "", ...it };
  // A Codex draft already contains the exact template and verified/unverified checks.
  if (it.draft) return { ...it.draft, itemId: it.id, source: it.source };
  // Older backlog rows may still need source details before a ticket can be drafted.
  if (!Array.isArray(it.ac) || !it.ac.length || !it.ctx || !it.validation ||
      (it.type === "Story" && !it.story) ||
      (it.type === "Bug" && (!Array.isArray(it.steps) || !it.expected || !it.current)) ||
      (it.type === "Spike" && !it.question) ||
      (it.type === "Task" && !it.objective) ||
      !["Story", "Bug", "Spike", "Task"].includes(it.type)) return null;
  const ac = it.ac.map(acLine).join("\n");
  const typeNote = (it.type === "Task" ? "" : "Type: " + it.type + " (created as Task; this Jira project has no " + it.type + " type).\n\n") +
    (it.owner !== "Unassigned" ? "Proposed owner (from the meeting): " + it.owner + ".\n\n" : "") +
    (it.phase !== "N/A" ? "Phase: " + it.phase + ".\n\n" : "");
  const refs = it.refs ? "\n\n## References, Risks and Dependencies\n" + it.refs : "";
  const evidence = "\n\n## Completion Evidence\nPending — to be linked as it becomes available.";
  const checklist = (first) => "\n\n## Completion Checklist\n- [ ] " + first + "\n- [ ] Acceptance criteria met.\n- [ ] Required validation completed.\n- [ ] Review and approval recorded.\n- [ ] Documentation updated, if applicable.";
  let md;
  if (it.type === "Story") {
    md = "## Context\n" + typeNote + it.ctx + "\n\n## User Story\n" + it.story + "\n\n## Acceptance Criteria\n" + ac +
      (it.rules ? "\n\n## Business Rules\n" + it.rules : "") + refs +
      "\n\n## Definition of Done\n- [ ] Acceptance criteria met.\n- [ ] Developer testing and sanity check completed.\n- [ ] Peer review approved.\n- [ ] QA validation approved.\n- [ ] Demo completed.\n- [ ] Documentation updated, if applicable.\n- [ ] Release status and evidence recorded." + evidence;
  } else if (it.type === "Bug") {
    md = "## Context\n" + typeNote + it.ctx + "\n\n## Steps to Reproduce\n" + it.steps.map((s, n) => (n + 1) + ". " + s).join("\n") +
      "\n\n## Expected Behavior\n" + it.expected + "\n\n## Current Behavior\n" + it.current + "\n\n## Acceptance Criteria\n" + ac + refs + checklist("Fix completed.").replace("Required validation completed.", "Fix verified in the environment where it failed.") + evidence;
  } else if (it.type === "Spike") {
    md = "## Context\n" + typeNote + it.ctx + "\n\n## Question and Deliverable\n" + it.question + "\n\n## Acceptance Criteria\n" + ac + refs +
      "\n\n## Completion Checklist\n- [ ] Question answered.\n- [ ] Findings documented.\n- [ ] Decision or recommendation recorded.\n- [ ] Follow-up tickets created, if applicable." + evidence;
  } else {
    md = "## Context\n" + typeNote + it.ctx + "\n\n## Objective and Deliverable\n" + it.objective + "\n\n## Acceptance Criteria\n" + ac + refs + checklist("Deliverable completed.") + evidence;
  }
  return { project: "GIH", issueType: "Task", intendedType: it.type, summary: it.title, priority: it.prio, description: md, itemId: it.id, source: it.source, validation: it.validation };
}
root.DraftBuilder = { buildDraft: buildDraft };
})(window);
