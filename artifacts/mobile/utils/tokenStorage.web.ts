export const TOKEN_KEY = "auth_token";
export const REFRESH_TOKEN_KEY = "auth_refresh_token";

export async function getStoredToken(): Promise<string | null> {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function storeToken(token: string): Promise<void> {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {}
}

export async function clearToken(): Promise<void> {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {}
}

export async function getStoredRefreshToken(): Promise<string | null> {
  return null;
}

export async function storeRefreshToken(_token: string): Promise<void> {}

export async function clearRefreshToken(): Promise<void> {}
