// Applies the November 10, 2026 corpus amendment in place, preserving each file's formatting.
//   node write-amendment.mjs --json <file.json>...          every HTML string in the JSON document
//   node write-amendment.mjs --text <bill-id> <file>...     a Markdown/HTML page of one bill
// Each file is rewritten only if its text changes; a JSON file must round-trip byte-for-byte first.
import fs from "node:fs";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { amendHtml, htmlStrings } from "./apply-amendment.mjs";

function serialize(value, raw) {
  for (const indent of [2, 1, 0]) {
    const text = JSON.stringify(value, null, indent || undefined) + (raw.endsWith("\n") ? "\n" : "");
    if (text === raw) return (next) => JSON.stringify(next, null, indent || undefined) + (raw.endsWith("\n") ? "\n" : "");
  }
  throw new Error("Unrecognized JSON formatting; refusing to rewrite.");
}
export function amendJson(data, top) {
  const next = structuredClone(data);
  for (const { html, bill, jsonPath } of htmlStrings(data, top)) {
    let owner = next;
    for (const key of jsonPath.slice(0, -1)) owner = owner[key];
    owner[jsonPath.at(-1)] = amendHtml(html, bill ?? top);
  }
  return next;
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
const [mode, ...rest] = process.argv.slice(2);
if (mode === "--json") {
  for (const file of rest) {
    const raw = fs.readFileSync(file, "utf8"), data = JSON.parse(raw), write = serialize(data, raw);
    const top = typeof data.bill_id === "string" ? data.bill_id : data.bill?.id ?? null;
    const next = amendJson(data, top), text = write(next);
    if (text !== raw) { fs.writeFileSync(file, text); console.log("amended", file); } else console.log("unchanged", file);
  }
} else if (mode === "--text") {
  const [bill, ...files] = rest;
  assert(bill, "Pass the bill id.");
  for (const file of files) {
    const raw = fs.readFileSync(file, "utf8"), text = amendHtml(raw, bill);
    if (text !== raw) { fs.writeFileSync(file, text); console.log("amended", file); } else console.log("unchanged", file);
  }
} else {
  console.error("usage: node write-amendment.mjs --json <file>... | --text <bill-id> <file>...");
  process.exit(2);
}
}
