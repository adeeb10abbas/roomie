import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  UserProfile, RoommateProfile, SwipeAction, Match,
  Message, HousingListing, FilterSettings,
} from './types';
import { apiFetch } from '@/utils/api';
import { uniqueId } from '@/utils/time';

/**
 * AsyncStorage is intentionally kept for three pieces of local-only state:
 *  - userId       : the device-generated identity used as the x-user-id auth header
 *  - currentUser  : cached profile so the app renders without a round-trip on cold start
 *  - filters      : user's last-used filter preferences (UI state, not server-owned)
 * All relational data (profiles, matches, messages, housing) is fully DB-backed via the API.
 */

const DEFAULT_FILTERS: FilterSettings = {
  budgetMin: 0,
  budgetMax: 5000,
  neighborhoods: [],
  noiseLevel: '',
  smokingOk: null,
  sameGenderOnly: false,
};

interface AppContextType {
  currentUser: UserProfile | null;
  userId: string | null;
  setCurrentUser: (user: UserProfile) => Promise<void>;
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
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUserState] = useState<UserProfile | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
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

  const clearError = () => setError(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (userId) {
      refreshMatches();
      fetchHousing();
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      refreshProfiles();
    }
  }, [userId, filters]);

  const loadInitialData = async () => {
    try {
      const [userStr, userIdStr, filtersStr] = await Promise.all([
        AsyncStorage.getItem('currentUser'),
        AsyncStorage.getItem('userId'),
        AsyncStorage.getItem('filters'),
      ]);

      if (filtersStr) setFiltersState(JSON.parse(filtersStr));

      let resolvedUserId = userIdStr;

      if (userStr) {
        const parsedUser = JSON.parse(userStr) as UserProfile;
        setCurrentUserState(parsedUser);

        if (!resolvedUserId) {
          resolvedUserId = parsedUser.id || uniqueId();
          await AsyncStorage.setItem('userId', resolvedUserId);
        }
        setUserId(resolvedUserId);
      }
    } catch (_) {
      // ignore AsyncStorage errors on cold start
    } finally {
      setLoading(false);
    }
  };

  const setCurrentUser = async (user: UserProfile) => {
    setCurrentUserState(user);
    await AsyncStorage.setItem('currentUser', JSON.stringify(user));

    let uid = userId;
    if (!uid) {
      uid = user.id || uniqueId();
      setUserId(uid);
      await AsyncStorage.setItem('userId', uid);
    }

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
    if (!userId) return;
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
  }, [userId, filters]);

  const refreshMatches = useCallback(async () => {
    if (!userId) return;
    try {
      const data = await apiFetch<{ matches: Match[] }>('/matches', userId);
      setMatches(data.matches);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load matches';
      setError(msg);
    }
  }, [userId]);

  const refreshMessages = useCallback(async (matchId: string) => {
    if (!userId) return;
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
  }, [userId]);

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
    } catch (err) {
      // Non-critical — unread count will re-sync on next refreshMatches
      console.warn('Failed to mark as read:', err);
    }
  };

  const setFilters = (f: FilterSettings) => {
    setFiltersState(f);
    AsyncStorage.setItem('filters', JSON.stringify(f));
  };

  return (
    <AppContext.Provider value={{
      currentUser,
      userId,
      setCurrentUser,
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
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
