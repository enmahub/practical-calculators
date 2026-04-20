const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, "rates");
const OUT_FILE = path.join(OUT_DIR, "latest.json");

const SUPPORTED_CODES = [
  "USD", "EUR", "GBP", "CAD", "AUD", "JPY", "INR", "MXN", "BRL",
  "COP", "ARS", "CHF", "SEK", "NOK", "DKK", "ZAR", "SGD", "AED"
];

const PROVIDER_FALLBACK_RATES = {
  // Frankfurter's ECB feed does not publish every world currency.
  // Keep explicit fallbacks for unsupported symbols so pages can still prefill.
  COP: 4535,
  ARS: 1200,
  AED: 4.18
};

async function fetchFrankfurterSnapshot() {
  const apiUrl = "https://api.frankfurter.app/latest?from=EUR";
  const response = await fetch(apiUrl, {
    headers: { Accept: "application/json" }
  });
  if (!response.ok) {
    throw new Error(`Frankfurter request failed with status ${response.status}`);
  }
  const payload = await response.json();
  const upstreamRates = payload && payload.rates ? payload.rates : {};

  const rates = {};
  for (const code of SUPPORTED_CODES) {
    if (code === "EUR") {
      rates.EUR = 1;
      continue;
    }
    const value = Number(upstreamRates[code]);
    if (Number.isFinite(value) && value > 0) {
      rates[code] = value;
      continue;
    }

    const fallbackValue = Number(PROVIDER_FALLBACK_RATES[code]);
    if (!Number.isFinite(fallbackValue) || fallbackValue <= 0) {
      throw new Error(`Missing or invalid rate for ${code}`);
    }
    rates[code] = fallbackValue;
    console.warn(
      `Frankfurter did not provide ${code}; using curated fallback value ${fallbackValue}.`
    );
  }

  return {
    asOf: new Date().toISOString(),
    provider: "frankfurter",
    base: "EUR",
    rates
  };
}

async function main() {
  const snapshot = await fetchFrankfurterSnapshot();
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(OUT_FILE, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");
  console.log(`Wrote rates snapshot: ${path.relative(ROOT, OUT_FILE)}`);
}

main().catch((error) => {
  console.error(`Failed to update rates: ${error.message}`);
  process.exitCode = 1;
});
