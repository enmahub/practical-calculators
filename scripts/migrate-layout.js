const fs = require("fs");
const path = require("path");

const root = process.cwd();

function hasClass(attrs, className) {
  const classMatch = attrs.match(/\bclass\s*=\s*["']([^"']*)["']/i);
  if (!classMatch) {
    return false;
  }
  return classMatch[1]
    .split(/\s+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .includes(className);
}

function appendClassToTag(tag, className) {
  const openTagMatch = tag.match(/^<([a-z0-9]+)([^>]*)>/i);
  if (!openTagMatch) {
    return tag;
  }
  const attrs = openTagMatch[2] || "";
  if (hasClass(attrs, className)) {
    return tag;
  }

  if (/\bclass\s*=\s*["'][^"']*["']/i.test(attrs)) {
    return tag.replace(/\bclass\s*=\s*["']([^"']*)["']/i, (m, p1) => {
      const next = `${p1} ${className}`.trim().replace(/\s+/g, " ");
      return `class="${next}"`;
    });
  }

  return tag.replace(/^<([a-z0-9]+)/i, `<$1 class="${className}"`);
}

function removeExistingShell(content) {
  let updated = content;
  updated = updated.replace(/<div class="top">[\s\S]*?<\/div>\s*/i, "");
  updated = updated.replace(/<div class="wrap">\s*<div class="card">\s*/i, "");
  updated = updated.replace(/\s*<\/div>\s*<div class="footer">[\s\S]*?<\/div>\s*<\/div>\s*$/i, "");
  updated = updated.replace(/\s*<\/div>\s*<\/div>\s*$/i, "");
  return updated.trim();
}

function addDescClass(mainHtml) {
  return mainHtml.replace(
    /(<h1[^>]*>[\s\S]*?<\/h1>\s*)(<p\b[^>]*>)/i,
    (m, h1, pTag) => `${h1}${appendClassToTag(pTag, "desc")}`
  );
}

function addResultClasses(mainHtml) {
  return mainHtml.replace(/<([a-z0-9]+)([^>]*\bid=["'][^"']*result[^"']*["'][^>]*)>/gi, (m, tag, attrs) => {
    return appendClassToTag(`<${tag}${attrs}>`, "result");
  }).replace(/<([a-z0-9]+)([^>]*\bid=["'](?:r|res|output)["'][^>]*)>/gi, (m, tag, attrs) => {
    return appendClassToTag(`<${tag}${attrs}>`, "result");
  });
}

function splitFooter(mainHtml) {
  const footerPattern = /(?:<hr>\s*)?<p>Browse Categories:<\/p>[\s\S]*$/i;
  const match = mainHtml.match(footerPattern);
  if (!match) {
    return { main: mainHtml.trim(), footer: "" };
  }

  const startIdx = match.index || 0;
  const main = mainHtml.slice(0, startIdx).trim();
  const footer = match[0].replace(/<hr>\s*/i, "").trim();
  return { main, footer };
}

function extractDetails(mainHtml) {
  const details = [];
  const main = mainHtml.replace(/<details[\s\S]*?<\/details>/gi, (match) => {
    details.push(match.trim());
    return "";
  });
  return { main: main.trim(), details };
}

function normalizeSpacing(mainHtml) {
  return mainHtml
    .replace(/<br\s*\/?>\s*<br\s*\/?>/gi, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function buildFooterMarkup() {
  return `<div class="footer">
<p>Browse Categories</p>
<div class="category-grid">
<a class="category-link" href="financial-calculators.html">Financial</a>
<a class="category-link" href="health-calculators.html">Health</a>
<a class="category-link" href="conversion-calculators.html">Conversions</a>
<a class="category-link" href="career-calculators.html">Career</a>
</div>
<p><a class="home-link" href="index.html">Home</a></p>
</div>`;
}

function rebuildBody(main, details) {
  const detailsBlock = details.length ? `${details.join("\n\n")}\n` : "";
  return `<div class="top">
<div class="wrap top-inner">
<a class="brand" href="index.html">Practical Calculators</a>
</div>
</div>
<div class="wrap">
<div class="card">
${main}
</div>
${detailsBlock}
${buildFooterMarkup()}
</div>`;
}

function migrateFile(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  const bodyMatch = raw.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (!bodyMatch) {
    return false;
  }

  let bodyInner = bodyMatch[1].trim();
  bodyInner = removeExistingShell(bodyInner);
  bodyInner = addDescClass(bodyInner);
  bodyInner = addResultClasses(bodyInner);
  bodyInner = normalizeSpacing(bodyInner);
  const split = splitFooter(bodyInner);
  const detailSplit = extractDetails(split.main);
  const rebuilt = rebuildBody(detailSplit.main, detailSplit.details);

  const next = raw.replace(/<body[^>]*>[\s\S]*?<\/body>/i, `<body>\n${rebuilt}\n</body>`);
  if (next === raw) {
    return false;
  }

  fs.writeFileSync(filePath, next, "utf8");
  return true;
}

function main() {
  const htmlFiles = fs.readdirSync(root).filter((name) => name.endsWith(".html"));
  let updatedCount = 0;
  for (const file of htmlFiles) {
    const fullPath = path.join(root, file);
    if (migrateFile(fullPath)) {
      updatedCount += 1;
    }
  }
  console.log(`Layout migration updated ${updatedCount} files.`);
}

main();
