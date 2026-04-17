const fs = require("fs");
const path = require("path");

const root = process.cwd();
const configPath = path.join(root, "pages.config.json");
const legacyConfigPath = path.join(root, "legacy-pages.config.json");

if (!fs.existsSync(configPath)) {
  throw new Error("Missing pages.config.json");
}

const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
const legacyConfig = fs.existsSync(legacyConfigPath)
  ? JSON.parse(fs.readFileSync(legacyConfigPath, "utf8"))
  : { pages: [] };
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

function normalizePath(value) {
  return String(value || "").replace(/\\/g, "/").replace(/^\/+/, "");
}

function pathDepth(pagePath) {
  const normalized = normalizePath(pagePath);
  if (!normalized) {
    return 0;
  }
  const parts = normalized.split("/");
  return Math.max(parts.length - 1, 0);
}

function relativePrefix(pagePath) {
  const depth = pathDepth(pagePath);
  if (depth <= 0) {
    return "";
  }
  return "../".repeat(depth);
}

function toHref(pagePath, targetPath) {
  const prefix = relativePrefix(pagePath);
  return `${prefix}${normalizePath(targetPath)}`;
}

function localeCode(lang) {
  return String(lang || "en").toLowerCase().startsWith("es") ? "es" : "en";
}

const LOCALE_LABELS = {
  en: {
    browseCategories: "Browse Categories",
    financial: "Financial",
    health: "Health",
    conversions: "Conversions",
    career: "Career",
    home: "Home",
    about: "About",
    contact: "Contact",
    privacy: "Privacy",
    terms: "Terms",
    relatedTitle: "Related Calculators",
    moreRelated: "More related calculators",
    categoryHub: "Category Hub",
    trustTitle: "How this result is estimated",
    trustDescription:
      "This {topic} provides estimate-level outputs based on the values you enter. Review assumptions and verify important decisions independently.",
    trustItem1: "Inputs are user-provided and may include rounding.",
    trustItem2: "Results are informational and not financial, tax, legal, or medical advice.",
    trustItem3: "For high-impact decisions, confirm with a licensed professional.",
    trustReviewed: "Last reviewed"
  },
  es: {
    browseCategories: "Explorar categorías",
    financial: "Finanzas",
    health: "Salud",
    conversions: "Conversiones",
    career: "Carrera",
    home: "Inicio (Español)",
    englishHome: "Home (English)",
    about: "Acerca de",
    contact: "Contacto",
    privacy: "Privacidad",
    terms: "Términos",
    relatedTitle: "Calculadoras relacionadas",
    moreRelated: "Más calculadoras relacionadas",
    categoryHub: "Índice de categoría",
    trustTitle: "Información sobre este cálculo",
    trustDescription: "El resultado se genera con los datos ingresados por el usuario.",
    trustItem1: "Los valores mostrados pueden incluir redondeos y son solo informativos.",
    trustItem2: "Para decisiones relevantes, verifique la información o consulte a un profesional.",
    trustItem3: "",
    trustReviewed: "Última revisión"
  }
};

const SPANISH_CATEGORY_LABELS = {
  Financial: "Finanzas",
  Conversions: "Conversiones",
  Health: "Salud",
  Career: "Carrera"
};

const EN_INFO_PAGES = [
  {
    fileName: "about.html",
    title: "About Practical Calculators",
    description: "Learn about Practical Calculators and our goal of offering free, easy-to-use online calculation tools.",
    body: `<h1>About Practical Calculators</h1>
<p class="desc">Practical Calculators is a free website that provides simple online calculators and conversion tools for everyday use.</p>
<p>The goal of this site is to make common calculations easier to access without downloads or signups.</p>
<p>Topics include finance, loans, percentages, currency conversion, business tools, savings, and other practical utilities.</p>
<p>New tools may be added over time as the site grows.</p>
<p>If you notice an issue or would like to suggest a calculator, please use the <a href="contact.html">contact page</a>.</p>`
  },
  {
    fileName: "contact.html",
    title: "Contact Practical Calculators",
    description: "Contact Practical Calculators with questions, feedback, and calculator suggestions.",
    body: `<h1>Contact Practical Calculators</h1>
<p class="desc">Questions, feedback, or calculator suggestions are welcome.</p>
<h2>Contact Form</h2>
<form action="https://formspree.io/f/xbdqgnky" method="POST">
<label for="contact-name">Name</label>
<input id="contact-name" name="name" type="text" placeholder="Your name" required>
<label for="contact-email">Email</label>
<input id="contact-email" name="email" type="email" placeholder="you@example.com" required>
<label for="contact-message">Message</label>
<textarea id="contact-message" name="message" placeholder="How can we help?" required></textarea>
<input type="hidden" name="_subject" value="New message from Practical Calculators">
<input type="text" name="_gotcha" tabindex="-1" autocomplete="off" style="display:none">
<button type="submit">Send</button>
</form>
<p class="small">This form is powered by Formspree.</p>
<p>Response times may vary.</p>`
  },
  {
    fileName: "privacy.html",
    title: "Privacy Policy | Practical Calculators",
    description: "Read the Practical Calculators privacy policy and how limited usage information may be handled.",
    body: `<h1>Privacy Policy</h1>
<p class="desc">Practical Calculators respects your privacy.</p>
<p>This website may collect limited non-personal data such as browser type, device information, pages visited, and usage statistics through analytics or hosting providers.</p>
<p>If advertising services are used, third-party vendors may use cookies to serve ads or measure performance.</p>
<p>This site does not require account creation.</p>
<p>If you contact us by email, the information you provide may be used only to respond to your message.</p>
<p>External links may lead to third-party websites with their own privacy practices.</p>
<p>This policy may be updated over time.</p>`
  },
  {
    fileName: "terms.html",
    title: "Terms of Use | Practical Calculators",
    description: "Review the terms of use for Practical Calculators and the limitations of calculator outputs.",
    body: `<h1>Terms of Use</h1>
<p class="desc">By using Practical Calculators, you agree to use the website for lawful purposes only.</p>
<p>The calculators and tools are provided for general informational use. Results are estimates based on the values entered.</p>
<p>No guarantee is made regarding completeness or suitability for financial, legal, tax, medical, or professional decisions.</p>
<p>Users should verify important results independently.</p>
<p>This website may update, change, or remove tools at any time without notice.</p>
<p>Use of this site is at your own risk.</p>`
  }
];

const ES_INFO_PAGES = [
  {
    fileName: "es/about.html",
    title: "Acerca de Practical Calculators",
    description: "Conoce Practical Calculators y su objetivo de ofrecer herramientas gratuitas de cálculo en español.",
    body: `<h1>Acerca de Practical Calculators</h1>
<p class="desc">Practical Calculators es un sitio web gratuito con calculadoras en línea y herramientas de conversión para usos cotidianos.</p>
<p>El objetivo del sitio es facilitar cálculos comunes sin descargas ni registros.</p>
<p>Incluye herramientas de finanzas, préstamos, porcentajes, conversión de divisas, negocios, ahorro y otras utilidades prácticas.</p>
<p>Se pueden agregar nuevas herramientas con el tiempo.</p>
<p>Si encuentras un problema o deseas sugerir una calculadora, visita la <a href="../es/contact.html">página de contacto</a>.</p>`
  },
  {
    fileName: "es/contact.html",
    title: "Contacto | Practical Calculators",
    description: "Contacta a Practical Calculators con preguntas, comentarios y sugerencias de nuevas calculadoras.",
    body: `<h1>Contacto</h1>
<p class="desc">Se aceptan preguntas, comentarios y sugerencias de nuevas calculadoras.</p>
<p>Usa el formulario de contacto disponible en esta página.</p>
<form action="https://formspree.io/f/xbdqgnky" method="POST">
<label for="contact-name">Nombre</label>
<input id="contact-name" name="name" type="text" placeholder="Tu nombre" required>
<label for="contact-email">Correo electrónico</label>
<input id="contact-email" name="email" type="email" placeholder="tu@correo.com" required>
<label for="contact-message">Mensaje</label>
<textarea id="contact-message" name="message" placeholder="¿Cómo podemos ayudarte?" required></textarea>
<input type="hidden" name="_subject" value="Nuevo mensaje desde Practical Calculators (ES)">
<input type="text" name="_gotcha" tabindex="-1" autocomplete="off" style="display:none">
<button type="submit">Enviar</button>
</form>
<p class="small">Este formulario funciona con Formspree.</p>
<p>Los tiempos de respuesta pueden variar.</p>`
  },
  {
    fileName: "es/privacy.html",
    title: "Privacidad | Practical Calculators",
    description: "Lee la política de privacidad de Practical Calculators en español.",
    body: `<h1>Política de Privacidad</h1>
<p class="desc">Practical Calculators respeta tu privacidad.</p>
<p>Este sitio puede recopilar datos no personales limitados, como tipo de navegador, dispositivo, páginas visitadas y estadísticas de uso mediante herramientas de análisis o proveedores de alojamiento.</p>
<p>Si se utilizan servicios publicitarios, terceros pueden usar cookies para mostrar anuncios o medir rendimiento.</p>
<p>Este sitio no requiere creación de cuentas.</p>
<p>Si nos contactas mediante formulario o correo, la información enviada puede usarse únicamente para responder tu mensaje.</p>
<p>Los enlaces externos pueden dirigir a sitios de terceros con sus propias políticas.</p>
<p>Esta política puede actualizarse con el tiempo.</p>`
  },
  {
    fileName: "es/terms.html",
    title: "Términos de Uso | Practical Calculators",
    description: "Revisa los términos de uso de Practical Calculators en español.",
    body: `<h1>Términos de Uso</h1>
<p class="desc">Al utilizar Practical Calculators, aceptas usar este sitio solo con fines legales.</p>
<p>Las calculadoras y herramientas se ofrecen para uso informativo general. Los resultados son estimaciones basadas en los valores ingresados.</p>
<p>No se garantiza integridad, disponibilidad o idoneidad para decisiones financieras, legales, fiscales, médicas o profesionales.</p>
<p>Se recomienda verificar resultados importantes de forma independiente.</p>
<p>Este sitio puede actualizar, cambiar o eliminar herramientas en cualquier momento y sin aviso previo.</p>
<p>El uso del sitio es bajo tu propia responsabilidad.</p>`
  }
];

function collectHtmlPaths(baseDir, currentDir = "") {
  const dirPath = path.join(baseDir, currentDir);
  const rows = [];
  for (const item of fs.readdirSync(dirPath, { withFileTypes: true })) {
    if (item.name.startsWith(".")) {
      continue;
    }
    const relative = normalizePath(path.join(currentDir, item.name));
    if (item.isDirectory()) {
      rows.push(...collectHtmlPaths(baseDir, relative));
      continue;
    }
    if (item.isFile() && item.name.endsWith(".html")) {
      rows.push(relative);
    }
  }
  return rows;
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

function htmlShell({
  title,
  description,
  body,
  lang = "en",
  pagePath = "",
  robotsDirective = "index, follow",
  canonicalPath = ""
}) {
  const locale = localeCode(lang);
  const labels = LOCALE_LABELS[locale];
  const isSpanishPath = normalizePath(pagePath).startsWith("es/");
  const robots = config.defaults?.includeRobotsMeta
    ? `<meta name="robots" content="${robotsDirective}">\n`
    : "";
  const canonicalHref = canonicalPath
    ? (config.siteUrl
        ? `${config.siteUrl.replace(/\/$/, "")}/${normalizePath(canonicalPath)}`
        : normalizePath(canonicalPath))
    : "";
  const canonical = canonicalHref
    ? `<link rel="canonical" href="${canonicalHref}">\n`
    : "";
  const stylesHref = toHref(pagePath, "styles.css");
  const homeHref = toHref(pagePath, isSpanishPath ? "es/index.html" : "index.html");
  const englishHomeHref = toHref(pagePath, "index.html");
  const financialHref = toHref(
    pagePath,
    isSpanishPath ? "es/financial-calculators.html" : "financial-calculators.html"
  );
  const healthHref = toHref(
    pagePath,
    isSpanishPath ? "es/health-calculators.html" : "health-calculators.html"
  );
  const conversionsHref = toHref(
    pagePath,
    isSpanishPath ? "es/conversion-calculators.html" : "conversion-calculators.html"
  );
  const careerHref = toHref(
    pagePath,
    isSpanishPath ? "es/career-calculators.html" : "career-calculators.html"
  );
  const analyticsLoader = `<script src="${toHref(pagePath, "site-analytics.js")}" data-analytics-page defer></script>`;
  const aboutPath = isSpanishPath ? "es/about.html" : "about.html";
  const contactPath = isSpanishPath ? "es/contact.html" : "contact.html";
  const privacyPath = isSpanishPath ? "es/privacy.html" : "privacy.html";
  const termsPath = isSpanishPath ? "es/terms.html" : "terms.html";
  const footerInfoLinksHtml = `<p class="footer-meta">
<a href="${toHref(pagePath, aboutPath)}">${labels.about}</a> |
<a href="${toHref(pagePath, contactPath)}">${labels.contact}</a> |
<a href="${toHref(pagePath, privacyPath)}">${labels.privacy}</a> |
<a href="${toHref(pagePath, termsPath)}">${labels.terms}</a>
</p>`;
  const homeLinksHtml = isSpanishPath
    ? `<p><a class="home-link" href="${homeHref}">${labels.home}</a> | <a class="home-link" href="${englishHomeHref}">${labels.englishHome}</a></p>`
    : `<p><a class="home-link" href="${homeHref}">${labels.home}</a></p>`;
  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
<title>${title}</title>
<meta name="description" content="${description}">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
${robots}${canonical}<link rel="stylesheet" href="${stylesHref}">
${analyticsLoader}
</head>
<body>
<div class="top">
<div class="wrap top-inner">
<a class="brand" href="${homeHref}">Practical Calculators</a>
</div>
</div>
<div class="wrap">
<div class="card">
${body}
</div>
<div class="footer">
<p>${labels.browseCategories}</p>
<div class="category-grid">
<a class="category-link" href="${financialHref}">${labels.financial}</a>
<a class="category-link" href="${healthHref}">${labels.health}</a>
<a class="category-link" href="${conversionsHref}">${labels.conversions}</a>
<a class="category-link" href="${careerHref}">${labels.career}</a>
</div>
${homeLinksHtml}
${footerInfoLinksHtml}
</div>
</div>
</body>
</html>
`;
}

const homeSections = [
  {
    category: "Financial",
    hub: "financial-calculators.html",
    items: [
      { fileName: "mortgage-calculator.html", h1: "Mortgage Calculator" },
      { fileName: "loan-calculator.html", h1: "Loan Calculator" },
      { fileName: "compound-interest.html", h1: "Compound Interest" },
      { fileName: "savings-calculator.html", h1: "Savings Calculator" },
      { fileName: "retirement-calculator.html", h1: "Retirement Calculator" }
    ]
  },
  {
    category: "Conversions",
    hub: "conversion-calculators.html",
    items: [
      { fileName: "kilometers-to-miles-converter.html", h1: "Kilometers to Miles Converter" },
      { fileName: "celsius-to-fahrenheit-converter.html", h1: "Celsius to Fahrenheit Converter" },
      { fileName: "seconds-to-minutes-converter.html", h1: "Seconds to Minutes Converter" },
      { fileName: "percentage-calculator.html", h1: "Percentage Calculator" },
      { fileName: "minutes-to-hours-converter.html", h1: "Minutes to Hours Converter" }
    ]
  },
  {
    category: "Health",
    hub: "health-calculators.html",
    items: [
      { fileName: "bmi-calculator.html", h1: "BMI Calculator" },
      { fileName: "calorie-calculator.html", h1: "Calorie Calculator" },
      { fileName: "weight-loss-calculator.html", h1: "Weight Loss Calculator" },
      { fileName: "ovulation-calculator.html", h1: "Ovulation Calculator" },
      { fileName: "macros-calculator.html", h1: "Macros Calculator" }
    ]
  },
  {
    category: "Career",
    hub: "career-calculators.html",
    items: [
      { fileName: "salary-calculator.html", h1: "Salary Calculator" },
      { fileName: "gpa-calculator.html", h1: "GPA Calculator" },
      { fileName: "30000-salary-to-hourly-calculator.html", h1: "$30,000 Salary to Hourly Calculator" },
      { fileName: "50000-salary-to-hourly-calculator.html", h1: "$50,000 Salary to Hourly Calculator" },
      { fileName: "100000-salary-to-hourly-calculator.html", h1: "$100,000 Salary to Hourly Calculator" }
    ]
  }
];

const footerInfoLinksHtml = `<p class="footer-meta">
<a href="about.html">About</a> |
<a href="contact.html">Contact</a> |
<a href="privacy.html">Privacy</a> |
<a href="terms.html">Terms</a>
</p>`;

const trustUpdatedDate = config.trust?.updatedDate || "2026-04-17";

function trustBlockHtml(topic = "calculator", lang = "en") {
  const locale = localeCode(lang);
  const labels = LOCALE_LABELS[locale];
  const description = labels.trustDescription.replace("{topic}", escapeHtml(topic));
  const trustItems = [labels.trustItem1, labels.trustItem2, labels.trustItem3]
    .filter((item) => String(item || "").trim().length > 0)
    .map((item) => `<li>${item}</li>`)
    .join("\n");
  return `<div class="trust-block">
<h2>${labels.trustTitle}</h2>
<p class="desc">${description}</p>
<ul>
${trustItems}
</ul>
<p class="small">${labels.trustReviewed}: ${escapeHtml(trustUpdatedDate)}</p>
</div>`;
}

function shouldIndexCurrencyPair(fromCode, toCode) {
  const core = new Set((config.qualityRules?.currencyIndexCore || []).map((item) => String(item).toUpperCase()));
  return core.has(fromCode) || core.has(toCode);
}

function isStepMatch(value, step, min) {
  if (!Number.isFinite(step) || step <= 0) {
    return true;
  }
  if (!Number.isFinite(value) || !Number.isFinite(min)) {
    return false;
  }
  return (value - min) % step === 0;
}

function shouldIndexLoanAmount(amount) {
  const min = Number(config.qualityRules?.loanIndexMinAmount || 0);
  const step = Number(config.qualityRules?.loanIndexStep || 0);
  return Number(amount) >= min && isStepMatch(Number(amount), step, min);
}

function shouldIndexSalaryAmount(amount) {
  const min = Number(config.qualityRules?.salaryIndexMinAmount || 0);
  const step = Number(config.qualityRules?.salaryIndexStep || 0);
  return Number(amount) >= min && isStepMatch(Number(amount), step, min);
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

function isSameMarket(entry, candidate) {
  return (entry.marketId || "en") === (candidate.marketId || "en");
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
        candidate.pagePath !== entry.pagePath &&
        candidate.family === entry.family &&
        isSameMarket(entry, candidate) &&
        candidate.indexable !== false
    );
    const sorted = sortByAmountProximity(sameFamily, entry.amount);
    return {
      primary: sorted.slice(0, primaryLimit),
      expanded: sorted.slice(primaryLimit, primaryLimit + expandedLimit)
    };
  }

  if (entry.family === "currencyConverter") {
    const scored = entries
      .filter(
        (candidate) =>
          candidate.family === "currencyConverter" &&
          isSameMarket(entry, candidate) &&
          candidate.indexable !== false
      )
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
      candidate.pagePath !== entry.pagePath &&
      candidate.category === entry.category &&
      isSameMarket(entry, candidate) &&
      candidate.indexable !== false
  );
  const primary = sameCategory.slice(0, primaryLimit);
  const expanded = sameCategory.slice(primaryLimit, primaryLimit + expandedLimit);
  return { primary, expanded };
}

function relatedHtml(entries, entry) {
  const locale = localeCode(entry.lang);
  const labels = LOCALE_LABELS[locale];
  const isSpanish = locale === "es";
  const structured = pickStructuredRelated(entries, entry);
  const primary = uniqueByFileName(structured.primary);
  const expanded = uniqueByFileName(structured.expanded).filter(
    (item) => !primary.some((p) => p.fileName === item.fileName)
  );
  if (!primary.length && !expanded.length) {
    return "";
  }

  const primaryLinks = primary
    .map((item) => `<li><a href="${toHref(entry.pagePath, item.pagePath || item.fileName)}">${escapeHtml(item.h1)}</a></li>`)
    .join("\n");

  const expandedLinks = expanded
    .map((item) => `<li><a href="${toHref(entry.pagePath, item.pagePath || item.fileName)}">${escapeHtml(item.h1)}</a></li>`)
    .join("\n");

  const expandedBlock = expanded.length
    ? `<details>
<summary>${labels.moreRelated}</summary>
<ul>
${expandedLinks}
</ul>
</details>`
    : "";

  const hubHref = toHref(entry.pagePath, entry.hubPath || "index.html");
  const homeHref = toHref(entry.pagePath, isSpanish ? "es/index.html" : "index.html");
  const englishHomeHref = toHref(entry.pagePath, "index.html");
  const homeLinks = isSpanish
    ? `<a href="${homeHref}">${labels.home}</a> | <a href="${englishHomeHref}">${labels.englishHome}</a>`
    : `<a href="${homeHref}">${labels.home}</a>`;

  return `<p>${homeLinks} | <a href="${hubHref}">${labels.categoryHub}</a></p>
<h2>${labels.relatedTitle}</h2>
<ul>
${primaryLinks}
</ul>
${expandedBlock}`;
}

function currencyTemplate(entry, entries) {
  const currencyScriptHref = toHref(entry.pagePath, "currency-rates.js");
  return htmlShell({
    title: entry.title,
    description: entry.description,
    lang: entry.lang || config.defaults?.lang || "en",
    pagePath: entry.pagePath,
    robotsDirective: entry.indexable === false ? "noindex, follow" : "index, follow",
    canonicalPath: entry.canonicalPath || entry.pagePath,
    body: `<h1>${entry.h1}</h1>
<p class="desc">Convert ${entry.fromName} (${entry.fromCode}) to ${entry.toName} (${entry.toCode}) using a manual exchange rate.</p>

<label>${entry.fromCode} Amount:</label>
<input type="number" id="amount" value="100"><br><br>
<label>Exchange Rate (${entry.fromCode} to ${entry.toCode}):</label>
<input type="number" id="rate" value="1.00" step="0.0001"><br><br>

<button onclick="convert()">Convert</button>
<h2 id="result" class="result">Result: -</h2>

<script src="${currencyScriptHref}" data-currency-page data-from="${entry.fromCode}" data-to="${entry.toCode}" data-amount-id="amount" data-rate-id="rate" data-result-id="result" defer></script>
${trustBlockHtml("currency converter", entry.lang)}
${relatedHtml(entries, entry)}`
  });
}

function loanTemplate(entry, entries) {
  return htmlShell({
    title: entry.title,
    description: entry.description,
    lang: entry.lang || config.defaults?.lang || "en",
    pagePath: entry.pagePath,
    robotsDirective: entry.indexable === false ? "noindex, follow" : "index, follow",
    canonicalPath: entry.canonicalPath || entry.pagePath,
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
<h2 id="result" class="result">Result: -</h2>

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
    document.dispatchEvent(new CustomEvent("pc:calculator_result", { detail: { type: "loan" } }));
    return;
  }
  const payment = amount * (monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
  document.getElementById("result").innerHTML = "Monthly Payment: $" + payment.toFixed(2);
  document.dispatchEvent(new CustomEvent("pc:calculator_result", { detail: { type: "loan" } }));
}
</script>
${trustBlockHtml("loan calculator", entry.lang)}
${relatedHtml(entries, entry)}`
  });
}

function salaryTemplate(entry, entries) {
  return htmlShell({
    title: entry.title,
    description: entry.description,
    lang: entry.lang || config.defaults?.lang || "en",
    pagePath: entry.pagePath,
    robotsDirective: entry.indexable === false ? "noindex, follow" : "index, follow",
    canonicalPath: entry.canonicalPath || entry.pagePath,
    body: `<h1>${entry.h1}</h1>
<p class="desc">Convert a $${formatAmount(entry.amount)} yearly salary into hourly pay.</p>

<label>Annual Salary ($):</label>
<input type="number" id="salary" value="${entry.amount}"><br><br>
<label>Hours Per Week:</label>
<input type="number" id="hours" value="40"><br><br>
<label>Weeks Per Year:</label>
<input type="number" id="weeks" value="52"><br><br>

<button onclick="calcHourly()">Calculate Hourly</button>
<h2 id="result" class="result">Result: -</h2>

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
  document.dispatchEvent(new CustomEvent("pc:calculator_result", { detail: { type: "salary" } }));
}
</script>
${trustBlockHtml("salary calculator", entry.lang)}
${relatedHtml(entries, entry)}`
  });
}

function spanishFormulaScript(formulaType) {
  if (formulaType === "bmi") {
    return `<label for="altura">Estatura (cm):</label>
<input type="number" id="altura" step="any" placeholder="Ej. 170"><br><br>
<label for="peso">Peso (kg):</label>
<input type="number" id="peso" step="any" placeholder="Ej. 70"><br><br>
<button onclick="calcular()">Calcular</button>
<h2 id="result" class="result">Resultado: -</h2>
<script>
function calcular() {
  const alturaCm = parseFloat(document.getElementById("altura").value);
  const pesoKg = parseFloat(document.getElementById("peso").value);
  if (!Number.isFinite(alturaCm) || !Number.isFinite(pesoKg) || alturaCm <= 0 || pesoKg <= 0) {
    document.getElementById("result").textContent = "Ingresa datos válidos.";
    return;
  }
  const alturaM = alturaCm / 100;
  const bmi = pesoKg / (alturaM * alturaM);
  let etiqueta = "Obeso";
  if (bmi < 18.5) etiqueta = "Bajo peso";
  else if (bmi < 25) etiqueta = "Normal";
  else if (bmi < 30) etiqueta = "Sobrepeso";
  document.getElementById("result").textContent = "IMC: " + bmi.toFixed(2) + " (" + etiqueta + ")";
}
</script>`;
  }
  if (formulaType === "loan") {
    return `<label for="monto">Monto:</label>
<input type="number" id="monto" value="150000"><br><br>
<label for="tasa">Tasa anual (%):</label>
<input type="number" id="tasa" value="9" step="0.1"><br><br>
<label for="anos">Plazo (años):</label>
<input type="number" id="anos" value="15"><br><br>
<button onclick="calcular()">Calcular</button>
<h2 id="result" class="result">Resultado: -</h2>
<script>
function calcular() {
  const monto = parseFloat(document.getElementById("monto").value) || 0;
  const tasaAnual = parseFloat(document.getElementById("tasa").value) || 0;
  const anos = parseFloat(document.getElementById("anos").value) || 0;
  const meses = anos * 12;
  if (meses <= 0) {
    document.getElementById("result").textContent = "Ingresa un plazo válido.";
    return;
  }
  const tasaMensual = tasaAnual / 100 / 12;
  if (tasaMensual === 0) {
    document.getElementById("result").textContent = "Pago mensual: $" + (monto / meses).toFixed(2);
    return;
  }
  const pago = monto * (tasaMensual * Math.pow(1 + tasaMensual, meses)) / (Math.pow(1 + tasaMensual, meses) - 1);
  document.getElementById("result").textContent = "Pago mensual: $" + pago.toFixed(2);
}
</script>`;
  }
  if (formulaType === "savings") {
    return `<label for="inicial">Monto inicial:</label>
<input type="number" id="inicial" value="1000"><br><br>
<label for="mensual">Aporte mensual:</label>
<input type="number" id="mensual" value="150"><br><br>
<label for="tasa">Tasa anual (%):</label>
<input type="number" id="tasa" value="5"><br><br>
<label for="anos">Años:</label>
<input type="number" id="anos" value="10"><br><br>
<button onclick="calcular()">Calcular</button>
<h2 id="result" class="result">Resultado: -</h2>
<script>
function calcular() {
  const inicial = parseFloat(document.getElementById("inicial").value) || 0;
  const mensual = parseFloat(document.getElementById("mensual").value) || 0;
  const tasa = (parseFloat(document.getElementById("tasa").value) || 0) / 100 / 12;
  const meses = (parseFloat(document.getElementById("anos").value) || 0) * 12;
  if (meses <= 0) {
    document.getElementById("result").textContent = "Ingresa años válidos.";
    return;
  }
  let saldo = inicial;
  for (let i = 0; i < meses; i += 1) {
    saldo = saldo * (1 + tasa) + mensual;
  }
  document.getElementById("result").textContent = "Saldo estimado: $" + saldo.toFixed(2);
}
</script>`;
  }
  if (formulaType === "kmMi") {
    return `<label for="km">Kilómetros:</label>
<input type="number" id="km" step="any"><br><br>
<label for="mi">Millas:</label>
<input type="number" id="mi" step="any"><br><br>
<button onclick="calcular()">Convertir</button>
<h2 id="result" class="result">Resultado: -</h2>
<script>
function calcular() {
  const km = parseFloat(document.getElementById("km").value);
  const mi = parseFloat(document.getElementById("mi").value);
  if (Number.isFinite(km)) {
    const out = km * 0.621371;
    document.getElementById("mi").value = out.toFixed(4);
    document.getElementById("result").textContent = km.toFixed(2) + " km = " + out.toFixed(2) + " mi";
    return;
  }
  if (Number.isFinite(mi)) {
    const out = mi / 0.621371;
    document.getElementById("km").value = out.toFixed(4);
    document.getElementById("result").textContent = mi.toFixed(2) + " mi = " + out.toFixed(2) + " km";
    return;
  }
  document.getElementById("result").textContent = "Ingresa un valor para convertir.";
}
</script>`;
  }
  if (formulaType === "cF") {
    return `<label for="c">Celsius:</label>
<input type="number" id="c" step="any"><br><br>
<label for="f">Fahrenheit:</label>
<input type="number" id="f" step="any"><br><br>
<button onclick="calcular()">Convertir</button>
<h2 id="result" class="result">Resultado: -</h2>
<script>
function calcular() {
  const c = parseFloat(document.getElementById("c").value);
  const f = parseFloat(document.getElementById("f").value);
  if (Number.isFinite(c)) {
    const out = (c * 9 / 5) + 32;
    document.getElementById("f").value = out.toFixed(2);
    document.getElementById("result").textContent = c.toFixed(2) + " C = " + out.toFixed(2) + " F";
    return;
  }
  if (Number.isFinite(f)) {
    const out = (f - 32) * 5 / 9;
    document.getElementById("c").value = out.toFixed(2);
    document.getElementById("result").textContent = f.toFixed(2) + " F = " + out.toFixed(2) + " C";
    return;
  }
  document.getElementById("result").textContent = "Ingresa un valor para convertir.";
}
</script>`;
  }
  if (formulaType === "salary") {
    return `<label for="salario">Salario anual:</label>
<input type="number" id="salario" value="52000"><br><br>
<label for="horas">Horas por semana:</label>
<input type="number" id="horas" value="40"><br><br>
<label for="semanas">Semanas por año:</label>
<input type="number" id="semanas" value="52"><br><br>
<button onclick="calcular()">Calcular</button>
<h2 id="result" class="result">Resultado: -</h2>
<script>
function calcular() {
  const salario = parseFloat(document.getElementById("salario").value) || 0;
  const horas = parseFloat(document.getElementById("horas").value) || 0;
  const semanas = parseFloat(document.getElementById("semanas").value) || 0;
  if (horas <= 0 || semanas <= 0) {
    document.getElementById("result").textContent = "Ingresa horas y semanas válidas.";
    return;
  }
  const tarifa = salario / (horas * semanas);
  document.getElementById("result").textContent = "Pago por hora: $" + tarifa.toFixed(2);
}
</script>`;
  }
  if (formulaType === "discount") {
    return `<label for="precio">Precio original:</label>
<input type="number" id="precio" value="100"><br><br>
<label for="descuento">Descuento (%):</label>
<input type="number" id="descuento" value="15"><br><br>
<button onclick="calcular()">Calcular</button>
<h2 id="result" class="result">Resultado: -</h2>
<script>
function calcular() {
  const precio = parseFloat(document.getElementById("precio").value) || 0;
  const descuento = (parseFloat(document.getElementById("descuento").value) || 0) / 100;
  const final = precio * (1 - descuento);
  document.getElementById("result").textContent = "Precio final: $" + final.toFixed(2);
}
</script>`;
  }
  if (formulaType === "tip") {
    return `<label for="cuenta">Cuenta:</label>
<input type="number" id="cuenta" value="70"><br><br>
<label for="propina">Propina (%):</label>
<input type="number" id="propina" value="15"><br><br>
<button onclick="calcular()">Calcular</button>
<h2 id="result" class="result">Resultado: -</h2>
<script>
function calcular() {
  const cuenta = parseFloat(document.getElementById("cuenta").value) || 0;
  const propina = (parseFloat(document.getElementById("propina").value) || 0) / 100;
  const total = cuenta * (1 + propina);
  document.getElementById("result").textContent = "Total con propina: $" + total.toFixed(2);
}
</script>`;
  }

  return `<label for="valorA">Valor A:</label>
<input type="number" id="valorA" step="any"><br><br>
<label for="valorB">Valor B:</label>
<input type="number" id="valorB" step="any"><br><br>
<button onclick="calcular()">Calcular</button>
<h2 id="result" class="result">Resultado: -</h2>
<script>
function calcular() {
  const a = parseFloat(document.getElementById("valorA").value) || 0;
  const b = parseFloat(document.getElementById("valorB").value) || 0;
  if (b === 0) {
    document.getElementById("result").textContent = "Ingresa valores válidos.";
    return;
  }
  const p = (a / b) * 100;
  document.getElementById("result").textContent = a.toFixed(2) + " es " + p.toFixed(2) + "% de " + b.toFixed(2);
}
</script>`;
}

function spanishPilotTemplate(entry, entries) {
  return htmlShell({
    title: entry.title,
    description: entry.description,
    lang: "es",
    pagePath: entry.pagePath,
    robotsDirective: "index, follow",
    canonicalPath: entry.pagePath,
    body: `<h1>${entry.h1}</h1>
<p class="desc">${entry.intro}</p>
${spanishFormulaScript(entry.formulaType)}
${trustBlockHtml("calculadora", "es")}
${relatedHtml(entries, entry)}`
  });
}

function statePaycheckTemplate(entry, entries) {
  return htmlShell({
    title: entry.title,
    description: entry.description,
    lang: "en",
    pagePath: entry.pagePath,
    robotsDirective: "index, follow",
    canonicalPath: entry.pagePath,
    body: `<h1>${entry.h1}</h1>
<p class="desc">Estimate paycheck outcomes for ${entry.stateName} using IRS-style progressive federal brackets and a transparent state tax assumption (${(entry.stateTaxRate * 100).toFixed(1)}%).</p>
<label for="salary">Annual Gross Salary ($):</label>
<input type="number" id="salary" value="70000"><br><br>
<label for="year">Federal Tax Year:</label>
<select id="year">
  <option value="2025">2025</option>
  <option value="2026" selected>2026</option>
</select><br><br>
<label for="filing">Filing Status:</label>
<select id="filing">
  <option value="single" selected>Single</option>
  <option value="married">Married Filing Jointly</option>
  <option value="head">Head of Household</option>
</select><br><br>
<button onclick="calcPaycheck()">Calculate</button>
<h2 id="result" class="result">Result: -</h2>
<script>
const FEDERAL_TAX_DATA = {
  2025: {
    standardDeduction: { single: 15000, married: 30000, head: 22500 },
    brackets: {
      single: [
        [11925, 0.10], [48475, 0.12], [103350, 0.22], [197300, 0.24], [250525, 0.32], [626350, 0.35], [Infinity, 0.37]
      ],
      married: [
        [23850, 0.10], [96950, 0.12], [206700, 0.22], [394600, 0.24], [501050, 0.32], [751600, 0.35], [Infinity, 0.37]
      ],
      head: [
        [17000, 0.10], [64850, 0.12], [103350, 0.22], [197300, 0.24], [250500, 0.32], [626350, 0.35], [Infinity, 0.37]
      ]
    }
  },
  2026: {
    standardDeduction: { single: 15600, married: 31200, head: 23400 },
    brackets: {
      single: [
        [11925, 0.10], [48475, 0.12], [103350, 0.22], [197300, 0.24], [250525, 0.32], [626350, 0.35], [Infinity, 0.37]
      ],
      married: [
        [23850, 0.10], [96950, 0.12], [206700, 0.22], [394600, 0.24], [501050, 0.32], [751600, 0.35], [Infinity, 0.37]
      ],
      head: [
        [17000, 0.10], [64850, 0.12], [103350, 0.22], [197300, 0.24], [250500, 0.32], [626350, 0.35], [Infinity, 0.37]
      ]
    }
  }
};

function computeFederalTax(gross, filing, year) {
  const table = FEDERAL_TAX_DATA[year] || FEDERAL_TAX_DATA[2026];
  const deduction = table.standardDeduction[filing] || table.standardDeduction.single;
  const taxable = Math.max(0, gross - deduction);
  const brackets = table.brackets[filing] || table.brackets.single;

  let tax = 0;
  let prevCap = 0;
  for (const row of brackets) {
    const cap = row[0];
    const rate = row[1];
    if (taxable <= prevCap) {
      break;
    }
    const taxedAmount = Math.min(taxable, cap) - prevCap;
    tax += taxedAmount * rate;
    prevCap = cap;
  }
  return { tax, taxableIncome: taxable, deduction };
}

function calcPaycheck() {
  const gross = parseFloat(document.getElementById("salary").value) || 0;
  const filing = document.getElementById("filing").value || "single";
  const year = Number(document.getElementById("year").value || 2026);
  const stateRate = ${entry.stateTaxRate};
  if (gross <= 0) {
    document.getElementById("result").textContent = "Enter a valid salary.";
    return;
  }

  const federal = computeFederalTax(gross, filing, year);
  const stateTax = gross * stateRate;
  const federalTax = federal.tax;
  const netAnnual = gross - federalTax - stateTax;
  const monthly = netAnnual / 12;
  const biweekly = netAnnual / 26;
  const weekly = netAnnual / 52;
  const effectiveFederalRate = gross > 0 ? (federalTax / gross) * 100 : 0;

  document.getElementById("result").innerHTML =
    "Estimated net annual: $" + netAnnual.toFixed(2) +
    "<br>Monthly: $" + monthly.toFixed(2) +
    "<br>Biweekly: $" + biweekly.toFixed(2) +
    "<br>Weekly: $" + weekly.toFixed(2) +
    "<br><br>Federal tax estimate (" + year + "): $" + federalTax.toFixed(2) +
    " (" + effectiveFederalRate.toFixed(2) + "% effective)" +
    "<br>State tax estimate: $" + stateTax.toFixed(2) +
    "<br>Taxable income after standard deduction: $" + federal.taxableIncome.toFixed(2);
}
</script>
${trustBlockHtml("paycheck calculator", entry.lang)}
${relatedHtml(entries, entry)}`
  });
}

function legacyStaticTemplate(entry, entries) {
  let normalizedBody = String(entry.body || "");
  normalizedBody = normalizedBody.replace(/<p>\s*Related Calculators:\s*<\/p>/gi, "<h2>Related Calculators</h2>");
  normalizedBody = normalizedBody.replace(/<input([^>]*?)class="([^"]*?)"([^>]*?)>/gi, (full, before, classes, after) => {
    const filtered = classes
      .split(/\s+/)
      .map((item) => item.trim())
      .filter((item) => item && item.toLowerCase() !== "result");
    if (filtered.length === 0) {
      return `<input${before}${after}>`;
    }
    return `<input${before}class="${filtered.join(" ")}"${after}>`;
  });
  const hasRelatedSection =
    /<h2>\s*Related Calculators\s*<\/h2>/i.test(normalizedBody) ||
    /<h2>\s*Calculadoras relacionadas\s*<\/h2>/i.test(normalizedBody);
  const relatedSection = hasRelatedSection ? "" : relatedHtml(entries, entry);
  return htmlShell({
    title: entry.title,
    description: entry.description,
    lang: entry.lang || "en",
    pagePath: entry.pagePath || entry.fileName,
    canonicalPath: entry.pagePath || entry.fileName,
    body: `${normalizedBody}
${trustBlockHtml(entry.trustTopic || "calculator", entry.lang || "en")}
${relatedSection}`
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
      const fileName = `${slug}.html`;
      entries.push({
        family: "currencyConverter",
        marketId: "en",
        lang: "en",
        category: families.currencyConverter.categoryLabel || "Currency",
        slug,
        fileName,
        pagePath: fileName,
        hubPath: "conversion-calculators.html",
        title: `${fromCode} to ${toCode} Converter (Free) - Convert ${fromCode} to ${toCode}`,
        description: `Convert ${fromCode} to ${toCode} instantly with this free currency converter calculator.`,
        h1: `${fromCode} to ${toCode} Converter`,
        fromCode,
        toCode,
        fromName,
        toName,
        indexable: shouldIndexCurrencyPair(fromCode, toCode)
      });
    }
  }

  if (families.loanPaymentByAmount?.enabled) {
    for (const amount of getAmounts(families.loanPaymentByAmount)) {
      const slug = slugify(`${amount}-loan-payment-calculator`);
      const fileName = `${slug}.html`;
      entries.push({
        family: "loanPaymentByAmount",
        marketId: "en",
        lang: "en",
        category: families.loanPaymentByAmount.categoryLabel || "Financial",
        slug,
        fileName,
        pagePath: fileName,
        hubPath: "financial-calculators.html",
        title: `${formatAmount(amount)} Loan Payment Calculator (Free)`,
        description: `Estimate monthly payment for a $${formatAmount(amount)} loan with this free calculator.`,
        h1: `$${formatAmount(amount)} Loan Payment Calculator`,
        amount,
        indexable: shouldIndexLoanAmount(Number(amount))
      });
    }
  }

  if (families.salaryToHourlyByAmount?.enabled) {
    for (const amount of getAmounts(families.salaryToHourlyByAmount)) {
      const slug = slugify(`${amount}-salary-to-hourly-calculator`);
      const fileName = `${slug}.html`;
      entries.push({
        family: "salaryToHourlyByAmount",
        marketId: "en",
        lang: "en",
        category: families.salaryToHourlyByAmount.categoryLabel || "Career",
        slug,
        fileName,
        pagePath: fileName,
        hubPath: "career-calculators.html",
        title: `${formatAmount(amount)} Salary to Hourly Calculator (Free)`,
        description: `Convert a $${formatAmount(amount)} annual salary into hourly pay instantly.`,
        h1: `$${formatAmount(amount)} Salary to Hourly Calculator`,
        amount,
        indexable: shouldIndexSalaryAmount(Number(amount))
      });
    }
  }

  const spanishPages = config.pilots?.spanishPages || [];
  for (const page of spanishPages) {
    const fileName = `${slugify(page.slug || page.h1 || "calculadora")}.html`;
    entries.push({
      family: "spanishPilotPage",
      marketId: "es",
      lang: "es",
      category: page.category || "Financial",
      slug: slugify(page.slug || page.h1 || "calculadora"),
      fileName,
      pagePath: normalizePath(`es/${fileName}`),
      hubPath: normalizePath(page.hubPath || "es/index.html"),
      title: page.title || "Calculadora",
      description: page.description || "Herramienta gratuita",
      h1: page.h1 || "Calculadora",
      intro: page.intro || "",
      formulaType: page.formulaType || "percentage",
      indexable: true
    });
  }

  const statePages = config.pilots?.statePages || [];
  for (const state of statePages) {
    const stateCode = String(state.stateCode || "").toLowerCase();
    const stateName = state.stateName || stateCode.toUpperCase();
    if (!stateCode) {
      continue;
    }
    const fileName = "paycheck-calculator.html";
    entries.push({
      family: "statePaycheckPilotPage",
      marketId: "us",
      lang: "en",
      category: "Financial",
      slug: `${stateCode}-paycheck-calculator`,
      fileName,
      pagePath: normalizePath(`us/${stateCode}/${fileName}`),
      hubPath: "financial-calculators.html",
      title: `${stateName} Paycheck Calculator (Estimate)`,
      description: `Estimate paycheck amounts in ${stateName} using gross salary and a state tax assumption.`,
      h1: `${stateName} Paycheck Calculator`,
      stateName,
      stateCode,
      stateTaxRate: Number(state.incomeTaxRate || 0),
      indexable: true
    });
  }

  const legacyPages = Array.isArray(legacyConfig.pages) ? legacyConfig.pages : [];
  for (const page of legacyPages) {
    if (!page || !page.fileName || !page.body) {
      continue;
    }
    entries.push({
      family: "legacyStaticPage",
      marketId: page.marketId || "en",
      lang: page.lang || "en",
      category: page.category || "Financial",
      slug: slugify(page.fileName.replace(/\.html$/i, "")),
      fileName: normalizePath(page.fileName),
      pagePath: normalizePath(page.pagePath || page.fileName),
      hubPath: normalizePath(page.hubPath || "financial-calculators.html"),
      title: page.title || "Practical Calculators",
      description: page.description || "Practical calculators and conversion tools.",
      h1: page.h1 || "Calculator",
      trustTopic: page.trustTopic || "calculator",
      body: page.body,
      indexable: page.indexable !== false
    });
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
  if (entry.family === "spanishPilotPage") {
    return spanishPilotTemplate(entry, entries);
  }
  if (entry.family === "statePaycheckPilotPage") {
    return statePaycheckTemplate(entry, entries);
  }
  if (entry.family === "legacyStaticPage") {
    return legacyStaticTemplate(entry, entries);
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
  const hubPath = normalizePath(fileName);
  const itemLinks = items
    .map((item) => `<li><a href="${toHref(hubPath, item.pagePath || item.fileName)}">${escapeHtml(item.h1)}</a></li>`)
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
    const replacePattern = new RegExp(`\\n?${startMarker}[\\s\\S]*?${endMarker}\\n?`, "m");
    content = content.replace(replacePattern, "\n");
  }

  if (content.includes("<hr>")) {
    content = content.replace("<hr>", `${section}\n\n<hr>`);
  } else if (/<\/div>\s*<div class="footer">/i.test(content)) {
    content = content.replace(/<\/div>\s*<div class="footer">/i, `${section}\n</div>\n\n<div class="footer">`);
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
  const englishEntries = entries.filter(
    (entry) => (entry.marketId || "en") === "en" && entry.indexable !== false
  );
  const financialGenerated = englishEntries.filter((entry) => entry.category === "Financial");
  const conversionGenerated = englishEntries.filter((entry) => entry.category === "Conversions");
  const careerGenerated = englishEntries.filter((entry) => entry.category === "Career");
  const healthGenerated = englishEntries.filter((entry) => entry.category === "Health");

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

function writeMarketPilotIndexes(entries) {
  const spanishEntries = entries.filter((entry) => entry.marketId === "es");
  if (spanishEntries.length > 0) {
    const byCategory = groupEntriesByCategory(spanishEntries);
    const spanishHubMap = {
      Financial: "es/financial-calculators.html",
      Conversions: "es/conversion-calculators.html",
      Health: "es/health-calculators.html",
      Career: "es/career-calculators.html"
    };
    const sections = Object.keys(byCategory)
      .sort()
      .map((category) => {
        const hubPath = spanishHubMap[category] || "es/index.html";
        const categoryLabel = SPANISH_CATEGORY_LABELS[category] || category;
        const links = byCategory[category]
          .map((entry) => `<li><a href="${toHref("es/index.html", entry.pagePath)}">${escapeHtml(entry.h1)}</a></li>`)
          .join("\n");
        const hubLink = `<p><a href="${toHref("es/index.html", hubPath)}">Ver índice de ${escapeHtml(categoryLabel)}</a></p>`;
        return `<h2>${escapeHtml(categoryLabel)}</h2>\n${hubLink}\n<ul>\n${links}\n</ul>`;
      })
      .join("\n\n");

    const esIndex = htmlShell({
      title: "Calculadoras Gratis en Español",
      description: "Índice general de calculadoras en español para audiencias hispanohablantes.",
      lang: "es",
      pagePath: "es/index.html",
      robotsDirective: "index, follow",
      canonicalPath: "es/index.html",
      body: `<h1>Calculadoras en Español</h1>
<p class="desc">Versión piloto de calculadoras en español. Incluye herramientas de finanzas, conversiones, salud y carrera.</p>
${sections}`
    });
    fs.mkdirSync(path.join(root, "es"), { recursive: true });
    fs.writeFileSync(path.join(root, "es", "index.html"), esIndex, "utf8");

    for (const [category, hubPath] of Object.entries(spanishHubMap)) {
      const categoryEntries = (byCategory[category] || []).slice().sort((a, b) => a.h1.localeCompare(b.h1));
      if (!categoryEntries.length) {
        continue;
      }
      const categoryLabel = SPANISH_CATEGORY_LABELS[category] || category;
      const hubLinks = categoryEntries
        .map((entry) => `<li><a href="${toHref(hubPath, entry.pagePath)}">${escapeHtml(entry.h1)}</a></li>`)
        .join("\n");
      const hubPage = htmlShell({
        title: `Calculadoras de ${categoryLabel}`,
        description: `Listado de calculadoras de ${categoryLabel.toLowerCase()} en español.`,
        lang: "es",
        pagePath: hubPath,
        robotsDirective: "index, follow",
        canonicalPath: hubPath,
        body: `<h1>Calculadoras de ${escapeHtml(categoryLabel)}</h1>
<p class="desc">Índice piloto para herramientas de ${escapeHtml(categoryLabel.toLowerCase())}.</p>
<ul>
${hubLinks}
</ul>`
      });
      fs.writeFileSync(path.join(root, hubPath), hubPage, "utf8");
    }
  }

  const stateEntries = entries.filter((entry) => entry.family === "statePaycheckPilotPage");
  if (stateEntries.length > 0) {
    const stateLinks = stateEntries
      .map(
        (entry) =>
          `<li><a href="${toHref("us/index.html", entry.pagePath)}">${escapeHtml(entry.stateName)} Paycheck Calculator</a></li>`
      )
      .join("\n");
    const usIndex = htmlShell({
      title: "US State Calculators",
      description: "Pilot index for U.S. state-specific calculators. Current release includes paycheck tools.",
      lang: "en",
      pagePath: "us/index.html",
      robotsDirective: "index, follow",
      canonicalPath: "us/index.html",
      body: `<h1>U.S. State Calculators</h1>
<p class="desc">Pilot rollout of state-specific calculators. Current pilot tools are paycheck estimators by state.</p>
<ul>
${stateLinks}
</ul>`
    });
    fs.mkdirSync(path.join(root, "us"), { recursive: true });
    fs.writeFileSync(path.join(root, "us", "index.html"), usIndex, "utf8");
  }
}

function writeGeneratedIndex(entries) {
  const page = `<!DOCTYPE html>
<html lang="en">
<head>
<title>Generated Calculators Index</title>
<meta name="description" content="Legacy URL redirecting to home calculator index.">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="robots" content="noindex, follow">
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
  const englishEntries = entries.filter((entry) => (entry.marketId || "en") === "en");
  const byCategory = groupEntriesByCategory(englishEntries);
  const sections = homeSections
    .map((section) => {
      const generatedCount = byCategory[section.category]?.length || 0;
      const listItems = section.items
        .map((item) => `<li><a href="${item.fileName}">${escapeHtml(item.h1)}</a></li>`)
        .join("\n");
      const viewAllCount = generatedCount > section.items.length ? generatedCount : undefined;
      const viewAll = viewAllCount
        ? `<p><a href="${section.hub}">View all ${viewAllCount} ${escapeHtml(section.category)} calculators</a></p>`
        : `<p><a href="${section.hub}">Browse all ${escapeHtml(section.category)} calculators</a></p>`;
      return `<h2>${escapeHtml(section.category)}</h2>\n${viewAll}\n<ul>\n${listItems}\n</ul>`;
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
<h2>Regional Indexes</h2>
<ul>
<li><a href="es/index.html">Spanish Calculators (Pilot)</a></li>
<li><a href="us/index.html">U.S. State Calculators (Pilot)</a></li>
</ul>
</div>
<div class="footer">
<p>Browse Categories</p>
<div class="category-grid">
<a class="category-link" href="financial-calculators.html">Financial</a>
<a class="category-link" href="health-calculators.html">Health</a>
<a class="category-link" href="conversion-calculators.html">Conversions</a>
<a class="category-link" href="career-calculators.html">Career</a>
</div>
${footerInfoLinksHtml}
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
  const excludedPaths = new Set([normalizePath(config.generatedIndexFile || "generated-calculators.html")]);
  const htmlFiles = collectHtmlPaths(root).filter((name) => !excludedPaths.has(normalizePath(name)));
  const urls = new Set(htmlFiles.map((file) => `${base}/${normalizePath(file)}`));
  const noindexPaths = new Set(
    entries
      .filter((entry) => entry.indexable === false)
      .map((entry) => normalizePath(entry.pagePath || entry.fileName))
  );
  for (const noindexPath of noindexPaths) {
    urls.delete(`${base}/${noindexPath}`);
  }
  for (const entry of entries) {
    if (entry.indexable === false) {
      continue;
    }
    const entryPath = normalizePath(entry.pagePath || entry.fileName);
    if (!excludedPaths.has(entryPath)) {
      urls.add(`${base}/${entryPath}`);
    }
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

function writeInformationalPages() {
  const pages = [...EN_INFO_PAGES, ...ES_INFO_PAGES];
  for (const page of pages) {
    const lang = page.fileName.startsWith("es/") ? "es" : "en";
    const body = `${page.body}
${trustBlockHtml("general", lang)}`;
    const html = htmlShell({
      title: page.title,
      description: page.description,
      body,
      lang,
      pagePath: page.fileName
    });
    const targetPath = path.join(root, page.fileName);
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    fs.writeFileSync(targetPath, html, "utf8");
  }
}

function main() {
  const overwrite = process.argv.includes("--overwrite");
  const entries = buildEntries();
  let created = 0;
  let skipped = 0;

  for (const entry of entries) {
    const outputPath = path.join(root, normalizePath(entry.pagePath || entry.fileName));
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    const fileExists =
      fs.existsSync(outputPath) ||
      existingHtml.has(normalizePath(entry.fileName || "").toLowerCase());
    if (fileExists && !overwrite) {
      skipped += 1;
      continue;
    }
    fs.writeFileSync(outputPath, renderPage(entry, entries), "utf8");
    created += 1;
  }

  syncMainCategoryPages(entries);
  writeHomeIndex(entries);
  writeMarketPilotIndexes(entries);
  writeGeneratedIndex(entries);
  writeInformationalPages();
  writeSitemap(entries);

  console.log(`Generated entries configured: ${entries.length}`);
  console.log(`Pages created/updated: ${created}`);
  console.log(`Pages skipped (existing): ${skipped}`);
  console.log(`Wrote index.html, ${config.generatedIndexFile || "generated-calculators.html"}, and sitemap.xml`);
}

main();
