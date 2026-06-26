/* Fetch the Waray (war) children's books from Bloom Library and extract their text.
   Bloom books are Creative-Commons licensed (mostly cc-by-nc-sa) — so unlike the Bible
   we can keep the text, with attribution. Output:
   - docs/sources/bloom-waray-stories.txt   (combined Waray text, ===BOOK=== separated)
   - docs/sources/bloom-waray/SOURCES.md     (per-book title, copyright, license, url)
   Read-only against Bloom's public Parse API + S3. Run: node tools/fetch-bloom.mjs */
import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const APPID = "R6qNTeumQXjJCMutAJYAwPtip1qBulkFyLefkCE5";
const BASE = "https://bloom-parse-server-production.azurewebsites.net/parse";
const curl = (args) => execSync(`curl -s ${args}`, { maxBuffer: 64 * 1024 * 1024 }).toString();

// 1. list the Waray books (title, baseUrl, copyright, license)
const where = '{"langPointers":{"$inQuery":{"where":{"isoCode":"war"},"className":"language"}}}';
const listJson = curl(`-G "${BASE}/classes/books" -H "X-Parse-Application-Id: ${APPID}" ` +
  `--data-urlencode 'where=${where}' --data-urlencode 'limit=100' ` +
  `--data-urlencode 'keys=title,baseUrl,copyright,license,pageCount'`);
const books = JSON.parse(listJson).results;
console.log(`Bloom Waray books: ${books.length}`);

// metadata blocks (not story prose) to skip when harvesting lang="war" text
const SKIP = /data-book="(smallCoverCredits|copyright|licenseUrl|licenseNotes|licenseDescription|originalContributions|funding|versionAcknowledgments|originalAcknowledgments|topic|outside-back-cover-branding-bottom-html)"/;
const stripTags = (s) => s.replace(/<[^>]+>/g, " ")
  .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
  .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n))
  .replace(/\s+/g, " ").trim();

const titleKey = (s) => (s || "").toLowerCase().replace(/\s+/g, " ").trim();
const fetched = [];
for (const b of books) {
  const baseUrl = decodeURIComponent(b.baseUrl).replace(/\/$/, "");
  const folder = baseUrl.split("/").pop();          // title folder (spaces as +)
  const htmUrl = `${baseUrl}/${folder}.htm`;
  let htm = "";
  try { htm = curl(`"${htmUrl.replace(/"/g, '\\"')}"`); } catch (e) { /* skip */ }
  if (!htm || htm.length < 500) { console.log(`  ⚠ no htm: ${b.title}`); continue; }
  // pull text from each bloom-editable lang="war" block that isn't a metadata field
  const seen = new Set(), parts = [];
  for (const m of htm.matchAll(/<div\b([^>]*\bbloom-editable\b[^>]*\blang="war"[^>]*)>([\s\S]*?)<\/div>/g)) {
    if (SKIP.test(m[1])) continue;
    const t = stripTags(m[2]);
    if (t.length >= 2 && !seen.has(t)) { seen.add(t); parts.push(t); }
  }
  let text = parts.join("\n").replace(/Moral Lesson of the Story:\s*/gi, ""); // strip English label
  if (!text) { console.log(`  ⚠ no war text: ${b.title}`); continue; }
  fetched.push({ title: b.title, license: b.license || "?", copyright: b.copyright || "", pages: b.pageCount || "", objectId: b.objectId, text });
  console.log(`  ✓ ${b.title} (${b.license}) — ${parts.length} blocks, ${text.length} chars`);
}

// dedup by title, keeping the LONGEST text — Bloom hosts duplicate-title editions, and one
// ("Kandiwata", cc-by-sa) is mis-uploaded with Tagalog content under the Waray tag; it's the
// shorter copy, so keeping the longest drops it cleanly. (Mirrors build-stories' dedup.)
const byTitle = new Map();
for (const b of fetched) { const k = titleKey(b.title); const ex = byTitle.get(k); if (!ex || b.text.length > ex.text.length) byTitle.set(k, b); }
const final = [...byTitle.values()];
if (final.length < fetched.length) console.log(`  (deduped ${fetched.length - final.length} duplicate-title book(s))`);

let corpus = "", rows = [];
for (const b of final) {
  corpus += `\n===BOOK: ${b.title} [${b.license}]===\n${b.text}\n`;
  rows.push({ title: b.title, copyright: b.copyright, license: b.license, pages: b.pages, url: `https://bloomlibrary.org/book/${b.objectId}` });
}

fs.mkdirSync(path.join(root, "docs/sources/bloom-waray"), { recursive: true });
fs.writeFileSync(path.join(root, "docs/sources/bloom-waray-stories.txt"), corpus.trim() + "\n");

let md = `# Bloom Library — Waray books (provenance + license)

${rows.length} children's books in Waray, fetched from Bloom Library's public API
(https://bloomlibrary.org/language:war). All Creative-Commons; used here for a free,
non-commercial learning app with attribution. **cc-by-nd** titles: frequency only, no
derived frames (No-Derivatives). **cc-...-sa**: derivatives share-alike.

| Title | Copyright | License | Pages |
|-------|-----------|:-------:|:--:|
`;
for (const r of rows) md += `| ${r.title.replace(/\|/g, "/")} | ${(r.copyright || "—").replace(/\|/g, "/").slice(0, 50)} | ${r.license} | ${r.pages} |\n`;
md += `\nText extracted from each book's \`.htm\` (lang="war" blocks) into \`../bloom-waray-stories.txt\`.\nRe-fetch: \`node tools/fetch-bloom.mjs\`.\n`;
fs.writeFileSync(path.join(root, "docs/sources/bloom-waray/SOURCES.md"), md);

console.log(`\nwrote ${rows.length} books → docs/sources/bloom-waray-stories.txt (${corpus.length} chars)`);
