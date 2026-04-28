const fs = require("fs");
const path = require("path");

const root = process.cwd();
const pagesConfig = JSON.parse(fs.readFileSync(path.join(root, "pages.config.json"), "utf8"));
const legacyConfig = JSON.parse(fs.readFileSync(path.join(root, "legacy-pages.config.json"), "utf8"));

function buildRange(range) {
  const start = Number(range?.start);
  const end = Number(range?.end);
  const step = Number(range?.step);
  if (!Number.isFinite(start) || !Number.isFinite(end) || !Number.isFinite(step) || step <= 0) {
    return [];
  }
  const out = [];
  for (let v = start; v <= end; v += step) out.push(v);
  return out;
}

function getCurrencyPairs(currencyFamily) {
  if (Array.isArray(currencyFamily?.pairs) && currencyFamily.pairs.length > 0) return currencyFamily.pairs;
  const codes = Array.isArray(currencyFamily?.codes) ? currencyFamily.codes : [];
  const includeReverse = Boolean(currencyFamily?.includeReverse);
  const limit = Number(currencyFamily?.limit) || Number.MAX_SAFE_INTEGER;
  const pairs = [];
  for (let i = 0; i < codes.length; i += 1) {
    for (let j = i + 1; j < codes.length; j += 1) {
      pairs.push([codes[i], codes[j]]);
      if (includeReverse) pairs.push([codes[j], codes[i]]);
      if (pairs.length >= limit) return pairs;
    }
  }
  return pairs;
}

function shouldIndexCurrencyPair(fromCode, toCode) {
  const core = new Set((pagesConfig.qualityRules?.currencyIndexCore || []).map((c) => String(c).toUpperCase()));
  return core.has(String(fromCode).toUpperCase()) || core.has(String(toCode).toUpperCase());
}

function isStepMatch(value, step, min) {
  if (!Number.isFinite(step) || step <= 0) return true;
  if (!Number.isFinite(value) || !Number.isFinite(min)) return false;
  return (value - min) % step === 0;
}

function shouldIndexLoanAmount(amount) {
  const min = Number(pagesConfig.qualityRules?.loanIndexMinAmount || 0);
  const step = Number(pagesConfig.qualityRules?.loanIndexStep || 0);
  return Number(amount) >= min && isStepMatch(Number(amount), step, min);
}

function shouldIndexSalaryAmount(amount) {
  const min = Number(pagesConfig.qualityRules?.salaryIndexMinAmount || 0);
  const step = Number(pagesConfig.qualityRules?.salaryIndexStep || 0);
  return Number(amount) >= min && isStepMatch(Number(amount), step, min);
}

function tally(rows) {
  const total = rows.length;
  const indexable = rows.filter((r) => r.indexable).length;
  return { total, indexable, noindex: total - indexable };
}

function line(label, stats) {
  return `${label.padEnd(22)} total=${String(stats.total).padStart(4)}  indexable=${String(
    stats.indexable
  ).padStart(4)}  noindex=${String(stats.noindex).padStart(4)}`;
}

const rows = [];
const families = pagesConfig.families || {};

if (families.currencyConverter?.enabled) {
  for (const [from, to] of getCurrencyPairs(families.currencyConverter)) {
    rows.push({ family: "currencyConverter", indexable: shouldIndexCurrencyPair(from, to) });
  }
}

if (families.loanPaymentByAmount?.enabled) {
  for (const amount of buildRange(families.loanPaymentByAmount.amountRange)) {
    rows.push({ family: "loanPaymentByAmount", indexable: shouldIndexLoanAmount(amount) });
  }
}

if (families.salaryToHourlyByAmount?.enabled) {
  for (const amount of buildRange(families.salaryToHourlyByAmount.amountRange)) {
    rows.push({ family: "salaryToHourlyByAmount", indexable: shouldIndexSalaryAmount(amount) });
  }
}

for (const _ of pagesConfig.pilots?.spanishPages || []) rows.push({ family: "spanishPilotPage", indexable: true });
for (const _ of pagesConfig.pilots?.statePages || []) rows.push({ family: "statePaycheckPilotPage", indexable: true });
for (const page of legacyConfig.pages || []) rows.push({ family: "legacyStaticPage", indexable: page.indexable !== false });

const familyNames = [
  "currencyConverter",
  "loanPaymentByAmount",
  "salaryToHourlyByAmount",
  "spanishPilotPage",
  "statePaycheckPilotPage",
  "legacyStaticPage"
];

const byFamily = {};
for (const fam of familyNames) byFamily[fam] = tally(rows.filter((r) => r.family === fam));
const grand = tally(rows);

const report = {
  generatedAt: new Date().toISOString(),
  configuredEntries: grand.total,
  indexable: grand.indexable,
  noindex: grand.noindex,
  byFamily
};

const outDir = path.join(root, "reports");
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, "indexability-report.json"), JSON.stringify(report, null, 2), "utf8");

console.log("Configured indexability report");
for (const fam of familyNames) console.log(line(fam, byFamily[fam]));
console.log("-".repeat(72));
console.log(line("TOTAL", grand));
console.log("Wrote reports/indexability-report.json");
