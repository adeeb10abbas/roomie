export type Gender = 'male' | 'female' | 'non_binary' | 'prefer_not_to_say';
export type SleepSchedule = 'early_bird' | 'night_owl' | 'flexible';
export type NoiseLevel = 'quiet' | 'moderate' | 'social';
export type DrinkingHabit = 'never' | 'socially' | 'regularly';
export type GuestFrequency = 'rarely' | 'sometimes' | 'often';
export type CommunicationStyle = 'direct' | 'laid_back' | 'reserved';
export type CleanlinessLevel = 1 | 2 | 3 | 4 | 5;

export interface LifestylePrefs {
  sleepSchedule: SleepSchedule;
  cleanliness: CleanlinessLevel;
  noise: NoiseLevel;
  smoking: boolean;
  drinking: DrinkingHabit;
  pets: boolean;
  guests: GuestFrequency;
  communicationStyle: CommunicationStyle;
}

export interface PrivacySettings {
  showAge: boolean;
  showUniversity: boolean;
  showOccupation: boolean;
  hideFromSearch: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  age: number;
  gender: Gender;
  university: string;
  isVerified: boolean;
  eduEmail?: string | null;
  eduDomain?: string | null;
  bio: string;
  photoIndex: number;
  photoUrl?: string | null;
  profileCompletion?: number;
  occupation: string;
  location: string;
  neighborhoods: string[];
  budgetMin: number;
  budgetMax: number;
  moveInDate: string;
  lifestyle: LifestylePrefs;
  sameGenderOnly: boolean;
  language: string;
  religion: string;
  prompts: { question: string; answer: string }[];
  tags: string[];
  badges: string[];
  notificationsEnabled?: boolean;
  privacy?: PrivacySettings;
}

export interface MatchBreakdownItem {
  category: string;
  compatible: boolean;
  earned: number;
  max: number;
}

export interface RoommateProfile extends UserProfile {
  matchScore: number;
  matchBreakdown?: MatchBreakdownItem[];
}

export interface SwipeAction {
  profileId: string;
  action: 'like' | 'skip' | 'shortlist';
}

export interface Match {
  id: string;
  profile: RoommateProfile;
  matchedAt: string;
  lastMessage: string;
  lastMessageTime: string;
  unread: number;
}

export interface Message {
  id: string;
  matchId: string;
  senderId: string;
  text: string;
  timestamp: string;
}

export type HousingType = 'permanent_room' | 'sublet' | 'forming_group';
export type HousingStatus = 'active' | 'filled' | 'withdrawn';

export interface HousingMember {
  id: string;
  name: string;
  photoIndex: number;
  photoUrl?: string | null;
  isVerified: boolean;
  eduDomain?: string | null;
}

export interface HousingListing {
  id: string;
  type: HousingType;
  title: string;
  address: string;
  neighborhood: string;
  rent: number;
  moveInDate: string;
  photoIndex: number;
  description: string;
  currentRoommates: number;
  maxRoommates: number;
  rules: string[];
  tags: string[];
  amenities: string[];
  sameGenderOnly: boolean;
  status: HousingStatus;
  requireRoommateReview: boolean;
  subletStart?: string | null;
  subletEnd?: string | null;
  currentMembers?: HousingMember[];
  postedBy: RoommateProfile;
  pendingRequestCount?: number;
}

export interface JoinRequest {
  id: string;
  listingId: string;
  requester: RoommateProfile;
  message?: string;
  status: 'pending' | 'approved' | 'denied' | 'withdrawn';
  createdAt: string;
  decidedAt?: string | null;
}

export interface FilterSettings {
  budgetMin: number;
  budgetMax: number;
  neighborhoods: string[];
  noiseLevel: string;
  smokingOk: boolean | null;
  sameGenderOnly: boolean;
  moveInDateFrom?: string;
  moveInDateTo?: string;
  cleanliness?: number | null;
  drinking?: string;
  guests?: string;
  pets?: boolean | null;
}

export interface VerificationStatus {
  isVerified: boolean;
  eduEmail?: string | null;
  eduDomain?: string | null;
  pendingRequest: boolean;
}

export interface BlockedUser {
  id: string;
  name: string;
  createdAt: string;
}
