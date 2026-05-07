import { Platform } from "react-native";

const getApiBase = (): string => {
  if (Platform.OS === "web") {
    return "/api";
  }
  const domain = process.env.EXPO_PUBLIC_REPLIT_DEV_DOMAIN;
  if (domain) return `https://${domain}/api`;
  return "http://localhost/api";
};

export const API_BASE = getApiBase();

export async function apiFetch<T>(
  path: string,
  userId: string | null,
  options: RequestInit = {},
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (userId) {
    headers["x-user-id"] = userId;
  }
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API error ${res.status}: ${body}`);
  }
  return res.json() as Promise<T>;
}
