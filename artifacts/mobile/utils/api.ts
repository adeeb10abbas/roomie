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
export const REFRESH_TOKEN_KEY = "auth_refresh_token";

/**
 * On web, the access token is kept in localStorage (short-lived, 15 min).
 * On native, it's stored in SecureStore.
 */
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

/**
 * Refresh-token storage.
 *
 * Web: stored as an httpOnly cookie set by the server — never touched by JS.
 *      These helpers are intentional no-ops for web so that localStorage is
 *      never used as a fallback (which would be readable by XSS).
 *
 * Native (iOS / Android): stored in SecureStore (encrypted on-device storage).
 *      The raw token is kept here and sent in the request body to /auth/refresh.
 */
export async function getStoredRefreshToken(): Promise<string | null> {
  if (Platform.OS === "web") {
    // Web uses httpOnly cookie — token is not readable from JS
    return null;
  }
  try {
    return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function storeRefreshToken(token: string): Promise<void> {
  if (Platform.OS === "web") {
    // Web: the server already set the httpOnly cookie — nothing to do in JS
    return;
  }
  try {
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
  } catch {
    // ignore storage errors
  }
}

export async function clearRefreshToken(): Promise<void> {
  if (Platform.OS === "web") {
    // Web: the server clears the cookie on /auth/logout — nothing to do in JS
    return;
  }
  try {
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  } catch {
    // ignore storage errors
  }
}

let _onUnauthorized: (() => void) | null = null;
let _onTokenRefreshed: ((newToken: string) => void) | null = null;

export function setUnauthorizedHandler(handler: () => void) {
  _onUnauthorized = handler;
}

/**
 * Registers a callback that is invoked whenever a silent refresh succeeds.
 * Use this to propagate the new access token to in-memory state (e.g. socket auth).
 */
export function setTokenRefreshedHandler(handler: (newToken: string) => void) {
  _onTokenRefreshed = handler;
}

/**
 * Single-flight refresh lock.
 * At most one refresh request runs at a time. Concurrent 401 responses
 * all await the same in-flight promise, preventing multiple rotations of
 * a one-time-use refresh token (which would cause successive refreshes to
 * fail and trigger an unexpected logout).
 */
let _refreshPromise: Promise<boolean> | null = null;

async function doRefresh(): Promise<boolean> {
  try {
    let newAccessToken: string | null = null;

    if (Platform.OS === "web") {
      // Browser sends the httpOnly refresh-token cookie automatically
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok) return false;
      const data = (await res.json()) as { token?: string };
      if (!data.token) return false;
      newAccessToken = data.token;
    } else {
      // Native: send refresh token in body with client type header
      const refreshToken = await getStoredRefreshToken();
      if (!refreshToken) return false;

      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Client-Type": "native",
        },
        body: JSON.stringify({ refreshToken }),
      });
      if (!res.ok) return false;
      const data = (await res.json()) as { token?: string; refreshToken?: string };
      if (!data.token || !data.refreshToken) return false;
      newAccessToken = data.token;
      await storeRefreshToken(data.refreshToken);
    }

    await storeToken(newAccessToken);
    // Notify AppContext so it can update authToken state (used by socket auth)
    if (_onTokenRefreshed) {
      _onTokenRefreshed(newAccessToken);
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Attempts a silent token refresh.
 * Guarantees at most one concurrent refresh request (single-flight pattern):
 * all callers share the same in-flight promise.
 */
function attemptTokenRefresh(): Promise<boolean> {
  if (_refreshPromise) return _refreshPromise;
  _refreshPromise = doRefresh().finally(() => {
    _refreshPromise = null;
  });
  return _refreshPromise;
}

/**
 * Native clients set this header so the server knows to include the raw
 * refresh token in the JSON response body (for SecureStore persistence).
 * Web clients rely on the httpOnly cookie instead.
 */
const NATIVE_CLIENT_HEADERS: Record<string, string> =
  Platform.OS !== "web" ? { "X-Client-Type": "native" } : {};

export async function apiFetch<T>(
  path: string,
  _userId: string | null,
  options: RequestInit = {},
  _isRetry = false,
): Promise<T> {
  const token = await getStoredToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...NATIVE_CLIENT_HEADERS,
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const fetchOptions: RequestInit = {
    ...options,
    headers,
    // Include cookies on web so the httpOnly refresh token cookie is always sent
    ...(Platform.OS === "web" ? { credentials: "include" } : {}),
  };

  const res = await fetch(`${API_BASE}${path}`, fetchOptions);

  if (res.status === 401) {
    if (!_isRetry) {
      // Single-flight refresh — all concurrent 401s share one refresh attempt
      const refreshed = await attemptTokenRefresh();
      if (refreshed) {
        return apiFetch<T>(path, _userId, options, true);
      }
    }
    // Refresh failed or this is already a retry — trigger logout
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
