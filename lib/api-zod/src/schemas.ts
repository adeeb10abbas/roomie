import { z } from "zod/v4";

export const LifestylePrefsSchema = z
  .object({
    sleepSchedule: z.enum(["early_bird", "night_owl", "flexible"]),
    cleanliness: z.union([
      z.literal(1),
      z.literal(2),
      z.literal(3),
      z.literal(4),
      z.literal(5),
    ]),
    noise: z.enum(["quiet", "moderate", "social"]),
    smoking: z.boolean(),
    drinking: z.enum(["never", "socially", "regularly"]),
    pets: z.boolean(),
    guests: z.enum(["rarely", "sometimes", "often"]),
    communicationStyle: z.enum(["direct", "laid_back", "reserved"]),
  })
  .partial()
  .passthrough();

export const PromptSchema = z.object({
  question: z.string(),
  answer: z.string(),
});

export const UserProfileSchema = z.object({
  id: z.string(),
  name: z.string(),
  age: z.number().int(),
  gender: z.enum(["male", "female", "non_binary", "prefer_not_to_say"]),
  university: z.string(),
  isVerified: z.boolean(),
  bio: z.string(),
  photoIndex: z.number().int(),
  occupation: z.string(),
  location: z.string(),
  neighborhoods: z.array(z.string()),
  budgetMin: z.number().int(),
  budgetMax: z.number().int(),
  moveInDate: z.string(),
  lifestyle: LifestylePrefsSchema,
  sameGenderOnly: z.boolean(),
  language: z.string(),
  religion: z.string(),
  prompts: z.array(PromptSchema),
  tags: z.array(z.string()),
  badges: z.array(z.string()),
  matchScore: z.number().int(),
  createdAt: z.string().optional(),
});

export const RoommateProfileSchema = UserProfileSchema;

export const MatchSchema = z.object({
  id: z.string(),
  profile: RoommateProfileSchema,
  matchedAt: z.string(),
  lastMessage: z.string(),
  lastMessageTime: z.string(),
  unread: z.number().int(),
});

export const MessageSchema = z.object({
  id: z.string(),
  matchId: z.string(),
  senderId: z.string(),
  text: z.string(),
  timestamp: z.string(),
  isRead: z.boolean().optional(),
});

export const HousingListingSchema = z.object({
  id: z.string(),
  type: z.enum(["open_room", "forming_group"]),
  title: z.string(),
  address: z.string(),
  neighborhood: z.string(),
  rent: z.number().int(),
  moveInDate: z.string(),
  photoIndex: z.number().int(),
  description: z.string(),
  currentRoommates: z.number().int(),
  maxRoommates: z.number().int(),
  rules: z.array(z.string()),
  tags: z.array(z.string()),
  amenities: z.array(z.string()),
  sameGenderOnly: z.boolean(),
  postedBy: RoommateProfileSchema,
});

export const FilterSettingsSchema = z.object({
  budgetMin: z.number().int().optional(),
  budgetMax: z.number().int().optional(),
  noiseLevel: z.string().optional(),
  smokingOk: z.boolean().nullable().optional(),
  sameGenderOnly: z.boolean().optional(),
  shortlistedOnly: z.boolean().optional(),
});

export const SwipeRequestSchema = z.object({
  profileId: z.string(),
  action: z.enum(["like", "skip", "shortlist"]),
});

export const SwipeResponseSchema = z.object({
  matched: z.boolean(),
  matchId: z.string().optional(),
});

export const SendMessageRequestSchema = z.object({
  text: z.string().min(1),
});

export const UpsertProfileSchema = UserProfileSchema.omit({
  id: true,
  createdAt: true,
}).partial();

export const ProfilesResponseSchema = z.object({
  profiles: z.array(RoommateProfileSchema),
  total: z.number().int(),
  page: z.number().int(),
  limit: z.number().int(),
  totalPages: z.number().int(),
});

export const MatchesResponseSchema = z.object({
  matches: z.array(MatchSchema),
});

export const MessagesResponseSchema = z.object({
  messages: z.array(MessageSchema),
});

export const HousingResponseSchema = z.object({
  listings: z.array(HousingListingSchema),
});
