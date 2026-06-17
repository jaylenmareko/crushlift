// DOTS — pound-for-pound scoring. Converts a raw lift into a bodyweight-adjusted
// score so a small lifter and a big lifter can be compared fairly. One formula,
// no per-class lookup table. Used by the Open (cross-class) leaderboard + superfights.
//
// DOTS coefficient (men) is a 4th-order polynomial of bodyweight in kg:
//   coeff = 500 / (a + b·bw + c·bw² + d·bw³ + e·bw⁴)
// Score = lift(kg) · coeff. We work in lbs at the UI edge and convert here.

const LBS_PER_KG = 2.2046226218

// Men's DOTS coefficients (IPF 2020). A women's set exists; add when we collect sex.
const A = -307.75076
const B = 24.0900756
const C = -0.1918759221
const D = 0.0007391293
const E = -0.000001093

// Bodyweight outside [40, 210] kg is clamped — the polynomial is only fit in that range.
function clampKg(bwKg: number) {
  return Math.min(210, Math.max(40, bwKg))
}

/** DOTS coefficient for a given bodyweight (lbs). Higher = more credit per lb lifted. */
export function dotsCoefficient(bodyweightLbs: number): number {
  const bw = clampKg(bodyweightLbs / LBS_PER_KG)
  const denom = A + B * bw + C * bw ** 2 + D * bw ** 3 + E * bw ** 4
  return 500 / denom
}

/** Pound-for-pound score: a lift (lbs) adjusted for the lifter's bodyweight (lbs). */
export function pound4poundScore(liftLbs: number, bodyweightLbs: number): number {
  const liftKg = liftLbs / LBS_PER_KG
  return liftKg * dotsCoefficient(bodyweightLbs)
}

/** Rounded P4P score for display. */
export function p4pDisplay(liftLbs: number, bodyweightLbs: number): number {
  return Math.round(pound4poundScore(liftLbs, bodyweightLbs))
}

/**
 * Decide a cross-class (superfight) winner: most weight, but size-adjusted.
 * Returns 1 if A wins, -1 if B wins, 0 if dead even.
 */
export function superfightWinner(
  a: { liftLbs: number; bodyweightLbs: number },
  b: { liftLbs: number; bodyweightLbs: number },
): 1 | -1 | 0 {
  const sa = pound4poundScore(a.liftLbs, a.bodyweightLbs)
  const sb = pound4poundScore(b.liftLbs, b.bodyweightLbs)
  return sa > sb ? 1 : sa < sb ? -1 : 0
}
