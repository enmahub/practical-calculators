/**
 * Fixed-rate amortizing loan: monthly payment on principal P at nominal annual rate
 * (compounded monthly). APR estimate: monthly IRR r such that PV(payments at r) = net proceeds.
 * Borrower convention: net cash from loan at closing = P - F (fees deducted from proceeds);
 * contract balance and payment computed on P at the stated note rate.
 */
(function (root) {
  "use strict";

  function monthlyNominalRate(annualNotePct) {
    return annualNotePct / 100 / 12;
  }

  function monthlyPayment(principal, annualNotePct, nMonths) {
    if (!Number.isFinite(principal) || principal <= 0 || !Number.isFinite(nMonths) || nMonths <= 0) {
      return NaN;
    }
    const r = monthlyNominalRate(annualNotePct);
    if (r === 0) {
      return principal / nMonths;
    }
    const pow = Math.pow(1 + r, nMonths);
    return (principal * r * pow) / (pow - 1);
  }

  function pvLevelMonthlyPayments(payment, rMonthly, nMonths) {
    if (!Number.isFinite(payment) || payment < 0 || !Number.isFinite(nMonths) || nMonths <= 0) {
      return NaN;
    }
    if (rMonthly <= 1e-15) {
      return payment * nMonths;
    }
    return (payment * (1 - Math.pow(1 + rMonthly, -nMonths))) / rMonthly;
  }

  /**
   * NPV at r (borrower): netProceeds - PV(payments). Zero when r is monthly IRR.
   */
  function npvMonthly(noteAnnualPct, principal, fees, years, rMonthly) {
    const n = Math.round(years * 12);
    const M = monthlyPayment(principal, noteAnnualPct, n);
    const net = principal - fees;
    return net - pvLevelMonthlyPayments(M, rMonthly, n);
  }

  /**
   * Actuarial APR (common consumer display): 12 * monthly IRR * 100.
   * Also returns effective annual rate (1+r)^12 - 1.
   */
  function solveApr(noteAnnualPct, principal, fees, years) {
    const out = {
      ok: false,
      error: "",
      monthlyPayment: NaN,
      aprActuarialPct: NaN,
      effectiveAnnualPct: NaN,
      noteAnnualPct: noteAnnualPct,
      nMonths: 0
    };

    if (!Number.isFinite(principal) || principal <= 0) {
      out.error = "Enter a valid loan principal.";
      return out;
    }
    if (!Number.isFinite(years) || years <= 0) {
      out.error = "Enter a valid loan term in years.";
      return out;
    }
    if (!Number.isFinite(noteAnnualPct) || noteAnnualPct < 0) {
      out.error = "Enter a valid note rate (0 or greater).";
      return out;
    }
    if (!Number.isFinite(fees) || fees < 0) {
      out.error = "Enter valid upfront fees (0 or greater).";
      return out;
    }
    if (fees >= principal) {
      out.error = "Upfront fees must be less than the loan principal for this model.";
      return out;
    }

    const n = Math.round(years * 12);
    if (n < 1) {
      out.error = "Loan term must be at least one month.";
      return out;
    }

    const M = monthlyPayment(principal, noteAnnualPct, n);
    if (!Number.isFinite(M) || M <= 0) {
      out.error = "Could not compute a monthly payment from the inputs.";
      return out;
    }

    out.monthlyPayment = M;
    out.nMonths = n;

    const noteRm = monthlyNominalRate(noteAnnualPct);
    const net = principal - fees;

    if (fees <= 1e-9) {
      out.ok = true;
      out.aprActuarialPct = noteAnnualPct;
      out.effectiveAnnualPct = (Math.pow(1 + noteRm, 12) - 1) * 100;
      return out;
    }

    const f = function (r) {
      return net - pvLevelMonthlyPayments(M, r, n);
    };

    let lo = noteRm;
    let fLo = f(lo);
    if (fLo >= 0) {
      out.error = "Internal: expected negative NPV at note rate when fees are positive.";
      return out;
    }

    let hi = noteRm;
    let fHi = fLo;
    let expanded = 0;
    while (fHi <= 0 && expanded < 80) {
      hi = Math.min(hi * 1.12 + 1e-7, 0.49);
      fHi = f(hi);
      expanded += 1;
    }
    if (fHi <= 0) {
      out.error = "Could not bracket a solution (try smaller fees or a longer term).";
      return out;
    }

    for (let iter = 0; iter < 100; iter += 1) {
      const mid = (lo + hi) / 2;
      const fm = f(mid);
      if (Math.abs(fm) < 1e-10 * Math.max(1, Math.abs(net))) {
        lo = hi = mid;
        break;
      }
      if (fm <= 0) {
        lo = mid;
      } else {
        hi = mid;
      }
    }

    const rStar = (lo + hi) / 2;
    const residual = Math.abs(f(rStar));
    if (residual > 1e-6 * Math.max(1, Math.abs(net))) {
      out.error = "Could not solve APR to sufficient accuracy.";
      return out;
    }

    out.ok = true;
    out.aprActuarialPct = rStar * 12 * 100;
    out.effectiveAnnualPct = (Math.pow(1 + rStar, 12) - 1) * 100;
    return out;
  }

  /**
   * Implied nominal annual rate (compounded monthly) on a fixed amortizing loan:
   * find monthly rate r such that PV(level payment M at r for n months) = principal P.
   */
  function solveImpliedAnnualRate(principal, monthlyPayment, years) {
    const out = {
      ok: false,
      error: "",
      nominalAnnualPct: NaN,
      effectiveAnnualPct: NaN,
      nMonths: 0
    };

    if (!Number.isFinite(principal) || principal <= 0) {
      out.error = "Enter a valid loan principal.";
      return out;
    }
    if (!Number.isFinite(monthlyPayment) || monthlyPayment <= 0) {
      out.error = "Enter a valid monthly payment.";
      return out;
    }
    if (!Number.isFinite(years) || years <= 0) {
      out.error = "Enter a valid loan term in years.";
      return out;
    }

    const n = Math.round(years * 12);
    if (n < 1) {
      out.error = "Loan term must be at least one month.";
      return out;
    }

    out.nMonths = n;

    const maxPv = monthlyPayment * n;
    if (principal > maxPv + 1e-6 * Math.max(1, principal)) {
      out.error =
        "Monthly payment is too low to amortize this principal over the term at any nonnegative rate.";
      return out;
    }

    function f(rm) {
      return pvLevelMonthlyPayments(monthlyPayment, rm, n) - principal;
    }

    const f0 = f(0);
    if (Math.abs(f0) <= 1e-9 * Math.max(1, principal)) {
      out.ok = true;
      out.nominalAnnualPct = 0;
      out.effectiveAnnualPct = 0;
      return out;
    }

    if (f0 < 0) {
      out.error = "Could not solve (unexpected payment vs principal relationship).";
      return out;
    }

    let lo = 0;
    let hi = 1e-8;
    let fHi = f(hi);
    let expanded = 0;
    while (fHi > 0 && expanded < 120) {
      hi = Math.min(hi * 1.35 + 1e-8, 0.49);
      fHi = f(hi);
      expanded += 1;
    }
    if (fHi > 0) {
      out.error = "Could not bracket an implied interest rate.";
      return out;
    }

    for (let iter = 0; iter < 100; iter += 1) {
      const mid = (lo + hi) / 2;
      const fm = f(mid);
      if (Math.abs(fm) < 1e-10 * Math.max(1, principal)) {
        lo = hi = mid;
        break;
      }
      if (fm > 0) {
        lo = mid;
      } else {
        hi = mid;
      }
    }

    const rStar = (lo + hi) / 2;
    const residual = Math.abs(f(rStar));
    if (residual > 1e-6 * Math.max(1, principal)) {
      out.error = "Could not solve implied rate to sufficient accuracy.";
      return out;
    }

    out.ok = true;
    out.nominalAnnualPct = rStar * 12 * 100;
    out.effectiveAnnualPct = (Math.pow(1 + rStar, 12) - 1) * 100;
    return out;
  }

  const api = {
    monthlyPayment,
    pvLevelMonthlyPayments,
    npvMonthly,
    solveApr,
    solveImpliedAnnualRate
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  root.AprMath = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
