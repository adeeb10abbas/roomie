import { z } from "zod/v4";
export declare const LifestylePrefsSchema: z.ZodObject<{
    sleepSchedule: z.ZodOptional<z.ZodEnum<{
        early_bird: "early_bird";
        night_owl: "night_owl";
        flexible: "flexible";
    }>>;
    cleanliness: z.ZodOptional<z.ZodUnion<readonly [z.ZodLiteral<1>, z.ZodLiteral<2>, z.ZodLiteral<3>, z.ZodLiteral<4>, z.ZodLiteral<5>]>>;
    noise: z.ZodOptional<z.ZodEnum<{
        quiet: "quiet";
        moderate: "moderate";
        social: "social";
    }>>;
    smoking: z.ZodOptional<z.ZodBoolean>;
    drinking: z.ZodOptional<z.ZodEnum<{
        never: "never";
        socially: "socially";
        regularly: "regularly";
    }>>;
    pets: z.ZodOptional<z.ZodBoolean>;
    guests: z.ZodOptional<z.ZodEnum<{
        rarely: "rarely";
        sometimes: "sometimes";
        often: "often";
    }>>;
    communicationStyle: z.ZodOptional<z.ZodEnum<{
        direct: "direct";
        laid_back: "laid_back";
        reserved: "reserved";
    }>>;
}, z.core.$loose>;
export declare const PromptSchema: z.ZodObject<{
    question: z.ZodString;
    answer: z.ZodString;
}, z.core.$strip>;
export declare const MatchBreakdownItemSchema: z.ZodObject<{
    category: z.ZodString;
    compatible: z.ZodBoolean;
    earned: z.ZodNumber;
    max: z.ZodNumber;
}, z.core.$strip>;
export declare const PrivacySettingsSchema: z.ZodObject<{
    showAge: z.ZodBoolean;
    showUniversity: z.ZodBoolean;
    showOccupation: z.ZodBoolean;
    hideFromSearch: z.ZodBoolean;
}, z.core.$strip>;
export declare const UserProfileSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    age: z.ZodNumber;
    gender: z.ZodEnum<{
        male: "male";
        female: "female";
        non_binary: "non_binary";
        prefer_not_to_say: "prefer_not_to_say";
    }>;
    university: z.ZodString;
    isVerified: z.ZodBoolean;
    eduEmail: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    eduDomain: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    bio: z.ZodString;
    photoIndex: z.ZodNumber;
    photoUrl: z.ZodOptional<z.ZodString>;
    profileCompletion: z.ZodOptional<z.ZodNumber>;
    occupation: z.ZodString;
    location: z.ZodString;
    neighborhoods: z.ZodArray<z.ZodString>;
    budgetMin: z.ZodNumber;
    budgetMax: z.ZodNumber;
    moveInDate: z.ZodString;
    lifestyle: z.ZodObject<{
        sleepSchedule: z.ZodOptional<z.ZodEnum<{
            early_bird: "early_bird";
            night_owl: "night_owl";
            flexible: "flexible";
        }>>;
        cleanliness: z.ZodOptional<z.ZodUnion<readonly [z.ZodLiteral<1>, z.ZodLiteral<2>, z.ZodLiteral<3>, z.ZodLiteral<4>, z.ZodLiteral<5>]>>;
        noise: z.ZodOptional<z.ZodEnum<{
            quiet: "quiet";
            moderate: "moderate";
            social: "social";
        }>>;
        smoking: z.ZodOptional<z.ZodBoolean>;
        drinking: z.ZodOptional<z.ZodEnum<{
            never: "never";
            socially: "socially";
            regularly: "regularly";
        }>>;
        pets: z.ZodOptional<z.ZodBoolean>;
        guests: z.ZodOptional<z.ZodEnum<{
            rarely: "rarely";
            sometimes: "sometimes";
            often: "often";
        }>>;
        communicationStyle: z.ZodOptional<z.ZodEnum<{
            direct: "direct";
            laid_back: "laid_back";
            reserved: "reserved";
        }>>;
    }, z.core.$loose>;
    sameGenderOnly: z.ZodBoolean;
    language: z.ZodString;
    religion: z.ZodString;
    prompts: z.ZodArray<z.ZodObject<{
        question: z.ZodString;
        answer: z.ZodString;
    }, z.core.$strip>>;
    tags: z.ZodArray<z.ZodString>;
    badges: z.ZodArray<z.ZodString>;
    matchScore: z.ZodNumber;
    matchBreakdown: z.ZodOptional<z.ZodArray<z.ZodObject<{
        category: z.ZodString;
        compatible: z.ZodBoolean;
        earned: z.ZodNumber;
        max: z.ZodNumber;
    }, z.core.$strip>>>;
    notificationsEnabled: z.ZodOptional<z.ZodBoolean>;
    privacy: z.ZodOptional<z.ZodObject<{
        showAge: z.ZodBoolean;
        showUniversity: z.ZodBoolean;
        showOccupation: z.ZodBoolean;
        hideFromSearch: z.ZodBoolean;
    }, z.core.$strip>>;
    createdAt: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const RoommateProfileSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    age: z.ZodNumber;
    gender: z.ZodEnum<{
        male: "male";
        female: "female";
        non_binary: "non_binary";
        prefer_not_to_say: "prefer_not_to_say";
    }>;
    university: z.ZodString;
    isVerified: z.ZodBoolean;
    eduEmail: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    eduDomain: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    bio: z.ZodString;
    photoIndex: z.ZodNumber;
    photoUrl: z.ZodOptional<z.ZodString>;
    profileCompletion: z.ZodOptional<z.ZodNumber>;
    occupation: z.ZodString;
    location: z.ZodString;
    neighborhoods: z.ZodArray<z.ZodString>;
    budgetMin: z.ZodNumber;
    budgetMax: z.ZodNumber;
    moveInDate: z.ZodString;
    lifestyle: z.ZodObject<{
        sleepSchedule: z.ZodOptional<z.ZodEnum<{
            early_bird: "early_bird";
            night_owl: "night_owl";
            flexible: "flexible";
        }>>;
        cleanliness: z.ZodOptional<z.ZodUnion<readonly [z.ZodLiteral<1>, z.ZodLiteral<2>, z.ZodLiteral<3>, z.ZodLiteral<4>, z.ZodLiteral<5>]>>;
        noise: z.ZodOptional<z.ZodEnum<{
            quiet: "quiet";
            moderate: "moderate";
            social: "social";
        }>>;
        smoking: z.ZodOptional<z.ZodBoolean>;
        drinking: z.ZodOptional<z.ZodEnum<{
            never: "never";
            socially: "socially";
            regularly: "regularly";
        }>>;
        pets: z.ZodOptional<z.ZodBoolean>;
        guests: z.ZodOptional<z.ZodEnum<{
            rarely: "rarely";
            sometimes: "sometimes";
            often: "often";
        }>>;
        communicationStyle: z.ZodOptional<z.ZodEnum<{
            direct: "direct";
            laid_back: "laid_back";
            reserved: "reserved";
        }>>;
    }, z.core.$loose>;
    sameGenderOnly: z.ZodBoolean;
    language: z.ZodString;
    religion: z.ZodString;
    prompts: z.ZodArray<z.ZodObject<{
        question: z.ZodString;
        answer: z.ZodString;
    }, z.core.$strip>>;
    tags: z.ZodArray<z.ZodString>;
    badges: z.ZodArray<z.ZodString>;
    matchScore: z.ZodNumber;
    matchBreakdown: z.ZodOptional<z.ZodArray<z.ZodObject<{
        category: z.ZodString;
        compatible: z.ZodBoolean;
        earned: z.ZodNumber;
        max: z.ZodNumber;
    }, z.core.$strip>>>;
    notificationsEnabled: z.ZodOptional<z.ZodBoolean>;
    privacy: z.ZodOptional<z.ZodObject<{
        showAge: z.ZodBoolean;
        showUniversity: z.ZodBoolean;
        showOccupation: z.ZodBoolean;
        hideFromSearch: z.ZodBoolean;
    }, z.core.$strip>>;
    createdAt: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const MatchSchema: z.ZodObject<{
    id: z.ZodString;
    profile: z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        age: z.ZodNumber;
        gender: z.ZodEnum<{
            male: "male";
            female: "female";
            non_binary: "non_binary";
            prefer_not_to_say: "prefer_not_to_say";
        }>;
        university: z.ZodString;
        isVerified: z.ZodBoolean;
        eduEmail: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        eduDomain: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        bio: z.ZodString;
        photoIndex: z.ZodNumber;
        photoUrl: z.ZodOptional<z.ZodString>;
        profileCompletion: z.ZodOptional<z.ZodNumber>;
        occupation: z.ZodString;
        location: z.ZodString;
        neighborhoods: z.ZodArray<z.ZodString>;
        budgetMin: z.ZodNumber;
        budgetMax: z.ZodNumber;
        moveInDate: z.ZodString;
        lifestyle: z.ZodObject<{
            sleepSchedule: z.ZodOptional<z.ZodEnum<{
                early_bird: "early_bird";
                night_owl: "night_owl";
                flexible: "flexible";
            }>>;
            cleanliness: z.ZodOptional<z.ZodUnion<readonly [z.ZodLiteral<1>, z.ZodLiteral<2>, z.ZodLiteral<3>, z.ZodLiteral<4>, z.ZodLiteral<5>]>>;
            noise: z.ZodOptional<z.ZodEnum<{
                quiet: "quiet";
                moderate: "moderate";
                social: "social";
            }>>;
            smoking: z.ZodOptional<z.ZodBoolean>;
            drinking: z.ZodOptional<z.ZodEnum<{
                never: "never";
                socially: "socially";
                regularly: "regularly";
            }>>;
            pets: z.ZodOptional<z.ZodBoolean>;
            guests: z.ZodOptional<z.ZodEnum<{
                rarely: "rarely";
                sometimes: "sometimes";
                often: "often";
            }>>;
            communicationStyle: z.ZodOptional<z.ZodEnum<{
                direct: "direct";
                laid_back: "laid_back";
                reserved: "reserved";
            }>>;
        }, z.core.$loose>;
        sameGenderOnly: z.ZodBoolean;
        language: z.ZodString;
        religion: z.ZodString;
        prompts: z.ZodArray<z.ZodObject<{
            question: z.ZodString;
            answer: z.ZodString;
        }, z.core.$strip>>;
        tags: z.ZodArray<z.ZodString>;
        badges: z.ZodArray<z.ZodString>;
        matchScore: z.ZodNumber;
        matchBreakdown: z.ZodOptional<z.ZodArray<z.ZodObject<{
            category: z.ZodString;
            compatible: z.ZodBoolean;
            earned: z.ZodNumber;
            max: z.ZodNumber;
        }, z.core.$strip>>>;
        notificationsEnabled: z.ZodOptional<z.ZodBoolean>;
        privacy: z.ZodOptional<z.ZodObject<{
            showAge: z.ZodBoolean;
            showUniversity: z.ZodBoolean;
            showOccupation: z.ZodBoolean;
            hideFromSearch: z.ZodBoolean;
        }, z.core.$strip>>;
        createdAt: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
    matchedAt: z.ZodString;
    lastMessage: z.ZodString;
    lastMessageTime: z.ZodString;
    unread: z.ZodNumber;
}, z.core.$strip>;
export declare const MessageSchema: z.ZodObject<{
    id: z.ZodString;
    matchId: z.ZodString;
    senderId: z.ZodString;
    text: z.ZodString;
    timestamp: z.ZodString;
    isRead: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
export declare const HousingMemberSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    photoIndex: z.ZodNumber;
    photoUrl: z.ZodOptional<z.ZodString>;
    isVerified: z.ZodBoolean;
    eduDomain: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, z.core.$strip>;
export declare const HousingListingSchema: z.ZodObject<{
    id: z.ZodString;
    type: z.ZodEnum<{
        permanent_room: "permanent_room";
        sublet: "sublet";
        forming_group: "forming_group";
        open_room: "open_room";
    }>;
    title: z.ZodString;
    address: z.ZodString;
    neighborhood: z.ZodString;
    rent: z.ZodNumber;
    moveInDate: z.ZodString;
    photoIndex: z.ZodNumber;
    description: z.ZodString;
    currentRoommates: z.ZodNumber;
    maxRoommates: z.ZodNumber;
    rules: z.ZodArray<z.ZodString>;
    tags: z.ZodArray<z.ZodString>;
    amenities: z.ZodArray<z.ZodString>;
    sameGenderOnly: z.ZodBoolean;
    status: z.ZodOptional<z.ZodEnum<{
        active: "active";
        filled: "filled";
        withdrawn: "withdrawn";
    }>>;
    requireRoommateReview: z.ZodOptional<z.ZodBoolean>;
    subletStart: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    subletEnd: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    currentMembers: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        photoIndex: z.ZodNumber;
        photoUrl: z.ZodOptional<z.ZodString>;
        isVerified: z.ZodBoolean;
        eduDomain: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, z.core.$strip>>>;
    postedBy: z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        age: z.ZodNumber;
        gender: z.ZodEnum<{
            male: "male";
            female: "female";
            non_binary: "non_binary";
            prefer_not_to_say: "prefer_not_to_say";
        }>;
        university: z.ZodString;
        isVerified: z.ZodBoolean;
        eduEmail: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        eduDomain: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        bio: z.ZodString;
        photoIndex: z.ZodNumber;
        photoUrl: z.ZodOptional<z.ZodString>;
        profileCompletion: z.ZodOptional<z.ZodNumber>;
        occupation: z.ZodString;
        location: z.ZodString;
        neighborhoods: z.ZodArray<z.ZodString>;
        budgetMin: z.ZodNumber;
        budgetMax: z.ZodNumber;
        moveInDate: z.ZodString;
        lifestyle: z.ZodObject<{
            sleepSchedule: z.ZodOptional<z.ZodEnum<{
                early_bird: "early_bird";
                night_owl: "night_owl";
                flexible: "flexible";
            }>>;
            cleanliness: z.ZodOptional<z.ZodUnion<readonly [z.ZodLiteral<1>, z.ZodLiteral<2>, z.ZodLiteral<3>, z.ZodLiteral<4>, z.ZodLiteral<5>]>>;
            noise: z.ZodOptional<z.ZodEnum<{
                quiet: "quiet";
                moderate: "moderate";
                social: "social";
            }>>;
            smoking: z.ZodOptional<z.ZodBoolean>;
            drinking: z.ZodOptional<z.ZodEnum<{
                never: "never";
                socially: "socially";
                regularly: "regularly";
            }>>;
            pets: z.ZodOptional<z.ZodBoolean>;
            guests: z.ZodOptional<z.ZodEnum<{
                rarely: "rarely";
                sometimes: "sometimes";
                often: "often";
            }>>;
            communicationStyle: z.ZodOptional<z.ZodEnum<{
                direct: "direct";
                laid_back: "laid_back";
                reserved: "reserved";
            }>>;
        }, z.core.$loose>;
        sameGenderOnly: z.ZodBoolean;
        language: z.ZodString;
        religion: z.ZodString;
        prompts: z.ZodArray<z.ZodObject<{
            question: z.ZodString;
            answer: z.ZodString;
        }, z.core.$strip>>;
        tags: z.ZodArray<z.ZodString>;
        badges: z.ZodArray<z.ZodString>;
        matchScore: z.ZodNumber;
        matchBreakdown: z.ZodOptional<z.ZodArray<z.ZodObject<{
            category: z.ZodString;
            compatible: z.ZodBoolean;
            earned: z.ZodNumber;
            max: z.ZodNumber;
        }, z.core.$strip>>>;
        notificationsEnabled: z.ZodOptional<z.ZodBoolean>;
        privacy: z.ZodOptional<z.ZodObject<{
            showAge: z.ZodBoolean;
            showUniversity: z.ZodBoolean;
            showOccupation: z.ZodBoolean;
            hideFromSearch: z.ZodBoolean;
        }, z.core.$strip>>;
        createdAt: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const CreateHousingListingSchema: z.ZodObject<{
    type: z.ZodEnum<{
        permanent_room: "permanent_room";
        sublet: "sublet";
    }>;
    title: z.ZodString;
    address: z.ZodString;
    neighborhood: z.ZodString;
    rent: z.ZodNumber;
    moveInDate: z.ZodString;
    description: z.ZodDefault<z.ZodString>;
    maxRoommates: z.ZodNumber;
    rules: z.ZodDefault<z.ZodArray<z.ZodString>>;
    tags: z.ZodDefault<z.ZodArray<z.ZodString>>;
    amenities: z.ZodDefault<z.ZodArray<z.ZodString>>;
    sameGenderOnly: z.ZodDefault<z.ZodBoolean>;
    subletStart: z.ZodOptional<z.ZodString>;
    subletEnd: z.ZodOptional<z.ZodString>;
    requireRoommateReview: z.ZodDefault<z.ZodBoolean>;
    photoIndex: z.ZodDefault<z.ZodNumber>;
}, z.core.$strip>;
export declare const JoinRequestSchema: z.ZodObject<{
    id: z.ZodString;
    listingId: z.ZodString;
    requester: z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        age: z.ZodNumber;
        gender: z.ZodEnum<{
            male: "male";
            female: "female";
            non_binary: "non_binary";
            prefer_not_to_say: "prefer_not_to_say";
        }>;
        university: z.ZodString;
        isVerified: z.ZodBoolean;
        eduEmail: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        eduDomain: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        bio: z.ZodString;
        photoIndex: z.ZodNumber;
        photoUrl: z.ZodOptional<z.ZodString>;
        profileCompletion: z.ZodOptional<z.ZodNumber>;
        occupation: z.ZodString;
        location: z.ZodString;
        neighborhoods: z.ZodArray<z.ZodString>;
        budgetMin: z.ZodNumber;
        budgetMax: z.ZodNumber;
        moveInDate: z.ZodString;
        lifestyle: z.ZodObject<{
            sleepSchedule: z.ZodOptional<z.ZodEnum<{
                early_bird: "early_bird";
                night_owl: "night_owl";
                flexible: "flexible";
            }>>;
            cleanliness: z.ZodOptional<z.ZodUnion<readonly [z.ZodLiteral<1>, z.ZodLiteral<2>, z.ZodLiteral<3>, z.ZodLiteral<4>, z.ZodLiteral<5>]>>;
            noise: z.ZodOptional<z.ZodEnum<{
                quiet: "quiet";
                moderate: "moderate";
                social: "social";
            }>>;
            smoking: z.ZodOptional<z.ZodBoolean>;
            drinking: z.ZodOptional<z.ZodEnum<{
                never: "never";
                socially: "socially";
                regularly: "regularly";
            }>>;
            pets: z.ZodOptional<z.ZodBoolean>;
            guests: z.ZodOptional<z.ZodEnum<{
                rarely: "rarely";
                sometimes: "sometimes";
                often: "often";
            }>>;
            communicationStyle: z.ZodOptional<z.ZodEnum<{
                direct: "direct";
                laid_back: "laid_back";
                reserved: "reserved";
            }>>;
        }, z.core.$loose>;
        sameGenderOnly: z.ZodBoolean;
        language: z.ZodString;
        religion: z.ZodString;
        prompts: z.ZodArray<z.ZodObject<{
            question: z.ZodString;
            answer: z.ZodString;
        }, z.core.$strip>>;
        tags: z.ZodArray<z.ZodString>;
        badges: z.ZodArray<z.ZodString>;
        matchScore: z.ZodNumber;
        matchBreakdown: z.ZodOptional<z.ZodArray<z.ZodObject<{
            category: z.ZodString;
            compatible: z.ZodBoolean;
            earned: z.ZodNumber;
            max: z.ZodNumber;
        }, z.core.$strip>>>;
        notificationsEnabled: z.ZodOptional<z.ZodBoolean>;
        privacy: z.ZodOptional<z.ZodObject<{
            showAge: z.ZodBoolean;
            showUniversity: z.ZodBoolean;
            showOccupation: z.ZodBoolean;
            hideFromSearch: z.ZodBoolean;
        }, z.core.$strip>>;
        createdAt: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
    message: z.ZodString;
    status: z.ZodEnum<{
        withdrawn: "withdrawn";
        pending: "pending";
        approved: "approved";
        denied: "denied";
    }>;
    createdAt: z.ZodString;
    decidedAt: z.ZodNullable<z.ZodString>;
}, z.core.$strip>;
export declare const JoinRequestsResponseSchema: z.ZodObject<{
    requests: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        listingId: z.ZodString;
        requester: z.ZodObject<{
            id: z.ZodString;
            name: z.ZodString;
            age: z.ZodNumber;
            gender: z.ZodEnum<{
                male: "male";
                female: "female";
                non_binary: "non_binary";
                prefer_not_to_say: "prefer_not_to_say";
            }>;
            university: z.ZodString;
            isVerified: z.ZodBoolean;
            eduEmail: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            eduDomain: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            bio: z.ZodString;
            photoIndex: z.ZodNumber;
            photoUrl: z.ZodOptional<z.ZodString>;
            profileCompletion: z.ZodOptional<z.ZodNumber>;
            occupation: z.ZodString;
            location: z.ZodString;
            neighborhoods: z.ZodArray<z.ZodString>;
            budgetMin: z.ZodNumber;
            budgetMax: z.ZodNumber;
            moveInDate: z.ZodString;
            lifestyle: z.ZodObject<{
                sleepSchedule: z.ZodOptional<z.ZodEnum<{
                    early_bird: "early_bird";
                    night_owl: "night_owl";
                    flexible: "flexible";
                }>>;
                cleanliness: z.ZodOptional<z.ZodUnion<readonly [z.ZodLiteral<1>, z.ZodLiteral<2>, z.ZodLiteral<3>, z.ZodLiteral<4>, z.ZodLiteral<5>]>>;
                noise: z.ZodOptional<z.ZodEnum<{
                    quiet: "quiet";
                    moderate: "moderate";
                    social: "social";
                }>>;
                smoking: z.ZodOptional<z.ZodBoolean>;
                drinking: z.ZodOptional<z.ZodEnum<{
                    never: "never";
                    socially: "socially";
                    regularly: "regularly";
                }>>;
                pets: z.ZodOptional<z.ZodBoolean>;
                guests: z.ZodOptional<z.ZodEnum<{
                    rarely: "rarely";
                    sometimes: "sometimes";
                    often: "often";
                }>>;
                communicationStyle: z.ZodOptional<z.ZodEnum<{
                    direct: "direct";
                    laid_back: "laid_back";
                    reserved: "reserved";
                }>>;
            }, z.core.$loose>;
            sameGenderOnly: z.ZodBoolean;
            language: z.ZodString;
            religion: z.ZodString;
            prompts: z.ZodArray<z.ZodObject<{
                question: z.ZodString;
                answer: z.ZodString;
            }, z.core.$strip>>;
            tags: z.ZodArray<z.ZodString>;
            badges: z.ZodArray<z.ZodString>;
            matchScore: z.ZodNumber;
            matchBreakdown: z.ZodOptional<z.ZodArray<z.ZodObject<{
                category: z.ZodString;
                compatible: z.ZodBoolean;
                earned: z.ZodNumber;
                max: z.ZodNumber;
            }, z.core.$strip>>>;
            notificationsEnabled: z.ZodOptional<z.ZodBoolean>;
            privacy: z.ZodOptional<z.ZodObject<{
                showAge: z.ZodBoolean;
                showUniversity: z.ZodBoolean;
                showOccupation: z.ZodBoolean;
                hideFromSearch: z.ZodBoolean;
            }, z.core.$strip>>;
            createdAt: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>;
        message: z.ZodString;
        status: z.ZodEnum<{
            withdrawn: "withdrawn";
            pending: "pending";
            approved: "approved";
            denied: "denied";
        }>;
        createdAt: z.ZodString;
        decidedAt: z.ZodNullable<z.ZodString>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export declare const CreateJoinRequestSchema: z.ZodObject<{
    message: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const FilterSettingsSchema: z.ZodObject<{
    budgetMin: z.ZodOptional<z.ZodNumber>;
    budgetMax: z.ZodOptional<z.ZodNumber>;
    noiseLevel: z.ZodOptional<z.ZodString>;
    smokingOk: z.ZodOptional<z.ZodNullable<z.ZodBoolean>>;
    sameGenderOnly: z.ZodOptional<z.ZodBoolean>;
    shortlistedOnly: z.ZodOptional<z.ZodBoolean>;
    moveInDateFrom: z.ZodOptional<z.ZodString>;
    moveInDateTo: z.ZodOptional<z.ZodString>;
    neighborhoods: z.ZodOptional<z.ZodArray<z.ZodString>>;
    cleanliness: z.ZodOptional<z.ZodNumber>;
    drinking: z.ZodOptional<z.ZodString>;
    guests: z.ZodOptional<z.ZodString>;
    pets: z.ZodOptional<z.ZodNullable<z.ZodBoolean>>;
}, z.core.$strip>;
export declare const SwipeRequestSchema: z.ZodObject<{
    profileId: z.ZodString;
    action: z.ZodEnum<{
        like: "like";
        skip: "skip";
        shortlist: "shortlist";
    }>;
}, z.core.$strip>;
export declare const SwipeResponseSchema: z.ZodObject<{
    matched: z.ZodBoolean;
    matchId: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const SendMessageRequestSchema: z.ZodObject<{
    text: z.ZodString;
}, z.core.$strip>;
export declare const UpsertProfileSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    lifestyle: z.ZodOptional<z.ZodObject<{
        sleepSchedule: z.ZodOptional<z.ZodEnum<{
            early_bird: "early_bird";
            night_owl: "night_owl";
            flexible: "flexible";
        }>>;
        cleanliness: z.ZodOptional<z.ZodUnion<readonly [z.ZodLiteral<1>, z.ZodLiteral<2>, z.ZodLiteral<3>, z.ZodLiteral<4>, z.ZodLiteral<5>]>>;
        noise: z.ZodOptional<z.ZodEnum<{
            quiet: "quiet";
            moderate: "moderate";
            social: "social";
        }>>;
        smoking: z.ZodOptional<z.ZodBoolean>;
        drinking: z.ZodOptional<z.ZodEnum<{
            never: "never";
            socially: "socially";
            regularly: "regularly";
        }>>;
        pets: z.ZodOptional<z.ZodBoolean>;
        guests: z.ZodOptional<z.ZodEnum<{
            rarely: "rarely";
            sometimes: "sometimes";
            often: "often";
        }>>;
        communicationStyle: z.ZodOptional<z.ZodEnum<{
            direct: "direct";
            laid_back: "laid_back";
            reserved: "reserved";
        }>>;
    }, z.core.$loose>>;
    age: z.ZodOptional<z.ZodNumber>;
    gender: z.ZodOptional<z.ZodEnum<{
        male: "male";
        female: "female";
        non_binary: "non_binary";
        prefer_not_to_say: "prefer_not_to_say";
    }>>;
    university: z.ZodOptional<z.ZodString>;
    isVerified: z.ZodOptional<z.ZodBoolean>;
    eduEmail: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodString>>>;
    eduDomain: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodString>>>;
    bio: z.ZodOptional<z.ZodString>;
    photoIndex: z.ZodOptional<z.ZodNumber>;
    photoUrl: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    profileCompletion: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    occupation: z.ZodOptional<z.ZodString>;
    location: z.ZodOptional<z.ZodString>;
    neighborhoods: z.ZodOptional<z.ZodArray<z.ZodString>>;
    budgetMin: z.ZodOptional<z.ZodNumber>;
    budgetMax: z.ZodOptional<z.ZodNumber>;
    moveInDate: z.ZodOptional<z.ZodString>;
    sameGenderOnly: z.ZodOptional<z.ZodBoolean>;
    language: z.ZodOptional<z.ZodString>;
    religion: z.ZodOptional<z.ZodString>;
    prompts: z.ZodOptional<z.ZodArray<z.ZodObject<{
        question: z.ZodString;
        answer: z.ZodString;
    }, z.core.$strip>>>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
    badges: z.ZodOptional<z.ZodArray<z.ZodString>>;
    matchScore: z.ZodOptional<z.ZodNumber>;
    matchBreakdown: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodObject<{
        category: z.ZodString;
        compatible: z.ZodBoolean;
        earned: z.ZodNumber;
        max: z.ZodNumber;
    }, z.core.$strip>>>>;
    notificationsEnabled: z.ZodOptional<z.ZodOptional<z.ZodBoolean>>;
    privacy: z.ZodOptional<z.ZodOptional<z.ZodObject<{
        showAge: z.ZodBoolean;
        showUniversity: z.ZodBoolean;
        showOccupation: z.ZodBoolean;
        hideFromSearch: z.ZodBoolean;
    }, z.core.$strip>>>;
}, z.core.$strip>;
export declare const ProfilesResponseSchema: z.ZodObject<{
    profiles: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        age: z.ZodNumber;
        gender: z.ZodEnum<{
            male: "male";
            female: "female";
            non_binary: "non_binary";
            prefer_not_to_say: "prefer_not_to_say";
        }>;
        university: z.ZodString;
        isVerified: z.ZodBoolean;
        eduEmail: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        eduDomain: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        bio: z.ZodString;
        photoIndex: z.ZodNumber;
        photoUrl: z.ZodOptional<z.ZodString>;
        profileCompletion: z.ZodOptional<z.ZodNumber>;
        occupation: z.ZodString;
        location: z.ZodString;
        neighborhoods: z.ZodArray<z.ZodString>;
        budgetMin: z.ZodNumber;
        budgetMax: z.ZodNumber;
        moveInDate: z.ZodString;
        lifestyle: z.ZodObject<{
            sleepSchedule: z.ZodOptional<z.ZodEnum<{
                early_bird: "early_bird";
                night_owl: "night_owl";
                flexible: "flexible";
            }>>;
            cleanliness: z.ZodOptional<z.ZodUnion<readonly [z.ZodLiteral<1>, z.ZodLiteral<2>, z.ZodLiteral<3>, z.ZodLiteral<4>, z.ZodLiteral<5>]>>;
            noise: z.ZodOptional<z.ZodEnum<{
                quiet: "quiet";
                moderate: "moderate";
                social: "social";
            }>>;
            smoking: z.ZodOptional<z.ZodBoolean>;
            drinking: z.ZodOptional<z.ZodEnum<{
                never: "never";
                socially: "socially";
                regularly: "regularly";
            }>>;
            pets: z.ZodOptional<z.ZodBoolean>;
            guests: z.ZodOptional<z.ZodEnum<{
                rarely: "rarely";
                sometimes: "sometimes";
                often: "often";
            }>>;
            communicationStyle: z.ZodOptional<z.ZodEnum<{
                direct: "direct";
                laid_back: "laid_back";
                reserved: "reserved";
            }>>;
        }, z.core.$loose>;
        sameGenderOnly: z.ZodBoolean;
        language: z.ZodString;
        religion: z.ZodString;
        prompts: z.ZodArray<z.ZodObject<{
            question: z.ZodString;
            answer: z.ZodString;
        }, z.core.$strip>>;
        tags: z.ZodArray<z.ZodString>;
        badges: z.ZodArray<z.ZodString>;
        matchScore: z.ZodNumber;
        matchBreakdown: z.ZodOptional<z.ZodArray<z.ZodObject<{
            category: z.ZodString;
            compatible: z.ZodBoolean;
            earned: z.ZodNumber;
            max: z.ZodNumber;
        }, z.core.$strip>>>;
        notificationsEnabled: z.ZodOptional<z.ZodBoolean>;
        privacy: z.ZodOptional<z.ZodObject<{
            showAge: z.ZodBoolean;
            showUniversity: z.ZodBoolean;
            showOccupation: z.ZodBoolean;
            hideFromSearch: z.ZodBoolean;
        }, z.core.$strip>>;
        createdAt: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
    total: z.ZodNumber;
    page: z.ZodNumber;
    limit: z.ZodNumber;
    totalPages: z.ZodNumber;
}, z.core.$strip>;
export declare const MatchesResponseSchema: z.ZodObject<{
    matches: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        profile: z.ZodObject<{
            id: z.ZodString;
            name: z.ZodString;
            age: z.ZodNumber;
            gender: z.ZodEnum<{
                male: "male";
                female: "female";
                non_binary: "non_binary";
                prefer_not_to_say: "prefer_not_to_say";
            }>;
            university: z.ZodString;
            isVerified: z.ZodBoolean;
            eduEmail: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            eduDomain: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            bio: z.ZodString;
            photoIndex: z.ZodNumber;
            photoUrl: z.ZodOptional<z.ZodString>;
            profileCompletion: z.ZodOptional<z.ZodNumber>;
            occupation: z.ZodString;
            location: z.ZodString;
            neighborhoods: z.ZodArray<z.ZodString>;
            budgetMin: z.ZodNumber;
            budgetMax: z.ZodNumber;
            moveInDate: z.ZodString;
            lifestyle: z.ZodObject<{
                sleepSchedule: z.ZodOptional<z.ZodEnum<{
                    early_bird: "early_bird";
                    night_owl: "night_owl";
                    flexible: "flexible";
                }>>;
                cleanliness: z.ZodOptional<z.ZodUnion<readonly [z.ZodLiteral<1>, z.ZodLiteral<2>, z.ZodLiteral<3>, z.ZodLiteral<4>, z.ZodLiteral<5>]>>;
                noise: z.ZodOptional<z.ZodEnum<{
                    quiet: "quiet";
                    moderate: "moderate";
                    social: "social";
                }>>;
                smoking: z.ZodOptional<z.ZodBoolean>;
                drinking: z.ZodOptional<z.ZodEnum<{
                    never: "never";
                    socially: "socially";
                    regularly: "regularly";
                }>>;
                pets: z.ZodOptional<z.ZodBoolean>;
                guests: z.ZodOptional<z.ZodEnum<{
                    rarely: "rarely";
                    sometimes: "sometimes";
                    often: "often";
                }>>;
                communicationStyle: z.ZodOptional<z.ZodEnum<{
                    direct: "direct";
                    laid_back: "laid_back";
                    reserved: "reserved";
                }>>;
            }, z.core.$loose>;
            sameGenderOnly: z.ZodBoolean;
            language: z.ZodString;
            religion: z.ZodString;
            prompts: z.ZodArray<z.ZodObject<{
                question: z.ZodString;
                answer: z.ZodString;
            }, z.core.$strip>>;
            tags: z.ZodArray<z.ZodString>;
            badges: z.ZodArray<z.ZodString>;
            matchScore: z.ZodNumber;
            matchBreakdown: z.ZodOptional<z.ZodArray<z.ZodObject<{
                category: z.ZodString;
                compatible: z.ZodBoolean;
                earned: z.ZodNumber;
                max: z.ZodNumber;
            }, z.core.$strip>>>;
            notificationsEnabled: z.ZodOptional<z.ZodBoolean>;
            privacy: z.ZodOptional<z.ZodObject<{
                showAge: z.ZodBoolean;
                showUniversity: z.ZodBoolean;
                showOccupation: z.ZodBoolean;
                hideFromSearch: z.ZodBoolean;
            }, z.core.$strip>>;
            createdAt: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>;
        matchedAt: z.ZodString;
        lastMessage: z.ZodString;
        lastMessageTime: z.ZodString;
        unread: z.ZodNumber;
    }, z.core.$strip>>;
}, z.core.$strip>;
export declare const MessagesResponseSchema: z.ZodObject<{
    messages: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        matchId: z.ZodString;
        senderId: z.ZodString;
        text: z.ZodString;
        timestamp: z.ZodString;
        isRead: z.ZodOptional<z.ZodBoolean>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export declare const HousingResponseSchema: z.ZodObject<{
    listings: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        type: z.ZodEnum<{
            permanent_room: "permanent_room";
            sublet: "sublet";
            forming_group: "forming_group";
            open_room: "open_room";
        }>;
        title: z.ZodString;
        address: z.ZodString;
        neighborhood: z.ZodString;
        rent: z.ZodNumber;
        moveInDate: z.ZodString;
        photoIndex: z.ZodNumber;
        description: z.ZodString;
        currentRoommates: z.ZodNumber;
        maxRoommates: z.ZodNumber;
        rules: z.ZodArray<z.ZodString>;
        tags: z.ZodArray<z.ZodString>;
        amenities: z.ZodArray<z.ZodString>;
        sameGenderOnly: z.ZodBoolean;
        status: z.ZodOptional<z.ZodEnum<{
            active: "active";
            filled: "filled";
            withdrawn: "withdrawn";
        }>>;
        requireRoommateReview: z.ZodOptional<z.ZodBoolean>;
        subletStart: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        subletEnd: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        currentMembers: z.ZodOptional<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            name: z.ZodString;
            photoIndex: z.ZodNumber;
            photoUrl: z.ZodOptional<z.ZodString>;
            isVerified: z.ZodBoolean;
            eduDomain: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        }, z.core.$strip>>>;
        postedBy: z.ZodObject<{
            id: z.ZodString;
            name: z.ZodString;
            age: z.ZodNumber;
            gender: z.ZodEnum<{
                male: "male";
                female: "female";
                non_binary: "non_binary";
                prefer_not_to_say: "prefer_not_to_say";
            }>;
            university: z.ZodString;
            isVerified: z.ZodBoolean;
            eduEmail: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            eduDomain: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            bio: z.ZodString;
            photoIndex: z.ZodNumber;
            photoUrl: z.ZodOptional<z.ZodString>;
            profileCompletion: z.ZodOptional<z.ZodNumber>;
            occupation: z.ZodString;
            location: z.ZodString;
            neighborhoods: z.ZodArray<z.ZodString>;
            budgetMin: z.ZodNumber;
            budgetMax: z.ZodNumber;
            moveInDate: z.ZodString;
            lifestyle: z.ZodObject<{
                sleepSchedule: z.ZodOptional<z.ZodEnum<{
                    early_bird: "early_bird";
                    night_owl: "night_owl";
                    flexible: "flexible";
                }>>;
                cleanliness: z.ZodOptional<z.ZodUnion<readonly [z.ZodLiteral<1>, z.ZodLiteral<2>, z.ZodLiteral<3>, z.ZodLiteral<4>, z.ZodLiteral<5>]>>;
                noise: z.ZodOptional<z.ZodEnum<{
                    quiet: "quiet";
                    moderate: "moderate";
                    social: "social";
                }>>;
                smoking: z.ZodOptional<z.ZodBoolean>;
                drinking: z.ZodOptional<z.ZodEnum<{
                    never: "never";
                    socially: "socially";
                    regularly: "regularly";
                }>>;
                pets: z.ZodOptional<z.ZodBoolean>;
                guests: z.ZodOptional<z.ZodEnum<{
                    rarely: "rarely";
                    sometimes: "sometimes";
                    often: "often";
                }>>;
                communicationStyle: z.ZodOptional<z.ZodEnum<{
                    direct: "direct";
                    laid_back: "laid_back";
                    reserved: "reserved";
                }>>;
            }, z.core.$loose>;
            sameGenderOnly: z.ZodBoolean;
            language: z.ZodString;
            religion: z.ZodString;
            prompts: z.ZodArray<z.ZodObject<{
                question: z.ZodString;
                answer: z.ZodString;
            }, z.core.$strip>>;
            tags: z.ZodArray<z.ZodString>;
            badges: z.ZodArray<z.ZodString>;
            matchScore: z.ZodNumber;
            matchBreakdown: z.ZodOptional<z.ZodArray<z.ZodObject<{
                category: z.ZodString;
                compatible: z.ZodBoolean;
                earned: z.ZodNumber;
                max: z.ZodNumber;
            }, z.core.$strip>>>;
            notificationsEnabled: z.ZodOptional<z.ZodBoolean>;
            privacy: z.ZodOptional<z.ZodObject<{
                showAge: z.ZodBoolean;
                showUniversity: z.ZodBoolean;
                showOccupation: z.ZodBoolean;
                hideFromSearch: z.ZodBoolean;
            }, z.core.$strip>>;
            createdAt: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export declare const RequestVerificationSchema: z.ZodObject<{
    eduEmail: z.ZodEmail;
}, z.core.$strip>;
export declare const ConfirmVerificationSchema: z.ZodObject<{
    code: z.ZodString;
}, z.core.$strip>;
export declare const VerificationStatusSchema: z.ZodObject<{
    isVerified: z.ZodBoolean;
    eduEmail: z.ZodNullable<z.ZodString>;
    eduDomain: z.ZodNullable<z.ZodString>;
    pendingRequest: z.ZodBoolean;
}, z.core.$strip>;
export declare const CreateBlockSchema: z.ZodObject<{
    blockedId: z.ZodString;
    reason: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const CreateReportSchema: z.ZodObject<{
    reportedId: z.ZodString;
    matchId: z.ZodOptional<z.ZodString>;
    category: z.ZodEnum<{
        harassment: "harassment";
        spam: "spam";
        fake_profile: "fake_profile";
        inappropriate: "inappropriate";
        safety: "safety";
        other: "other";
    }>;
    description: z.ZodDefault<z.ZodString>;
}, z.core.$strip>;
export declare const BlockedUserSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    createdAt: z.ZodString;
}, z.core.$strip>;
export declare const BlockedUsersResponseSchema: z.ZodObject<{
    blocked: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        createdAt: z.ZodString;
    }, z.core.$strip>>;
}, z.core.$strip>;
export declare const BioGenerationResponseSchema: z.ZodObject<{
    bio: z.ZodString;
}, z.core.$strip>;
export declare const DeleteAccountSchema: z.ZodObject<{
    confirmation: z.ZodLiteral<"DELETE">;
}, z.core.$strip>;
export declare const CreateFeedbackSchema: z.ZodObject<{
    category: z.ZodEnum<{
        other: "other";
        bug: "bug";
        feature: "feature";
        general: "general";
    }>;
    body: z.ZodString;
    appVersion: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const PhotoUploadResponseSchema: z.ZodObject<{
    photoUrl: z.ZodString;
}, z.core.$strip>;
//# sourceMappingURL=schemas.d.ts.map