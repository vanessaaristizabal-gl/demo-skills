// Demo UI. State lives in memory; approvals live on disk (server.mjs → ../approvals/*.json).
const D = window.DEMO;
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const inline = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/`(.+?)`/g, "<code>$1</code>");
const JIRA = "https://gorillalogic.atlassian.net/browse/";
const PRIO = { high: "High", medium: "Medium", low: "Low" };

const state = { filter: "all", tab: "backlog", meeting: "m3", openId: null, approvals: {}, transcripts: [], audit: [], fresh: new Set(), busy: false, adding: false, manual: {}, manualSel: null, drafts: {}, edits: {} };
// Items from an unprocessed meeting are not in the backlog yet.
const visible = () => D.items.filter((i) => D.meetings.find((m) => m.id === i.meeting).processed);
const meetingOf = (i) => D.meetings.find((m) => m.id === i.meeting);
const ticketOf = (i) => {
  const a = state.approvals[i.id];
  if (a && a.key) return { key: a.key, url: a.url || JIRA + a.key, type: a.draft.issueType };
  return i.ticket;
};
const log = (text) => state.audit.unshift({ t: new Date().toTimeString().slice(0, 8), text });

/* ---------- ticket draft (what ticket-writer would produce) ---------- */
const buildDraft = (it) => window.DraftBuilder.buildDraft(it);
// The temporary draft file (drafts/<id>.json) wins; the builder is only a fallback until the server has written it.
const draftOf = (it) => (state.drafts[it.id] && state.drafts[it.id].draft) || buildDraft(it);
function renderMd(md) {
  const out = []; let list = null;
  const close = () => { if (list) { out.push("</" + list.tag + ">"); list = null; } };
  md.split("\n").forEach((line) => {
    let m;
    if ((m = line.match(/^## (.+)/))) { close(); out.push("<h5>" + esc(m[1]) + "</h5>"); }
    else if ((m = line.match(/^- \[ \] (.+)/))) { if (!list || list.cls !== "chk") { close(); list = { tag: "ul", cls: "chk" }; out.push('<ul class="chk">'); } out.push("<li>" + inline(m[1]) + "</li>"); }
    else if ((m = line.match(/^- (.+)/))) { if (!list || list.cls !== "") { close(); list = { tag: "ul", cls: "" }; out.push("<ul>"); } out.push("<li>" + inline(m[1]) + "</li>"); }
    else if ((m = line.match(/^\d+\. (.+)/))) { if (!list || list.tag !== "ol") { close(); list = { tag: "ol", cls: "" }; out.push("<ol>"); } out.push("<li>" + inline(m[1]) + "</li>"); }
    else if (line.trim()) { close(); out.push("<p>" + inline(line) + "</p>"); }
    else close();
  });
  close(); return out.join("");
}

/* ---------- backlog ---------- */
function renderBacklog() {
  const items = visible();
  const withT = items.filter((i) => ticketOf(i)).length;
  $("stats").innerHTML = "<span><b>" + items.length + "</b> items</span><span><b>" + state.fresh.size + "</b> new from the last processing</span><span><b>" + withT + "</b> with ticket</span><span><b>" + (items.length - withT) + "</b> without ticket</span>";
  document.querySelectorAll(".filters button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.f === state.filter)));
  const list = items.filter((i) => state.filter === "all" || (state.filter === "done" ? ticketOf(i) : !ticketOf(i)));
  $("empty").hidden = list.length > 0;
  $("rows").innerHTML = list.map((i) => {
    const t = ticketOf(i), a = state.approvals[i.id];
    let cell;
    if (t) cell = t.dummy ? '<span class="key">' + t.key + '</span> <span class="chip dummy">dummy</span>' : '<a class="key" target="_blank" rel="noopener" href="' + esc(t.url || JIRA + t.key) + '">' + t.key + "</a> " + '<span class="mono">' + t.type + "</span>";
    else if (a) cell = '<button type="button" class="btn small" data-open="' + i.id + '">View draft</button> <span class="chip wait">Approved · waiting for the Writer</span>';
    else cell = '<button type="button" class="btn small" data-open="' + i.id + '">' + (draftOf(i) ? "Review draft" : "Prepare draft") + '</button> ' + (draftOf(i) ? '<span class="chip">Draft ready</span>' : '<span class="chip wait">Needs details</span>');
    const mf = state.manual[i.id];
    const mcell = !mf ? '<span class="chip wait">Pending</span>' : mf.status === "draft" ? '<button type="button" class="srcbtn" data-manual="' + i.id + '">Draft · open</button>' : '<span class="mono" title="' + esc(mf.reason || "") + '">Not needed</span>';
    return "<tr data-row=\"" + i.id + "\"><td class=\"name\"><button type=\"button\" class=\"linkbtn\" data-open=\"" + i.id + "\">" + esc(i.title) + "</button>" + (state.fresh.has(i.id) ? '<span class="new">New</span>' : "") +
      '<div class="mono">' + i.id + ' · <span class="type">' + i.type + '</span> <span class="prio ' + i.prio + '">' + PRIO[i.prio] + "</span></div></td>" +
      "<td>" + esc(i.area) + '</td><td class="clamp"><div>' + esc(i.desc) + '</div></td><td><button type="button" class="srcbtn" data-m="' + i.meeting + '" data-goto="1" title="Open the meeting note">' + esc(i.source) + "</button></td><td>" + cell + "</td><td>" + mcell + '</td><td class="clamp"><div>' + esc(i.notes) + '</div></td><td class="mono">' + (esc(i.dev) || "—") + "</td><td>" + esc(i.phase) + "</td></tr>";
  }).join("");
}

/* ---------- side panel ---------- */
function openSheet(id) {
  const it = D.items.find((x) => x.id === id); if (!it) return;
  state.openId = id;
  const t = ticketOf(it), a = state.approvals[id];
  const d = a ? a.draft : draftOf(it);
  if (!d) {
    $("sheet").innerHTML = '<header><h3 id="sheetTitle">Prepare ticket draft</h3><button type="button" class="btn small" id="closeBtn">Close</button></header>' +
      '<div class="body"><h4>' + esc(it.title) + '</h4><p>' + esc(it.desc) + '</p><p class="mono">' + esc(it.source) + '</p>' +
      '<div class="note">This item needs a complete draft before approval. In Claude Code or Codex, ask for <b>a draft of ' + esc(it.id) + ' with the ticket-writer skill</b>.</div>' +
      (it.refs ? '<p>' + esc(it.refs) + '</p>' : '') + '</div>';
    $("sheet").hidden = false; $("backdrop").hidden = false;
    $("closeBtn").onclick = closeSheet; $("closeBtn").focus();
    return;
  }
  const locked = !!(a || (t && t.dummy));
  const noAc = !(it.ac && it.ac.length);
  const related = visible().filter((x) => x.id !== id && x.area.split(" · ")[0] === it.area.split(" · ")[0]).map((x) => x.id + " " + x.title);
  let banner;
  if (t && !t.dummy) banner = '<div class="note ok">Created in Jira: <a href="' + esc(t.url || JIRA + t.key) + '" target="_blank" rel="noopener">' + t.key + "</a>.</div>";
  else if (t) banner = '<div class="note ok">Already linked to the dummy ticket ' + t.key + ". Nothing to create.</div>";
  else if (a) banner = '<div class="note">Approved on ' + new Date(a.approvedAt).toLocaleTimeString() + ". Waiting for the Writer to create it in Jira; the key appears here and in the table.</div>";
  else if (noAc) banner = '<div class="note">No acceptance criteria could be written from the source for this item, so it cannot be approved. Ask Claude to draft it again from the meeting note.</div>';
  else banner = '<div class="note">Draft from ticket-writer. It cannot create tickets. Review it, adjust the summary or priority, and approve: after approval the ticket is created in Jira and cannot be deleted.</div>';
  const sheet = $("sheet");
  sheet.innerHTML =
    '<header><div><h3 id="sheetTitle">' + (t && !t.dummy ? "Ticket " + t.key : "Ticket draft") + '</h3><div style="margin-top:6px;display:flex;gap:6px;flex-wrap:wrap"><span class="type">' + it.type + '</span><span class="type">' + it.id + '</span></div></div><button type="button" class="btn small" id="closeBtn">Close</button></header>' +
    '<div class="body">' + banner +
    '<div class="row2"><div class="field"><span class="lbl">Project</span><p>' + esc(d.project) + '</p></div><div class="field"><span class="lbl">Issue type</span><p>' + esc(d.issueType) + (d.intendedType && d.intendedType !== d.issueType ? ' <span class="mono">(intended: ' + esc(d.intendedType) + ")</span>" : "") + "</p></div></div>" +
    (d.intendedType && d.intendedType !== d.issueType ? '<div class="note">The draft uses an available issue type and records the intended type in the description.</div>' : "") +
    (locked ? "" : '<details class="edit"><summary class="mono" style="cursor:pointer">Edit the backlog item (the draft updates with it)</summary>' +
      '<div class="field"><label for="eTitle">Title</label><input id="eTitle" value="' + esc(it.title) + '"></div>' +
      '<div class="field"><label for="eCtx">Context</label><textarea id="eCtx" rows="3">' + esc(it.ctx || it.desc) + '</textarea></div>' +
      '<div class="field"><label for="eDesc">Description</label><textarea id="eDesc" rows="3">' + esc(it.desc) + '</textarea></div>' +
      '<div class="row2"><div class="field"><label for="ePrio">Priority</label><select id="ePrio">' + ["high", "medium", "low"].map((p) => '<option value="' + p + '"' + (p === it.prio ? " selected" : "") + ">" + PRIO[p] + "</option>").join("") + '</select></div><div class="field"><label for="ePhase">Phase</label><input id="ePhase" value="' + esc(it.phase) + '"></div></div>' +
      '<div class="field"><label for="eOwner">Owner</label><input id="eOwner" value="' + esc(it.owner) + '"></div>' +
      '<div class="field"><label for="eNotes">Notes</label><textarea id="eNotes" rows="2">' + esc(it.notes) + '</textarea></div>' +
      '<button type="button" class="btn small" id="saveItem">Save changes</button></details>') +
    '<div class="field"><label for="fSum">Summary</label><input id="fSum" value="' + esc(d.summary) + '"' + (locked ? " disabled" : "") + "></div>" +
    '<div class="row2"><div class="field"><label for="fPrio">Priority</label><select id="fPrio"' + (locked ? " disabled" : "") + ">" + ["high", "medium", "low"].map((p) => '<option value="' + p + '"' + (p === d.priority ? " selected" : "") + ">" + PRIO[p] + "</option>").join("") + '</select></div><div class="field"><span class="lbl">Assignee</span><p>Not set</p></div></div>' +
    '<div class="note">Owner from the meeting: <b>' + esc(it.owner) + "</b>. The Writer looks the name up in Jira and assigns only if exactly one person matches. If there is no match or several, the ticket stays unassigned and the owner is kept in the description, so nothing is lost.</div>" +
    '<div class="row2"><div class="field"><span class="lbl">Labels</span><p>' + esc(d.labels?.join(", ") || "None") + '</p></div><div class="field"><span class="lbl">Parent</span><p>' + esc(d.parent || "None") + '</p></div></div>' +
    (d.checks ? '<div class="note">Jira checks: ' + esc(Object.entries(d.checks).map(([name, result]) => name + ": " + result).join(" · ")) + '</div>' : '') +
    '<div class="field"><span class="lbl">Source</span><p>' + esc(it.source) + "</p></div>" +
    (related.length ? '<div class="field"><span class="lbl">Related items (link as Relates after creating)</span><ul>' + related.map((r) => "<li>" + esc(r) + "</li>").join("") + "</ul></div>" : "") +
    '<div class="field"><span class="lbl">Description (what Jira will receive)</span><div class="md">' + renderMd(d.description) + "</div></div>" +
    '<div class="field"><span class="lbl">Acceptance-criteria validation</span><p>' + esc(d.validation || it.validation) + "</p></div>" +
    '<details><summary class="mono" style="cursor:pointer">Show the Markdown</summary><pre class="src md">' + esc(d.description) + "</pre></details></div>" +
    "<footer>" + (locked ? "" : '<button type="button" class="btn primary" id="approveBtn"' + (noAc ? " disabled" : "") + '>Approve and create ticket</button>') + '' + (state.manual[it.id] && state.manual[it.id].status === "draft" ? '<button type="button" class="btn" data-manual="' + it.id + '">Open manual section</button>' : "") + '<button type="button" class="btn" id="mtgBtn" data-m="' + it.meeting + '" data-goto="1">Open meeting note</button><button type="button" class="btn" id="cancelBtn">' + (locked ? "Close" : "Cancel") + "</button></footer>";
  sheet.hidden = false; $("backdrop").hidden = false;
  $("closeBtn").onclick = closeSheet; $("cancelBtn").onclick = closeSheet;
  if (!locked) { $("approveBtn").onclick = () => approve(id); $("saveItem").onclick = () => saveItem(id); }
  (locked ? $("closeBtn") : $("fSum")).focus();
}
function closeSheet() { state.openId = null; $("sheet").hidden = true; $("backdrop").hidden = true; }

async function saveItem(id) {
  const it = D.items.find((x) => x.id === id);
  const next = { title: $("eTitle").value.trim(), ctx: $("eCtx").value, desc: $("eDesc").value, prio: $("ePrio").value, phase: $("ePhase").value.trim() || "N/A", owner: $("eOwner").value.trim() || "Unassigned", notes: $("eNotes").value };
  const patch = {}; Object.keys(next).forEach((k) => { if (next[k] !== (k === "ctx" ? it.ctx || it.desc : it[k])) patch[k] = next[k]; });
  if (!Object.keys(patch).length) { $("status").textContent = "No changes to save."; return; }
  $("saveItem").disabled = true;
  try {
    const r = await fetch("/api/items/" + encodeURIComponent(id), { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(patch) });
    const body = await r.json(); if (!r.ok) throw new Error(body.error || r.status);
    state.edits[id] = { itemId: id, fields: body.fields }; Object.assign(it, body.fields);
    if (body.draft) state.drafts[id] = body.draft;
    log(id + " edited (" + Object.keys(patch).join(", ") + "); its ticket draft was rewritten.");
    $("status").textContent = id + " saved. The ticket draft now reflects the change.";
    renderAll(); openSheet(id);
  } catch (e) { $("status").textContent = "Could not save: " + e.message; $("saveItem").disabled = false; }
}

async function approve(id) {
  const it = D.items.find((x) => x.id === id);
  const draft = { ...draftOf(it) };
  draft.summary = $("fSum").value.trim() || draft.summary;
  draft.priority = $("fPrio").value;
  $("approveBtn").disabled = true;
  try {
    const r = await fetch("/api/approve", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ id, draft }) });
    const body = await r.json();
    if (!r.ok && r.status !== 409) throw new Error(body.error || r.status);
    state.approvals[id] = body.approval || body;
    log("Human approval for " + id + ". Draft saved for the Writer: “" + draft.summary + "”.");
    $("status").textContent = id + " approved. In Claude Code or Codex, say “create the approved tickets” to send it to Jira.";
    closeSheet(); renderAll();
  } catch (e) {
    $("status").textContent = "Could not save the approval: " + e.message;
    $("approveBtn").disabled = false;
  }
}

/* ---------- meeting notes tab ---------- */
function renderNotes() {
  $("mlist").innerHTML = '<button type="button" class="btn primary addbtn" id="addMeeting">+ Add meeting note</button>' + D.meetings.map((m) =>
    '<button type="button" data-m="' + m.id + '" aria-current="' + (!state.adding && m.id === state.meeting) + '"><span class="mono">' + m.date + "</span><b>" + esc(m.title.replace(/ – .*/, "")) + "</b>" +
    '<span><span class="chip' + (m.processed ? "" : " wait") + '">' + (m.processed ? "Notes ready" : m.pending ? "Waiting for the skill" : "Transcripts only") + "</span></span></button>").join("");
  if (state.adding) { renderAddForm(); return; }
  const m = D.meetings.find((x) => x.id === state.meeting);
  const src = m.transcripts || (m.id === "m3" ? state.transcripts : []);
  const parts = src.map((t, n) => '<details><summary class="mono" style="cursor:pointer">Part ' + (n + 1) + " · " + esc(t.name) + '</summary><pre class="tr">' + esc(t.text) + "</pre></details>").join("");
  if (m.pending) {
    $("mpage").innerHTML = "<h3>" + esc(m.date + " " + m.title) + '</h3><div class="bench"><b>Saved in <span class="mono">inbox/</span>.</b> The agents are processing it: the meeting note, backlog items, manual sections and ticket drafts appear here by themselves.</div><h4>Transcripts</h4>' + parts;
    return;
  }
  if (!m.processed) {
    $("mpage").innerHTML = "<h3>" + esc(m.date + " " + m.title) + '</h3><div class="bench"><b>Not processed yet.</b> This meeting has ' + m.parts + " transcript parts and no notes. Use <b>Process transcripts</b> to write the meeting note and extract its backlog items.</div><h4>Transcripts</h4>" + (parts || '<p class="mono">Loading…</p>');
    return;
  }
  const items = D.items.filter((i) => i.meeting === m.id);
  const tbl = m.topics.map((r) => "<tr><td class=\"mono\">" + esc(r[0]) + "</td><td><b>" + esc(r[1]) + "</b></td><td>" + esc(r[2]) + "</td><td>" + esc(r[3]) + "</td></tr>").join("");
  $("mpage").innerHTML = "<h3>" + esc(m.date + " " + m.title) + "</h3>" +
    "<h4>Date</h4><p>" + m.date + "</p><h4>Participants</h4><ul>" + m.participants.map((p) => "<li>@" + esc(p) + "</li>").join("") + "</ul>" +
    "<h4>Goals</h4><p>" + esc(m.goals) + '</p><h4>Discussion topics</h4><div class="tablewrap"><table><thead><tr><th>Time</th><th>Topic</th><th>Presenter</th><th>Notes</th></tr></thead><tbody>' + tbl + "</tbody></table></div>" +
    '<h4>Action items</h4><ul class="todo">' + m.actions.map((a) => "<li>" + inline(a) + "</li>").join("") + "</ul>" +
    "<h4>Decisions</h4><ul>" + m.decisions.map((d) => "<li>" + esc(d) + "</li>").join("") + "</ul>" +
    "<h4>Related info</h4><ul>" + m.related.map((r) => "<li>" + esc(r) + "</li>").join("") + "</ul>" +
    "<h4>Backlog items from this meeting (" + items.length + ")</h4><ul>" + items.map((i) => {
      const t = ticketOf(i);
      return '<li><button type="button" class="linkbtn" style="background:none;border:0;padding:0;cursor:pointer;text-decoration:underline;color:inherit;font:inherit" data-goitem="' + i.id + '" title="Show in the Backlog">' + i.id + " " + esc(i.title) + "</button> " + (t ? '<span class="key">' + t.key + "</span>" : '<span class="mono">no ticket</span>') + "</li>";
    }).join("") + "</ul>" + (parts ? "<h4>Transcripts</h4>" + parts : "");
}


function renderAddForm() {
  $("mpage").innerHTML = '<h3>Add a meeting note</h3><form class="form" id="addForm">' +
    '<div class="field"><label for="mFile">Transcript file(s)</label><input type="file" id="mFile" accept=".txt,.md,text/plain" multiple required></div>' +
    '<div id="partList" class="mono">One file per recording part. Title and date are read from the file.</div>' +
    '<div style="display:flex;gap:8px;flex-wrap:wrap"><button type="submit" class="btn primary" id="saveMeeting">Add meeting note</button><button type="button" class="btn" id="cancelAdd">Cancel</button></div>' +
    '<p class="mono">That is all you provide. The meeting note, backlog items, manual sections and ticket drafts are produced from the transcript; nothing is created in Jira until you approve a draft.</p></form>';
  $("cancelAdd").onclick = () => { state.adding = false; renderNotes(); };
  $("addForm").onsubmit = async (e) => {
    e.preventDefault();
    const files = [...$("mFile").files]; if (!files.length) return;
    $("saveMeeting").disabled = true;
    try {
      const parts = await Promise.all(files.map(async (f) => ({ name: f.name, text: await f.text() })));
      const r = await fetch("/api/meetings", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ parts }) });
      const body = await r.json(); if (!r.ok) throw new Error(body.error || r.status);
      state.adding = false; state.meeting = body.meetings[0].id;
      body.meetings.forEach((rec) => log("Meeting “" + rec.title + "” added from " + rec.parts.length + " file(s); the agents take it from here."));
      $("status").textContent = "Saved. The agents are processing it: the note, items, manual sections and ticket drafts appear here by themselves.";
      await pollMeetings();
    } catch (err) { $("status").textContent = "Could not save the meeting: " + err.message; $("saveMeeting").disabled = false; }
  };
}

// Meetings added from the page live in inbox/*.json; the skill fills in `meeting` and `items` when it processes them.
async function pollMeetings() {
  try {
    const recs = await (await fetch("/api/meetings")).json();
    let changed = false;
    recs.forEach((r) => {
      let m = D.meetings.find((x) => x.id === r.id);
      if (!m) { m = { id: r.id, date: r.date, title: r.title, processed: false, pending: true, parts: r.parts.length, transcripts: r.parts }; D.meetings.push(m); changed = true; }
      if (r.status === "processed" && !m.processed) {
        Object.assign(m, r.meeting, { id: r.id, processed: true, pending: false, transcripts: r.parts });
        const items = (r.items || []).map((it) => ({ ticket: null, dev: "", phase: "N/A", ...it, meeting: r.id }));
        items.forEach((it) => { if (!D.items.find((x) => x.id === it.id)) D.items.push(Object.assign(it, (state.edits[it.id] || {}).fields || {})); state.fresh.add(it.id); });
        log("The meeting-notes skill processed “" + m.title + "”: " + items.length + " backlog items.");
        $("status").textContent = "“" + m.title + "” processed: " + items.length + " new backlog items, each with a ticket draft ready to review.";
        changed = true;
      }
    });
    if (changed) renderAll();
  } catch { /* offline */ }
}


/* ---------- go to a backlog item ---------- */
function goToItem(id) {
  closeSheet(); state.filter = "all"; showTab("backlog"); renderBacklog();
  const row = document.querySelector('tr[data-row="' + id + '"]'); if (!row) return;
  row.scrollIntoView({ block: "center", behavior: "smooth" });
  row.classList.add("hl"); setTimeout(() => row.classList.remove("hl"), 2600);
}

/* ---------- manual tab ---------- */
function renderManual() {
  const items = D.items.filter((i) => D.meetings.find((m) => m.id === i.meeting).processed);
  const rank = (i) => { const f = state.manual[i.id]; return !f ? 1 : f.status === "draft" ? 0 : 2; };
  const sorted = [...items].sort((x, y) => rank(x) - rank(y));
  if (!state.manualSel || !items.find((i) => i.id === state.manualSel)) { const first = sorted.find((i) => rank(i) === 0) || sorted[0]; state.manualSel = first ? first.id : null; }
  const chip = (f) => !f ? '<span class="chip wait">Pending</span>' : f.status === "draft" ? '<span class="chip">Draft</span>' : '<span class="mono">Not needed</span>';
  $("manlist").innerHTML = sorted.map((i) => '<button type="button" data-msec="' + i.id + '" aria-current="' + (i.id === state.manualSel) + '"><span class="mono">' + i.id + "</span><b>" + esc((state.manual[i.id] && state.manual[i.id].title) || i.title) + "</b><span>" + chip(state.manual[i.id]) + "</span></button>").join("");
  const it = items.find((i) => i.id === state.manualSel); if (!it) { $("manpage").innerHTML = '<div class="empty">No items yet.</div>'; return; }
  const f = state.manual[it.id], t = ticketOf(it);
  const head = '<div class="mono" style="margin-bottom:6px">' + it.id + " · " + esc(it.title) + (t ? " · " + t.key : "") + "</div>";
  const back = '<p><button type="button" class="srcbtn" data-goitem="' + it.id + '">Show this item in the Backlog</button></p>';
  if (!f) { $("manpage").innerHTML = head + "<h3>No manual section yet</h3>" + '<div class="bench"><b>Pending.</b> In Claude Code or Codex, say <b>“write the manual sections”</b>. The manual-writer skill decides whether this item needs a section and writes it from the agreed behaviour.</div>' + back; return; }
  if (f.status === "na") { $("manpage").innerHTML = head + "<h3>No manual change needed</h3><p>" + esc(f.reason) + "</p>" + back; return; }
  const list = (arr) => arr.length ? "<ul>" + arr.map((x) => "<li>" + esc(x) + "</li>").join("") + "</ul>" : "";
  $("manpage").innerHTML = head + "<h3>" + esc(f.title) + '</h3><p><span class="chip">Draft</span> <span class="type">For: ' + esc(f.audience) + "</span></p><p>" + esc(f.summary) + "</p>" +
    (f.steps.length ? "<h4>What you do</h4><ol>" + f.steps.map((x) => "<li>" + esc(x) + "</li>").join("") + "</ol>" : "") +
    (f.sees.length ? "<h4>What you will see</h4>" + list(f.sees) : "") +
    (f.notes.length ? "<h4>Notes</h4>" + list(f.notes) : "") +
    '<div class="bench">Drafted from ' + esc(f.source) + ". Written before release: check it against the running app before publishing.</div>" + back;
}
async function pollManual() {
  try {
    const next = await (await fetch("/api/manual")).json();
    if (JSON.stringify(next) === JSON.stringify(state.manual)) return;
    const had = Object.keys(state.manual).length; state.manual = next;
    if (had) log("The manual-writer skill updated the manual: " + Object.keys(next).length + " entries.");
    renderAll();
  } catch { /* offline */ }
}

function renderAudit() { $("audit").innerHTML = state.audit.map((a) => '<div class="log"><span class="d">' + a.t + "</span><span>" + esc(a.text) + "</span></div>").join("") || '<div class="empty">Nothing yet.</div>'; }
async function pollDrafts() {
  try {
    const next = await (await fetch("/api/drafts")).json();
    const ed = await (await fetch("/api/edits")).json();
    if (JSON.stringify(next) === JSON.stringify(state.drafts) && JSON.stringify(ed) === JSON.stringify(state.edits)) return;
    state.drafts = next; state.edits = ed;
    D.items.forEach((it) => { if (ed[it.id]) Object.assign(it, ed[it.id].fields); });
    if (state.openId === null) renderAll();
  } catch { /* offline */ }
}

function renderAll() { renderBacklog(); renderNotes(); renderManual(); renderAudit(); $("syncBtn").disabled = state.busy || D.meetings.every((m) => m.processed || m.pending); $("syncBtn").textContent = D.meetings.every((m) => m.processed || m.pending) ? "Transcripts processed" : "Process transcripts"; }

/* ---------- actions ---------- */
async function processTranscripts() {
  const m = D.meetings.find((x) => !x.processed && !x.pending); if (!m) return;
  state.busy = true; renderAll();
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  for (let n = 0; n < m.parts; n++) { $("status").textContent = "meeting-notes is reading part " + (n + 1) + " of " + m.parts + "…"; log("Read part " + (n + 1) + " of " + m.parts + " of “" + m.title + "”."); await wait(700); }
  $("status").textContent = "Writing the meeting note and extracting backlog items…"; await wait(700);
  m.processed = true;
  const items = D.items.filter((i) => i.meeting === m.id);
  state.fresh = new Set(items.map((i) => i.id));
  log("Meeting note written for " + m.date + " " + m.title + "; " + items.length + " backlog items extracted, each with its source and timestamp.");
  state.busy = false; state.meeting = m.id;
  $("status").textContent = "Done: " + items.length + " new backlog items from “" + m.title + "”.";
  renderAll();
}
function showTab(name) {
  state.tab = name;
  $("v-backlog").hidden = name !== "backlog"; $("v-notes").hidden = name !== "notes"; $("v-how").hidden = name !== "how"; $("v-deck").hidden = name !== "deck"; $("v-manual").hidden = name !== "manual"; $("v-struct").hidden = name !== "struct";
  document.querySelectorAll(".tabs button").forEach((b) => b.setAttribute("aria-selected", String(b.dataset.tab === name)));
}
async function poll() {
  try {
    const next = await (await fetch("/api/state")).json();
    if (JSON.stringify(next) === JSON.stringify(state.approvals)) return;
    const before = state.approvals; state.approvals = next;
    Object.keys(next).forEach((id) => { if (next[id].key && !(before[id] && before[id].key)) { log("The Writer created " + next[id].key + " for " + id + "."); $("status").textContent = next[id].key + " created in Jira from " + id + "."; } });
    renderAll();
    if (state.openId) openSheet(state.openId);
  } catch { /* server offline: keep what is on screen */ }
}

/* ---------- presentation ---------- */
let slideNo = 0;
function showSlide(n) {
  const all = [...document.querySelectorAll(".slide")];
  slideNo = Math.max(0, Math.min(all.length - 1, n));
  all.forEach((el, i) => { el.hidden = i !== slideNo; });
  $("deckCount").textContent = slideNo + 1 + " / " + all.length;
  $("prevSlide").disabled = slideNo === 0; $("nextSlide").disabled = slideNo === all.length - 1;
  document.querySelectorAll("#dots button").forEach((b, i) => b.setAttribute("aria-current", String(i === slideNo)));
}
(function initDeck() {
  const all = document.querySelectorAll(".slide");
  $("dots").innerHTML = [...all].map((_, i) => '<button type="button" aria-label="Slide ' + (i + 1) + '" data-slide="' + i + '"></button>').join("");
  $("dots").onclick = (e) => { const b = e.target.closest("[data-slide]"); if (b) showSlide(Number(b.dataset.slide)); };
  $("prevSlide").onclick = () => showSlide(slideNo - 1); $("nextSlide").onclick = () => showSlide(slideNo + 1);
  document.addEventListener("keydown", (e) => {
    if (state.tab !== "deck" || state.openId || /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
    if (e.key === "ArrowRight") showSlide(slideNo + 1); if (e.key === "ArrowLeft") showSlide(slideNo - 1);
  });
  showSlide(0);
})();

$("syncBtn").addEventListener("click", processTranscripts);
$("backdrop").addEventListener("click", closeSheet);
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && state.openId) closeSheet(); });
document.addEventListener("click", (e) => {
  const o = e.target.closest("[data-open]"); if (o) return openSheet(o.dataset.open);
  const m = e.target.closest("[data-m]");
  if (m) { state.meeting = m.dataset.m; state.adding = false; if (m.dataset.goto) { closeSheet(); showTab("notes"); } renderNotes(); }
  const gi = e.target.closest("[data-goitem]"); if (gi) return goToItem(gi.dataset.goitem);
  const mm = e.target.closest("[data-manual]");
  if (mm) { state.manualSel = mm.dataset.manual; closeSheet(); showTab("manual"); renderManual(); }
  const ms = e.target.closest("[data-msec]"); if (ms) { state.manualSel = ms.dataset.msec; renderManual(); }
  if (e.target.closest("#addMeeting")) { state.adding = true; renderNotes(); }
});
document.querySelector(".filters").addEventListener("click", (e) => { const b = e.target.closest("[data-f]"); if (b) { state.filter = b.dataset.f; renderBacklog(); } });
document.querySelector(".tabs").addEventListener("click", (e) => { const b = e.target.closest("[data-tab]"); if (b) showTab(b.dataset.tab); });

(async function start() {
  log("Backlog loaded: meetings 2026-10-01 and 2026-10-05 already processed.");
  renderAll();
  try { state.transcripts = await (await fetch("/api/transcripts")).json(); } catch { /* offline */ }
  await pollMeetings(); await poll(); await pollManual(); await pollDrafts(); renderAll();
  setInterval(() => { poll(); pollMeetings(); pollManual(); pollDrafts(); }, 3000);
})();
