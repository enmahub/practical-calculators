/**
 * Rough calories burned from walking steps using MET × kg × hours,
 * with distance from step count × stride and duration from distance ÷ assumed speed.
 * Educational estimate only—not metabolic testing or clinical guidance.
 */
(function (root) {
  "use strict";

  var KCAL_PER_LB_RULE = 3500;
  var KCAL_PER_KG_RULE = 7700;

  /** Pace tier: physiological intensity (MET) paired with speed used only for time-from-distance. */
  var PACE = {
    slow: { met: 2.8, speedKmh: 3.2 },
    moderate: { met: 3.5, speedKmh: 4.5 },
    brisk: { met: 5.0, speedKmh: 5.6 },
    fast: { met: 6.5, speedKmh: 6.5 }
  };

  /** Multiplicative bump on MET for sustained incline / uneven terrain. */
  var TERRAIN_MET_FACTOR = {
    flat: 1,
    light: 1.06,
    hilly: 1.14,
    steep: 1.24
  };

  function weightToKg(w, unit) {
    if (unit === "lb") {
      return w * 0.45359237;
    }
    return w;
  }

  /**
   * Walking stride (meters): ~41.3% of height in meters when height known;
   * otherwise ~76 cm typical adult default.
   */
  function strideMeters(heightCm) {
    if (Number.isFinite(heightCm) && heightCm >= 120 && heightCm <= 240) {
      return (heightCm * 0.413) / 100;
    }
    return 0.762;
  }

  /**
   * @param {object} raw
   * @param {number} raw.steps
   * @param {number} raw.weight
   * @param {string} [raw.weightUnit] "kg" | "lb"
   * @param {number} [raw.heightCm]
   * @param {string} [raw.paceKey]
   * @param {string} [raw.terrainKey]
   * @param {boolean} [raw.dailyHabit]
   */
  function estimate(raw) {
    var steps = Number(raw.steps);
    var weight = Number(raw.weight);
    var unit = raw.weightUnit === "lb" ? "lb" : "kg";
    var heightCm = raw.heightCm;
    var paceKey = raw.paceKey || "moderate";
    var terrainKey = raw.terrainKey || "flat";
    var dailyHabit = !!raw.dailyHabit;

    if (!Number.isFinite(steps) || steps <= 0 || steps > 200000) {
      return {
        ok: false,
        error: "Enter a positive step count (for single outings or one day; most people stay under ~100,000)."
      };
    }
    if (!Number.isFinite(weight) || weight <= 0) {
      return { ok: false, error: "Enter a positive body weight." };
    }
    if (unit === "kg" && weight > 350) {
      return { ok: false, error: "Weight looks too large for kg—switch units or check your entry." };
    }
    if (unit === "lb" && weight > 800) {
      return { ok: false, error: "Weight looks too large for lb—switch units or check your entry." };
    }

    var wKg = weightToKg(weight, unit);
    var stride = strideMeters(heightCm);
    var pace = PACE[paceKey] || PACE.moderate;
    var terrainFactor =
      TERRAIN_MET_FACTOR[terrainKey] != null ? TERRAIN_MET_FACTOR[terrainKey] : 1;

    var distM = steps * stride;
    var distKm = distM / 1000;
    var distMi = distKm * 0.621371;

    var hours = distKm / pace.speedKmh;
    if (!Number.isFinite(hours) || hours <= 0) {
      return { ok: false, error: "Could not estimate walking time from distance and pace." };
    }

    var met = pace.met * terrainFactor;
    var kcal = met * wKg * hours;

    var result = {
      ok: true,
      calories: kcal,
      distanceKm: distKm,
      distanceMi: distMi,
      durationHours: hours,
      strideMeters: stride,
      metEffective: met,
      paceKeyUsed: paceKey in PACE ? paceKey : "moderate",
      terrainKeyUsed: terrainKey in TERRAIN_MET_FACTOR ? terrainKey : "flat"
    };

    if (dailyHabit) {
      result.weeklyCalories = kcal * 7;
      result.monthlyCalories30 = kcal * 30;
      result.roughLbPerWeekIllustrative = (kcal * 7) / KCAL_PER_LB_RULE;
      result.roughKgPerWeekIllustrative = (kcal * 7) / KCAL_PER_KG_RULE;
    }

    return result;
  }

  root.StepsCaloriesMath = {
    estimate: estimate
  };
})(typeof globalThis !== "undefined" ? globalThis : window);
