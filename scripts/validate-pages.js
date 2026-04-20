const fs = require("fs");
const path = require("path");

const root = process.cwd();

function normalizePath(value) {
  return String(value || "").replace(/\\/g, "/").replace(/^\/+/, "");
}

function collectHtmlFiles(baseDir, currentDir = "") {
  const dirPath = path.join(baseDir, currentDir);
  const rows = [];
  for (const item of fs.readdirSync(dirPath, { withFileTypes: true })) {
    if (item.name.startsWith(".") || item.name === "node_modules") {
      continue;
    }
    const rel = normalizePath(path.join(currentDir, item.name));
    if (item.isDirectory()) {
      rows.push(...collectHtmlFiles(baseDir, rel));
      continue;
    }
    if (item.isFile() && item.name.endsWith(".html")) {
      rows.push(rel);
    }
  }
  return rows;
}

const htmlFiles = collectHtmlFiles(root);
const htmlSet = new Set(htmlFiles.map((name) => name.toLowerCase()));

const errors = [];
const warnings = [];
const titleToFiles = new Map();
const descriptionToFiles = new Map();

function trackDupes(map, key, file) {
  if (!key) {
    return;
  }
  if (!map.has(key)) {
    map.set(key, []);
  }
  map.get(key).push(file);
}

/** Only <li><a href> after Related h2 and before footer (avoids hub nav / canonical false positives). */
function relatedListSelfLinkErrors(file, content) {
  const relatedRe = /<h2>\s*(?:Related Calculators|Calculadoras relacionadas)\s*<\/h2>/i;
  const idx = content.search(relatedRe);
  if (idx === -1) {
    return [];
  }
  const fromRelated = content.slice(idx);
  const footerIdx = fromRelated.search(/<div\s+class="footer">/i);
  const slice = footerIdx === -1 ? fromRelated : fromRelated.slice(0, footerIdx);
  const selfKey = file.toLowerCase();
  const out = [];
  const liRe = /<li>\s*<a\s+href=["']([^"']+)["']/gi;
  let m;
  while ((m = liRe.exec(slice)) !== null) {
    const href = m[1];
    const skip =
      href.startsWith("http://") ||
      href.startsWith("https://") ||
      href.startsWith("mailto:") ||
      href.startsWith("tel:") ||
      href.startsWith("#") ||
      href.startsWith("javascript:") ||
      href.startsWith("//");
    if (skip) {
      continue;
    }
    const pathOnly = href.split("#")[0].split("?")[0].replace(/^\.\//, "");
    const resolvedPath = normalizePath(
      path.posix.normalize(path.posix.join(path.posix.dirname(file), pathOnly))
    );
    if (resolvedPath.toLowerCase() === selfKey) {
      out.push(`${file}: Related list links to itself -> ${href}`);
    }
  }
  return out;
}

for (const file of htmlFiles) {
  const fullPath = path.join(root, file);
  const content = fs.readFileSync(fullPath, "utf8");
  if (/^google[0-9a-z]+\.html$/i.test(path.basename(file))) {
    continue;
  }

  const hasLang = /<html[^>]*\slang=["'][^"']+["']/i.test(content);
  const hasViewport = /<meta\s+name=["']viewport["']/i.test(content);
  const titleMatch = content.match(/<title[^>]*>(.*?)<\/title>/is);
  const descMatch = content.match(
    /<meta\s+name=["']description["']\s+content=["']([^"']*)["']/i
  );
  const h1Count = (content.match(/<h1\b/gi) || []).length;

  if (!hasLang) {
    errors.push(`${file}: missing <html lang="...">`);
  }
  if (!hasViewport) {
    errors.push(`${file}: missing viewport meta tag`);
  }
  if (!titleMatch || !titleMatch[1].trim()) {
    errors.push(`${file}: missing non-empty <title>`);
  }
  if (!descMatch || !descMatch[1].trim()) {
    errors.push(`${file}: missing non-empty meta description`);
  }
  if (h1Count !== 1) {
    warnings.push(`${file}: expected exactly 1 <h1>, found ${h1Count}`);
  }

  const title = titleMatch ? titleMatch[1].trim() : "";
  const description = descMatch ? descMatch[1].trim() : "";
  trackDupes(titleToFiles, title, file);
  trackDupes(descriptionToFiles, description, file);

  const hrefRegex = /href\s*=\s*["']([^"']+)["']/gi;
  let match = hrefRegex.exec(content);
  while (match) {
    const href = match[1];
    const skip =
      href.startsWith("http://") ||
      href.startsWith("https://") ||
      href.startsWith("mailto:") ||
      href.startsWith("tel:") ||
      href.startsWith("#") ||
      href.startsWith("javascript:") ||
      href.startsWith("//");

    if (!skip) {
      const pathOnly = href.split("#")[0].split("?")[0].replace(/^\.\//, "");
      const resolvedPath = normalizePath(
        path.posix.normalize(path.posix.join(path.posix.dirname(file), pathOnly))
      );
      if (resolvedPath.endsWith(".html") && !htmlSet.has(resolvedPath.toLowerCase())) {
        errors.push(`${file}: broken internal link -> ${href}`);
      }
    }

    match = hrefRegex.exec(content);
  }

  for (const msg of relatedListSelfLinkErrors(file, content)) {
    errors.push(msg);
  }
}

for (const [title, files] of titleToFiles.entries()) {
  if (title && files.length > 1) {
    warnings.push(`duplicate title "${title}" in: ${files.join(", ")}`);
  }
}

for (const [description, files] of descriptionToFiles.entries()) {
  if (description && files.length > 1) {
    warnings.push(`duplicate description "${description}" in: ${files.join(", ")}`);
  }
}

if (warnings.length) {
  console.log("Warnings:");
  for (const warning of warnings) {
    console.log(`- ${warning}`);
  }
}

if (errors.length) {
  console.error("Validation errors:");
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log(`Validated ${htmlFiles.length} HTML files successfully.`);
