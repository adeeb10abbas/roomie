import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  UserProfile, RoommateProfile, SwipeAction, Match,
  Message, HousingListing, FilterSettings,
  VerificationStatus, BlockedUser, JoinRequest,
} from './types';
import {
  apiFetch,
  API_BASE,
  getStoredToken,
  storeToken,
  clearToken,
  getStoredRefreshToken,
  storeRefreshToken,
  clearRefreshToken,
  setUnauthorizedHandler,
  setTokenRefreshedHandler,
} from '@/utils/api';
import { uniqueId } from '@/utils/time';
import { router } from 'expo-router';
import { useSocket, SocketStatus } from '@/hooks/useSocket';
import { registerForPushNotifications, unregisterPushNotifications } from '@/utils/pushNotifications';

const DEFAULT_FILTERS: FilterSettings = {
  budgetMin: 0,
  budgetMax: 5000,
  neighborhoods: [],
  noiseLevel: '',
  smokingOk: null,
  sameGenderOnly: false,
  moveInDateFrom: '',
  moveInDateTo: '',
  cleanliness: null,
  drinking: '',
  guests: '',
  pets: null,
};

interface AuthResult {
  token: string;
  refreshToken?: string;
  userId: string;
  email: string;
  hasProfile: boolean;
}

interface PendingGuestAction {
  profileId: string;
  action: 'like' | 'skip' | 'shortlist';
}

interface AppContextType {
  currentUser: UserProfile | null;
  userId: string | null;
  isAuthenticated: boolean;
  hasProfile: boolean;
  isGuest: boolean;
  guestProfile: RoommateProfile | null;
  clearGuestMode: () => void;
  pendingGuestAction: PendingGuestAction | null;
  setPendingGuestAction: (a: PendingGuestAction | null) => void;
  verificationRequired: boolean;
  setCurrentUser: (user: UserProfile) => Promise<void>;
  patchCurrentUser: (patch: Partial<UserProfile>) => Promise<void>;
  login: (email: string, password: string) => Promise<AuthResult>;
  register: (name: string, email: string, password: string) => Promise<AuthResult>;
  oauthSignIn: (provider: 'google' | 'apple', idToken: string, name?: string) => Promise<AuthResult>;
  logout: () => Promise<void>;
  swipeActions: SwipeAction[];
  swipe: (profileId: string, action: 'like' | 'skip' | 'shortlist') => Promise<boolean>;
  undoLastSwipe: () => Promise<void>;
  matches: Match[];
  messages: Message[];
  sendMessage: (matchId: string, text: string) => Promise<void>;
  markAsRead: (matchId: string) => Promise<void>;
  unmatch: (matchId: string) => Promise<void>;
  housing: HousingListing[];
  groups: HousingListing[];
  groupsLoading: boolean;
  refreshGroups: () => Promise<void>;
  filters: FilterSettings;
  setFilters: (f: FilterSettings) => void;
  filteredProfiles: RoommateProfile[];
  shortlisted: RoommateProfile[];
  loading: boolean;
  profilesLoading: boolean;
  matchesLoading: boolean;
  housingLoading: boolean;
  error: string | null;
  clearError: () => void;
  refreshMatches: () => Promise<void>;
  refreshMessages: (matchId: string) => Promise<void>;
  refreshProfiles: () => Promise<void>;
  refreshHousing: () => Promise<void>;
  socketStatus: SocketStatus;
  setActiveChatMatchId: (matchId: string | null) => void;
  // Verification
  verificationStatus: VerificationStatus | null;
  requestVerification: (eduEmail: string) => Promise<void>;
  confirmVerification: (code: string) => Promise<void>;
  resendVerification: () => Promise<void>;
  refreshVerificationStatus: () => Promise<void>;
  // Safety
  blockUser: (blockedId: string, reason?: string) => Promise<void>;
  unblockUser: (blockedId: string) => Promise<void>;
  blockedUsers: BlockedUser[];
  refreshBlockedUsers: () => Promise<void>;
  reportUser: (reportedId: string, matchId: string | null, category: string, description?: string) => Promise<void>;
  // Account
  deactivateAccount: () => Promise<void>;
  reactivateAccount: () => Promise<void>;
  deleteAccount: (reason?: string) => Promise<void>;
  submitFeedback: (category: string, body: string, appVersion?: string) => Promise<void>;
  // AI
  generateBio: () => Promise<string>;
  // Housing actions
  createHousingListing: (data: Record<string, unknown>) => Promise<HousingListing>;
  updateHousingListing: (listingId: string, data: Record<string, unknown>) => Promise<HousingListing>;
  deleteHousingListing: (listingId: string) => Promise<void>;
  sendJoinRequest: (listingId: string, message?: string) => Promise<{ status: string; matchId?: string; requestId?: string }>;
  getJoinRequests: (listingId: string) => Promise<JoinRequest[]>;
  approveJoinRequest: (requestId: string) => Promise<void>;
  denyJoinRequest: (requestId: string) => Promise<void>;
  withdrawJoinRequest: (requestId: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUserState] = useState<UserProfile | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const [guestProfile, setGuestProfile] = useState<RoommateProfile | null>(null);
  const [pendingGuestAction, setPendingGuestAction] = useState<PendingGuestAction | null>(null);
  const [verificationRequired, setVerificationRequired] = useState(false);
  const [swipeActions, setSwipeActions] = useState<SwipeAction[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [housing, setHousing] = useState<HousingListing[]>([]);
  const [groups, setGroups] = useState<HousingListing[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [filteredProfiles, setFilteredProfiles] = useState<RoommateProfile[]>([]);
  const [shortlisted, setShortlisted] = useState<RoommateProfile[]>([]);
  const [filters, setFiltersState] = useState<FilterSettings>(DEFAULT_FILTERS);
  const [loading, setLoading] = useState(true);
  const [profilesLoading, setProfilesLoading] = useState(false);
  const [matchesLoading, setMatchesLoading] = useState(false);
  const [housingLoading, setHousingLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [socketStatus, setSocketStatus] = useState<SocketStatus>('disconnected');
  const [activeChatMatchId, setActiveChatMatchId] = useState<string | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus | null>(null);
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);

  const clearError = () => setError(null);

  const clearGuestMode = () => {
    setIsGuest(false);
    setGuestProfile(null);
  };

  const logout = useCallback(async () => {
    const currentUserId = userId;
    const jwtToken = await getStoredToken();
    try {
      if (jwtToken) {
        await fetch(`${API_BASE}/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${jwtToken}`,
            ...(Platform.OS !== 'web' ? { 'X-Client-Type': 'native' } : {}),
          },
          ...(Platform.OS === 'web' ? { credentials: 'include' } : {}),
        });
      }
    } catch {
      // Network failure — local cleanup still proceeds
    }
    await clearToken();
    await clearRefreshToken();
    if (currentUserId && jwtToken) {
      await unregisterPushNotifications(currentUserId, jwtToken);
    }
    await AsyncStorage.multiRemove(['currentUser', 'filters']);
    setAuthToken(null);
    setCurrentUserState(null);
    setUserId(null);
    setIsAuthenticated(false);
    setHasProfile(false);
    setVerificationRequired(false);
    setSwipeActions([]);
    setMatches([]);
    setMessages([]);
    setFilteredProfiles([]);
    setShortlisted([]);
    setVerificationStatus(null);
    setBlockedUsers([]);
    // Re-enter guest mode after logout
    setIsGuest(true);
    try {
      const data = await fetch(`${API_BASE}/profiles/preview`).then(r => r.json()) as { profiles: RoommateProfile[] };
      if (data.profiles && data.profiles.length > 0) {
        setGuestProfile(data.profiles[0]);
      }
    } catch {
      setGuestProfile(null);
    }
    router.replace('/(tabs)');
  }, [userId]);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      logout();
    });
  }, [logout]);

  useEffect(() => {
    setTokenRefreshedHandler((newToken: string) => {
      setAuthToken(newToken);
    });
  }, []);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (userId && isAuthenticated) {
      refreshMatches();
      refreshHousing();
      refreshGroups();
      refreshVerificationStatus();
      refreshBlockedUsers();
    }
  }, [userId, isAuthenticated]);

  useEffect(() => {
    if (userId && isAuthenticated) {
      refreshProfiles();
    }
  }, [userId, isAuthenticated, filters]);

  const loadInitialData = async () => {
    try {
      const token = await getStoredToken();
      const filtersStr = await AsyncStorage.getItem('filters');
      if (filtersStr) setFiltersState(JSON.parse(filtersStr));

      const needsRefresh = !token || !parseJwt(token)?.userId;
      if (needsRefresh) {
        const nativeRefreshToken = await getStoredRefreshToken();
        const canAttempt = nativeRefreshToken !== null || Platform.OS === 'web';
        if (canAttempt) {
          const refreshed = await tryRefreshOnStartup(nativeRefreshToken ?? '');
          if (refreshed) {
            await loadInitialData();
            return;
          }
        }
        await clearToken();
        await clearRefreshToken();
        await AsyncStorage.multiRemove(['currentUser']);
        // Enter guest mode: load one preview profile
        setIsGuest(true);
        try {
          const data = await fetch(`${API_BASE}/profiles/preview`).then(r => r.json()) as { profiles: RoommateProfile[] };
          if (data.profiles && data.profiles.length > 0) {
            setGuestProfile(data.profiles[0]);
          }
        } catch {
          // Guest preview unavailable — guest card will just be empty
        }
        setLoading(false);
        return;
      }

      const payload = parseJwt(token!)!;
      setUserId(payload.userId);
      setIsAuthenticated(true);
      setAuthToken(token);
      void registerForPushNotifications(payload.userId);

      const cachedUserStr = await AsyncStorage.getItem('currentUser');
      if (cachedUserStr) {
        const cached = JSON.parse(cachedUserStr) as UserProfile;
        setCurrentUserState(cached);
        setHasProfile(cached.age > 0 && cached.name.trim().length > 0);
      }

      try {
        const serverProfile = await apiFetch<UserProfile>('/profile/me', payload.userId);
        setCurrentUserState(serverProfile);
        await AsyncStorage.setItem('currentUser', JSON.stringify(serverProfile));
        setHasProfile(serverProfile.age > 0 && serverProfile.name.trim().length > 0);
      } catch (err: unknown) {
        if (err instanceof Error && err.message.includes('verification_required')) {
          setVerificationRequired(true);
        }
      }
    } catch {
      await clearToken();
      await clearRefreshToken();
      await AsyncStorage.multiRemove(['currentUser']);
    } finally {
      setLoading(false);
    }
  };

  const authHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(Platform.OS !== 'web' ? { 'X-Client-Type': 'native' } : {}),
  };

  const login = async (email: string, password: string): Promise<AuthResult> => {
    const result = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST', headers: authHeaders, body: JSON.stringify({ email, password }),
    });
    if (!result.ok) throw new Error(`API error ${result.status}: ${await result.text()}`);
    const data = await result.json() as AuthResult;
    await storeToken(data.token);
    if (data.refreshToken) await storeRefreshToken(data.refreshToken);
    setAuthToken(data.token);
    setUserId(data.userId);
    setIsAuthenticated(true);
    setHasProfile(data.hasProfile);
    clearGuestMode();
    void registerForPushNotifications(data.userId);
    return data;
  };

  const register = async (name: string, email: string, password: string): Promise<AuthResult> => {
    const result = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST', headers: authHeaders, body: JSON.stringify({ name, email, password }),
    });
    if (!result.ok) throw new Error(`API error ${result.status}: ${await result.text()}`);
    const data = await result.json() as AuthResult;
    await storeToken(data.token);
    if (data.refreshToken) await storeRefreshToken(data.refreshToken);
    setAuthToken(data.token);
    setUserId(data.userId);
    setIsAuthenticated(true);
    setHasProfile(data.hasProfile);
    clearGuestMode();
    void registerForPushNotifications(data.userId);
    return data;
  };

  const oauthSignIn = async (provider: 'google' | 'apple', idToken: string, name?: string): Promise<AuthResult> => {
    const result = await fetch(`${API_BASE}/auth/oauth`, {
      method: 'POST', headers: authHeaders, body: JSON.stringify({ provider, idToken, name }),
    });
    if (!result.ok) throw new Error(`API error ${result.status}: ${await result.text()}`);
    const data = await result.json() as AuthResult;
    await storeToken(data.token);
    if (data.refreshToken) await storeRefreshToken(data.refreshToken);
    setAuthToken(data.token);
    setUserId(data.userId);
    setIsAuthenticated(true);
    setHasProfile(data.hasProfile);
    clearGuestMode();
    void registerForPushNotifications(data.userId);
    return data;
  };

  const patchCurrentUser = async (patch: Partial<UserProfile>) => {
    if (!currentUser) return;
    const merged = { ...currentUser, ...patch };
    setCurrentUserState(merged);
    await AsyncStorage.setItem('currentUser', JSON.stringify(merged));
  };

  const setCurrentUser = async (user: UserProfile) => {
    setCurrentUserState(user);
    await AsyncStorage.setItem('currentUser', JSON.stringify(user));
    if (user.age > 0 && user.name.trim().length > 0) setHasProfile(true);
    if (!userId) return;
    try {
      await apiFetch(`/profile/me`, userId, { method: 'PUT', body: JSON.stringify(user) });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sync profile');
    }
  };

  const refreshProfiles = useCallback(async () => {
    if (!userId || !isAuthenticated) return;
    setProfilesLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.budgetMin > 0) params.set('budgetMin', String(filters.budgetMin));
      if (filters.budgetMax < 5000) params.set('budgetMax', String(filters.budgetMax));
      if (filters.noiseLevel) params.set('noiseLevel', filters.noiseLevel);
      if (filters.smokingOk === false) params.set('smokingOk', 'false');
      if (filters.sameGenderOnly) params.set('sameGenderOnly', 'true');
      if (filters.moveInDateFrom) params.set('moveInDateFrom', filters.moveInDateFrom);
      if (filters.moveInDateTo) params.set('moveInDateTo', filters.moveInDateTo);
      if (filters.neighborhoods?.length) params.set('neighborhoods', filters.neighborhoods.join(','));
      if (filters.cleanliness) params.set('cleanliness', String(filters.cleanliness));
      if (filters.drinking) params.set('drinking', filters.drinking);
      if (filters.guests) params.set('guests', filters.guests);
      if (filters.pets !== null && filters.pets !== undefined) params.set('pets', String(filters.pets));

      const qs = params.toString();
      const [profileData, shortlistedData] = await Promise.all([
        apiFetch<{ profiles: RoommateProfile[] }>(`/profiles${qs ? `?${qs}` : ''}`, userId),
        apiFetch<{ profiles: RoommateProfile[] }>('/profiles?shortlistedOnly=true', userId),
      ]);
      setFilteredProfiles(profileData.profiles);
      setShortlisted(shortlistedData.profiles);
      setVerificationRequired(false);
    } catch (err) {
      if (err instanceof Error && err.message.includes('verification_required')) {
        setVerificationRequired(true);
      } else {
        setError(err instanceof Error ? err.message : 'Failed to load profiles');
      }
    } finally {
      setProfilesLoading(false);
    }
  }, [userId, isAuthenticated, filters]);

  const refreshMatches = useCallback(async () => {
    if (!userId || !isAuthenticated) return;
    setMatchesLoading(true);
    try {
      const data = await apiFetch<{ matches: Match[] }>('/matches', userId);
      setMatches(data.matches);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load matches');
    } finally {
      setMatchesLoading(false);
    }
  }, [userId, isAuthenticated]);

  const refreshMessages = useCallback(async (matchId: string) => {
    if (!userId || !isAuthenticated) return;
    try {
      const data = await apiFetch<{ messages: Message[] }>(`/messages/${matchId}`, userId);
      setMessages((prev) => {
        const withoutMatch = prev.filter((m) => m.matchId !== matchId);
        return [...withoutMatch, ...data.messages];
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load messages');
    }
  }, [userId, isAuthenticated]);

  const refreshHousing = useCallback(async () => {
    setHousingLoading(true);
    try {
      const data = await apiFetch<{ listings: HousingListing[] }>('/housing', userId);
      setHousing(data.listings);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load housing');
    } finally {
      setHousingLoading(false);
    }
  }, [userId]);

  const refreshGroups = useCallback(async () => {
    setGroupsLoading(true);
    try {
      const data = await apiFetch<{ listings: HousingListing[] }>('/housing?type=forming_group', userId);
      setGroups(data.listings);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load groups');
    } finally {
      setGroupsLoading(false);
    }
  }, [userId]);

  const swipe = async (profileId: string, action: 'like' | 'skip' | 'shortlist'): Promise<boolean> => {
    const newAction: SwipeAction = { profileId, action };
    const removedProfile = filteredProfiles.find((p) => p.id === profileId);
    setSwipeActions((prev) => [...prev, newAction]);
    setFilteredProfiles((prev) => prev.filter((p) => p.id !== profileId));
    if (action === 'shortlist' && removedProfile) {
      setShortlisted((prev) => [...prev, removedProfile]);
    }
    if (!userId) return false;
    try {
      const result = await apiFetch<{ matched: boolean; matchId?: string }>(
        '/swipes', userId, { method: 'POST', body: JSON.stringify({ profileId, action }) },
      );
      if (result.matched && result.matchId) {
        await refreshMatches();
        return true;
      }
      return false;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record swipe');
      setSwipeActions((prev) => prev.filter((a) => a.profileId !== profileId));
      if (removedProfile) setFilteredProfiles((prev) => [removedProfile, ...prev]);
      if (action === 'shortlist' && removedProfile) {
        setShortlisted((prev) => prev.filter((p) => p.id !== profileId));
      }
      return false;
    }
  };

  const undoLastSwipe = async () => {
    if (swipeActions.length === 0) return;
    const last = swipeActions[swipeActions.length - 1];
    setSwipeActions((prev) => prev.slice(0, -1));
    try {
      await apiFetch<{ ok: boolean }>(`/swipes/${encodeURIComponent(last.profileId)}`, userId, { method: 'DELETE' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to undo swipe');
    }
    refreshProfiles();
  };

  const sendMessage = async (matchId: string, text: string): Promise<void> => {
    if (!userId) return;
    const optimisticMsg: Message = { id: uniqueId(), matchId, senderId: userId, text, timestamp: new Date().toISOString() };
    const prevLastMessage = matches.find((m) => m.id === matchId)?.lastMessage ?? '';
    const prevLastMessageTime = matches.find((m) => m.id === matchId)?.lastMessageTime ?? '';
    setMessages((prev) => [...prev, optimisticMsg]);
    setMatches((prev) => prev.map((m) => m.id === matchId ? { ...m, lastMessage: text, lastMessageTime: new Date().toISOString() } : m));
    try {
      const saved = await apiFetch<Message>(`/messages/${matchId}`, userId, { method: 'POST', body: JSON.stringify({ text }) });
      setMessages((prev) => prev.map((m) => (m.id === optimisticMsg.id ? { ...saved, timestamp: saved.timestamp } : m)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
      setMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id));
      setMatches((prev) => prev.map((m) => m.id === matchId ? { ...m, lastMessage: prevLastMessage, lastMessageTime: prevLastMessageTime } : m));
    }
  };

  const markAsRead = async (matchId: string): Promise<void> => {
    setMatches((prev) => prev.map((m) => (m.id === matchId ? { ...m, unread: 0 } : m)));
    if (!userId) return;
    try {
      await apiFetch(`/messages/${matchId}/read`, userId, { method: 'POST' });
    } catch {
      // non-critical
    }
  };

  const unmatch = async (matchId: string): Promise<void> => {
    if (!userId) return;
    await apiFetch(`/matches/${matchId}`, userId, { method: 'DELETE' });
    setMatches((prev) => prev.filter((m) => m.id !== matchId));
  };

  const setFilters = (f: FilterSettings) => {
    setFiltersState(f);
    AsyncStorage.setItem('filters', JSON.stringify(f));
  };

  // Verification
  const refreshVerificationStatus = useCallback(async () => {
    if (!userId) return;
    try {
      const status = await apiFetch<VerificationStatus>('/verification/status', userId);
      setVerificationStatus(status);
      if (status.isVerified) setVerificationRequired(false);
    } catch {
      // non-critical
    }
  }, [userId]);

  const requestVerification = async (eduEmail: string) => {
    if (!userId) return;
    await apiFetch('/verification/request', userId, { method: 'POST', body: JSON.stringify({ eduEmail }) });
    await refreshVerificationStatus();
  };

  const confirmVerification = async (code: string) => {
    if (!userId) return;
    await apiFetch('/verification/confirm', userId, { method: 'POST', body: JSON.stringify({ code }) });
    await refreshVerificationStatus();
    // Refresh profile to get updated isVerified/badges
    const updated = await apiFetch<UserProfile>('/profile/me', userId);
    setCurrentUserState(updated);
    await AsyncStorage.setItem('currentUser', JSON.stringify(updated));
    setVerificationRequired(false);
    await refreshProfiles();
  };

  const resendVerification = async () => {
    if (!userId) return;
    await apiFetch('/verification/resend', userId, { method: 'POST' });
  };

  // Safety
  const refreshBlockedUsers = useCallback(async () => {
    if (!userId) return;
    try {
      const data = await apiFetch<{ blocked: BlockedUser[] }>('/blocks', userId);
      setBlockedUsers(data.blocked);
    } catch {
      // non-critical
    }
  }, [userId]);

  const blockUser = async (blockedId: string, reason?: string) => {
    if (!userId) return;
    await apiFetch('/blocks', userId, { method: 'POST', body: JSON.stringify({ blockedId, reason }) });
    setMatches((prev) => prev.filter((m) => m.profile.id !== blockedId));
    setFilteredProfiles((prev) => prev.filter((p) => p.id !== blockedId));
    await refreshBlockedUsers();
  };

  const unblockUser = async (blockedId: string) => {
    if (!userId) return;
    await apiFetch(`/blocks/${blockedId}`, userId, { method: 'DELETE' });
    await refreshBlockedUsers();
  };

  const reportUser = async (reportedId: string, matchId: string | null, category: string, description?: string) => {
    if (!userId) return;
    await apiFetch('/reports', userId, {
      method: 'POST',
      body: JSON.stringify({ reportedId, matchId, category, description }),
    });
  };

  // Account lifecycle
  const deactivateAccount = async () => {
    if (!userId) return;
    await apiFetch('/account/deactivate', userId, { method: 'POST' });
    await patchCurrentUser({ deactivatedAt: new Date().toISOString() } as any);
  };

  const reactivateAccount = async () => {
    if (!userId) return;
    await apiFetch('/account/reactivate', userId, { method: 'POST' });
    await patchCurrentUser({ deactivatedAt: null } as any);
  };

  const deleteAccount = async (reason?: string) => {
    if (!userId) return;
    await apiFetch('/account', userId, { method: 'DELETE', body: JSON.stringify({ reason }) });
    await logout();
  };

  const submitFeedback = async (category: string, body: string, appVersion?: string) => {
    if (!userId) return;
    await apiFetch('/feedback', userId, { method: 'POST', body: JSON.stringify({ category, body, appVersion }) });
  };

  // AI
  const generateBio = async (): Promise<string> => {
    if (!userId) throw new Error('Not authenticated');
    const result = await apiFetch<{ bio: string }>('/ai/bio', userId, { method: 'POST' });
    return result.bio;
  };

  // Housing actions
  const createHousingListing = async (data: Record<string, unknown>): Promise<HousingListing> => {
    if (!userId) throw new Error('Not authenticated');
    const listing = await apiFetch<HousingListing>('/housing', userId, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (listing.type === 'forming_group') {
      setGroups((prev) => [listing, ...prev]);
    } else {
      setHousing((prev) => [listing, ...prev]);
    }
    return listing;
  };

  const updateHousingListing = async (listingId: string, data: Record<string, unknown>): Promise<HousingListing> => {
    if (!userId) throw new Error('Not authenticated');
    const listing = await apiFetch<HousingListing>(`/housing/${listingId}`, userId, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    const replace = (prev: HousingListing[]) => prev.map((l) => (l.id === listingId ? listing : l));
    setHousing(replace);
    setGroups(replace);
    return listing;
  };

  const deleteHousingListing = async (listingId: string): Promise<void> => {
    if (!userId) throw new Error('Not authenticated');
    await apiFetch(`/housing/${listingId}`, userId, { method: 'DELETE' });
    const remove = (prev: HousingListing[]) => prev.filter((l) => l.id !== listingId);
    setHousing(remove);
    setGroups(remove);
  };

  const sendJoinRequest = async (listingId: string, message?: string) => {
    if (!userId) throw new Error('Not authenticated');
    return apiFetch<{ status: string; matchId?: string; requestId?: string }>(
      `/housing/${listingId}/join-requests`, userId, {
        method: 'POST',
        body: JSON.stringify({ message }),
      },
    );
  };

  const getJoinRequests = async (listingId: string): Promise<JoinRequest[]> => {
    if (!userId) throw new Error('Not authenticated');
    const data = await apiFetch<{ requests: JoinRequest[] }>(`/housing/${listingId}/join-requests`, userId);
    return data.requests;
  };

  const approveJoinRequest = async (requestId: string) => {
    if (!userId) throw new Error('Not authenticated');
    await apiFetch(`/housing/join-requests/${requestId}/approve`, userId, { method: 'POST' });
  };

  const denyJoinRequest = async (requestId: string) => {
    if (!userId) throw new Error('Not authenticated');
    await apiFetch(`/housing/join-requests/${requestId}/deny`, userId, { method: 'POST' });
  };

  const withdrawJoinRequest = async (requestId: string) => {
    if (!userId) throw new Error('Not authenticated');
    await apiFetch(`/housing/join-requests/${requestId}`, userId, { method: 'DELETE' });
  };

  const handleNewMessage = useCallback((message: Message) => {
    if (message.senderId === userId) return;
    setMessages((prev) => {
      const exists = prev.some((m) => m.id === message.id);
      if (exists) return prev;
      return [...prev, message];
    });
    setMatches((prev) => prev.map((m) => {
      if (m.id !== message.matchId) return m;
      return {
        ...m,
        lastMessage: message.text,
        lastMessageTime: message.timestamp,
        unread: m.id === activeChatMatchId ? m.unread : m.unread + 1,
      };
    }));
  }, [userId, activeChatMatchId]);

  const matchIds = matches.map((m) => m.id);
  useSocket({ authToken, matchIds, activeChatMatchId, onNewMessage: handleNewMessage, onStatusChange: setSocketStatus });

  return (
    <AppContext.Provider value={{
      currentUser, userId, isAuthenticated, hasProfile, isGuest, guestProfile, clearGuestMode, pendingGuestAction, setPendingGuestAction, verificationRequired,
      setCurrentUser, patchCurrentUser, login, register, oauthSignIn, logout,
      swipeActions, swipe, undoLastSwipe,
      matches, messages, sendMessage, markAsRead, unmatch,
      housing, groups, groupsLoading, refreshGroups, filters, setFilters,
      filteredProfiles, shortlisted,
      loading, profilesLoading, matchesLoading, housingLoading,
      error, clearError,
      refreshMatches, refreshMessages, refreshProfiles, refreshHousing,
      socketStatus, setActiveChatMatchId,
      verificationStatus, requestVerification, confirmVerification, resendVerification, refreshVerificationStatus,
      blockUser, unblockUser, blockedUsers, refreshBlockedUsers,
      reportUser,
      deactivateAccount, reactivateAccount, deleteAccount, submitFeedback,
      generateBio,
      createHousingListing, updateHousingListing, deleteHousingListing, sendJoinRequest, getJoinRequests, approveJoinRequest, denyJoinRequest, withdrawJoinRequest,
    } as AppContextType}>
      {children}
    </AppContext.Provider>
  );
}

function base64UrlDecode(str: string): string {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '=='.slice(0, (4 - (base64.length % 4)) % 4);
  try {
    return decodeURIComponent(atob(padded).split('').map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
  } catch {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    let result = '';
    let bits = 0;
    let acc = 0;
    for (const char of padded) {
      const idx = chars.indexOf(char);
      if (idx === -1) continue;
      acc = (acc << 6) | idx;
      bits += 6;
      if (bits >= 8) {
        bits -= 8;
        result += String.fromCharCode((acc >> bits) & 0xff);
      }
    }
    return decodeURIComponent(result.split('').map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
  }
}

function parseJwt(token: string): { userId: string; email: string; exp?: number } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(base64UrlDecode(parts[1])) as { userId?: string; email?: string; exp?: number };
    if (!payload.userId) return null;
    if (payload.exp && payload.exp * 1000 < Date.now()) return null;
    return payload as { userId: string; email: string; exp?: number };
  } catch {
    return null;
  }
}

async function tryRefreshOnStartup(nativeRefreshToken: string): Promise<boolean> {
  try {
    if (Platform.OS === 'web') {
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (!res.ok) return false;
      const data = (await res.json()) as { token: string };
      if (!data.token) return false;
      await storeToken(data.token);
      return true;
    }
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Client-Type': 'native' },
      body: JSON.stringify({ refreshToken: nativeRefreshToken }),
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { token: string; refreshToken: string };
    if (!data.token || !data.refreshToken) return false;
    await storeToken(data.token);
    await storeRefreshToken(data.refreshToken);
    return true;
  } catch {
    return false;
  }
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
