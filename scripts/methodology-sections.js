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
<p class="small">The page title uses “paycheck” loosely for take-home after <strong>income taxes only</strong>. It is not payroll advice: real paychecks include <strong>FICA</strong>, local taxes, pre-tax deductions, and withholding adjustments.</p>`;
  return methodologyDetailsWrap(helpers, lang, inner);
}

function methodologySpanishPilot(helpers, formulaType, lang) {
  const innerByType = {
    percentage: `<h3>Qué significa cada dato</h3>
<ul>
<li><strong>Modo “Hallar un valor”</strong> — Ingresa un porcentaje y un total; el resultado es <em>total × (porcentaje ÷ 100)</em>.</li>
<li><strong>Modo “Hallar porcentaje”</strong> — Ingresa la parte (A) y el total (B); el resultado es <em>(A ÷ B) × 100</em> como “A es p% de B”. Si <strong>B es 0</strong>, se muestra un aviso.</li>
</ul>
<h3>Fórmula</h3>
<p>En modo valor: <em>resultado = base × (porcentaje ÷ 100)</em>. En modo porcentaje: <em>p = (A ÷ B) × 100</em>.</p>
<p class="small">Los campos vacíos o no numéricos no son válidos hasta que ingreses números.</p>`,
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
<li><strong>Starting balance</strong> — Amount already saved before the first month.</li>
<li><strong>Monthly saving</strong> — Deposited at the end of each month.</li>
<li><strong>Years</strong> — Projection length (converted to months).</li>
<li><strong>Expected annual return (%)</strong> — Nominal rate converted to monthly <em>r = (annual ÷ 100) ÷ 12</em>; use <strong>0</strong> for no growth (contributions only).</li>
</ul>
<h3>${escapeHtml(L.methodologyFormula)}</h3>
<p>Month-by-month: <em>balance = balance × (1 + r) + monthly saving</em> for <em>years × 12</em> months.</p>
<p class="small">Simplified projection—no taxes, fees, contribution limits, or irregular deposits.</p>`,
    "tax-calculator.html": `<h3>${escapeHtml(L.methodologyInputs)}</h3>
<ul>
<li><strong>Income</strong> — Dollar base the percentage applies to.</li>
<li><strong>Tax %</strong> — One blended rate you supply (effective or marginal style estimate).</li>
</ul>
<h3>${escapeHtml(L.methodologyFormula)}</h3>
<p><em>Estimated tax ≈ income × (tax% ÷ 100)</em>; you can mentally subtract from income for a rough net.</p>
<p class="small">Not a full tax return—no brackets, deductions, credits, self-employment tax, or state splits.</p>`,
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
<li><strong>People splitting bill</strong> — Optional; when greater than 1, the page shows per-person totals.</li>
</ul>
<h3>${escapeHtml(L.methodologyFormula)}</h3>
<p><em>Tip = bill × (tip% ÷ 100)</em>; <em>bill + tip</em> for the full check; per-person lines divide by the people count.</p>
<p class="small">Does not add tax lines or itemize service charges—numbers are as you enter them.</p>`,
    "discount-calculator.html": `<h3>${escapeHtml(L.methodologyInputs)}</h3>
<ul><li><strong>Price</strong> and <strong>discount %</strong>.</li></ul>
<h3>${escapeHtml(L.methodologyFormula)}</h3>
<p><em>Final price = price × (1 − discount/100)</em></p>`,
    "loan-fee-annualizer.html": `<h3>${escapeHtml(L.methodologyInputs)}</h3>
<ul>
<li><strong>Loan principal</strong> — Amount borrowed (denominator).</li>
<li><strong>Total upfront fees</strong> — One-time charges you want to annualize (for example origination or points you group together). This tool does not split financed fees from cash fees.</li>
<li><strong>Loan term (years)</strong> — Used only as a simple divisor to spread the fee load.</li>
</ul>
<h3>${escapeHtml(L.methodologyFormula)}</h3>
<p><em>Simple annualized fee rate (%) ≈ (fees ÷ principal ÷ years) × 100</em></p>
<p class="small">Rough comparison figure only—not Truth-in-Lending APR: it ignores payment timing, compounding, nominal interest rate, and lender rounding rules.</p>`,
    "apr-calculator.html": `<h3>${escapeHtml(L.methodologyInputs)}</h3>
<ul>
<li><strong>Loan principal / contract amount</strong> — Balance used to compute the level monthly payment at the stated note rate.</li>
<li><strong>Stated interest rate</strong> — Nominal annual rate with <strong>monthly compounding</strong> (common U.S. mortgage convention for this estimate).</li>
<li><strong>Loan term (years)</strong> — Converted to months (rounded) for payment count.</li>
<li><strong>Upfront fees deducted from proceeds</strong> — Cash you receive at closing is <em>principal − fees</em>, while the scheduled payment still amortizes the full principal at the note rate.</li>
</ul>
<h3>${escapeHtml(L.methodologyFormula)}</h3>
<p>Monthly payment <em>M</em> = standard amortization on principal <em>P</em> at monthly rate <em>i = (note% ÷ 100 ÷ 12)</em> for <em>n</em> months. Net proceeds <em>N = P − fees</em>. The tool finds monthly IRR <em>r</em> such that present value of <em>n</em> payments of <em>M</em> at rate <em>r</em> equals <em>N</em>, then reports <strong>actuarial APR ≈ 12 × r</strong> (and an effective annual rate for comparison).</p>
<p><strong>APR vs APY:</strong> APR here reflects loan cash-flow timing for borrowing. APY describes compounded growth on savings; the <a href="apy-calculator.html">APY calculator</a> page documents that conversion.</p>
<p class="small">Not a Reg Z / Loan Estimate substitute: ignores PMI, escrow, odd-day interest, APR tolerance rules, prepaid finance charges definitions, variable rates, and lender-specific cash-flow timing.</p>`,
    "apy-calculator.html": `<h3>${escapeHtml(L.methodologyInputs)}</h3>
<ul>
<li><strong>Nominal annual rate (%)</strong> — Stated yearly rate before converting to a periodic rate.</li>
<li><strong>Compounding periods per year (<em>n</em>)</strong> — How often interest is credited per year (12 monthly, 365 daily, etc.).</li>
</ul>
<h3>${escapeHtml(L.methodologyFormula)}</h3>
<p>Periodic rate <em>i = (nominal% ÷ 100) ÷ n</em>. <strong>APY</strong> = <em>(1 + i)<sup>n</sup> − 1</em>, expressed as a percent per year.</p>
<p class="small">Educational deposit/yield math only—not a bank disclosure or loan APR.</p>`,
    "loan-implied-rate-calculator.html": `<h3>${escapeHtml(L.methodologyInputs)}</h3>
<ul>
<li><strong>Loan principal</strong> — Amount being amortized.</li>
<li><strong>Monthly payment</strong> — Level payment assumed each month.</li>
<li><strong>Loan term (years)</strong> — Converted to months (rounded) for payment count.</li>
</ul>
<h3>${escapeHtml(L.methodologyFormula)}</h3>
<p>Solves monthly rate <em>r</em> such that principal equals the present value of <em>n</em> payments at <em>r</em>, then quotes <strong>nominal annual rate ≈ 12 × r</strong> (monthly compounding) plus an effective annual rate.</p>
<p class="small">Assumes standard fixed-rate amortization; not for interest-only, balloon, or negative amortization schedules.</p>`,
    "bonus-calculator.html": `<h3>${escapeHtml(L.methodologyInputs)}</h3>
<ul>
<li><strong>Annual base salary</strong> — Multiplied by bonus percent when you use the percentage piece.</li>
<li><strong>Bonus (% of base)</strong> — Applied as <em>base × (percent ÷ 100)</em> when base is a valid number.</li>
<li><strong>Flat bonus ($)</strong> — Added after the percentage portion.</li>
</ul>
<h3>${escapeHtml(L.methodologyFormula)}</h3>
<p><em>Estimated bonus ≈ base × (bonus% ÷ 100) + flat</em> with non-finite inputs treated as zero where noted in the script.</p>
<p class="small">Gross estimate only—no tax withholding, clawbacks, or employer caps.</p>`,
    "salary-plus-commission-calculator.html": `<h3>${escapeHtml(L.methodologyInputs)}</h3>
<ul>
<li><strong>Annual base salary</strong> — Fixed component.</li>
<li><strong>Sales amount</strong> — Multiplied by commission rate.</li>
<li><strong>Commission rate (%)</strong> — <em>Commission = sales × (rate ÷ 100)</em>.</li>
</ul>
<h3>${escapeHtml(L.methodologyFormula)}</h3>
<p><em>Total ≈ base + commission</em> as entered; all figures are gross before tax.</p>
<p class="small">Does not prorate partial years, tiers, draws, or accelerators.</p>`,
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
<p class="small">This tool divides the two totals you enter; it does not add rows per course. Your school’s rounding or weighting rules may differ.</p>`,
    "1099-vs-w2-income-calculator.html": `<h3>${escapeHtml(L.methodologyInputs)}</h3>
<ul>
<li><strong>Gross annual income</strong> — Same gross used for both columns before tax-specific adjustments.</li>
<li><strong>W2 total tax estimate (%)</strong> — Effective or blended rate you assign to W2 withholding; applied as <em>W2 net = gross × (1 − W2% ÷ 100)</em>.</li>
<li><strong>1099 total tax estimate (%)</strong> — Rate you assign to contractor/self-employed income after expenses.</li>
<li><strong>1099 deductible business expenses</strong> — Subtracted from gross before the 1099 rate: <em>taxable 1099 = max(0, gross − expenses)</em>.</li>
</ul>
<h3>${escapeHtml(L.methodologyFormula)}</h3>
<p><em>1099 net ≈ taxable 1099 × (1 − 1099% ÷ 100)</em>; difference = 1099 net − W2 net.</p>
<p class="small">Uses your percentage guesses only—not full payroll, FICA splits, QBI, state rules, or phase-outs.</p>`,
    "401k-calculator.html": `<h3>${escapeHtml(L.methodologyInputs)}</h3>
<ul>
<li><strong>Annual salary</strong> — Base used to compute dollar contributions from the percentages below.</li>
<li><strong>Your contribution (%) + employer match (%)</strong> — Combined into one annual cash flow: <em>annual contribution = salary × (your% + match%) ÷ 100</em>.</li>
<li><strong>Expected annual return (%)</strong> — Constant growth rate <em>r</em> each year.</li>
<li><strong>Years to invest</strong> — Number of compounding periods (same as “years” in the formula below).</li>
</ul>
<h3>${escapeHtml(L.methodologyFormula)}</h3>
<p>Future value of a constant end-of-year contribution stream:</p>
<p><em>FV ≈ PMT × ((1 + r)<sup>n</sup> − 1) ÷ r</em>, with <em>PMT</em> = annual contribution, <em>r</em> = return ÷ 100, <em>n</em> = years. If return is 0, FV = PMT × n.</p>
<p class="small">Ignores contribution limits, vesting schedules, catch-up, fees, taxes on withdrawal, and irregular raises.</p>`,
    "age-calculator.html": `<h3>${escapeHtml(L.methodologyInputs)}</h3>
<ul>
<li><strong>Birth date</strong> — Calendar date used as the start of the interval.</li>
</ul>
<h3>${escapeHtml(L.methodologyFormula)}</h3>
<p>Computes whole years between the birth date and today: subtract calendar years, then subtract one if the birthday has not yet occurred this year.</p>
<p class="small">Uses the browser’s local date; does not account for time zones across midnight.</p>`,
    "biweekly-to-annual-salary-calculator.html": `<h3>${escapeHtml(L.methodologyInputs)}</h3>
<ul>
<li><strong>Biweekly gross pay</strong> — Gross amount per paycheck on a biweekly schedule (26 pay periods per year).</li>
</ul>
<h3>${escapeHtml(L.methodologyFormula)}</h3>
<p><em>Annual ≈ biweekly × 26</em>; <em>Monthly ≈ annual ÷ 12</em>; <em>Weekly ≈ annual ÷ 52</em>.</p>
<p class="small">Gross-only; ignores taxes, pre-tax deductions, and employers that use 24 or 27 pay periods.</p>`,
    "break-even-calculator.html": `<h3>${escapeHtml(L.methodologyInputs)}</h3>
<ul>
<li><strong>Fixed costs</strong> — Overhead that does not change with each unit sold (must be ≥ 0).</li>
<li><strong>Price per unit</strong> and <strong>variable cost per unit</strong> — Contribution margin per unit must be positive (<em>price − cost &gt; 0</em>).</li>
</ul>
<h3>${escapeHtml(L.methodologyFormula)}</h3>
<p><em>Break-even units = fixed costs ÷ (price per unit − cost per unit)</em>; the page rounds up to the next whole unit.</p>
<p class="small">Assumes linear unit economics; does not model discounts, capacity limits, or mixed product lines.</p>`,
    "closing-cost-calculator.html": `<h3>${escapeHtml(L.methodologyInputs)}</h3>
<ul>
<li><strong>Home purchase price</strong> — Basis for the percentage fee estimate.</li>
<li><strong>Closing cost estimate (%)</strong> — Applied as <em>fees = price × (% ÷ 100)</em>.</li>
<li><strong>Prepaid taxes/insurance estimate</strong> — Added as a flat dollar amount to the fee subtotal.</li>
</ul>
<h3>${escapeHtml(L.methodologyFormula)}</h3>
<p><em>Total cash to close (fees + prepaid) = closing fees + prepaid</em> (as implemented on the page).</p>
<p class="small">Does not itemize title, recording, points, or lender-specific rules.</p>`,
    "commission-calculator.html": `<h3>${escapeHtml(L.methodologyInputs)}</h3>
<ul>
<li><strong>Sales amount</strong> — Revenue the commission rate applies to.</li>
<li><strong>Commission rate (%)</strong> — Percent of sales paid as commission.</li>
<li><strong>Base pay (optional)</strong> — Flat dollars added after commission.</li>
</ul>
<h3>${escapeHtml(L.methodologyFormula)}</h3>
<p><em>Commission = sales × (rate ÷ 100)</em>; total shown = commission + base.</p>
<p class="small">Does not tier rates, split draws, or clawbacks.</p>`,
    "credit-card-interest-calculator.html": `<h3>${escapeHtml(L.methodologyInputs)}</h3>
<ul>
<li><strong>Card balance</strong> — Balance interest accrues on for the month.</li>
<li><strong>APR (%)</strong> — Nominal annual rate; converted to monthly periodic rate <em>r = APR ÷ 100 ÷ 12</em>.</li>
</ul>
<h3>${escapeHtml(L.methodologyFormula)}</h3>
<p><em>Estimated monthly interest ≈ balance × r</em> (simple interest on the current balance; not minimum-payment schedules).</p>
<p class="small">Real cards use daily balance methods, grace periods, and promo rates—confirm with your issuer.</p>`,
    "debt-avalanche-calculator.html": `<h3>${escapeHtml(L.methodologyInputs)}</h3>
<ul>
<li><strong>Total debt balance</strong> — One combined principal modeled as a single amortizing loan (the “avalanche” label describes the strategy concept, not per-account ordering in this tool).</li>
<li><strong>Average APR (%)</strong> — Converted to monthly rate <em>r = APR ÷ 100 ÷ 12</em>.</li>
<li><strong>Monthly payment budget</strong> — Constant payment applied each month.</li>
</ul>
<h3>${escapeHtml(L.methodologyFormula)}</h3>
<p>Uses the standard amortization payoff-time solve for one balance: months from <em>log</em> formula on payment, rate, and principal (same numeric model as the snowball page on this site).</p>
<p class="small">Does not reorder multiple debts or allocate payments across accounts—use it as a quick single-balance payoff-time estimate.</p>`,
    "debt-snowball-calculator.html": `<h3>${escapeHtml(L.methodologyInputs)}</h3>
<ul>
<li><strong>Total debt balance</strong> — One combined principal modeled as a single amortizing loan (the “snowball” label describes the strategy concept, not smallest-balance ordering in this tool).</li>
<li><strong>Average APR (%)</strong> — Monthly rate <em>r = APR ÷ 100 ÷ 12</em>.</li>
<li><strong>Monthly payment budget</strong> — Applied until the balance is paid.</li>
</ul>
<h3>${escapeHtml(L.methodologyFormula)}</h3>
<p>Same payoff-months math as the avalanche page here: one-balance amortization closed form using log of payment ratio.</p>
<p class="small">Does not simulate paying smallest balances first across multiple accounts—only one combined principal.</p>`,
    "debt-to-income-calculator.html": `<h3>${escapeHtml(L.methodologyInputs)}</h3>
<ul>
<li><strong>Monthly gross income</strong> — Denominator for the ratio.</li>
<li><strong>Monthly debt payments</strong> — Total recurring minimum payments you choose to include (credit cards, auto, housing, other installment debt, etc.). Which debts belong in the ratio depends on the lender or program.</li>
</ul>
<h3>${escapeHtml(L.methodologyFormula)}</h3>
<p><em>DTI (%) ≈ (monthly debt ÷ monthly gross income) × 100</em> as implemented—a generic <strong>back-end</strong>-style ratio.</p>
<p><strong>Front-end vs back-end:</strong> Some lenders emphasize housing payment vs income (“front-end”) separately from all debts (“back-end”). This page uses one combined debts field.</p>
<p class="small">Lenders use underwriting-specific definitions; this is not a credit decision.</p>`,
    "emergency-fund-calculator.html": `<h3>${escapeHtml(L.methodologyInputs)}</h3>
<ul>
<li><strong>Monthly expenses</strong> — Spending level you want covered.</li>
<li><strong>Target months of expenses</strong> — Multiplier for the fund size.</li>
</ul>
<h3>${escapeHtml(L.methodologyFormula)}</h3>
<p><em>Target emergency fund ≈ monthly expenses × months</em>.</p>
<p class="small">Does not adjust for inflation, irregular bills, or invested vs cash holdings.</p>`,
    "extra-payment-loan-calculator.html": `<h3>${escapeHtml(L.methodologyInputs)}</h3>
<ul>
<li><strong>Loan balance, annual rate (%), remaining term (years)</strong> — Used to compute the baseline amortizing payment.</li>
<li><strong>Extra payment per month</strong> — Added to that payment; payoff is simulated month-by-month until the balance is paid.</li>
</ul>
<h3>${escapeHtml(L.methodologyFormula)}</h3>
<p>Baseline payment uses fixed-rate amortization <em>M = P × r ÷ (1 − (1 + r)<sup>−n</sup>)</em> with <em>r</em> monthly and <em>n</em> months. <strong>Interest totals</strong> sum each month’s <em>balance × r</em> until payoff for the baseline schedule vs the increased-payment schedule.</p>
<p class="small">Assumes the extra pays down principal immediately; ignores fees, taxes, and escrow.</p>`,
    "freelance-tax-estimate-calculator.html": `<h3>${escapeHtml(L.methodologyInputs)}</h3>
<ul>
<li><strong>Annual freelance revenue</strong> and <strong>business expenses</strong> — <em>Taxable income ≈ max(0, revenue − expenses)</em>.</li>
<li><strong>Combined tax estimate (%)</strong> — One effective rate applied to taxable income.</li>
</ul>
<h3>${escapeHtml(L.methodologyFormula)}</h3>
<p><em>Estimated annual tax ≈ taxable × (combined% ÷ 100)</em>; <em>estimated quarterly ≈ annual ÷ 4</em>.</p>
<p class="small">Not IRS Form 1040-ES; ignores SE tax split, brackets, QBI, and state taxes.</p>`,
    "hourly-to-salary-after-tax-calculator.html": `<h3>${escapeHtml(L.methodologyInputs)}</h3>
<ul>
<li><strong>Hourly wage, hours per week, weeks per year</strong> — Build gross annual pay.</li>
<li><strong>Total tax estimate (%)</strong> — Single effective rate applied to gross.</li>
</ul>
<h3>${escapeHtml(L.methodologyFormula)}</h3>
<p><em>Gross annual ≈ hourly × hours × weeks</em>; <em>Net annual ≈ gross × (1 − tax% ÷ 100)</em>; monthly/biweekly derived by division.</p>
<p class="small">One blended tax rate only; not paycheck withholding math.</p>`,
    "hours-to-days-converter.html": `<h3>${escapeHtml(L.methodologyInputs)}</h3>
<ul><li><strong>Hours</strong> or <strong>days</strong> — Enter one; the other is computed.</li></ul>
<h3>${escapeHtml(L.methodologyFormula)}</h3>
<p><em>Days = hours ÷ 24</em>; <em>hours = days × 24</em> (fixed conversion).</p>`,
    "inflation-calculator.html": `<h3>${escapeHtml(L.methodologyInputs)}</h3>
<ul>
<li><strong>Amount</strong> — Starting dollars.</li>
<li><strong>Inflation %</strong> — Assumed constant annual rate.</li>
<li><strong>Years</strong> — Number of compounding periods (annual compounding).</li>
</ul>
<h3>${escapeHtml(L.methodologyFormula)}</h3>
<p><em>Future value ≈ amount × (1 + inflation% ÷ 100)<sup>years</sup></em> as implemented on the page.</p>
<p class="small">Does not vary the rate year-to-year or model partial years.</p>`,
    "interest-rate-calculator.html": `<h3>${escapeHtml(L.methodologyInputs)}</h3>
<ul>
<li><strong>Principal</strong> — Dollar base.</li>
<li><strong>Rate %</strong> — Annual simple rate.</li>
<li><strong>Time (years)</strong> — Whole years in the product (not converted to months).</li>
</ul>
<h3>${escapeHtml(L.methodologyFormula)}</h3>
<p><em>Interest ≈ principal × (rate ÷ 100) × time</em> (simple interest; no compounding within the period).</p>`,
    "kilograms-to-pounds-converter.html": `<h3>${escapeHtml(L.methodologyInputs)}</h3>
<ul><li><strong>Kilograms</strong> or <strong>pounds</strong> — Enter one field to convert.</li></ul>
<h3>${escapeHtml(L.methodologyFormula)}</h3>
<p>Uses <em>1 kg = 2.2046226218 lb</em> in the script (high-precision constant).</p>`,
    "liters-to-gallons-converter.html": `<h3>${escapeHtml(L.methodologyInputs)}</h3>
<ul><li><strong>Liters</strong> or <strong>US gallons</strong> — Enter one field to convert.</li></ul>
<h3>${escapeHtml(L.methodologyFormula)}</h3>
<p>Uses <em>1 L = 0.2641720524 US gal</em> as coded on the page.</p>`,
    "macros-calculator.html": `<h3>${escapeHtml(L.methodologyInputs)}</h3>
<ul>
<li><strong>Calorie target</strong> — Daily calories to split into macros.</li>
<li><strong>Goal style / ratio</strong> — Preset protein/carbs/fat percentages that sum to 100%.</li>
</ul>
<h3>${escapeHtml(L.methodologyFormula)}</h3>
<p>Atwater-style grams: <em>protein g = calories × (P% ÷ 100) ÷ 4</em>, <em>carbs g = calories × (C% ÷ 100) ÷ 4</em>, <em>fat g = calories × (F% ÷ 100) ÷ 9</em>.</p>
<p class="small">Educational split only—not a meal plan or medical advice.</p>`,
    "minutes-to-hours-converter.html": `<h3>${escapeHtml(L.methodologyInputs)}</h3>
<ul><li><strong>Minutes</strong> or <strong>hours</strong> — Enter one field to convert.</li></ul>
<h3>${escapeHtml(L.methodologyFormula)}</h3>
<p><em>Hours = minutes ÷ 60</em>; <em>minutes = hours × 60</em>.</p>`,
    "mortgage-affordability-calculator.html": `<h3>${escapeHtml(L.methodologyInputs)}</h3>
<ul>
<li><strong>Gross monthly income</strong> and <strong>target DTI limit (%)</strong> — Housing budget cap ≈ <em>income × (DTI ÷ 100) − other monthly debts</em>.</li>
<li><strong>Estimated mortgage rate (%)</strong> and <strong>loan term (years)</strong> — Convert payment capacity into a loan principal using the amortization identity.</li>
<li><strong>Down payment (% of purchase price)</strong> — Optional; if provided, <em>estimated price ≈ loan ÷ (1 − down% ÷ 100)</em> (loan-only math; not a full cash-to-close).</li>
</ul>
<h3>${escapeHtml(L.methodologyFormula)}</h3>
<p>Payment-to-loan principal: <em>loan ≈ max housing × ((1 + r)<sup>n</sup> − 1) ÷ (r(1 + r)<sup>n</sup>)</em> with monthly <em>r</em> and <em>n = years × 12</em>; if <em>r = 0</em>, <em>loan = max housing × n</em>.</p>
<p class="small">Ignores taxes, insurance in the payment, PMI, and underwriting overlays.</p>`,
    "net-worth-calculator.html": `<h3>${escapeHtml(L.methodologyInputs)}</h3>
<ul>
<li><strong>Total assets</strong> — Everything you count as positive value.</li>
<li><strong>Total liabilities</strong> — Debts subtracted from assets.</li>
</ul>
<h3>${escapeHtml(L.methodologyFormula)}</h3>
<p><em>Net worth = assets − liabilities</em>.</p>
<p class="small">Classification of items as asset/liability is yours to define consistently.</p>`,
    "overtime-pay-calculator.html": `<h3>${escapeHtml(L.methodologyInputs)}</h3>
<ul>
<li><strong>Hourly rate</strong> — Base pay per hour before overtime.</li>
<li><strong>Overtime hours</strong> — Hours paid at the multiplier.</li>
<li><strong>Overtime multiplier</strong> — Often 1.5 (time-and-a-half); editable.</li>
</ul>
<h3>${escapeHtml(L.methodologyFormula)}</h3>
<p><em>Overtime pay ≈ hourly × hours × multiplier</em> (gross; no tax withholding).</p>`,
    "ovulation-calculator.html": `<h3>${escapeHtml(L.methodologyInputs)}</h3>
<ul>
<li><strong>First day of last period</strong> — Anchor date.</li>
<li><strong>Cycle length (days)</strong> — Typical menstrual cycle length you enter.</li>
</ul>
<h3>${escapeHtml(L.methodologyFormula)}</h3>
<p>Adds <em>(cycle length − 14)</em> days to the last-period date to approximate ovulation (about two weeks before the next expected period). The page also shows a <strong>rough fertile window</strong> (about two days before through two days after that estimate).</p>
<p class="small">Simplified calendar estimate—not medical timing or fertility treatment guidance.</p>`,
    "payback-period-calculator.html": `<h3>${escapeHtml(L.methodologyInputs)}</h3>
<ul>
<li><strong>Upfront investment</strong> — One-time cash outlay.</li>
<li><strong>Expected monthly net cash flow</strong> — Constant benefit each month.</li>
</ul>
<h3>${escapeHtml(L.methodologyFormula)}</h3>
<p><em>Payback months ≈ investment ÷ monthly cash flow</em> (then displayed with rounding as on the page).</p>
<p class="small">No discounting; ignores uneven cash flows after payback.</p>`,
    "profit-margin-calculator.html": `<h3>${escapeHtml(L.methodologyInputs)}</h3>
<ul><li><strong>Revenue</strong> and <strong>cost</strong> — Used as dollars in the margin ratio.</li></ul>
<h3>${escapeHtml(L.methodologyFormula)}</h3>
<p><em>Margin % ≈ ((revenue − cost) ÷ revenue) × 100</em> when revenue ≠ 0.</p>
<p class="small">Markup vs margin differ; this is margin on revenue only.</p>`,
    "property-tax-estimate-calculator.html": `<h3>${escapeHtml(L.methodologyInputs)}</h3>
<ul>
<li><strong>Home value</strong> — Assessed or market value you choose as the base.</li>
<li><strong>Property tax rate (%)</strong> — Effective annual rate applied to that value.</li>
</ul>
<h3>${escapeHtml(L.methodologyFormula)}</h3>
<p><em>Annual tax ≈ value × (rate ÷ 100)</em>; <em>monthly ≈ annual ÷ 12</em>.</p>
<p class="small">Real bills use mill rates, exemptions, and caps; this is a flat percentage model.</p>`,
    "raise-calculator.html": `<h3>${escapeHtml(L.methodologyInputs)}</h3>
<ul>
<li><strong>Current annual salary</strong> — Pre-raise base.</li>
<li><strong>Raise (%)</strong> — Percent increase applied once.</li>
</ul>
<h3>${escapeHtml(L.methodologyFormula)}</h3>
<p><em>New salary ≈ current × (1 + raise% ÷ 100)</em>; annual gain = new − current; monthly gain = annual gain ÷ 12.</p>`,
    "refinance-calculator.html": `<h3>${escapeHtml(L.methodologyInputs)}</h3>
<ul>
<li><strong>Loan balance, remaining term (years)</strong> — Same principal and term for old vs new rate scenarios.</li>
<li><strong>Current rate (%)</strong> vs <strong>new rate (%)</strong> — Each produces a fixed-rate amortizing payment.</li>
<li><strong>Refinance closing costs</strong> — Divided by monthly savings to show break-even months when savings &gt; 0.</li>
</ul>
<h3>${escapeHtml(L.methodologyFormula)}</h3>
<p>Monthly payment <em>M = P × r ÷ (1 − (1 + r)<sup>−n</sup>)</em> with monthly <em>r</em>. Savings = current payment − new payment; break-even months ≈ costs ÷ savings.</p>
<p class="small">Assumes balance and term unchanged; ignores cash-out, points, and tax effects.</p>`,
    "rent-vs-buy-calculator.html": `<h3>${escapeHtml(L.methodologyInputs)}</h3>
<ul>
<li><strong>Monthly rent</strong> — Annualized as <em>rent × 12</em>.</li>
<li><strong>Monthly mortgage payment</strong> — Annualized as <em>mortgage × 12</em>, then <strong>annual property tax + insurance</strong> and <strong>annual maintenance</strong> are added for the buy side.</li>
</ul>
<h3>${escapeHtml(L.methodologyFormula)}</h3>
<p><em>Annual buy cost = mortgage×12 + taxes/insurance + maintenance</em>; compared to annual rent.</p>
<p class="small">Omits opportunity cost, appreciation, transaction costs, and tax deductions.</p>`,
    "retirement-calculator.html": `<h3>${escapeHtml(L.methodologyInputs)}</h3>
<ul>
<li><strong>Current savings</strong> — Starting balance before monthly contributions.</li>
<li><strong>Monthly contribution</strong> — Added at the end of each month in the simulation.</li>
<li><strong>Years</strong> — Number of years to project (converted to months).</li>
<li><strong>Expected annual return (%)</strong> — Nominal rate converted to a monthly rate <em>r = (annual ÷ 100) ÷ 12</em>; use <strong>0</strong> for no growth (contributions only).</li>
</ul>
<h3>${escapeHtml(L.methodologyFormula)}</h3>
<p>Month-by-month: <em>balance = balance × (1 + r) + monthly contribution</em> for <em>years × 12</em> months. This is a simplified projection, not tax-adjusted or inflation-adjusted.</p>
<p class="small">Does not model employer match, contribution limits, or withdrawals; compare with the 401(k) tool for salary-percent contribution patterns.</p>`,
    "roi-calculator.html": `<h3>${escapeHtml(L.methodologyInputs)}</h3>
<ul>
<li><strong>Initial investment</strong> — Starting outlay.</li>
<li><strong>Final value</strong> — Ending value of the investment.</li>
</ul>
<h3>${escapeHtml(L.methodologyFormula)}</h3>
<p><em>Profit = final − initial</em>; <em>ROI % = (profit ÷ initial) × 100</em> when initial &gt; 0.</p>
<p class="small">Ignores time horizon, cash flows mid-period, and annualization.</p>`,
    "salary-after-tax-calculator.html": `<h3>${escapeHtml(L.methodologyInputs)}</h3>
<ul>
<li><strong>Gross annual salary</strong> — Before deductions.</li>
<li><strong>Federal, state, and payroll tax estimates (%)</strong> — Summed into one effective rate.</li>
</ul>
<h3>${escapeHtml(L.methodologyFormula)}</h3>
<p><em>Net annual ≈ gross × (1 − (federal% + state% + payroll%) ÷ 100)</em>; <em>net monthly ≈ net annual ÷ 12</em>.</p>
<p class="small">Flat percentages only—not real withholding tables or pre-tax benefits.</p>`,
    "salary-calculator.html": `<h3>${escapeHtml(L.methodologyInputs)}</h3>
<ul>
<li><strong>Hourly rate ($)</strong> — Gross pay per hour.</li>
<li><strong>Hours per week</strong> — Typical work week length.</li>
</ul>
<h3>${escapeHtml(L.methodologyFormula)}</h3>
<p><em>Yearly gross ≈ hourly × hours × 52</em>; <em>monthly ≈ yearly ÷ 12</em> (the page assumes 52 work weeks).</p>
<p class="small">Gross only; no PTO, overtime, or tax adjustments.</p>`,
    "seconds-to-minutes-converter.html": `<h3>${escapeHtml(L.methodologyInputs)}</h3>
<ul><li><strong>Seconds</strong> or <strong>minutes</strong> — Enter one field to convert.</li></ul>
<h3>${escapeHtml(L.methodologyFormula)}</h3>
<p><em>Minutes = seconds ÷ 60</em>; <em>seconds = minutes × 60</em>.</p>`,
    "self-employment-tax-calculator.html": `<h3>${escapeHtml(L.methodologyInputs)}</h3>
<ul>
<li><strong>Net business income</strong> — Profit base before the optional IRS earnings factor.</li>
<li><strong>Apply 92.35% factor</strong> — Optional checkbox: multiplies net income by 0.9235 before the rate (Schedule SE uses this on net earnings from self-employment).</li>
<li><strong>Self-employment tax rate (%)</strong> — Default 15.3% is a common combined placeholder; you can edit it.</li>
</ul>
<h3>${escapeHtml(L.methodologyFormula)}</h3>
<p><em>Estimated SE tax ≈ (optional 92.35% ×) income × (rate ÷ 100)</em> as one dollar output.</p>
<p class="small">Still not Schedule SE—ignores Social Security wage base cap, Medicare surtax tiers, and the employer-equivalent deduction.</p>`,
    "side-hustle-income-tax-calculator.html": `<h3>${escapeHtml(L.methodologyInputs)}</h3>
<ul>
<li><strong>Annual side hustle income</strong> — Extra taxable dollars.</li>
<li><strong>Marginal tax estimate (%)</strong> — Applied to that income only.</li>
</ul>
<h3>${escapeHtml(L.methodologyFormula)}</h3>
<p><em>Extra tax ≈ side income × (marginal% ÷ 100)</em>; <em>net side income ≈ side income − extra tax</em>.</p>
<p class="small">Flat marginal rate; ignores SE tax, phase-outs, and state taxes.</p>`,
    "steps-calories-calculator.html": `<h3>${escapeHtml(L.methodologyInputs)}</h3>
<ul>
<li><strong>Steps walked</strong> — Total step count for the walk or day you are estimating.</li>
<li><strong>Body weight</strong> — MET-based formulas scale with mass (kg internally).</li>
<li><strong>Height (optional)</strong> — When provided, stride length defaults to about <strong>41.3% of height</strong> (walking heuristic); otherwise a fixed ~76 cm stride.</li>
<li><strong>Pace</strong> — Chooses a <strong>MET</strong> value and a <strong>walking speed</strong> used only to turn distance into time: <em>hours = distance ÷ speed</em>.</li>
<li><strong>Terrain / incline</strong> — Multiplies MET upward for hills or treadmill incline (coarse factors, not measured grade).</li>
<li><strong>Daily-average checkbox</strong> — Scales one-day burn to week/month totals and shows illustrative lb/kg/week figures using common rule-of-thumb energy densities (~3,500 kcal per lb, ~7,700 per kg).</li>
</ul>
<h3>${escapeHtml(L.methodologyFormula)}</h3>
<p><em>Distance</em> ≈ steps × stride (m). <em>Time</em> ≈ distance ÷ pace speed. <em>Calories</em> ≈ MET × weight(kg) × time(hours), with MET adjusted by terrain.</p>
<p class="small">Wearables and lab measures disagree; this page does not replace metabolic testing. Weight-change lines assume calories translate directly into fat deficit, which real life usually violates.</p>`,
    "take-home-paycheck-calculator.html": `<h3>${escapeHtml(L.methodologyInputs)}</h3>
<ul>
<li><strong>Gross paycheck</strong> — Per-period gross.</li>
<li><strong>Tax withholding (%)</strong> and <strong>other deductions (%)</strong> — Combined before applying to gross.</li>
</ul>
<h3>${escapeHtml(L.methodologyFormula)}</h3>
<p><em>Net ≈ gross × (1 − (tax% + other%) ÷ 100)</em>.</p>
<p class="small">Percent-of-gross only; not actual W-4 or benefit elections.</p>`,
    "weight-loss-calculator.html": `<h3>${escapeHtml(L.methodologyInputs)}</h3>
<ul><li><strong>Start weight</strong> and <strong>goal weight</strong> — Use the <strong>same units</strong> for both (pounds, kilograms, etc.).</li></ul>
<h3>${escapeHtml(L.methodologyFormula)}</h3>
<p><em>Difference = start − goal</em>. Positive means the goal is below the start (common “weight to lose” case); negative means the goal is above the start.</p>
<p class="small">Total body-weight math only—not body fat, lean mass, timelines, or medical advice.</p>`
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
