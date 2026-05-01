"use strict";

const assert = require("assert");
const path = require("path");
const {
  monthlyPayment,
  pvLevelMonthlyPayments,
  npvMonthly,
  solveApr,
  solveImpliedAnnualRate
} = require(path.join(__dirname, "..", "apr-math.js"));

function approxEqual(a, b, eps) {
  return Math.abs(a - b) <= eps * Math.max(1, Math.abs(b));
}

// Zero fees: APR equals note rate (actuarial convention)
{
  const note = 6.5;
  const P = 200000;
  const n = 360;
  const M = monthlyPayment(P, note, n);
  assert.ok(Number.isFinite(M) && M > 0);
  const pv = pvLevelMonthlyPayments(M, note / 100 / 12, n);
  assert.ok(approxEqual(pv, P, 1e-4), "PV at note rate should equal principal");
  const r = solveApr(note, P, 0, 30);
  assert.strictEqual(r.ok, true);
  assert.ok(approxEqual(r.aprActuarialPct, note, 1e-6), "APR should match note when fees are 0");
}

// Positive fees => APR > note
{
  const r = solveApr(6.5, 200000, 4000, 30);
  assert.strictEqual(r.ok, true);
  assert.ok(r.aprActuarialPct > 6.5 + 1e-6);
  assert.ok(r.monthlyPayment > 0);
}

// NPV at solved rate ~ 0
{
  const note = 5.875;
  const P = 320000;
  const F = 6500;
  const years = 30;
  const r = solveApr(note, P, F, years);
  assert.strictEqual(r.ok, true);
  const rm = (r.aprActuarialPct / 100) * (1 / 12);
  const npv = npvMonthly(note, P, F, years, rm);
  assert.ok(Math.abs(npv) < 0.02, "Residual NPV should be tiny, got " + npv);
}

// Errors
{
  assert.strictEqual(solveApr(6, 100000, 100000, 30).ok, false);
  assert.strictEqual(solveApr(6, 0, 0, 30).ok, false);
}

// Inverse: payment + principal + term → implied nominal rate
{
  const note = 6.5;
  const P = 200000;
  const years = 30;
  const M = monthlyPayment(P, note, Math.round(years * 12));
  const inv = solveImpliedAnnualRate(P, M, years);
  assert.strictEqual(inv.ok, true);
  assert.ok(approxEqual(inv.nominalAnnualPct, note, 1e-4), "implied rate should match note");
}

// Impossible payment
{
  const inv = solveImpliedAnnualRate(200000, 100, 30);
  assert.strictEqual(inv.ok, false);
}

console.log("apr-math tests passed.");
