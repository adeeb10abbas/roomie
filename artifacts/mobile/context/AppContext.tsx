import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  UserProfile, RoommateProfile, SwipeAction, Match,
  Message, HousingListing, FilterSettings,
} from './types';
import { apiFetch, API_BASE, getStoredToken, storeToken, clearToken, setUnauthorizedHandler } from '@/utils/api';
import { uniqueId } from '@/utils/time';
import { router } from 'expo-router';
import { useSocket, SocketStatus } from '@/hooks/useSocket';

/**
 * AsyncStorage is kept only for two pieces of local-only state:
 *  - currentUser  : cached profile so the app renders without a round-trip on cold start
 *  - filters      : user's last-used filter preferences (UI state, not server-owned)
 *
 * Authentication is now JWT-based. The token is stored in SecureStore (or localStorage on web).
 * userId is derived from the JWT payload; no longer stored separately in AsyncStorage.
 */

const DEFAULT_FILTERS: FilterSettings = {
  budgetMin: 0,
  budgetMax: 5000,
  neighborhoods: [],
  noiseLevel: '',
  smokingOk: null,
  sameGenderOnly: false,
};

interface AuthResult {
  token: string;
  userId: string;
  email: string;
  hasProfile: boolean;
}

interface AppContextType {
  currentUser: UserProfile | null;
  userId: string | null;
  isAuthenticated: boolean;
  hasProfile: boolean;
  setCurrentUser: (user: UserProfile) => Promise<void>;
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
  housing: HousingListing[];
  filters: FilterSettings;
  setFilters: (f: FilterSettings) => void;
  filteredProfiles: RoommateProfile[];
  shortlisted: RoommateProfile[];
  loading: boolean;
  profilesLoading: boolean;
  error: string | null;
  clearError: () => void;
  refreshMatches: () => Promise<void>;
  refreshMessages: (matchId: string) => Promise<void>;
  refreshProfiles: () => Promise<void>;
  socketStatus: SocketStatus;
  setActiveChatMatchId: (matchId: string | null) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUserState] = useState<UserProfile | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);
  const [swipeActions, setSwipeActions] = useState<SwipeAction[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [housing, setHousing] = useState<HousingListing[]>([]);
  const [filteredProfiles, setFilteredProfiles] = useState<RoommateProfile[]>([]);
  const [shortlisted, setShortlisted] = useState<RoommateProfile[]>([]);
  const [filters, setFiltersState] = useState<FilterSettings>(DEFAULT_FILTERS);
  const [loading, setLoading] = useState(true);
  const [profilesLoading, setProfilesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [socketStatus, setSocketStatus] = useState<SocketStatus>('disconnected');
  const [activeChatMatchId, setActiveChatMatchId] = useState<string | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);

  const clearError = () => setError(null);

  const logout = useCallback(async () => {
    await clearToken();
    await AsyncStorage.multiRemove(['currentUser', 'filters']);
    setAuthToken(null);
    setCurrentUserState(null);
    setUserId(null);
    setIsAuthenticated(false);
    setHasProfile(false);
    setSwipeActions([]);
    setMatches([]);
    setMessages([]);
    setFilteredProfiles([]);
    setShortlisted([]);
    router.replace('/login');
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      logout();
    });
  }, [logout]);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (userId && isAuthenticated) {
      refreshMatches();
      fetchHousing();
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
      if (!token) {
        setLoading(false);
        return;
      }

      const filtersStr = await AsyncStorage.getItem('filters');
      if (filtersStr) setFiltersState(JSON.parse(filtersStr));

      const payload = parseJwt(token);
      if (!payload?.userId) {
        // Token is invalid or expired — clear it
        await clearToken();
        await AsyncStorage.multiRemove(['currentUser']);
        setLoading(false);
        return;
      }

      setUserId(payload.userId);
      setIsAuthenticated(true);
      setAuthToken(token);

      // Fetch profile from server to get authoritative hasProfile state.
      // Fall back to cached value for UI speed, then update.
      const cachedUserStr = await AsyncStorage.getItem('currentUser');
      if (cachedUserStr) {
        const cached = JSON.parse(cachedUserStr) as UserProfile;
        setCurrentUserState(cached);
        // Consider profile complete if cached has meaningful data
        setHasProfile(cached.age > 0 && cached.name.trim().length > 0);
      }

      try {
        const serverProfile = await apiFetch<UserProfile>('/profile/me', payload.userId);
        setCurrentUserState(serverProfile);
        await AsyncStorage.setItem('currentUser', JSON.stringify(serverProfile));
        setHasProfile(serverProfile.age > 0 && serverProfile.name.trim().length > 0);
      } catch {
        // Server fetch failed (network/offline) — keep cached profile state
        // hasProfile was already set from cache above; if no cache, stays false
      }
    } catch {
      // On any unexpected error, clear potentially corrupted auth state
      await clearToken();
      await AsyncStorage.multiRemove(['currentUser']);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<AuthResult> => {
    const result = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!result.ok) {
      const body = await result.text();
      throw new Error(`API error ${result.status}: ${body}`);
    }

    const data = await result.json() as AuthResult;
    await storeToken(data.token);
    setAuthToken(data.token);
    setUserId(data.userId);
    setIsAuthenticated(true);
    setHasProfile(data.hasProfile);
    return data;
  };

  const register = async (name: string, email: string, password: string): Promise<AuthResult> => {
    const result = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });

    if (!result.ok) {
      const body = await result.text();
      throw new Error(`API error ${result.status}: ${body}`);
    }

    const data = await result.json() as AuthResult;
    await storeToken(data.token);
    setAuthToken(data.token);
    setUserId(data.userId);
    setIsAuthenticated(true);
    setHasProfile(data.hasProfile);
    return data;
  };

  const oauthSignIn = async (
    provider: 'google' | 'apple',
    idToken: string,
    name?: string,
  ): Promise<AuthResult> => {
    const result = await fetch(`${API_BASE}/auth/oauth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider, idToken, name }),
    });

    if (!result.ok) {
      const body = await result.text();
      throw new Error(`API error ${result.status}: ${body}`);
    }

    const data = await result.json() as AuthResult;
    await storeToken(data.token);
    setAuthToken(data.token);
    setUserId(data.userId);
    setIsAuthenticated(true);
    setHasProfile(data.hasProfile);
    return data;
  };

  const setCurrentUser = async (user: UserProfile) => {
    setCurrentUserState(user);
    await AsyncStorage.setItem('currentUser', JSON.stringify(user));
    if (user.age > 0 && user.name.trim().length > 0) {
      setHasProfile(true);
    }

    const uid = userId;
    if (!uid) return;

    try {
      await apiFetch(`/profile/me`, uid, {
        method: 'PUT',
        body: JSON.stringify(user),
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to sync profile';
      setError(msg);
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

      const qs = params.toString();
      const [profileData, shortlistedData] = await Promise.all([
        apiFetch<{ profiles: RoommateProfile[] }>(
          `/profiles${qs ? `?${qs}` : ''}`,
          userId,
        ),
        apiFetch<{ profiles: RoommateProfile[] }>(
          '/profiles?shortlistedOnly=true',
          userId,
        ),
      ]);
      setFilteredProfiles(profileData.profiles);
      setShortlisted(shortlistedData.profiles);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load profiles';
      setError(msg);
    } finally {
      setProfilesLoading(false);
    }
  }, [userId, isAuthenticated, filters]);

  const refreshMatches = useCallback(async () => {
    if (!userId || !isAuthenticated) return;
    try {
      const data = await apiFetch<{ matches: Match[] }>('/matches', userId);
      setMatches(data.matches);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load matches';
      setError(msg);
    }
  }, [userId, isAuthenticated]);

  const refreshMessages = useCallback(async (matchId: string) => {
    if (!userId || !isAuthenticated) return;
    try {
      const data = await apiFetch<{ messages: Message[] }>(
        `/messages/${matchId}`,
        userId,
      );
      setMessages((prev) => {
        const withoutMatch = prev.filter((m) => m.matchId !== matchId);
        return [...withoutMatch, ...data.messages];
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load messages';
      setError(msg);
    }
  }, [userId, isAuthenticated]);

  const fetchHousing = useCallback(async () => {
    try {
      const data = await apiFetch<{ listings: HousingListing[] }>('/housing', userId);
      setHousing(data.listings);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load housing';
      setError(msg);
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
        '/swipes',
        userId,
        { method: 'POST', body: JSON.stringify({ profileId, action }) },
      );

      if (result.matched && result.matchId) {
        await refreshMatches();
        return true;
      }
      return false;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to record swipe';
      setError(msg);
      setSwipeActions((prev) => prev.filter((a) => a.profileId !== profileId));
      if (removedProfile) {
        setFilteredProfiles((prev) => [removedProfile, ...prev]);
      }
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
      await apiFetch<{ ok: boolean }>(
        `/swipes/${encodeURIComponent(last.profileId)}`,
        userId,
        { method: 'DELETE' },
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to undo swipe';
      setError(msg);
    }
    refreshProfiles();
  };

  const sendMessage = async (matchId: string, text: string): Promise<void> => {
    if (!userId) return;

    const optimisticMsg: Message = {
      id: uniqueId(),
      matchId,
      senderId: userId,
      text,
      timestamp: new Date().toISOString(),
    };
    const prevLastMessage = matches.find((m) => m.id === matchId)?.lastMessage ?? '';
    const prevLastMessageTime = matches.find((m) => m.id === matchId)?.lastMessageTime ?? '';

    setMessages((prev) => [...prev, optimisticMsg]);
    setMatches((prev) =>
      prev.map((m) =>
        m.id === matchId
          ? { ...m, lastMessage: text, lastMessageTime: new Date().toISOString() }
          : m,
      ),
    );

    try {
      const saved = await apiFetch<Message>(
        `/messages/${matchId}`,
        userId,
        { method: 'POST', body: JSON.stringify({ text }) },
      );
      setMessages((prev) =>
        prev.map((m) => (m.id === optimisticMsg.id ? { ...saved, timestamp: saved.timestamp } : m)),
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to send message';
      setError(msg);
      setMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id));
      setMatches((prev) =>
        prev.map((m) =>
          m.id === matchId
            ? { ...m, lastMessage: prevLastMessage, lastMessageTime: prevLastMessageTime }
            : m,
        ),
      );
    }
  };

  const markAsRead = async (matchId: string): Promise<void> => {
    setMatches((prev) => prev.map((m) => (m.id === matchId ? { ...m, unread: 0 } : m)));
    if (!userId) return;
    try {
      await apiFetch(`/messages/${matchId}/read`, userId, { method: 'POST' });
    } catch {
      // Non-critical — unread count will re-sync on next refreshMatches
    }
  };

  const setFilters = (f: FilterSettings) => {
    setFiltersState(f);
    AsyncStorage.setItem('filters', JSON.stringify(f));
  };

  const handleNewMessage = useCallback((message: Message) => {
    if (message.senderId === userId) return;

    setMessages((prev) => {
      const exists = prev.some((m) => m.id === message.id);
      if (exists) return prev;
      return [...prev, message];
    });
    setMatches((prev) =>
      prev.map((m) => {
        if (m.id !== message.matchId) return m;
        return {
          ...m,
          lastMessage: message.text,
          lastMessageTime: message.timestamp,
          unread: m.id === activeChatMatchId ? m.unread : m.unread + 1,
        };
      }),
    );
  }, [userId, activeChatMatchId]);

  const matchIds = matches.map((m) => m.id);

  useSocket({
    authToken,
    matchIds,
    onNewMessage: handleNewMessage,
    onStatusChange: setSocketStatus,
  });

  return (
    <AppContext.Provider value={{
      currentUser,
      userId,
      isAuthenticated,
      hasProfile,
      setCurrentUser,
      login,
      register,
      oauthSignIn,
      logout,
      swipeActions,
      swipe,
      undoLastSwipe,
      matches,
      messages,
      sendMessage,
      markAsRead,
      housing,
      filters,
      setFilters,
      filteredProfiles,
      shortlisted,
      loading,
      profilesLoading,
      error,
      clearError,
      refreshMatches,
      refreshMessages,
      refreshProfiles,
      socketStatus,
      setActiveChatMatchId,
    }}>
      {children}
    </AppContext.Provider>
  );
}

function base64UrlDecode(str: string): string {
  // Normalize base64url → base64 then decode robustly (works in RN + web)
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '=='.slice(0, (4 - (base64.length % 4)) % 4);
  try {
    // atob is available in React Native ≥0.70 and all modern browsers
    return decodeURIComponent(
      atob(padded)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join(''),
    );
  } catch {
    // Fallback: manual base64 decode without atob (for edge environments)
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
    return decodeURIComponent(
      result.split('').map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''),
    );
  }
}

function parseJwt(token: string): { userId: string; email: string; exp?: number } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(base64UrlDecode(parts[1])) as {
      userId?: string;
      email?: string;
      exp?: number;
    };
    if (!payload.userId) return null;
    // Reject token if already expired
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      return null;
    }
    return payload as { userId: string; email: string; exp?: number };
  } catch {
    return null;
  }
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
