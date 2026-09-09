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

export const MatchBreakdownItemSchema = z.object({
  category: z.string(),
  compatible: z.boolean(),
  earned: z.number().int(),
  max: z.number().int(),
});

export const PrivacySettingsSchema = z.object({
  showAge: z.boolean(),
  showUniversity: z.boolean(),
  showOccupation: z.boolean(),
  hideFromSearch: z.boolean(),
});

export const UserProfileSchema = z.object({
  id: z.string(),
  name: z.string(),
  age: z.number().int(),
  gender: z.enum(["male", "female", "non_binary", "prefer_not_to_say"]),
  university: z.string(),
  isVerified: z.boolean(),
  eduEmail: z.string().nullable().optional(),
  eduDomain: z.string().nullable().optional(),
  bio: z.string(),
  photoIndex: z.number().int(),
  photoUrl: z.string().optional(),
  profileCompletion: z.number().int().optional(),
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
  matchBreakdown: z.array(MatchBreakdownItemSchema).optional(),
  notificationsEnabled: z.boolean().optional(),
  privacy: PrivacySettingsSchema.optional(),
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

export const HousingMemberSchema = z.object({
  id: z.string(),
  name: z.string(),
  photoIndex: z.number().int(),
  photoUrl: z.string().optional(),
  isVerified: z.boolean(),
  eduDomain: z.string().nullable().optional(),
});

export const HousingListingSchema = z.object({
  id: z.string(),
  type: z.enum(["permanent_room", "sublet", "forming_group", "open_room"]),
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
  status: z.enum(["active", "filled", "withdrawn"]).optional(),
  requireRoommateReview: z.boolean().optional(),
  subletStart: z.string().nullable().optional(),
  subletEnd: z.string().nullable().optional(),
  currentMembers: z.array(HousingMemberSchema).optional(),
  postedBy: RoommateProfileSchema,
  pendingRequestCount: z.number().int().optional(),
});

export const CreateHousingListingSchema = z.object({
  type: z.enum(["permanent_room", "sublet", "forming_group"]),
  title: z.string().min(3).max(120),
  address: z.string().default(""),
  neighborhood: z.string().min(2),
  rent: z.number().int().positive(),
  moveInDate: z.string(),
  description: z.string().max(2000).default(""),
  maxRoommates: z.number().int().min(1).max(10),
  rules: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  amenities: z.array(z.string()).default([]),
  sameGenderOnly: z.boolean().default(false),
  subletStart: z.string().optional(),
  subletEnd: z.string().optional(),
  requireRoommateReview: z.boolean().default(true),
  photoIndex: z.number().int().min(0).max(4).default(0),
});

export const JoinRequestSchema = z.object({
  id: z.string(),
  listingId: z.string(),
  requester: RoommateProfileSchema,
  message: z.string(),
  status: z.enum(["pending", "approved", "denied", "withdrawn"]),
  createdAt: z.string(),
  decidedAt: z.string().nullable(),
});

export const JoinRequestsResponseSchema = z.object({ requests: z.array(JoinRequestSchema) });
export const CreateJoinRequestSchema = z.object({ message: z.string().max(500).optional() });

export const FilterSettingsSchema = z.object({
  budgetMin: z.number().int().optional(),
  budgetMax: z.number().int().optional(),
  noiseLevel: z.string().optional(),
  smokingOk: z.boolean().nullable().optional(),
  sameGenderOnly: z.boolean().optional(),
  shortlistedOnly: z.boolean().optional(),
  moveInDateFrom: z.string().optional(),
  moveInDateTo: z.string().optional(),
  neighborhoods: z.array(z.string()).optional(),
  cleanliness: z.number().int().min(1).max(5).optional(),
  drinking: z.string().optional(),
  guests: z.string().optional(),
  pets: z.boolean().nullable().optional(),
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

export const RequestVerificationSchema = z.object({ eduEmail: z.email() });
export const ConfirmVerificationSchema = z.object({ code: z.string().regex(/^\d{6}$/) });
export const VerificationStatusSchema = z.object({
  isVerified: z.boolean(),
  eduEmail: z.string().nullable(),
  eduDomain: z.string().nullable(),
  pendingRequest: z.boolean(),
});

export const CreateBlockSchema = z.object({
  blockedId: z.string(),
  reason: z.string().max(500).optional(),
});

export const CreateReportSchema = z.object({
  reportedId: z.string(),
  matchId: z.string().optional(),
  category: z.enum(["harassment", "spam", "fake_profile", "inappropriate", "safety", "other"]),
  description: z.string().max(2000).default(""),
});

export const BlockedUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  createdAt: z.string(),
});

export const BlockedUsersResponseSchema = z.object({ blocked: z.array(BlockedUserSchema) });

export const BioGenerationResponseSchema = z.object({ bio: z.string() });

export const DeleteAccountSchema = z.object({ confirmation: z.literal("DELETE") });

export const CreateFeedbackSchema = z.object({
  category: z.enum(["bug", "feature", "general", "other"]),
  body: z.string().min(1).max(5000),
  appVersion: z.string().optional(),
});

export const PhotoUploadResponseSchema = z.object({ photoUrl: z.string() });
