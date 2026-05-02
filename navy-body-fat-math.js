/**
 * U.S. Navy body fat estimation from circumference measurements (log10 formulation).
 * Measurements must follow Navy tape procedures; results are screening estimates only.
 */
(function (root) {
  "use strict";

  function log10(x) {
    return Math.log(x) / Math.LN10;
  }

  /**
   * @param {object} o
   * @param {'male'|'female'} o.sex
   * @param {number} o.heightIn - total standing height (in)
   * @param {number} o.neckIn - neck below larynx (in)
   * @param {number} o.waistIn - men: at navel; women: natural waist narrowest (in)
   * @param {number} [o.hipIn] - women only, widest part (in)
   */
  function estimate(o) {
    var sex = o.sex === "female" ? "female" : "male";
    var h = Number(o.heightIn);
    var neck = Number(o.neckIn);
    var waist = Number(o.waistIn);
    var hip = Number(o.hipIn);

    if (!Number.isFinite(h) || h <= 0 || !Number.isFinite(neck) || neck <= 0 || !Number.isFinite(waist) || waist <= 0) {
      return { ok: false, error: "Enter positive height, neck, and waist measurements." };
    }

    if (sex === "male") {
      if (waist <= neck) {
        return {
          ok: false,
          error: "For males, waist must be greater than neck (check tape placement). Typical Navy tapes: waist at the navel."
        };
      }
      var pct =
        86.010 * log10(waist - neck) - 70.041 * log10(h) + 36.76;
      return { ok: true, bodyFatPct: pct, sex: "male" };
    }

    if (!Number.isFinite(hip) || hip <= 0) {
      return { ok: false, error: "For females, enter hip circumference at the widest point." };
    }
    if (waist + hip <= neck) {
      return {
        ok: false,
        error: "For females, waist plus hip must exceed neck—please verify measurements."
      };
    }
    var pctF =
      163.205 * log10(waist + hip - neck) - 97.684 * log10(h) - 78.387;
    return { ok: true, bodyFatPct: pctF, sex: "female" };
  }

  root.NavyBodyFatMath = {
    estimate: estimate,
    log10: log10
  };
})(typeof globalThis !== "undefined" ? globalThis : window);
