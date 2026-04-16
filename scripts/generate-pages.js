const fs = require("fs");
const path = require("path");

const root = process.cwd();
const configPath = path.join(root, "pages.config.json");

if (!fs.existsSync(configPath)) {
  throw new Error("Missing pages.config.json");
}

const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
const existingHtml = new Set(
  fs
    .readdirSync(root)
    .filter((name) => name.endsWith(".html"))
    .map((name) => name.toLowerCase())
);

const codeNames = {
  usd: "US Dollar",
  eur: "Euro",
  cop: "Colombian Peso",
  gbp: "British Pound",
  cad: "Canadian Dollar",
  mxn: "Mexican Peso",
  jpy: "Japanese Yen",
  inr: "Indian Rupee",
  aud: "Australian Dollar",
  brl: "Brazilian Real",
  ars: "Argentine Peso",
  chf: "Swiss Franc",
  sek: "Swedish Krona",
  nok: "Norwegian Krone",
  dkk: "Danish Krone",
  zar: "South African Rand",
  sgd: "Singapore Dollar",
  aed: "UAE Dirham"
};

function capitalize(code) {
  return code.toUpperCase();
}

function formatAmount(num) {
  return Number(num).toLocaleString("en-US");
}

function slugify(input) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function buildRange(rangeConfig = {}) {
  const start = Number(rangeConfig.start);
  const end = Number(rangeConfig.end);
  const step = Number(rangeConfig.step);
  if (!Number.isFinite(start) || !Number.isFinite(end) || !Number.isFinite(step) || step <= 0) {
    return [];
  }

  const values = [];
  for (let value = start; value <= end; value += step) {
    values.push(value);
  }
  return values;
}

function getAmounts(family) {
  if (Array.isArray(family.amounts) && family.amounts.length > 0) {
    return family.amounts;
  }
  if (family.amountRange) {
    return buildRange(family.amountRange);
  }
  return [];
}

function getCurrencyPairs(currencyFamily) {
  if (Array.isArray(currencyFamily.pairs) && currencyFamily.pairs.length > 0) {
    return currencyFamily.pairs;
  }

  const codes = Array.isArray(currencyFamily.codes) ? currencyFamily.codes : [];
  const includeReverse = Boolean(currencyFamily.includeReverse);
  const limit = Number(currencyFamily.limit) || Number.MAX_SAFE_INTEGER;
  const pairs = [];

  for (let i = 0; i < codes.length; i += 1) {
    for (let j = i + 1; j < codes.length; j += 1) {
      pairs.push([codes[i], codes[j]]);
      if (includeReverse) {
        pairs.push([codes[j], codes[i]]);
      }
      if (pairs.length >= limit) {
        return pairs;
      }
    }
  }

  return pairs;
}

function htmlShell({ title, description, body, lang = "en" }) {
  const robots = config.defaults?.includeRobotsMeta
    ? '<meta name="robots" content="index, follow">\n'
    : "";
  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
<title>${title}</title>
<meta name="description" content="${description}">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
${robots}<link rel="stylesheet" href="styles.css">
</head>
<body>
<div class="top">
<div class="wrap top-inner">
<a class="brand" href="index.html">Practical Calculators</a>
</div>
</div>
<div class="wrap">
<div class="card">
${body}
</div>
<div class="footer">
<p>Browse Categories</p>
<div class="category-grid">
<a class="category-link" href="financial-calculators.html">Financial</a>
<a class="category-link" href="health-calculators.html">Health</a>
<a class="category-link" href="conversion-calculators.html">Conversions</a>
<a class="category-link" href="career-calculators.html">Career</a>
</div>
<p><a class="home-link" href="index.html">Home</a></p>
</div>
</div>
</body>
</html>
`;
}

function pickRelatedEntries(entries, entry, limit = 8) {
  return pickStructuredRelated(entries, entry).primary.slice(0, limit);
}

function uniqueByFileName(items) {
  const seen = new Set();
  const unique = [];
  for (const item of items) {
    if (seen.has(item.fileName)) {
      continue;
    }
    seen.add(item.fileName);
    unique.push(item);
  }
  return unique;
}

function sortByAmountProximity(candidates, targetAmount) {
  return [...candidates].sort((a, b) => {
    const diffA = Math.abs(Number(a.amount || 0) - Number(targetAmount || 0));
    const diffB = Math.abs(Number(b.amount || 0) - Number(targetAmount || 0));
    if (diffA !== diffB) {
      return diffA - diffB;
    }
    return a.fileName.localeCompare(b.fileName);
  });
}

function scoreCurrencyCandidate(entry, candidate) {
  if (entry.family !== "currencyConverter" || candidate.family !== "currencyConverter") {
    return -1;
  }
  if (entry.fileName === candidate.fileName) {
    return -1;
  }

  let score = 0;
  if (candidate.fromCode === entry.toCode && candidate.toCode === entry.fromCode) {
    score += 1000; // reverse pair is usually the most useful.
  }
  if (candidate.fromCode === entry.fromCode) {
    score += 300;
  }
  if (candidate.toCode === entry.toCode) {
    score += 260;
  }
  if (candidate.fromCode === entry.toCode) {
    score += 220;
  }
  if (candidate.toCode === entry.fromCode) {
    score += 220;
  }
  if (
    candidate.fromCode === entry.fromCode ||
    candidate.toCode === entry.toCode ||
    candidate.fromCode === entry.toCode ||
    candidate.toCode === entry.fromCode
  ) {
    score += 50;
  }
  return score;
}

function pickStructuredRelated(entries, entry) {
  const primaryLimit = 10;
  const expandedLimit = 30;

  if (
    entry.family === "loanPaymentByAmount" ||
    entry.family === "salaryToHourlyByAmount"
  ) {
    const sameFamily = entries.filter(
      (candidate) =>
        candidate.fileName !== entry.fileName && candidate.family === entry.family
    );
    const sorted = sortByAmountProximity(sameFamily, entry.amount);
    return {
      primary: sorted.slice(0, primaryLimit),
      expanded: sorted.slice(primaryLimit, primaryLimit + expandedLimit)
    };
  }

  if (entry.family === "currencyConverter") {
    const scored = entries
      .filter((candidate) => candidate.family === "currencyConverter")
      .map((candidate) => ({ candidate, score: scoreCurrencyCandidate(entry, candidate) }))
      .filter((row) => row.score > 0)
      .sort((a, b) => {
        if (b.score !== a.score) {
          return b.score - a.score;
        }
        return a.candidate.fileName.localeCompare(b.candidate.fileName);
      })
      .map((row) => row.candidate);

    return {
      primary: scored.slice(0, primaryLimit),
      expanded: scored.slice(primaryLimit, primaryLimit + expandedLimit)
    };
  }

  const sameCategory = entries.filter(
    (candidate) =>
      candidate.fileName !== entry.fileName && candidate.category === entry.category
  );
  const primary = sameCategory.slice(0, primaryLimit);
  const expanded = sameCategory.slice(primaryLimit, primaryLimit + expandedLimit);
  return { primary, expanded };
}

function relatedHtml(entries, entry) {
  const structured = pickStructuredRelated(entries, entry);
  const primary = uniqueByFileName(structured.primary);
  const expanded = uniqueByFileName(structured.expanded).filter(
    (item) => !primary.some((p) => p.fileName === item.fileName)
  );
  if (!primary.length && !expanded.length) {
    return "";
  }

  const primaryLinks = primary
    .map((item) => `<li><a href="${item.fileName}">${escapeHtml(item.h1)}</a></li>`)
    .join("\n");

  const expandedLinks = expanded
    .map((item) => `<li><a href="${item.fileName}">${escapeHtml(item.h1)}</a></li>`)
    .join("\n");

  const expandedBlock = expanded.length
    ? `<details>
<summary>More related calculators</summary>
<ul>
${expandedLinks}
</ul>
</details>`
    : "";

  return `<h2>Related Calculators</h2>
<ul>
${primaryLinks}
</ul>
${expandedBlock}`;
}

function currencyTemplate(entry, entries) {
  return htmlShell({
    title: entry.title,
    description: entry.description,
    body: `<h1>${entry.h1}</h1>
<p class="desc">Convert ${entry.fromName} (${entry.fromCode}) to ${entry.toName} (${entry.toCode}) using a manual exchange rate.</p>

<label>${entry.fromCode} Amount:</label>
<input type="number" id="amount" value="100"><br><br>
<label>Exchange Rate (${entry.fromCode} to ${entry.toCode}):</label>
<input type="number" id="rate" value="1.00" step="0.0001"><br><br>

<button onclick="convert()">Convert</button>
<h2 id="result" class="result"></h2>

<script>
function convert() {
  const amount = parseFloat(document.getElementById("amount").value) || 0;
  const rate = parseFloat(document.getElementById("rate").value) || 0;
  const converted = amount * rate;
  document.getElementById("result").innerHTML = converted.toFixed(2) + " ${entry.toCode}";
}
</script>
${relatedHtml(entries, entry)}`
  });
}

function loanTemplate(entry, entries) {
  return htmlShell({
    title: entry.title,
    description: entry.description,
    body: `<h1>${entry.h1}</h1>
<p class="desc">Estimate monthly payment for a $${formatAmount(
      entry.amount
    )} loan amount using simple amortization.</p>

<label>Loan Amount ($):</label>
<input type="number" id="amount" value="${entry.amount}"><br><br>
<label>Annual Interest Rate (%):</label>
<input type="number" id="rate" value="7.5" step="0.1"><br><br>
<label>Loan Term (Years):</label>
<input type="number" id="years" value="5"><br><br>

<button onclick="calcPayment()">Calculate Payment</button>
<h2 id="result" class="result"></h2>

<script>
function calcPayment() {
  const amount = parseFloat(document.getElementById("amount").value) || 0;
  const annualRate = parseFloat(document.getElementById("rate").value) || 0;
  const years = parseFloat(document.getElementById("years").value) || 0;
  const monthlyRate = annualRate / 100 / 12;
  const months = years * 12;
  if (months <= 0) {
    document.getElementById("result").innerHTML = "Enter a valid loan term.";
    return;
  }
  if (monthlyRate === 0) {
    const noInterestPayment = amount / months;
    document.getElementById("result").innerHTML = "Monthly Payment: $" + noInterestPayment.toFixed(2);
    return;
  }
  const payment = amount * (monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
  document.getElementById("result").innerHTML = "Monthly Payment: $" + payment.toFixed(2);
}
</script>
${relatedHtml(entries, entry)}`
  });
}

function salaryTemplate(entry, entries) {
  return htmlShell({
    title: entry.title,
    description: entry.description,
    body: `<h1>${entry.h1}</h1>
<p class="desc">Convert a $${formatAmount(entry.amount)} yearly salary into hourly pay.</p>

<label>Annual Salary ($):</label>
<input type="number" id="salary" value="${entry.amount}"><br><br>
<label>Hours Per Week:</label>
<input type="number" id="hours" value="40"><br><br>
<label>Weeks Per Year:</label>
<input type="number" id="weeks" value="52"><br><br>

<button onclick="calcHourly()">Calculate Hourly</button>
<h2 id="result" class="result"></h2>

<script>
function calcHourly() {
  const salary = parseFloat(document.getElementById("salary").value) || 0;
  const hours = parseFloat(document.getElementById("hours").value) || 0;
  const weeks = parseFloat(document.getElementById("weeks").value) || 0;
  const denominator = hours * weeks;
  if (denominator <= 0) {
    document.getElementById("result").innerHTML = "Enter valid hours and weeks.";
    return;
  }
  const hourly = salary / denominator;
  document.getElementById("result").innerHTML = "Hourly Rate: $" + hourly.toFixed(2);
}
</script>
${relatedHtml(entries, entry)}`
  });
}

function buildEntries() {
  const entries = [];
  const families = config.families || {};

  if (families.currencyConverter?.enabled) {
    for (const [from, to] of getCurrencyPairs(families.currencyConverter)) {
      const fromCode = capitalize(from);
      const toCode = capitalize(to);
      const fromName = codeNames[from] || fromCode;
      const toName = codeNames[to] || toCode;
      const slug = slugify(`${from}-to-${to}-converter`);
      entries.push({
        family: "currencyConverter",
        category: families.currencyConverter.categoryLabel || "Currency",
        slug,
        fileName: `${slug}.html`,
        title: `${fromCode} to ${toCode} Converter (Free) - Convert ${fromCode} to ${toCode}`,
        description: `Convert ${fromCode} to ${toCode} instantly with this free currency converter calculator.`,
        h1: `${fromCode} to ${toCode} Converter`,
        fromCode,
        toCode,
        fromName,
        toName
      });
    }
  }

  if (families.loanPaymentByAmount?.enabled) {
    for (const amount of getAmounts(families.loanPaymentByAmount)) {
      const slug = slugify(`${amount}-loan-payment-calculator`);
      entries.push({
        family: "loanPaymentByAmount",
        category: families.loanPaymentByAmount.categoryLabel || "Financial",
        slug,
        fileName: `${slug}.html`,
        title: `${formatAmount(amount)} Loan Payment Calculator (Free)`,
        description: `Estimate monthly payment for a $${formatAmount(amount)} loan with this free calculator.`,
        h1: `$${formatAmount(amount)} Loan Payment Calculator`,
        amount
      });
    }
  }

  if (families.salaryToHourlyByAmount?.enabled) {
    for (const amount of getAmounts(families.salaryToHourlyByAmount)) {
      const slug = slugify(`${amount}-salary-to-hourly-calculator`);
      entries.push({
        family: "salaryToHourlyByAmount",
        category: families.salaryToHourlyByAmount.categoryLabel || "Career",
        slug,
        fileName: `${slug}.html`,
        title: `${formatAmount(amount)} Salary to Hourly Calculator (Free)`,
        description: `Convert a $${formatAmount(amount)} annual salary into hourly pay instantly.`,
        h1: `$${formatAmount(amount)} Salary to Hourly Calculator`,
        amount
      });
    }
  }

  return entries;
}

function renderPage(entry, entries) {
  if (entry.family === "currencyConverter") {
    return currencyTemplate(entry, entries);
  }
  if (entry.family === "loanPaymentByAmount") {
    return loanTemplate(entry, entries);
  }
  if (entry.family === "salaryToHourlyByAmount") {
    return salaryTemplate(entry, entries);
  }
  throw new Error(`Unknown family: ${entry.family}`);
}

function categorySlug(label) {
  return slugify(String(label || "other"));
}

function escapeHtml(text) {
  return String(text || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function groupEntriesByCategory(entries) {
  return entries.reduce((acc, entry) => {
    if (!acc[entry.category]) {
      acc[entry.category] = [];
    }
    acc[entry.category].push(entry);
    return acc;
  }, {});
}

function upsertCategoryHubSection(fileName, heading, items) {
  const filePath = path.join(root, fileName);
  if (!fs.existsSync(filePath)) {
    return;
  }

  const startMarker = "<!-- GENERATED_CATEGORY_LINKS_START -->";
  const endMarker = "<!-- GENERATED_CATEGORY_LINKS_END -->";
  const itemLinks = items
    .map((item) => `<li><a href="${item.fileName}">${escapeHtml(item.h1)}</a></li>`)
    .join("\n");
  const section = `${startMarker}
<h2>${escapeHtml(heading)}</h2>
<!-- Generated from pages.config.json -->
<ul>
${itemLinks}
</ul>
${endMarker}`;

  let content = fs.readFileSync(filePath, "utf8");
  if (content.includes(startMarker) && content.includes(endMarker)) {
    const replacePattern = new RegExp(
      `${startMarker}[\\s\\S]*?${endMarker}`,
      "m"
    );
    content = content.replace(replacePattern, section);
  } else if (content.includes("<hr>")) {
    content = content.replace("<hr>", `${section}\n\n<hr>`);
  } else if (content.includes("</body>")) {
    content = content.replace("</body>", `${section}\n</body>`);
  } else {
    content += `\n${section}\n`;
  }

  fs.writeFileSync(filePath, content, "utf8");
}

function removeCategoryHubSection(fileName) {
  const filePath = path.join(root, fileName);
  if (!fs.existsSync(filePath)) {
    return;
  }
  const startMarker = "<!-- GENERATED_CATEGORY_LINKS_START -->";
  const endMarker = "<!-- GENERATED_CATEGORY_LINKS_END -->";
  let content = fs.readFileSync(filePath, "utf8");
  if (content.includes(startMarker) && content.includes(endMarker)) {
    const replacePattern = new RegExp(`\\n?${startMarker}[\\s\\S]*?${endMarker}\\n?`, "m");
    content = content.replace(replacePattern, "\n");
    fs.writeFileSync(filePath, content, "utf8");
  }
}

function syncMainCategoryPages(entries) {
  const financialGenerated = entries.filter((entry) => entry.category === "Financial");
  const conversionGenerated = entries.filter((entry) => entry.category === "Conversions");
  const careerGenerated = entries.filter((entry) => entry.category === "Career");
  const healthGenerated = entries.filter((entry) => entry.category === "Health");

  if (financialGenerated.length > 0) {
    upsertCategoryHubSection(
      "financial-calculators.html",
      `More Financial Calculators (${financialGenerated.length})`,
      financialGenerated
    );
  }
  if (conversionGenerated.length > 0) {
    upsertCategoryHubSection(
      "conversion-calculators.html",
      `More Conversion Calculators (${conversionGenerated.length})`,
      conversionGenerated
    );
  }
  if (careerGenerated.length > 0) {
    upsertCategoryHubSection(
      "career-calculators.html",
      `More Career Calculators (${careerGenerated.length})`,
      careerGenerated
    );
  } else {
    removeCategoryHubSection("career-calculators.html");
  }
  if (healthGenerated.length > 0) {
    upsertCategoryHubSection(
      "health-calculators.html",
      `More Health Calculators (${healthGenerated.length})`,
      healthGenerated
    );
  } else {
    removeCategoryHubSection("health-calculators.html");
  }
}

function writeGeneratedIndex(entries) {
  const page = `<!DOCTYPE html>
<html lang="en">
<head>
<title>Generated Calculators Index</title>
<meta name="description" content="Legacy URL redirecting to home calculator index.">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="robots" content="index, follow">
<link rel="canonical" href="index.html">
<meta http-equiv="refresh" content="0; url=index.html">
<link rel="stylesheet" href="styles.css">
<!-- Generated from pages.config.json -->
</head>
<body>
<div class="top">
<div class="wrap top-inner">
<a class="brand" href="index.html">Practical Calculators</a>
</div>
</div>
<div class="wrap">
<div class="card">
<h1>Generated Calculators Index</h1>
<p class="desc">This page moved to <a href="index.html">Home</a>.</p>
<script>
window.location.replace("index.html");
</script>
</div>
</div>
</body>
</html>
`;

  const indexPath = path.join(root, config.generatedIndexFile || "generated-calculators.html");
  fs.writeFileSync(indexPath, page, "utf8");
}

function writeHomeIndex(entries) {
  const byCategory = groupEntriesByCategory(entries);
  const categoryHubMap = {
    Financial: "financial-calculators.html",
    Health: "health-calculators.html",
    Conversions: "conversion-calculators.html",
    Career: "career-calculators.html"
  };
  const sections = Object.entries(byCategory)
    .map(([category, items]) => {
      const listItems = items
        .slice(0, 12)
        .map((item) => `<li><a href="${item.fileName}">${escapeHtml(item.h1)}</a></li>`)
        .join("\n");
      const hub = categoryHubMap[category];
      const viewAll = hub
        ? `<p><a href="${hub}">View all ${items.length} ${escapeHtml(category)} calculators</a></p>`
        : "";
      return `<h2>${escapeHtml(category)}</h2>\n${viewAll}\n<ul>\n${listItems}\n</ul>`;
    })
    .join("\n\n");

  const page = `<!DOCTYPE html>
<html lang="en">
<head>
<title>Free Online Calculators - Financial, Health, Conversion & More</title>
<meta name="description" content="Use free online calculators for finance, health, conversions, and more. Simple tools with instant results.">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="robots" content="index, follow">
<link rel="stylesheet" href="styles.css">
</head>
<body>
<div class="top">
<div class="wrap top-inner">
<a class="brand" href="index.html">Practical Calculators</a>
</div>
</div>
<div class="wrap">
<div class="card">
<h1>Free Online Calculators</h1>
<p class="desc">Browse calculators by category.</p>
<!-- Home index generated from pages.config.json -->
<h2>Categories</h2>
<div class="category-grid">
<a class="category-link" href="financial-calculators.html">Financial Calculators</a>
<a class="category-link" href="health-calculators.html">Health Calculators</a>
<a class="category-link" href="conversion-calculators.html">Conversion Calculators</a>
<a class="category-link" href="career-calculators.html">Career Calculators</a>
</div>
${sections}
</div>
<div class="footer">
<p>Browse Categories</p>
<div class="category-grid">
<a class="category-link" href="financial-calculators.html">Financial</a>
<a class="category-link" href="health-calculators.html">Health</a>
<a class="category-link" href="conversion-calculators.html">Conversions</a>
<a class="category-link" href="career-calculators.html">Career</a>
</div>
</div>
</div>
</body>
</html>
`;
  fs.writeFileSync(path.join(root, "index.html"), page, "utf8");
}

function writeSitemap(entries) {
  if (!config.siteUrl) {
    return;
  }

  const base = config.siteUrl.replace(/\/$/, "");
  const htmlFiles = fs
    .readdirSync(root)
    .filter((name) => name.endsWith(".html"));

  const urls = new Set(htmlFiles.map((file) => `${base}/${file}`));
  urls.add(`${base}/${config.generatedIndexFile || "generated-calculators.html"}`);
  for (const entry of entries) {
    urls.add(`${base}/${entry.fileName}`);
  }

  const content = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${Array.from(urls)
  .sort()
  .map((url) => `  <url><loc>${url}</loc></url>`)
  .join("\n")}
</urlset>
`;

  fs.writeFileSync(path.join(root, "sitemap.xml"), content, "utf8");
}

function main() {
  const overwrite = process.argv.includes("--overwrite");
  const entries = buildEntries();
  let created = 0;
  let skipped = 0;

  for (const entry of entries) {
    const outputPath = path.join(root, entry.fileName);
    const fileExists = fs.existsSync(outputPath) || existingHtml.has(entry.fileName.toLowerCase());
    if (fileExists && !overwrite) {
      skipped += 1;
      continue;
    }
    fs.writeFileSync(outputPath, renderPage(entry, entries), "utf8");
    created += 1;
  }

  syncMainCategoryPages(entries);
  writeHomeIndex(entries);
  writeGeneratedIndex(entries);
  writeSitemap(entries);

  console.log(`Generated entries configured: ${entries.length}`);
  console.log(`Pages created/updated: ${created}`);
  console.log(`Pages skipped (existing): ${skipped}`);
  console.log(`Wrote index.html, ${config.generatedIndexFile || "generated-calculators.html"}, and sitemap.xml`);
}

main();
