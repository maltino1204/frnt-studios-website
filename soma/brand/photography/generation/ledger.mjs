// node ledger.mjs set <shotId> <jobId> [url] [status] [note]  — records generation jobs (jobs-v2.json)
import fs from "node:fs";
const f = new URL("./jobs-v2.json", import.meta.url).pathname;
const db = fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, "utf8")) : {};
const [cmd, id, job, url, status, ...note] = process.argv.slice(2);
if (cmd === "set") {
  db[id] = db[id] || { attempts: [] };
  let a = db[id].attempts.find((x) => x.job === job);
  if (!a) { a = { job }; db[id].attempts.push(a); }
  if (url && url !== "-") a.url = url;
  if (status && status !== "-") a.status = status;
  if (note.length) a.note = note.join(" ");
  fs.writeFileSync(f, JSON.stringify(db, null, 2) + "\n");
} else console.log(JSON.stringify(db, null, 1));
