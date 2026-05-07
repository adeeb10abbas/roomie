import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

const getApiBase = (): string => {
  if (Platform.OS === "web") {
    return "/api";
  }
  const domain = process.env.EXPO_PUBLIC_REPLIT_DEV_DOMAIN;
  if (domain) return `https://${domain}/api`;
  return "http://localhost/api";
};

export const API_BASE = getApiBase();

export const TOKEN_KEY = "auth_token";

export async function getStoredToken(): Promise<string | null> {
  try {
    if (Platform.OS === "web") {
      return localStorage.getItem(TOKEN_KEY);
    }
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function storeToken(token: string): Promise<void> {
  try {
    if (Platform.OS === "web") {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      await SecureStore.setItemAsync(TOKEN_KEY, token);
    }
  } catch {
    // ignore storage errors
  }
}

export async function clearToken(): Promise<void> {
  try {
    if (Platform.OS === "web") {
      localStorage.removeItem(TOKEN_KEY);
    } else {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    }
  } catch {
    // ignore storage errors
  }
}

let _onUnauthorized: (() => void) | null = null;

export function setUnauthorizedHandler(handler: () => void) {
  _onUnauthorized = handler;
}

export async function apiFetch<T>(
  path: string,
  _userId: string | null,
  options: RequestInit = {},
): Promise<T> {
  const token = await getStoredToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (res.status === 401) {
    if (_onUnauthorized) {
      _onUnauthorized();
    }
    throw new Error("API error 401: Unauthorized");
  }

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API error ${res.status}: ${body}`);
  }
  return res.json() as Promise<T>;
}
