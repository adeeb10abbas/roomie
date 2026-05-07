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

export interface UserProfile {
  id: string;
  name: string;
  age: number;
  gender: Gender;
  university: string;
  isVerified: boolean;
  bio: string;
  photoIndex: number;
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
}

export interface RoommateProfile extends UserProfile {
  matchScore: number;
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

export interface HousingListing {
  id: string;
  type: 'open_room' | 'forming_group';
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
  postedBy: RoommateProfile;
}

export interface FilterSettings {
  budgetMin: number;
  budgetMax: number;
  neighborhoods: string[];
  noiseLevel: string;
  smokingOk: boolean | null;
  sameGenderOnly: boolean;
}
