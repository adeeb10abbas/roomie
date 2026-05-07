import type { User } from "@workspace/db";

type Lifestyle = {
  sleepSchedule?: "early_bird" | "night_owl" | "flexible";
  cleanliness?: number;
  noise?: "quiet" | "moderate" | "social";
  smoking?: boolean;
  drinking?: "never" | "socially" | "regularly";
  pets?: boolean;
  guests?: "rarely" | "sometimes" | "often";
  communicationStyle?: "direct" | "laid_back" | "reserved";
  [key: string]: unknown;
};

const NOISE_ORDER: Record<string, number> = {
  quiet: 0,
  moderate: 1,
  social: 2,
};

const DRINKING_ORDER: Record<string, number> = {
  never: 0,
  socially: 1,
  regularly: 2,
};

const GUESTS_ORDER: Record<string, number> = {
  rarely: 0,
  sometimes: 1,
  often: 2,
};

function ordinalScore(
  a: string | undefined,
  b: string | undefined,
  order: Record<string, number>,
  maxPts: number,
): number {
  if (a === undefined || b === undefined) return Math.round(maxPts * 0.5);
  if (a === b) return maxPts;
  const diff = Math.abs((order[a] ?? 0) - (order[b] ?? 0));
  if (diff === 1) return Math.round(maxPts * 0.5);
  return Math.round(maxPts * 0.1);
}

function sleepScore(
  a: string | undefined,
  b: string | undefined,
): number {
  if (a === undefined || b === undefined) return 9;
  if (a === b) return 18;
  if (a === "flexible" || b === "flexible") return 12;
  return 4;
}

function cleanlinessScore(a: number | undefined, b: number | undefined): number {
  if (a === undefined || b === undefined) return 8;
  const diff = Math.abs(a - b);
  if (diff === 0) return 15;
  if (diff === 1) return 10;
  if (diff === 2) return 5;
  return 0;
}

function budgetOverlapScore(
  aMin: number,
  aMax: number,
  bMin: number,
  bMax: number,
): number {
  const overlapMin = Math.max(aMin, bMin);
  const overlapMax = Math.min(aMax, bMax);
  if (overlapMin > overlapMax) return 0;
  const overlap = overlapMax - overlapMin;
  const rangeA = Math.max(aMax - aMin, 1);
  const rangeB = Math.max(bMax - bMin, 1);
  const ratio = overlap / Math.max(rangeA, rangeB);
  return Math.min(12, Math.round(ratio * 12));
}

/**
 * Compute a 0–100 match score between two users based on lifestyle compatibility.
 *
 * Weights (must sum to 100):
 *   sleepSchedule       18
 *   cleanliness         15
 *   noise               15
 *   smoking             12
 *   budgetOverlap       12
 *   drinking             8
 *   guests               8
 *   pets                 7
 *   communicationStyle   5
 *
 * Total = 100
 */
export function computeMatchScore(a: User, b: User): number {
  const la = (a.lifestyle ?? {}) as Lifestyle;
  const lb = (b.lifestyle ?? {}) as Lifestyle;

  const sleep = sleepScore(la.sleepSchedule, lb.sleepSchedule);

  const clean = cleanlinessScore(
    typeof la.cleanliness === "number" ? la.cleanliness : undefined,
    typeof lb.cleanliness === "number" ? lb.cleanliness : undefined,
  );

  const noise = ordinalScore(la.noise, lb.noise, NOISE_ORDER, 15);

  let smoking: number;
  if (la.smoking === undefined || lb.smoking === undefined) {
    smoking = 6;
  } else if (la.smoking === lb.smoking) {
    smoking = la.smoking ? 6 : 12;
  } else {
    smoking = 0;
  }

  const budget = budgetOverlapScore(a.budgetMin, a.budgetMax, b.budgetMin, b.budgetMax);

  const drinking = ordinalScore(la.drinking, lb.drinking, DRINKING_ORDER, 8);

  const guests = ordinalScore(la.guests, lb.guests, GUESTS_ORDER, 8);

  let pets: number;
  if (la.pets === undefined || lb.pets === undefined) {
    pets = 4;
  } else {
    pets = la.pets === lb.pets ? 7 : 3;
  }

  let comms: number;
  if (la.communicationStyle === undefined || lb.communicationStyle === undefined) {
    comms = 3;
  } else {
    comms = la.communicationStyle === lb.communicationStyle ? 5 : 2;
  }

  return sleep + clean + noise + smoking + budget + drinking + guests + pets + comms;
}

/**
 * Returns a per-category breakdown so clients can render "Why you match" details.
 * Each entry has a label, whether it's compatible, and the score earned vs max.
 */
export function computeMatchBreakdown(
  a: User,
  b: User,
): Array<{ category: string; compatible: boolean; earned: number; max: number }> {
  const la = (a.lifestyle ?? {}) as Lifestyle;
  const lb = (b.lifestyle ?? {}) as Lifestyle;

  const sleep = sleepScore(la.sleepSchedule, lb.sleepSchedule);
  const clean = cleanlinessScore(
    typeof la.cleanliness === "number" ? la.cleanliness : undefined,
    typeof lb.cleanliness === "number" ? lb.cleanliness : undefined,
  );
  const noise = ordinalScore(la.noise, lb.noise, NOISE_ORDER, 15);

  let smoking: number;
  if (la.smoking === undefined || lb.smoking === undefined) smoking = 6;
  else if (la.smoking === lb.smoking) smoking = la.smoking ? 6 : 12;
  else smoking = 0;

  const budget = budgetOverlapScore(a.budgetMin, a.budgetMax, b.budgetMin, b.budgetMax);
  const drinking = ordinalScore(la.drinking, lb.drinking, DRINKING_ORDER, 8);
  const guests = ordinalScore(la.guests, lb.guests, GUESTS_ORDER, 8);

  let pets: number;
  if (la.pets === undefined || lb.pets === undefined) pets = 4;
  else pets = la.pets === lb.pets ? 7 : 3;

  let comms: number;
  if (la.communicationStyle === undefined || lb.communicationStyle === undefined) comms = 3;
  else comms = la.communicationStyle === lb.communicationStyle ? 5 : 2;

  return [
    { category: "Sleep Schedule", compatible: sleep >= 12, earned: sleep, max: 18 },
    { category: "Cleanliness", compatible: clean >= 10, earned: clean, max: 15 },
    { category: "Noise Level", compatible: noise >= 8, earned: noise, max: 15 },
    { category: "Smoking", compatible: smoking >= 12, earned: smoking, max: 12 },
    { category: "Budget", compatible: budget >= 6, earned: budget, max: 12 },
    { category: "Drinking", compatible: drinking >= 4, earned: drinking, max: 8 },
    { category: "Guest Policy", compatible: guests >= 4, earned: guests, max: 8 },
    { category: "Pets", compatible: pets >= 7, earned: pets, max: 7 },
    { category: "Communication", compatible: comms >= 5, earned: comms, max: 5 },
  ];
}
