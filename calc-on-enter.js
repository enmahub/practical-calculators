/**
 * Press Enter in calculator inputs to run the same action as the main Calculate/Convert button.
 * Skips site search, real HTML forms (e.g. contact), and non-field controls.
 */
(function () {
  "use strict";

  function findPrimaryCalcButton(card) {
    if (!card) {
      return null;
    }
    const buttons = card.querySelectorAll("button[onclick]");
    for (let i = 0; i < buttons.length; i++) {
      const btn = buttons[i];
      if (btn.getAttribute("type") === "submit") {
        continue;
      }
      const oc = btn.getAttribute("onclick") || "";
      if (!/\(/.test(oc)) {
        continue;
      }
      if (/calc|convert|calcular|payment|hourly|paycheck|conv/i.test(oc)) {
        return btn;
      }
    }
    return null;
  }

  document.addEventListener(
    "keydown",
    function (e) {
      if (e.key !== "Enter") {
        return;
      }
      const t = e.target;
      if (!t || typeof t.closest !== "function") {
        return;
      }
      if (t.closest(".site-search")) {
        return;
      }
      if (t.closest("form")) {
        return;
      }

      const tag = (t.tagName || "").toUpperCase();
      if (tag !== "INPUT" && tag !== "SELECT") {
        return;
      }

      if (tag === "INPUT") {
        const type = (t.getAttribute("type") || "text").toLowerCase();
        if (
          type === "button" ||
          type === "submit" ||
          type === "reset" ||
          type === "checkbox" ||
          type === "radio" ||
          type === "file" ||
          type === "hidden"
        ) {
          return;
        }
      }

      const card = t.closest(".wrap .card") || t.closest(".card");
      if (!card) {
        return;
      }

      const btn = findPrimaryCalcButton(card);
      if (!btn) {
        return;
      }

      e.preventDefault();
      btn.click();
    },
    true
  );
})();
