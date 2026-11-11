// Corpus amendment of November 10, 2026 for Policy Stake Briefs.
//
// Fixes two published defects in citation links, using the two tables kept beside this file:
//   record-attributions.json  Congressional Record citations whose hover label (title) names the
//                             wrong document on a shared Record page (audit finding B1)
//   link-replacements.json    dead archive links to primary texts (audit finding B10)
//
// A Record citation is identified by its page (the CREC granule in its href) and the quoted words
// that precede it, so the same fix applies to reworded guided-review blocks that quote the same
// words. A citation that no table entry attributes is left unchanged and reported.
//
//   import { amendHtml } from "./apply-amendment.mjs";  amendHtml(html, "119_H_R_28")
//   node apply-amendment.mjs --check <file.json>...     report what would change; writes nothing

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ANCHOR = /<a\s([^>]*)>([\s\S]*?)<\/a>/g;
const ATTRIBUTE = /\b(href|title)="([^"]*)"/g;
const BLOCK_TAG = /<(?:\/?(?:p|li|ol|ul|div|h[1-6]|blockquote|section|table|tr|td)\b[^>]*|br\s*\/?)>/gi;
const SAME_RUN = /^[\s,;()]*$/; // text allowed between links of one citation run, e.g. "[2], [3]"
const QUOTATION = /“([^“”]+)”|"([^"]+)"/g; // curly, or straight in a few notes
const RECORD_PAGE = /CREC-\d{4}-\d{2}-\d{2}-pt\d+-Pg[A-Z]+\d+(?:-\d+)?/;
const MIN_PARTIAL_WORDS = 4; // shortest quotation matched by containment rather than exactly

const NAMED_ENTITIES = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", lsquo: "‘", rsquo: "’",
  ldquo: "“", rdquo: "”", ndash: "–", mdash: "—", hellip: "…",
};

export function decodeEntities(text) {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (whole, entity) => {
    if (entity[0] !== "#") return NAMED_ENTITIES[entity.toLowerCase()] ?? whole;
    const isHex = entity[1].toLowerCase() === "x";
    return String.fromCodePoint(parseInt(entity.slice(isHex ? 2 : 1), isHex ? 16 : 10));
  });
}

// The escaping the site builder uses for attributes (Python's html.escape).
export function escapeAttribute(text) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#x27;");
}

// Comparable form of quoted or source text: Unicode-compatible, straight quotes, one dash form,
// single spaces, lower case. The Record's ``...'' quotation marks become straight quotes.
export function normText(text) {
  return text.normalize("NFKC")
    .replace(/``|''/g, '"').replace(/[‘’ʼ]/g, "'").replace(/[“”]/g, '"').replace(/ /g, " ")
    .replace(/\[\[Page [^\]]*\]\]/g, " ")
    .replace(/\s*[-‐‑‒–—―]+\s*/g, " - ")
    .replace(/\s+/g, " ").trim().toLowerCase();
}

export function quoteKey(quote) {
  return normText(quote).replace(/^[\s.,;:!?'"()\-]+|[\s.,;:!?'"()\-]+$/g, "");
}

export function recordPage(href) {
  const match = href && href.match(RECORD_PAGE);
  return match ? match[0] : null;
}

export function billKey(bill) {
  if (!bill) return null;
  return String(bill).toLowerCase().replace(/^119[_\s]*/, "").replace(/[^a-z0-9]/g, "");
}

function stripTags(html) {
  return decodeEntities(html.replace(/<[^>]*>/g, ""));
}

function parseAttributes(attributeText) {
  const attributes = {};
  for (const match of attributeText.matchAll(ATTRIBUTE)) attributes[match[1]] = match[2];
  return attributes;
}

// Every link in an HTML string, with the text it cites: the text since the previous link run,
// cut at the last block boundary, and the quoted words in that text.
export function citationsIn(html) {
  const links = [...html.matchAll(ANCHOR)].map((match) => {
    const attributes = parseAttributes(match[1]);
    return {
      start: match.index, end: match.index + match[0].length, attributeText: match[1], linkText: match[2],
      href: attributes.href === undefined ? null : decodeEntities(attributes.href),
      title: attributes.title === undefined ? null : decodeEntities(attributes.title),
    };
  });
  let leadStart = 0, runStart = 0, run = -1, previousEnd = null;
  for (const link of links) {
    const sameRun = previousEnd !== null && SAME_RUN.test(html.slice(previousEnd, link.start));
    if (!sameRun) { leadStart = previousEnd ?? 0; runStart = link.start; run += 1; }
    let leadHtml = html.slice(leadStart, runStart);
    const blocks = [...leadHtml.matchAll(BLOCK_TAG)];
    if (blocks.length) { const last = blocks.at(-1); leadHtml = leadHtml.slice(last.index + last[0].length); }
    link.run = run;
    link.lead = stripTags(leadHtml);
    link.quotes = [...link.lead.matchAll(QUOTATION)].map((match) => match[1] ?? match[2]);
    link.page = recordPage(link.href);
    previousEnd = link.end;
  }
  for (const link of links) link.runPages = links.filter((other) => other.run === link.run).map((other) => other.page);
  let recordIndex = 0;
  for (const link of links) if (link.page) link.recordIndex = recordIndex++;
  return links;
}

export function loadAmendment(directory = HERE) {
  const attributions = JSON.parse(fs.readFileSync(path.join(directory, "record-attributions.json"), "utf8"));
  const replacements = JSON.parse(fs.readFileSync(path.join(directory, "link-replacements.json"), "utf8"));
  const byQuote = new Map(), byLead = new Map(), byRunLabel = new Map(), quotesByPage = new Map();
  const add = (map, key, entry) => { if (!map.has(key)) map.set(key, []); map.get(key).push(entry); };
  for (const entry of attributions.occurrences) {
    const decision = { bill: billKey(entry.bill), status: entry.status, title: entry.correct_title, reason: entry.reason };
    if (entry.same_page_run) {
      // Two or more links to one page in a single run: each is told apart by its current label.
      add(byRunLabel, `${entry.page}\u0000${normText(entry.run_lead)}\u0000${entry.current_title}`, decision);
    } else if (entry.quotes.length) {
      for (const quote of entry.quotes) {
        const key = quoteKey(quote);
        add(byQuote, `${entry.page}\u0000${key}`, decision);
        if (!quotesByPage.has(entry.page)) quotesByPage.set(entry.page, new Set());
        quotesByPage.get(entry.page).add(key);
      }
    } else {
      add(byLead, `${entry.page}\u0000${normText(entry.lead)}`, decision);
    }
  }
  const hrefs = new Map(replacements.replacements.map((item) => [item.old_href, item.new_href]));
  return { byQuote, byLead, byRunLabel, quotesByPage, hrefs };
}

let defaultAmendment = null;

function decide(link, bill, amendment) {
  const wanted = billKey(bill);
  const keep = (decisions) => decisions.filter((d) => !wanted || d.bill === wanted);
  let decisions = [];
  if (link.runPages.filter((page) => page === link.page).length > 1) {
    decisions = keep(amendment.byRunLabel.get(`${link.page}\u0000${normText(link.lead)}\u0000${link.title}`) ?? []);
    if (!decisions.length) return { attributed: false, reason: "this run cites the same Record page more than once, and no entry matches its text and label" };
    return settle(decisions);
  }
  // Each quotation is settled on its own; quotations with no entry for this page are taken to
  // belong to other sources in the run.
  const known = [...(amendment.quotesByPage.get(link.page) ?? [])];
  const titles = new Set();
  for (const key of link.quotes.map(quoteKey).filter(Boolean)) {
    let found = keep(amendment.byQuote.get(`${link.page}\u0000${key}`) ?? []);
    if (!found.length && key.split(" ").length >= MIN_PARTIAL_WORDS) {
      for (const other of known) {
        if (other.split(" ").length >= MIN_PARTIAL_WORDS && (other.includes(key) || key.includes(other))) {
          found.push(...keep(amendment.byQuote.get(`${link.page}\u0000${other}`)));
        }
      }
    }
    if (!found.length) continue;
    const settled = settle(found);
    if (!settled.attributed) return settled;
    titles.add(settled.title);
  }
  if (titles.size > 1) return { attributed: false, reason: `the quotations before this citation belong to different documents: ${[...titles].join(" | ")}` };
  if (titles.size === 1) return { attributed: true, title: [...titles][0] };
  decisions = keep(amendment.byLead.get(`${link.page}\u0000${normText(link.lead)}`) ?? []);
  if (!decisions.length) return { attributed: false, reason: "no attribution entry matches this page and quotation" };
  return settle(decisions);
}

// Entries verified for the same words agree on one label; unresolved entries count only when
// no entry for those words was resolved.
function settle(decisions) {
  const resolved = decisions.filter((d) => d.status !== "unresolved");
  if (!resolved.length) return { attributed: false, reason: `unresolved in the attribution table: ${decisions[0].reason}` };
  const titles = [...new Set(resolved.map((d) => d.title))];
  if (titles.length > 1) return { attributed: false, reason: `matching entries give different labels: ${titles.join(" | ")}` };
  return { attributed: true, title: titles[0] };
}

// Full result for one HTML string: the amended HTML, each change, and Record citations left
// unattributed.
export function amendHtmlDetailed(html, bill, amendment = defaultAmendment ??= loadAmendment()) {
  const changes = [], unattributed = [];
  const edits = [];
  for (const link of citationsIn(html)) {
    let href = link.href, title = link.title;
    if (href !== null && amendment.hrefs.has(href)) href = amendment.hrefs.get(href);
    if (link.page) {
      const decision = decide(link, bill, amendment);
      if (decision.attributed) title = decision.title;
      else unattributed.push({ href: link.href, title: link.title, quotes: link.quotes, lead: link.lead.slice(-200), reason: decision.reason });
    }
    if (href === link.href && title === link.title) continue;
    let attributeText = link.attributeText;
    if (href !== link.href) attributeText = attributeText.replace(/\bhref="[^"]*"/, () => `href="${escapeAttribute(href)}"`);
    if (title !== link.title) attributeText = attributeText.replace(/\btitle="[^"]*"/, () => `title="${escapeAttribute(title)}"`);
    edits.push({ link, replacement: `<a ${attributeText}>${link.linkText}</a>` });
    changes.push({ old_href: link.href, new_href: href, old_title: link.title, new_title: title, quotes: link.quotes });
  }
  let amended = html;
  for (const { link, replacement } of edits.reverse()) amended = amended.slice(0, link.start) + replacement + amended.slice(link.end);
  return { html: amended, changes, unattributed };
}

export function amendHtml(html, bill) {
  return amendHtmlDetailed(html, bill).html;
}

const BILL_PREFIX = { HR28: "119_H_R_28", HR131: "119_H_R_131", HR1834: "119_H_R_1834", HR4405: "119_H_R_4405",
  HR5408: "119_H_R_5408", S1582: "119_S_1582", S2: "119_S_2", SJRes88: "119_S_J_Res_88" };

function billFromId(id) {
  const match = typeof id === "string" && id.match(/^(HR\d+|SJRes\d+|S\d+)_/);
  return match ? BILL_PREFIX[match[1]] ?? null : null;
}

function fileBill(data) {
  if (typeof data.bill_id === "string") return data.bill_id;
  const bill = data.bill;
  if (typeof bill === "string") return bill;
  if (bill && typeof bill === "object") return bill.id ?? bill.bill_id ?? bill.bill ?? null;
  return null;
}

// Every HTML string in a JSON document, with its JSON path and the bill it belongs to.
export function* htmlStrings(value, bill = null, jsonPath = []) {
  if (typeof value === "string") {
    if (value.includes("<a ")) yield { html: value, bill, jsonPath };
  } else if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) yield* htmlStrings(value[i], bill, [...jsonPath, i]);
  } else if (value && typeof value === "object") {
    const own = typeof value.bill_id === "string" ? value.bill_id : billFromId(value.id) ?? bill;
    for (const [key, child] of Object.entries(value)) {
      yield* htmlStrings(child, own ?? billFromId(key) ?? bill, [...jsonPath, key]);
    }
  }
}

function check(files) {
  const amendment = loadAmendment();
  for (const file of files) {
    const data = JSON.parse(fs.readFileSync(file, "utf8"));
    const top = fileBill(data);
    let titleChanges = 0, hrefChanges = 0, citations = 0, recordCitations = 0;
    const unattributed = [];
    for (const { html, bill, jsonPath } of htmlStrings(data, top)) {
      const links = citationsIn(html);
      citations += links.length;
      recordCitations += links.filter((link) => link.page).length;
      const result = amendHtmlDetailed(html, bill ?? top, amendment);
      for (const change of result.changes) {
        if (change.new_title !== change.old_title) titleChanges += 1;
        if (change.new_href !== change.old_href) hrefChanges += 1;
      }
      for (const item of result.unattributed) unattributed.push({ path: jsonPath.join("."), ...item });
    }
    console.log(`${file}`);
    console.log(`  links: ${citations}; Record citations: ${recordCitations}; label changes: ${titleChanges}; link changes: ${hrefChanges}; Record citations not attributed: ${unattributed.length}`);
    for (const item of unattributed) {
      const words = item.quotes.length ? item.quotes.map((q) => `“${q.slice(0, 90)}”`).join(" + ") : `(no quotation) …${item.lead.slice(-90)}`;
      console.log(`    - ${item.path}: ${words}\n      label: ${item.title}\n      ${item.reason}`);
    }
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [mode, ...files] = process.argv.slice(2);
  if (mode !== "--check" || !files.length) {
    console.error("usage: node apply-amendment.mjs --check <file.json>...");
    process.exit(2);
  }
  check(files);
}
