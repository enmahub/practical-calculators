(function () {
  "use strict";

  function currentLocale() {
    var lang = (document.documentElement.getAttribute("lang") || "en").toLowerCase();
    return lang.indexOf("es") === 0 ? "es-ES" : "en-US";
  }

  function formatNumberToken(token, prevChar, nextChar, locale) {
    if (token.indexOf(",") !== -1) {
      return token;
    }
    const clean = token.replace(/,/g, "");
    const value = Number(clean);
    if (!Number.isFinite(value)) {
      return token;
    }
    // Avoid turning common year markers like "(2026)" into "(2,026)".
    if (
      prevChar === "(" &&
      nextChar === ")" &&
      Number.isInteger(value) &&
      value >= 1900 &&
      value <= 2100
    ) {
      return token;
    }
    const parts = clean.split(".");
    const sign = parts[0].startsWith("-") ? "-" : "";
    const integer = sign ? parts[0].slice(1) : parts[0];
    if (integer.length < 4) {
      return token;
    }
    const fractionDigits = parts[1] ? parts[1].length : 0;
    const formatted = new Intl.NumberFormat(locale, {
      useGrouping: true,
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits
    }).format(value);
    return formatted;
  }

  function formatText(text, locale) {
    const re = /-?\d{4,}(?:\.\d+)?/g;
    return String(text).replace(re, function (match, offset, full) {
      const prev = offset > 0 ? full[offset - 1] : "";
      const next = offset + match.length < full.length ? full[offset + match.length] : "";
      return formatNumberToken(match, prev, next, locale);
    });
  }

  function walkTextNodes(root, locale) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    const nodes = [];
    while (walker.nextNode()) {
      nodes.push(walker.currentNode);
    }
    for (let i = 0; i < nodes.length; i += 1) {
      const node = nodes[i];
      const nextValue = formatText(node.nodeValue || "", locale);
      if (nextValue !== node.nodeValue) {
        node.nodeValue = nextValue;
      }
    }
  }

  function formatResultNode(node, locale) {
    if (!(node instanceof Element)) {
      return;
    }
    walkTextNodes(node, locale);
  }

  function init() {
    const locale = currentLocale();
    const selectors = [".result", "#result", "#r"];
    const targets = [];
    for (let i = 0; i < selectors.length; i += 1) {
      const found = document.querySelectorAll(selectors[i]);
      for (let j = 0; j < found.length; j += 1) {
        if (!targets.includes(found[j])) {
          targets.push(found[j]);
        }
      }
    }

    for (let i = 0; i < targets.length; i += 1) {
      const target = targets[i];
      formatResultNode(target, locale);
      const observer = new MutationObserver(function () {
        formatResultNode(target, locale);
      });
      observer.observe(target, { childList: true, subtree: true, characterData: true });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
