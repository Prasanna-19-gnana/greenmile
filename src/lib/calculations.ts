/**
 * GreenMile — Transport Comparison & Reward Calculation Utilities
 *
 * Contains emission factors, cost tables, speed data, and functions
 * that power the trip-comparison and reward-points features.
 */

// ── Constants ────────────────────────────────────────────────────────

/** Grams of CO₂ emitted per kilometre for each transport mode */
export const EMISSION_FACTORS: Record<string, number> = {
  car: 120,   // g CO₂/km
  bike: 70,   // g CO₂/km
  bus: 80,    // g CO₂/km
  metro: 30,  // g CO₂/km
  train: 30,  // g CO₂/km
  cycle: 0,   // g CO₂/km
  walk: 0,    // g CO₂/km
};

/** Cost in ₹ per kilometre for each transport mode */
export const COST_PER_KM: Record<string, number> = {
  car: 12,  // ₹/km
  bike: 5,  // ₹/km
  bus: 2,   // ₹/km
  metro: 3, // ₹/km
  train: 2, // ₹/km
  cycle: 0, // ₹/km
  walk: 0,  // ₹/km
};

/** Average speed in km/h (urban Indian metro context) */
export const SPEED_KMH: Record<string, number> = {
  car: 30,   // km/h
  bike: 35,  // km/h
  bus: 25,   // km/h
  metro: 45, // km/h
  train: 40, // km/h
  cycle: 15, // km/h
  walk: 5,   // km/h
};

/** Human-readable labels */
export const MODE_LABELS: Record<string, string> = {
  car: 'Car',
  bike: 'Bike',
  bus: 'Bus',
  metro: 'Metro',
  train: 'Train',
  cycle: 'Cycle',
  walk: 'Walk',
};

// ── Types ────────────────────────────────────────────────────────────

export interface ModeComparison {
  mode: string;
  label: string;
  co2: number;        // kg CO₂
  cost: number;       // ₹
  time: number;       // minutes
  greenScore: number; // 0-100 (100 = zero emissions)
  co2Saved: number;   // kg saved vs car
  costSaved: number;  // ₹ saved vs car
}

// ── Functions ────────────────────────────────────────────────────────

/**
 * For a given distance (km), return a comparison object for every
 * supported transport mode.  All savings are relative to driving a car.
 */
export function calculateComparison(distance: number): ModeComparison[] {
  const modes = Object.keys(EMISSION_FACTORS);

  // Pre-compute car baseline values
  const carCo2 = (distance * EMISSION_FACTORS.car) / 1000;   // kg
  const carCost = distance * COST_PER_KM.car;                 // ₹

  return modes.map((mode) => {
    const co2 = (distance * EMISSION_FACTORS[mode]) / 1000;    // kg
    const cost = distance * COST_PER_KM[mode];                  // ₹
    const time = (distance / SPEED_KMH[mode]) * 60;             // minutes
    const greenScore = 100 - (EMISSION_FACTORS[mode] / 120) * 100;

    return {
      mode,
      label: MODE_LABELS[mode],
      co2: Math.round(co2 * 100) / 100,
      cost: Math.round(cost * 100) / 100,
      time: Math.round(time),
      greenScore: Math.round(greenScore),
      co2Saved: Math.round((carCo2 - co2) * 100) / 100,
      costSaved: Math.round((carCost - cost) * 100) / 100,
    };
  });
}

/**
 * Convert CO₂ savings (kg) into GreenMile reward points.
 * Rate: 1 kg CO₂ saved = 10 points.
 */
export function calculateReward(co2SavedKg: number): number {
  return Math.round(co2SavedKg * 10);
}
