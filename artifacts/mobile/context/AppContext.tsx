import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  UserProfile, RoommateProfile, SwipeAction, Match,
  Message, HousingListing, FilterSettings,
} from './types';
import { MOCK_PROFILES, MOCK_HOUSING, INITIAL_MATCHES, INITIAL_MESSAGES } from '@/data/mockData';
import { uniqueId } from '@/utils/time';

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
  setCurrentUser: (user: UserProfile) => Promise<void>;
  swipeActions: SwipeAction[];
  swipe: (profileId: string, action: 'like' | 'skip' | 'shortlist') => boolean;
  undoLastSwipe: () => void;
  matches: Match[];
  messages: Message[];
  sendMessage: (matchId: string, text: string) => void;
  markAsRead: (matchId: string) => void;
  housing: HousingListing[];
  filters: FilterSettings;
  setFilters: (f: FilterSettings) => void;
  filteredProfiles: RoommateProfile[];
  shortlisted: RoommateProfile[];
  loading: boolean;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUserState] = useState<UserProfile | null>(null);
  const [swipeActions, setSwipeActions] = useState<SwipeAction[]>([]);
  const [matches, setMatches] = useState<Match[]>(INITIAL_MATCHES);
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [filters, setFiltersState] = useState<FilterSettings>(DEFAULT_FILTERS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [userStr, actionsStr, matchesStr, messagesStr, filtersStr] = await Promise.all([
        AsyncStorage.getItem('currentUser'),
        AsyncStorage.getItem('swipeActions'),
        AsyncStorage.getItem('matches'),
        AsyncStorage.getItem('messages'),
        AsyncStorage.getItem('filters'),
      ]);
      if (userStr) setCurrentUserState(JSON.parse(userStr));
      if (actionsStr) setSwipeActions(JSON.parse(actionsStr));
      if (matchesStr) setMatches(JSON.parse(matchesStr));
      if (messagesStr) setMessages(JSON.parse(messagesStr));
      if (filtersStr) setFiltersState(JSON.parse(filtersStr));
    } catch (_) {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const setCurrentUser = async (user: UserProfile) => {
    setCurrentUserState(user);
    await AsyncStorage.setItem('currentUser', JSON.stringify(user));
  };

  const swipe = (profileId: string, action: 'like' | 'skip' | 'shortlist'): boolean => {
    const newAction: SwipeAction = { profileId, action };
    const newActions = [...swipeActions, newAction];
    setSwipeActions(newActions);
    AsyncStorage.setItem('swipeActions', JSON.stringify(newActions));

    if (action === 'like' || action === 'shortlist') {
      const profile = MOCK_PROFILES.find(p => p.id === profileId);
      if (profile && Math.random() < 0.35) {
        const newMatch: Match = {
          id: uniqueId(),
          profile,
          matchedAt: new Date().toISOString(),
          lastMessage: '',
          lastMessageTime: '',
          unread: 0,
        };
        const newMatches = [newMatch, ...matches];
        setMatches(newMatches);
        AsyncStorage.setItem('matches', JSON.stringify(newMatches));
        return true;
      }
    }
    return false;
  };

  const undoLastSwipe = () => {
    if (swipeActions.length === 0) return;
    const newActions = swipeActions.slice(0, -1);
    setSwipeActions(newActions);
    AsyncStorage.setItem('swipeActions', JSON.stringify(newActions));
  };

  const sendMessage = (matchId: string, text: string) => {
    const newMsg: Message = {
      id: uniqueId(),
      matchId,
      senderId: 'me',
      text,
      timestamp: new Date().toISOString(),
    };
    const newMessages = [...messages, newMsg];
    setMessages(newMessages);
    AsyncStorage.setItem('messages', JSON.stringify(newMessages));

    const newMatches = matches.map(m =>
      m.id === matchId ? { ...m, lastMessage: text, lastMessageTime: new Date().toISOString() } : m
    );
    setMatches(newMatches);
    AsyncStorage.setItem('matches', JSON.stringify(newMatches));
  };

  const markAsRead = (matchId: string) => {
    const newMatches = matches.map(m => m.id === matchId ? { ...m, unread: 0 } : m);
    setMatches(newMatches);
    AsyncStorage.setItem('matches', JSON.stringify(newMatches));
  };

  const setFilters = (f: FilterSettings) => {
    setFiltersState(f);
    AsyncStorage.setItem('filters', JSON.stringify(f));
  };

  const swipedIds = new Set(swipeActions.map(a => a.profileId));
  const filteredProfiles = MOCK_PROFILES.filter(p => {
    if (swipedIds.has(p.id)) return false;
    if (filters.budgetMax < 5000 && p.budgetMin > filters.budgetMax) return false;
    if (filters.budgetMin > 0 && p.budgetMax < filters.budgetMin) return false;
    if (filters.noiseLevel && p.lifestyle.noise !== filters.noiseLevel) return false;
    if (filters.smokingOk === false && p.lifestyle.smoking) return false;
    if (filters.sameGenderOnly && currentUser && p.gender !== currentUser.gender) return false;
    return true;
  });

  const shortlisted = MOCK_PROFILES.filter(p =>
    swipeActions.some(a => a.profileId === p.id && a.action === 'shortlist')
  );

  return (
    <AppContext.Provider value={{
      currentUser,
      setCurrentUser,
      swipeActions,
      swipe,
      undoLastSwipe,
      matches,
      messages,
      sendMessage,
      markAsRead,
      housing: MOCK_HOUSING,
      filters,
      setFilters,
      filteredProfiles,
      shortlisted,
      loading,
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
