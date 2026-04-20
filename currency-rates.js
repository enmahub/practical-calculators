(function () {
  const script = document.querySelector("script[data-currency-page]");
  if (!script) {
    return;
  }

  const fromCode = (script.dataset.from || "").toUpperCase();
  const toCode = (script.dataset.to || "").toUpperCase();
  const amountId = script.dataset.amountId || "amount";
  const rateId = script.dataset.rateId || "";
  const resultId = script.dataset.resultId || "result";
  const updatedId = script.dataset.updatedId || "";
  const ratesUrl = script.dataset.ratesUrl || "rates/latest.json";
  const liveFallbackEnabled =
    script.dataset.liveFallback === "1" ||
    (typeof window !== "undefined" && window.PRACTICAL_CALC_LIVE_FALLBACK === true);

  const proxyFromDataset = (script.dataset.frankfurterProxy || "").trim();
  const proxyFromGlobal =
    typeof window !== "undefined" && window.PRACTICAL_CALC_FRANKFURTER_PROXY
      ? String(window.PRACTICAL_CALC_FRANKFURTER_PROXY).trim()
      : "";
  const frankfurterProxyBase = (proxyFromDataset || proxyFromGlobal).replace(/\/$/, "");

  const amountInput = document.getElementById(amountId);
  const rateInput = rateId ? document.getElementById(rateId) : null;
  const resultNode = document.getElementById(resultId);
  const updatedNode = updatedId ? document.getElementById(updatedId) : null;

  let suggestedRate = null;
  let fetchFailed = false;

  function formatRate(rate) {
    return Number(rate).toFixed(6).replace(/\.?0+$/, "");
  }

  function getRate() {
    if (rateInput) {
      const manualRate = parseFloat(rateInput.value);
      if (Number.isFinite(manualRate) && manualRate > 0) {
        return manualRate;
      }
    }
    return suggestedRate;
  }

  function showMessage(message) {
    if (resultNode) {
      resultNode.textContent = message;
    }
  }

  function setUpdatedText(asOfIso) {
    if (!updatedNode) {
      return;
    }
    if (!asOfIso) {
      updatedNode.textContent = "";
      return;
    }
    const asOfDate = new Date(asOfIso);
    if (Number.isNaN(asOfDate.getTime())) {
      updatedNode.textContent = "";
      return;
    }
    updatedNode.textContent = `Suggested rate last updated: ${asOfDate.toLocaleString()}`;
  }

  function parseSnapshotRate(payload) {
    if (!payload || typeof payload !== "object") {
      return NaN;
    }
    const rates = payload.rates;
    if (!rates || typeof rates !== "object") {
      return NaN;
    }
    const fromRate = fromCode === "EUR" ? 1 : Number(rates[fromCode]);
    const toRate = toCode === "EUR" ? 1 : Number(rates[toCode]);
    if (!Number.isFinite(fromRate) || fromRate <= 0 || !Number.isFinite(toRate) || toRate <= 0) {
      return NaN;
    }
    return toRate / fromRate;
  }

  async function fetchSnapshotRate() {
    try {
      const response = await fetch(ratesUrl, { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`Rates snapshot request failed with status ${response.status}`);
      }
      const data = await response.json();
      const nextRate = parseSnapshotRate(data);
      if (!Number.isFinite(nextRate) || nextRate <= 0) {
        throw new Error("Rate missing from rates snapshot");
      }

      suggestedRate = nextRate;
      if (rateInput) {
        rateInput.value = formatRate(nextRate);
      }
      setUpdatedText(data.asOf);
    } catch (error) {
      fetchFailed = true;
      setUpdatedText("");
    }
  }

  async function fetchLiveRateFallback() {
    try {
      const query = `from=${encodeURIComponent(fromCode)}&to=${encodeURIComponent(toCode)}`;
      const rateUrl = frankfurterProxyBase
        ? `${frankfurterProxyBase}/latest?${query}`
        : `https://api.frankfurter.app/latest?${query}`;
      const response = await fetch(rateUrl);
      if (!response.ok) {
        throw new Error(`Rate request failed with status ${response.status}`);
      }
      const data = await response.json();
      const nextRate = data && data.rates ? Number(data.rates[toCode]) : NaN;
      if (!Number.isFinite(nextRate) || nextRate <= 0) {
        throw new Error("Rate missing from API response");
      }

      suggestedRate = nextRate;
      if (rateInput) {
        rateInput.value = formatRate(nextRate);
      }
      if (!updatedNode) {
        return;
      }
      const nowIso = new Date().toISOString();
      setUpdatedText(nowIso);
    } catch (error) {
      fetchFailed = true;
    }
  }

  function calculate() {
    const amount = amountInput ? parseFloat(amountInput.value) || 0 : 0;
    const rate = getRate();

    if (!Number.isFinite(rate) || rate <= 0) {
      if (fetchFailed && !rateInput) {
        showMessage("Suggested rate unavailable right now. Please try again later.");
      } else {
        showMessage("Suggested rate unavailable. Enter a valid rate and click Convert.");
      }
      return;
    }

    const converted = amount * rate;
    showMessage(`${converted.toFixed(2)} ${toCode}`);
    document.dispatchEvent(
      new CustomEvent("pc:calculator_result", {
        detail: { type: "currency" }
      })
    );
  }

  window.convert = calculate;
  window.calc = calculate;

  fetchSnapshotRate().then(function () {
    if (!Number.isFinite(suggestedRate) && liveFallbackEnabled) {
      return fetchLiveRateFallback();
    }
    return null;
  }).then(function () {
    if (!Number.isFinite(suggestedRate) && rateInput) {
      showMessage("Suggested rate unavailable. Enter a rate manually and click Convert.");
    }
    if (!Number.isFinite(suggestedRate) && !rateInput) {
      showMessage("Suggested rate unavailable right now. Please try again later.");
    }
  });
})();
