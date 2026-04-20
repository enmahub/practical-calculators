/**
 * Collapsible "How this calculation works" blocks for calculator templates.
 * Used by generate-pages.js — keep HTML accessible and assumptions explicit.
 */

function methodologyDetailsWrap(helpers, lang, innerHtml) {
  const { LOCALE_LABELS, localeCode, escapeHtml } = helpers;
  const locale = localeCode(lang);
  const L = LOCALE_LABELS[locale] || LOCALE_LABELS.en;
  const title = L.methodologyTitle || "How this calculation works";
  return `<details class="methodology-block">
<summary>${escapeHtml(title)}</summary>
<div>
${innerHtml}
</div>
</details>`;
}

function methodologyCurrency(helpers, entry, lang) {
  const { escapeHtml, LOCALE_LABELS, localeCode } = helpers;
  const locale = localeCode(lang);
  const L = LOCALE_LABELS[locale] || LOCALE_LABELS.en;
  const fc = escapeHtml(String(entry.fromCode || ""));
  const tc = escapeHtml(String(entry.toCode || ""));
  const fn = escapeHtml(String(entry.fromName || entry.fromCode || ""));
  const tn = escapeHtml(String(entry.toName || entry.toCode || ""));
  const inner = `<h3>${escapeHtml(L.methodologyInputs)}</h3>
<ul>
<li><strong>${fc} amount</strong> — How much of the source currency you are converting.</li>
<li><strong>Exchange rate (${fc} to ${tc})</strong> — How many <strong>${tc}</strong> units equal one <strong>${fc}</strong> unit (e.g. if 1 ${fn} = 0.85 ${tn}, enter 0.85).</li>
</ul>
<h3>${escapeHtml(L.methodologyFormula)}</h3>
<p><em>Result ≈ amount × rate</em></p>
<p class="small">This page can prefill a suggested rate from the latest published rates snapshot; you can always type your own. Banks and cards may use different spreads, fees, and cut-off times—use results for planning only.</p>`;
  return methodologyDetailsWrap(helpers, lang, inner);
}

function methodologyLoanLadder(helpers, entry, lang) {
  const { escapeHtml, formatAmount, LOCALE_LABELS, localeCode } = helpers;
  const locale = localeCode(lang);
  const L = LOCALE_LABELS[locale] || LOCALE_LABELS.en;
  const amt = formatAmount(entry.amount);
  const inner = `<h3>${escapeHtml(L.methodologyInputs)}</h3>
<ul>
<li><strong>Loan amount ($)</strong> — Principal; defaults to <strong>$${escapeHtml(amt)}</strong> for this page. You can change it.</li>
<li><strong>Annual interest rate (%)</strong> — Nominal yearly rate; converted to a monthly rate <em>r = (annual ÷ 100) ÷ 12</em>.</li>
<li><strong>Loan term (years)</strong> — Number of monthly payments <em>n = years × 12</em>.</li>
</ul>
<h3>${escapeHtml(L.methodologyFormula)}</h3>
<p>Fixed-rate amortization (equal monthly payments):</p>
<p><em>M = P × r / (1 − (1 + r)<sup>−n</sup>)</em></p>
<p class="small">If the rate is 0%, payment = P / n. Does not include escrow, PMI, or lender-specific rounding.</p>`;
  return methodologyDetailsWrap(helpers, lang, inner);
}

function methodologySalaryLadder(helpers, entry, lang) {
  const { escapeHtml, formatAmount, LOCALE_LABELS, localeCode } = helpers;
  const locale = localeCode(lang);
  const L = LOCALE_LABELS[locale] || LOCALE_LABELS.en;
  const amt = formatAmount(entry.amount);
  const inner = `<h3>${escapeHtml(L.methodologyInputs)}</h3>
<ul>
<li><strong>Annual salary ($)</strong> — Gross yearly pay; defaults to <strong>$${escapeHtml(amt)}</strong>.</li>
<li><strong>Hours per week</strong> — Typical working hours in one week.</li>
<li><strong>Weeks per year</strong> — Often 52; adjust if you use a different work-year assumption.</li>
</ul>
<h3>${escapeHtml(L.methodologyFormula)}</h3>
<p><em>Hourly rate = annual salary ÷ (hours per week × weeks per year)</em></p>
<p class="small">Does not subtract taxes, benefits, or unpaid time off—use as a quick gross estimate.</p>`;
  return methodologyDetailsWrap(helpers, lang, inner);
}

function methodologyStatePaycheck(helpers, entry, lang) {
  const { escapeHtml, LOCALE_LABELS, localeCode } = helpers;
  const locale = localeCode(lang);
  const L = LOCALE_LABELS[locale] || LOCALE_LABELS.en;
  const stateName = escapeHtml(String(entry.stateName || ""));
  const ratePct = ((Number(entry.stateTaxRate) || 0) * 100).toFixed(1);
  const inner = `<h3>${escapeHtml(L.methodologyInputs)}</h3>
<ul>
<li><strong>Annual gross salary</strong> — Pre-tax yearly income.</li>
<li><strong>Federal tax year</strong> — Selects IRS bracket and standard deduction values baked into this tool.</li>
<li><strong>Filing status</strong> — Chooses single, married filing jointly, or head of household for federal brackets and standard deduction.</li>
</ul>
<h3>${escapeHtml(L.methodologyFormula)}</h3>
<p>Federal income tax is estimated with <strong>progressive brackets</strong> after the <strong>standard deduction</strong> for the chosen status and year.</p>
<p><strong>${stateName} state tax</strong> is approximated as a flat <strong>${escapeHtml(ratePct)}%</strong> of gross (pilot assumption—not a full state return).</p>
<p><em>Net ≈ gross − estimated federal tax − estimated state tax</em>; then divided into monthly / biweekly / weekly for display.</p>
<p class="small">Not payroll advice. Real paychecks include FICA, local taxes, pre-tax deductions, and withholding adjustments.</p>`;
  return methodologyDetailsWrap(helpers, lang, inner);
}

function methodologySpanishPilot(helpers, formulaType, lang) {
  const innerByType = {
    percentage: `<h3>Qué significa cada dato</h3>
<ul>
<li><strong>Valor A</strong> — El numerador en la comparación.</li>
<li><strong>Valor B</strong> — El valor base (denominador).</li>
</ul>
<h3>Fórmula</h3>
<p>Se calcula <em>p = (A ÷ B) × 100</em> y se muestra como “A es p% de B”. Si <strong>B es 0</strong>, se muestra un aviso en lugar de dividir.</p>
<p class="small">Valores no numéricos se tratan como 0 al leer los campos.</p>`,
    bmi: `<h3>Qué significa cada dato</h3>
<ul>
<li><strong>Estatura (cm)</strong> — Altura en centímetros.</li>
<li><strong>Peso (kg)</strong> — Masa en kilogramos.</li>
</ul>
<h3>Fórmula</h3>
<p><em>IMC = peso (kg) ÷ (estatura (m))²</em> con estatura en metros (cm ÷ 100).</p>
<p class="small">Clasificación orientativa; no sustituye evaluación médica.</p>`,
    loan: `<h3>Qué significa cada dato</h3>
<ul>
<li><strong>Monto</strong> — Capital del préstamo.</li>
<li><strong>Tasa anual (%)</strong> — Se convierte a tasa mensual.</li>
<li><strong>Años</strong> — Plazo en años (pagos mensuales).</li>
</ul>
<h3>Fórmula</h3>
<p>Amortización con cuota fija: <em>M = P × r / (1 − (1 + r)<sup>−n</sup>)</em>, con <em>r</em> mensual y <em>n</em> meses.</p>`,
    savings: `<h3>Qué significa cada dato</h3>
<ul>
<li><strong>Monto inicial</strong> — Saldo al inicio del primer mes.</li>
<li><strong>Aporte mensual</strong> — Cantidad que se añade al final de cada mes.</li>
<li><strong>Tasa anual (%)</strong> — Se convierte a tasa mensual <em>i = (tasa ÷ 100) ÷ 12</em>.</li>
<li><strong>Años</strong> — Duración en años; el plazo en meses es <em>años × 12</em>.</li>
</ul>
<h3>Regla</h3>
<p>Para cada mes: <em>saldo = saldo × (1 + i) + aporte mensual</em>, repetido durante todos los meses del plazo. No se modelan impuestos ni comisiones.</p>
<p class="small">Proyección educativa; los bancos pueden capitalizar o acreditar en fechas distintas.</p>`,
    kmMi: `<h3>Qué significa cada dato</h3>
<ul><li><strong>Kilómetros</strong> o <strong>millas</strong>: rellena uno; el otro se calcula en la dirección correspondiente.</li></ul>
<h3>Factor</h3>
<p>De km a mi: <em>mi = km × 0,621371</em>. De mi a km: <em>km = mi ÷ 0,621371</em> (mismo factor en ambas direcciones).</p>`,
    cF: `<h3>Qué significa cada dato</h3>
<ul><li><strong>Celsius / Fahrenheit</strong> — Rellena uno para obtener el otro.</li></ul>
<h3>Fórmulas</h3>
<p><em>°F = °C × 9/5 + 32</em>; <em>°C = (°F − 32) × 5/9</em>.</p>`,
    salary: `<h3>Qué significa cada dato</h3>
<ul>
<li><strong>Salario anual</strong> — Bruto anual.</li>
<li><strong>Horas por semana / semanas por año</strong> — Para pasar a tarifa horaria bruta.</li>
</ul>
<h3>Fórmula</h3>
<p><em>Tarifa horaria ≈ salario ÷ (horas × semanas)</em>.</p>`,
    discount: `<h3>Qué significa cada dato</h3>
<ul><li><strong>Precio original</strong> y <strong>descuento (%)</strong>.</li></ul>
<h3>Fórmula</h3>
<p><em>Precio final = precio × (1 − descuento/100)</em>.</p>`,
    tip: `<h3>Qué significa cada dato</h3>
<ul><li><strong>Cuenta</strong> — Importe antes de propina.</li><li><strong>Propina (%)</strong> — Porcentaje sobre la cuenta.</li></ul>
<h3>Fórmula</h3>
<p><em>Total con propina = cuenta × (1 + propina ÷ 100)</em>; la propina en dinero es <em>cuenta × (propina ÷ 100)</em>.</p>`
  };
  const inner =
    innerByType[formulaType] ||
    `<h3>Qué significa cada dato</h3>
<p>Usa los campos etiquetados arriba y pulsa calcular. El resultado aparece al instante en tu navegador a partir de los números que ingreses.</p>
<p class="small">Resultados orientativos; revisa redondeos y supuestos en decisiones importantes.</p>`;
  return methodologyDetailsWrap(helpers, lang, inner);
}

function methodologyLegacyByFileName(helpers, fileName, lang) {
  const { escapeHtml, LOCALE_LABELS, localeCode } = helpers;
  const locale = localeCode(lang);
  const L = LOCALE_LABELS[locale] || LOCALE_LABELS.en;
  const key = String(fileName || "")
    .replace(/\\/g, "/")
    .split("/")
    .pop()
    .toLowerCase();

  const generic = () => {
    const inner = `<h3>${escapeHtml(L.methodologyInputs)}</h3>
<p class="desc">Enter the values requested above, then use <strong>Calculate</strong>. The result is computed immediately in your browser from those inputs.</p>
<p class="small">Outputs are planning-level estimates. For taxes, credit, health, or legal decisions, confirm figures and definitions with an authoritative source or professional.</p>`;
    return methodologyDetailsWrap(helpers, lang, inner);
  };

  const specific = {
    "mortgage-calculator.html": `<h3>${escapeHtml(L.methodologyInputs)}</h3>
<ul>
<li><strong>Loan amount</strong> — Principal <em>P</em>.</li>
<li><strong>Interest %</strong> — Annual nominal rate → monthly <em>r = (annual ÷ 100) ÷ 12</em>.</li>
<li><strong>Years</strong> — Term; number of monthly payments <em>n = years × 12</em>.</li>
</ul>
<h3>${escapeHtml(L.methodologyFormula)}</h3>
<p><em>M = P × r / (1 − (1 + r)<sup>−n</sup>)</em></p>
<p class="small">Simplified fixed-rate payment. Excludes escrow, PMI, fees, and lender rounding.</p>`,
    "loan-calculator.html": `<h3>${escapeHtml(L.methodologyInputs)}</h3>
<ul>
<li><strong>Loan amount (<em>P</em>)</strong> — Principal borrowed.</li>
<li><strong>Interest rate (% yearly)</strong> — Nominal annual rate; monthly rate <em>r = (annual ÷ 100) ÷ 12</em>.</li>
<li><strong>Years</strong> — Loan term; number of monthly payments <em>n = years × 12</em>.</li>
</ul>
<h3>${escapeHtml(L.methodologyFormula)}</h3>
<p>Fixed-rate payment (same standard amortization as the mortgage calculator):</p>
<p><em>M = P × r / (1 − (1 + r)<sup>−n</sup>)</em></p>
<p class="small">If the annual rate is 0%, use <em>M = P ÷ n</em>. The standard formula above assumes a positive monthly rate. Excludes fees, taxes, and lender rounding.</p>`,
    "compound-interest.html": `<h3>${escapeHtml(L.methodologyInputs)}</h3>
<ul>
<li><strong>Principal (<em>P</em>)</strong> — Starting lump sum.</li>
<li><strong>Rate % (<em>r</em>)</strong> — Annual interest rate entered as a percent.</li>
<li><strong>Years (<em>t</em>)</strong> — Whole years the balance grows.</li>
</ul>
<h3>${escapeHtml(L.methodologyFormula)}</h3>
<p>Interest compounds <strong>once per year</strong> at the rate you enter:</p>
<p><em>A = P × (1 + r/100)<sup>t</sup></em></p>
<p class="small">Does not model contributions, withdrawals, or intra-year compounding.</p>`,
    "savings-calculator.html": `<h3>${escapeHtml(L.methodologyInputs)}</h3>
<ul>
<li><strong>Monthly saving</strong> — Amount set aside each month (same value every month).</li>
<li><strong>Years</strong> — How long you save at that monthly rate.</li>
</ul>
<h3>${escapeHtml(L.methodologyFormula)}</h3>
<p><em>Total saved = monthly saving × 12 × years</em></p>
<p class="small">This version does not apply investment returns or interest—only the sum of monthly contributions.</p>`,
    "tax-calculator.html": `<h3>${escapeHtml(L.methodologyInputs)}</h3>
<ul>
<li><strong>Income</strong> — Amount the tax percentage applies to.</li>
<li><strong>Tax %</strong> — Effective or marginal rate you choose for a quick estimate.</li>
</ul>
<h3>${escapeHtml(L.methodologyFormula)}</h3>
<p><em>Tax ≈ income × (tax% ÷ 100)</em></p>
<p class="small">Not a full tax return—no brackets, deductions, or credits.</p>`,
    "debt-payoff.html": `<h3>${escapeHtml(L.methodologyInputs)}</h3>
<ul>
<li><strong>Debt</strong> — Total balance you want to clear.</li>
<li><strong>Monthly payment</strong> — Constant amount applied each month toward that balance.</li>
</ul>
<h3>${escapeHtml(L.methodologyFormula)}</h3>
<p><em>Months ≈ debt ÷ monthly payment</em>, then rounded to the nearest whole month for display.</p>
<p class="small">Interest is not modeled—real loans take longer when interest accrues. Avoid a payment of zero.</p>`,
    "tip-calculator.html": `<h3>${escapeHtml(L.methodologyInputs)}</h3>
<ul>
<li><strong>Bill</strong> — Check amount before tip.</li>
<li><strong>Tip %</strong> — Percent of the bill you want as gratuity.</li>
</ul>
<h3>${escapeHtml(L.methodologyFormula)}</h3>
<p><em>Tip ($) = bill × (tip% ÷ 100)</em></p>
<p class="small">The result line shows the tip in dollars only (not bill + tip).</p>`,
    "discount-calculator.html": `<h3>${escapeHtml(L.methodologyInputs)}</h3>
<ul><li><strong>Price</strong> and <strong>discount %</strong>.</li></ul>
<h3>${escapeHtml(L.methodologyFormula)}</h3>
<p><em>Final price = price × (1 − discount/100)</em></p>`,
    "percentage-calculator.html": `<h3>${escapeHtml(L.methodologyInputs)}</h3>
<ul>
<li><strong>Mode</strong> — Choose <em>Find value (X% of Y)</em> or <em>Find percent (X is what % of Y)</em>; the first two fields relabel automatically.</li>
<li><strong>Find value</strong> — Enter percentage (%) and base value; result = <em>base × (percentage ÷ 100)</em>.</li>
<li><strong>Find percent</strong> — Enter part value and total value; result = <em>(part ÷ total) × 100</em> as a percent. If total is 0, the tool shows an error instead of dividing.</li>
</ul>
<h3>${escapeHtml(L.methodologyFormula)}</h3>
<p>Both modes use standard percent arithmetic; non-numeric inputs are rejected.</p>`,
    "bmi-calculator.html": `<h3>${escapeHtml(L.methodologyInputs)}</h3>
<ul>
<li><strong>Weight (kg)</strong> and <strong>height (m)</strong>.</li>
</ul>
<h3>${escapeHtml(L.methodologyFormula)}</h3>
<p><em>BMI = weight ÷ height²</em></p>
<p class="small">Screening metric only—not a medical diagnosis.</p>`,
    "calorie-calculator.html": `<h3>${escapeHtml(L.methodologyInputs)}</h3>
<ul>
<li><strong>Age</strong>, <strong>sex</strong>, <strong>height (cm)</strong>, <strong>weight (kg)</strong> — Used in the Mifflin–St Jeor BMR estimate.</li>
<li><strong>Activity level</strong> — Multiplies BMR: sedentary 1.2; light 1.375; moderate 1.55; very active 1.725; extra active 1.9.</li>
</ul>
<h3>${escapeHtml(L.methodologyFormula)}</h3>
<p><strong>BMR (female):</strong> <em>10 × weight(kg) + 6.25 × height(cm) − 5 × age − 161</em></p>
<p><strong>BMR (male):</strong> <em>10 × weight(kg) + 6.25 × height(cm) − 5 × age + 5</em></p>
<p><strong>Maintenance</strong> = BMR × activity factor. <strong>Weight loss</strong> target = maintenance − 500 (not shown below 1200 kcal/day). <strong>Weight gain</strong> target = maintenance + 300.</p>
<p class="small">Educational estimate only—not medical nutrition advice.</p>`,
    "kilometers-to-miles-converter.html": `<h3>${escapeHtml(L.methodologyInputs)}</h3>
<ul><li>Enter km or mi; the tool converts using a fixed conversion factor.</li></ul>
<h3>${escapeHtml(L.methodologyFormula)}</h3>
<p>1 mi = 1.609344 km (definition used for conversion).</p>`,
    "celsius-to-fahrenheit-converter.html": `<h3>${escapeHtml(L.methodologyInputs)}</h3>
<ul><li>Celsius and/or Fahrenheit fields.</li></ul>
<h3>${escapeHtml(L.methodologyFormula)}</h3>
<p><em>°F = °C × 9/5 + 32</em>; inverse for °C.</p>`,
    "gpa-calculator.html": `<h3>${escapeHtml(L.methodologyInputs)}</h3>
<ul>
<li><strong>Total grade points</strong> — Combined quality points for the scope you are measuring (one total, not per-row).</li>
<li><strong>Credits</strong> — Total credit hours that go with those points.</li>
</ul>
<h3>${escapeHtml(L.methodologyFormula)}</h3>
<p><em>GPA = total grade points ÷ credits</em></p>
<p class="small">This tool divides the two totals you enter; it does not add rows per course. Your school’s rounding or weighting rules may differ.</p>`
  };

  if (specific[key]) {
    return methodologyDetailsWrap(helpers, lang, specific[key]);
  }
  return generic();
}

function buildMethodologySection(entry, helpers) {
  const lang = entry.lang || "en";
  const fam = entry.family;

  if (fam === "currencyConverter") {
    return methodologyCurrency(helpers, entry, lang);
  }
  if (fam === "loanPaymentByAmount") {
    return methodologyLoanLadder(helpers, entry, lang);
  }
  if (fam === "salaryToHourlyByAmount") {
    return methodologySalaryLadder(helpers, entry, lang);
  }
  if (fam === "spanishPilotPage") {
    return methodologySpanishPilot(helpers, entry.formulaType || "percentage", lang);
  }
  if (fam === "statePaycheckPilotPage") {
    return methodologyStatePaycheck(helpers, entry, lang);
  }
  if (fam === "legacyStaticPage") {
    const fn = entry.pagePath || entry.fileName;
    return methodologyLegacyByFileName(helpers, fn, lang);
  }

  return "";
}

module.exports = { buildMethodologySection };
