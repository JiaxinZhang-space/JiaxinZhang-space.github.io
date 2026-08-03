import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const publicDir = path.join(root, "public");
const site = "https://www.jiaxinzhang-data.com";

const pairs = [
  ["index.html", "zh/index.html", "/", "/zh/"],
  ["projects/ecommerce-lakehouse-warehouse.html", "zh/projects/ecommerce-lakehouse-warehouse.html", "/projects/ecommerce-lakehouse-warehouse.html", "/zh/projects/ecommerce-lakehouse-warehouse.html"],
  ["projects/mini-c4-data-pipeline.html", "zh/projects/mini-c4-data-pipeline.html", "/projects/mini-c4-data-pipeline.html", "/zh/projects/mini-c4-data-pipeline.html"],
  ["projects/governed-novel-data-pipeline.html", "zh/projects/governed-novel-data-pipeline.html", "/projects/governed-novel-data-pipeline.html", "/zh/projects/governed-novel-data-pipeline.html"],
];

const failures = [];
const assert = (condition, message) => {
  if (!condition) failures.push(message);
};

function read(relativePath) {
  const absolutePath = path.join(publicDir, relativePath);
  assert(fs.existsSync(absolutePath), `Missing file: ${relativePath}`);
  return fs.existsSync(absolutePath) ? fs.readFileSync(absolutePath, "utf8") : "";
}

function relativeHref(fromFile, toFile) {
  return path.relative(path.dirname(fromFile), toFile).replaceAll("\\", "/");
}

function assertMetadata(html, relativePath, language, englishUrl, chineseUrl, canonicalUrl) {
  assert(html.includes(`<html lang="${language}">`), `${relativePath}: expected lang=${language}`);
  assert(html.includes(`<link rel="canonical" href="${site}${canonicalUrl}">`), `${relativePath}: canonical mismatch`);
  assert(html.includes(`<link rel="alternate" hreflang="en" href="${site}${englishUrl}">`), `${relativePath}: missing English alternate`);
  assert(html.includes(`<link rel="alternate" hreflang="zh-CN" href="${site}${chineseUrl}">`), `${relativePath}: missing Chinese alternate`);
  assert(html.includes(`<link rel="alternate" hreflang="x-default" href="${site}${englishUrl}">`), `${relativePath}: missing x-default alternate`);
  const stylesheet = relativeHref(relativePath, "assets/i18n.css");
  assert(html.includes(`<link rel="stylesheet" href="${stylesheet}">`), `${relativePath}: missing file-safe i18n stylesheet`);
}

function localTarget(fromFile, rawUrl) {
  const clean = rawUrl.split("#")[0].split("?")[0];
  if (!clean || /^(?:https?:|mailto:|tel:|data:|javascript:)/i.test(clean)) return null;
  let target;
  if (clean.startsWith("/")) target = path.join(publicDir, clean.slice(1));
  else target = path.resolve(path.dirname(path.join(publicDir, fromFile)), clean);
  if (clean.endsWith("/")) target = path.join(target, "index.html");
  return target;
}

const englishPages = [];
for (const [englishFile, chineseFile, englishUrl, chineseUrl] of pairs) {
  const en = read(englishFile);
  const zh = read(chineseFile);
  englishPages.push([englishFile, en]);
  assertMetadata(en, englishFile, "en", englishUrl, chineseUrl, englishUrl);
  assertMetadata(zh, chineseFile, "zh-CN", englishUrl, chineseUrl, chineseUrl);
  assert(en.includes(`href="${relativeHref(englishFile, chineseFile)}"`), `${englishFile}: language switch does not point to Chinese counterpart`);
  assert(zh.includes(`href="${relativeHref(chineseFile, englishFile)}"`), `${chineseFile}: language switch does not point to English counterpart`);
}

for (const [relativePath, html] of [...pairs.flatMap(([enFile, zhFile]) => [[enFile, read(enFile)], [zhFile, read(zhFile)]]), ["404.html", read("404.html")]]) {
  const refs = [...html.matchAll(/\b(?:href|src)="([^"]+)"/g)].map((match) => match[1]);
  for (const ref of refs) {
    assert(!ref.startsWith("/"), `${relativePath}: root-relative reference breaks file preview: ${ref}`);
    const target = localTarget(relativePath, ref);
    if (target) assert(fs.existsSync(target), `${relativePath}: broken local reference ${ref}`);
  }
}

for (const [relativePath, html] of englishPages) {
  const unexpected = html.split(/\r?\n/).filter((line) => /\p{Script=Han}/u.test(line) && !line.includes("alternateName") && !line.includes('hreflang="zh-CN"'));
  assert(unexpected.length === 0, `${relativePath}: unexpected Chinese text on lines: ${unexpected.map((line) => line.trim()).join(" | ")}`);
}

const miniC4English = read("projects/mini-c4-data-pipeline.html");
const miniC4Chinese = read("zh/projects/mini-c4-data-pipeline.html");
const homeEnglish = read("index.html");
const homeChinese = read("zh/index.html");
assert(homeEnglish.includes("assets/projects/mini-c4/pipeline-iterations-en.svg"), "English homepage: missing the English Mini-C4 thumbnail");
assert(!homeEnglish.includes("assets/projects/mini-c4/pipeline-iterations-thumb.webp"), "English homepage: still references the Chinese Mini-C4 thumbnail");
assert(homeChinese.includes("../assets/projects/mini-c4/pipeline-iterations-thumb.webp"), "Chinese homepage: missing the Chinese Mini-C4 thumbnail");
assert(!homeChinese.includes("pipeline-iterations-en.svg"), "Chinese homepage: should not reference the English Mini-C4 thumbnail");
for (const asset of [
  "pipeline-iterations-en.svg",
  "dedup-minhash-lsh-en.svg",
  "language-branching-en.svg",
  "retention-funnel-current-en.svg",
  "validation-loop-en.svg",
]) {
  assert(miniC4English.includes(asset), `English Mini-C4 page: missing localized diagram ${asset}`);
  assert(!miniC4Chinese.includes(asset), `Chinese Mini-C4 page: should keep the Chinese diagram instead of ${asset}`);
  const diagram = read(`assets/projects/mini-c4/${asset}`);
  assert(!/\p{Script=Han}/u.test(diagram), `English Mini-C4 diagram: unexpected Chinese text in ${asset}`);
}

const sitemap = read("sitemap.xml");
for (const [, , englishUrl, chineseUrl] of pairs) {
  assert(sitemap.includes(`<loc>${site}${englishUrl}</loc>`), `sitemap.xml: missing ${englishUrl}`);
  assert(sitemap.includes(`<loc>${site}${chineseUrl}</loc>`), `sitemap.xml: missing ${chineseUrl}`);
}

if (failures.length) {
  console.error(`i18n validation failed (${failures.length})`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("i18n validation passed: 8 localized pages, reciprocal metadata, file-safe language switches, sitemap entries, and local assets.");
