// Read-only inbox watcher. Returns control to an active Codex turn; never invokes a model.
import { readdir, readFile } from "node:fs/promises";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";
import { setTimeout as delay } from "node:timers/promises";

const args = process.argv.slice(2);
const options = { inbox: resolve(dirname(fileURLToPath(import.meta.url)), "../../../..", "inbox"), timeout: 55000 };
const emit = (result) => console.log(JSON.stringify(result));

try {
  for (let i = 0; i < args.length; i += 2) {
    const value = args[i + 1];
    if (value === undefined) throw new Error(`Missing value for ${args[i]}`);
    if (args[i] === "--inbox") options.inbox = resolve(value);
    else if (args[i] === "--timeout-ms") options.timeout = Number(value);
    else throw new Error(`Unknown option: ${args[i]}`);
  }
  if (!Number.isInteger(options.timeout) || options.timeout < 0 || options.timeout > 60000) {
    throw new Error("--timeout-ms must be an integer between 0 and 60000");
  }
  const deadline = Date.now() + options.timeout;
  do {
    const names = (await readdir(options.inbox)).filter(name => name.endsWith(".json")).sort();
    const files = [];
    for (const name of names) {
      const file = join(options.inbox, name);
      let record;
      try { record = JSON.parse(await readFile(file, "utf8")); }
      catch (error) { throw new Error(`${file}: ${error.message}`); }
      if (record?.status === "pending") files.push(file);
    }
    if (files.length) {
      emit({ status: "pending", files });
      process.exit(0);
    }
    const remaining = deadline - Date.now();
    if (remaining <= 0) break;
    await delay(Math.min(2000, remaining));
  } while (Date.now() <= deadline);
  emit({ status: "waiting", files: [] });
} catch (error) {
  emit({ status: "error", error: error.message });
  process.exitCode = 1;
}
