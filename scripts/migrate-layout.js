const fs = require("fs");
const path = require("path");

const root = process.cwd();

function isGeneratedFile(fileName) {
  const generatedPatterns = [
    /-loan-payment-calculator\.html$/i,
    /-salary-to-hourly-calculator\.html$/i,
    /-to-[a-z]{3}-converter\.html$/i
  ];
  return generatedPatterns.some((pattern) => pattern.test(fileName));
}

function shouldSkipMigration(fileName) {
  const explicitlyManagedByGenerator = new Set([
    "index.html",
    "generated-calculators.html"
  ]);
  return explicitlyManagedByGenerator.has(fileName.toLowerCase()) || isGeneratedFile(fileName);
}

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

function escapeAttr(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;");
}

function removeExistingShell(content) {
  let updated = content;
  updated = updated.replace(/\s*<script\b[^>]*\bsite-search\.js[^>]*>\s*<\/script>\s*$/i, "");
  updated = updated.replace(/^\s*<div class="top">[\s\S]*?<\/div>\s*/i, "");
  updated = updated.replace(/\s*<div class="footer">[\s\S]*?<\/div>\s*$/i, "");
  const emptyShellPrefix = /^\s*(?:<div class="wrap">\s*)?<div class="card">\s*<\/div>\s*(?:<\/div>\s*)?/i;
  while (emptyShellPrefix.test(updated)) {
    updated = updated.replace(emptyShellPrefix, "");
  }

  const wrappedMatch = updated.match(
    /^\s*<div class="wrap">\s*<div class="card">\s*([\s\S]*?)\s*<\/div>\s*<\/div>\s*$/i
  );
  if (wrappedMatch) {
    return wrappedMatch[1].trim();
  }

  updated = updated.replace(/^\s*<div class="wrap">\s*/i, "");
  updated = updated.replace(/\s*<\/div>\s*$/i, "");
  updated = updated.replace(/^\s*<div class="card">\s*/i, "");
  updated = updated.replace(/\s*<\/div>\s*$/i, "");
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
    if (tag.toLowerCase() === "script") {
      return m;
    }
    return appendClassToTag(`<${tag}${attrs}>`, "result");
  }).replace(/<([a-z0-9]+)([^>]*\bid=["'](?:r|res|output)["'][^>]*)>/gi, (m, tag, attrs) => {
    if (tag.toLowerCase() === "script") {
      return m;
    }
    return appendClassToTag(`<${tag}${attrs}>`, "result");
  });
}

function addResultPlaceholders(mainHtml) {
  return mainHtml.replace(
    /<([a-z0-9]+)([^>]*\bclass=["'][^"']*\bresult\b[^"']*["'][^>]*)>\s*<\/\1>/gi,
    (m, tag, attrs) => {
      if (tag.toLowerCase() === "script") {
        return m;
      }
      return `<${tag}${attrs}>Result: -</${tag}>`;
    }
  );
}

function splitFooter(mainHtml) {
  const footerPattern = /(?:<hr>\s*)?<p>Browse Categories:?<\/p>[\s\S]*$/i;
  const match = mainHtml.match(footerPattern);
  if (!match) {
    return { main: mainHtml.trim(), footer: "" };
  }

  const startIdx = match.index || 0;
  const main = mainHtml.slice(0, startIdx).trim();
  const footer = match[0].replace(/<hr>\s*/i, "").trim();
  return { main, footer };
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
<p class="footer-meta">
<a href="about.html">About</a> |
<a href="contact.html">Contact</a> |
<a href="privacy.html">Privacy</a> |
<a href="terms.html">Terms</a>
</p>
</div>`;
}

function rebuildBody(main, currentFileName) {
  const pagePath = String(currentFileName || "").replace(/\\/g, "/");
  const searchBlock = `<div class="site-search" data-site-search data-search-index="search-index.json" data-page-path="${escapeAttr(
    pagePath
  )}" data-pref-lang="en" data-no-results="No matches">
<label class="visually-hidden" for="site-search-q">Search calculators</label>
<input type="search" id="site-search-q" class="site-search-input" placeholder="Search calculators…" autocomplete="off" spellcheck="false" role="combobox" aria-haspopup="listbox" aria-autocomplete="list" aria-controls="site-search-results" aria-expanded="false">
<div class="site-search-dropdown" id="site-search-results" hidden role="listbox" aria-label="Search calculators"></div>
</div>`;
  return `<div class="top">
<div class="wrap top-inner">
<a class="brand" href="index.html">Practical Calculators</a>
${searchBlock}
</div>
</div>
<div class="wrap">
<div class="card">
${main}
</div>
${buildFooterMarkup()}
</div>
<script src="number-format.js" defer></script>
<script src="site-search.js" defer></script>`;
}

function migrateFile(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  // Pages built by generate-pages.js (htmlShell) carry data-page-path on <html>.
  // Re-running shell extraction on them duplicates wrappers and empties the card.
  if (/<html[^>]*\bdata-page-path=/i.test(raw)) {
    return false;
  }
  const bodyMatch = raw.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (!bodyMatch) {
    return false;
  }

  let bodyInner = bodyMatch[1].trim();
  bodyInner = bodyInner.replace(/(?:<div class="wrap">\s*<div class="card">\s*<\/div>\s*)+/gi, "");
  bodyInner = removeExistingShell(bodyInner);
  bodyInner = addDescClass(bodyInner);
  bodyInner = addResultClasses(bodyInner);
  bodyInner = addResultPlaceholders(bodyInner);
  bodyInner = normalizeSpacing(bodyInner);
  const split = splitFooter(bodyInner);
  const rebuilt = rebuildBody(split.main, path.basename(filePath));

  let next = raw.replace(/<body[^>]*>[\s\S]*?<\/body>/i, `<body>\n${rebuilt}\n</body>`);
  const nestedEmptyWrapperPattern =
    /<div class="wrap">\s*<div class="card">\s*<\/div>\s*<div class="wrap">\s*<div class="card">/i;
  while (nestedEmptyWrapperPattern.test(next)) {
    next = next.replace(
      nestedEmptyWrapperPattern,
      `<div class="wrap">\n<div class="card">`
    );
  }
  if (next === raw) {
    return false;
  }

  fs.writeFileSync(filePath, next, "utf8");
  return true;
}

function main() {
  const htmlFiles = fs
    .readdirSync(root)
    .filter((name) => name.endsWith(".html") && !shouldSkipMigration(name));
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
