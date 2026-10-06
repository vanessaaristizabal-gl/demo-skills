// Local server for the demo. No dependencies, no credentials, never talks to Jira.
// The page writes an approval file; the Writer (Codex or Claude, through a connected Jira MCP) creates the ticket
// and records its key in the same file. The page polls /api/state and shows the key.
import { createServer } from "node:http";
import { readFile, writeFile, readdir, mkdir } from "node:fs/promises";
import { join, extname, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const approvals = join(root, "approvals");
const transcripts = join(root, "samples", "transcripts");
const inbox = join(root, "inbox");
const manual = join(root, "manual");
const drafts = join(root, "drafts"); // temporary ticket drafts, one per item, removed once the Jira ticket exists
const edits = join(root, "edits");   // user edits to backlog items, one overlay per item
const port = Number(process.env.PORT || 4100);
const types = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".json": "application/json" };

const json = (res, code, body) => { res.writeHead(code, { "content-type": "application/json" }); res.end(JSON.stringify(body)); };
const safeId = (s) => /^[A-Za-z0-9_-]{1,40}$/.test(s);

async function readApprovals() {
  await mkdir(approvals, { recursive: true });
  const out = {};
  for (const f of await readdir(approvals)) {
    if (!f.endsWith(".json")) continue;
    try { out[f.slice(0, -5)] = JSON.parse(await readFile(join(approvals, f), "utf8")); } catch { /* half-written file: next poll */ }
  }
  return out;
}

async function readDir(dir) {
  await mkdir(dir, { recursive: true });
  const out = {};
  for (const f of await readdir(dir)) {
    if (!f.endsWith(".json")) continue;
    try { out[f.slice(0, -5)] = JSON.parse(await readFile(join(dir, f), "utf8")); } catch { /* half-written file: next poll */ }
  }
  return out;
}

// data.js and draft.js are browser scripts that set window.DEMO / window.DraftBuilder; evaluate them with a fake window.
async function loadShared() {
  const w = {};
  for (const f of ["data.js", "draft.js"]) new Function("window", await readFile(join(here, f), "utf8"))(w);
  return w;
}

// Every backlog item (sample data + processed inbox meetings) with the user's edits applied.
async function allItems() {
  const w = await loadShared(), ed = await readDir(edits), out = [...w.DEMO.items];
  for (const m of await readInbox()) if (m.status === "processed") for (const it of m.items || []) if (!out.find((x) => x.id === it.id)) out.push({ ticket: null, dev: "", phase: "N/A", ...it, meeting: m.id });
  return { build: w.DraftBuilder.buildDraft, items: out.map((it) => ({ ...it, ...(ed[it.id] ? ed[it.id].fields : {}) })) };
}

async function writeDraft(id, draft, extra = {}) {
  await mkdir(drafts, { recursive: true });
  await writeFile(join(drafts, id + ".json"), JSON.stringify({ itemId: id, status: "draft", updatedAt: new Date().toISOString(), ...extra, draft }, null, 2));
}

// A draft file exists for every item that has no ticket yet. Agents may write a richer one; this fills any gap.
async function ensureDrafts() {
  const { build, items } = await allItems(), have = await readDir(drafts), appr = await readApprovals();
  for (const it of items) {
    if (it.ticket || have[it.id] || appr[it.id]) continue;
    const d = build(it); if (d) await writeDraft(it.id, d, { origin: "auto" });
  }
  return readDir(drafts);
}

const EDITABLE = { title: "string", desc: "string", ctx: "string", owner: "string", phase: "string", notes: "string", prio: ["high", "medium", "low"] };

async function readManual() {
  await mkdir(manual, { recursive: true });
  const out = {};
  for (const f of await readdir(manual)) {
    if (!f.endsWith(".json")) continue;
    try { out[f.slice(0, -5)] = JSON.parse(await readFile(join(manual, f), "utf8")); } catch { /* half-written file: next poll */ }
  }
  return out;
}

async function readInbox() {
  await mkdir(inbox, { recursive: true });
  const out = [];
  for (const f of (await readdir(inbox)).sort()) {
    if (!f.endsWith(".json")) continue;
    try { out.push(JSON.parse(await readFile(join(inbox, f), "utf8"))); } catch { /* half-written file: next poll */ }
  }
  return out;
}

createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://localhost");
    if (req.method === "GET" && url.pathname === "/api/state") return json(res, 200, await readApprovals());
    if (req.method === "GET" && url.pathname === "/api/transcripts") {
      const names = (await readdir(transcripts)).filter((n) => n.endsWith(".txt")).sort();
      return json(res, 200, await Promise.all(names.map(async (name) => ({ name, text: await readFile(join(transcripts, name), "utf8") }))));
    }
    if (req.method === "GET" && url.pathname === "/api/manual") return json(res, 200, await readManual());
    if (req.method === "GET" && url.pathname === "/api/meetings") return json(res, 200, await readInbox());
    if (req.method === "POST" && url.pathname === "/api/meetings") {
      let raw = ""; for await (const c of req) { raw += c; if (raw.length > 600000) return json(res, 413, { error: "too large" }); }
      const { parts } = JSON.parse(raw);
      const okParts = Array.isArray(parts) && parts.length > 0 && parts.every((p) => p && typeof p.text === "string" && p.text.trim());
      if (!okParts) return json(res, 400, { error: "at least one non-empty transcript file is required" });
      // Only the files come from the user: title and date are read from each file's header (or its file name).
      const groups = new Map();
      for (const [n, p] of parts.entries()) {
        const name = String(p.name || "part" + (n + 1));
        const title = ((p.text.match(/^Meeting:\s*(.+)$/m) || [])[1] || name.replace(/\.[^.]+$/, "").replace(/^\d{4}-\d{2}-\d{2}-?/, "").replace(/_part\d+$/, "").replace(/[-_]+/g, " ")).replace(/\s*\(fictional data\)/i, "").trim();
        const date = (p.text.match(/^Date:\s*(\d{4}-\d{2}-\d{2})/m) || name.match(/(\d{4}-\d{2}-\d{2})/) || [])[1];
        if (!title || !/^\d{4}-\d{2}-\d{2}$/.test(date || "")) return json(res, 400, { error: name + ": no 'Meeting:' and 'Date:' header and no date in the file name" });
        const key = date + "|" + title;
        if (!groups.has(key)) groups.set(key, { title, date, parts: [] });
        groups.get(key).parts.push({ name, text: p.text });
      }
      await mkdir(inbox, { recursive: true });
      const records = [];
      for (const g of groups.values()) {
        const id = "m" + Date.now() + records.length;
        const record = { id, status: "pending", createdAt: new Date().toISOString(), ...g };
        await writeFile(join(inbox, id + ".json"), JSON.stringify(record, null, 2));
        records.push(record);
      }
      return json(res, 200, { meetings: records });
    }
    if (req.method === "GET" && url.pathname === "/api/drafts") return json(res, 200, await ensureDrafts());
    if (req.method === "GET" && url.pathname === "/api/edits") return json(res, 200, await readDir(edits));
    if (req.method === "PATCH" && url.pathname.startsWith("/api/items/")) {
      const id = decodeURIComponent(url.pathname.slice("/api/items/".length));
      let raw = ""; for await (const c of req) raw += c;
      const patch = JSON.parse(raw);
      if (!safeId(id)) return json(res, 400, { error: "bad id" });
      if ((await readApprovals())[id]) return json(res, 409, { error: "already approved: the draft is locked" });
      const fields = {};
      for (const [k, v] of Object.entries(patch)) {
        const rule = EDITABLE[k];
        if (!rule) return json(res, 400, { error: "field not editable: " + k });
        if (Array.isArray(rule) ? !rule.includes(v) : typeof v !== "string" || (k === "title" && !v.trim())) return json(res, 400, { error: "invalid value for " + k });
        fields[k] = v;
      }
      const { build, items } = await allItems();
      const base = items.find((x) => x.id === id);
      if (!base) return json(res, 404, { error: "unknown item" });
      const prev = (await readDir(edits))[id];
      const merged = { ...(prev ? prev.fields : {}), ...fields };
      await mkdir(edits, { recursive: true });
      await writeFile(join(edits, id + ".json"), JSON.stringify({ itemId: id, updatedAt: new Date().toISOString(), fields: merged }, null, 2));
      // An edited item rewrites its temporary draft so the ticket always reflects the backlog row.
      const draft = build({ ...base, ...fields });
      if (draft) await writeDraft(id, draft, { origin: "edit" });
      return json(res, 200, { itemId: id, fields: merged, draft: draft ? { itemId: id, status: "draft", draft } : null });
    }
    if (req.method === "POST" && url.pathname === "/api/approve") {
      let raw = ""; for await (const c of req) raw += c;
      const { id, draft } = JSON.parse(raw);
      if (!safeId(id) || !draft || !draft.summary) return json(res, 400, { error: "id and draft.summary are required" });
      const file = join(approvals, id + ".json");
      const existing = (await readApprovals())[id];
      if (existing) return json(res, 409, { error: "already approved", approval: existing });
      const record = { id, status: "approved", approvedAt: new Date().toISOString(), draft };
      await writeFile(file, JSON.stringify(record, null, 2));
      return json(res, 200, record);
    }
    const path = url.pathname === "/" ? "/index.html" : url.pathname;
    if (path.includes("..")) return json(res, 400, { error: "bad path" });
    const body = await readFile(join(here, path));
    res.writeHead(200, { "content-type": types[extname(path)] || "application/octet-stream" });
    res.end(body);
  } catch (e) {
    json(res, e.code === "ENOENT" ? 404 : 500, { error: e.code === "ENOENT" ? "not found" : String(e.message) });
  }
}).listen(port, () => console.log(`Demo on http://localhost:${port}  (approvals → ${approvals})`));
