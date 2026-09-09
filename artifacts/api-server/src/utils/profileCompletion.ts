import type { User } from "@workspace/db";

type Lifestyle = {
  sleepSchedule?: string;
  noise?: string;
  cleanliness?: number;
  smoking?: boolean;
  drinking?: string;
  pets?: boolean;
  guests?: string;
  communicationStyle?: string;
  [key: string]: unknown;
};

const WEIGHTS = {
  basics: 15,
  university: 10,
  budget: 10,
  moveInDate: 5,
  neighborhoods: 10,
  lifestyleCore: 15,
  lifestyleExtra: 10,
  bio: 10,
  photo: 10,
  verified: 5,
};

export function computeProfileCompletion(u: User): number {
  const lf = (u.lifestyle ?? {}) as Lifestyle;
  let score = 0;

  if (u.name?.trim() && u.age > 0 && u.gender) score += WEIGHTS.basics;
  if (u.university?.trim()) score += WEIGHTS.university;
  if (u.budgetMin > 0 && u.budgetMax > 0 && u.budgetMin < u.budgetMax) score += WEIGHTS.budget;
  if (u.moveInDate?.trim()) score += WEIGHTS.moveInDate;
  if (Array.isArray(u.neighborhoods) && u.neighborhoods.length > 0) score += WEIGHTS.neighborhoods;
  if (lf.sleepSchedule && lf.noise && typeof lf.cleanliness === "number") score += WEIGHTS.lifestyleCore;
  if (
    typeof lf.smoking === "boolean" &&
    lf.drinking &&
    typeof lf.pets === "boolean" &&
    lf.guests
  )
    score += WEIGHTS.lifestyleExtra;
  if (u.bio?.trim().length >= 60) score += WEIGHTS.bio;
  if (u.photoUrl?.trim()) score += WEIGHTS.photo;
  if (u.isVerified) score += WEIGHTS.verified;

  return Math.min(100, score);
}
