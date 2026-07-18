export type Membership = "free" | "vip";

export type AthenaUser = {
  id: string;
  name: string;
  avatar: string;
  membership: Membership;
};

export const USER_STORAGE_KEY = "user";
export const FAVORITES_STORAGE_KEY = "favoriteMatches";
export const RECENT_MATCHES_STORAGE_KEY = "recentMatches";
export const USER_CHANGED_EVENT = "athena:user-changed";
export const FAVORITES_CHANGED_EVENT = "athena:favorites-changed";

const defaultUser: AthenaUser = {
  id: "user001",
  name: "Athena用户",
  avatar: "",
  membership: "free",
};

function notify(eventName: string) {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(eventName));
}

export function getUser(): AthenaUser | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = window.localStorage.getItem(USER_STORAGE_KEY);
    if (!stored) return null;
    const parsed = JSON.parse(stored) as Partial<AthenaUser>;
    if (!parsed.id || !parsed.name) return null;
    return { ...defaultUser, ...parsed, membership: parsed.membership === "vip" ? "vip" : "free" };
  } catch {
    return null;
  }
}

export function login(name = defaultUser.name): AthenaUser {
  const user = { ...defaultUser, name: name.trim() || defaultUser.name };
  if (typeof window !== "undefined") {
    window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    notify(USER_CHANGED_EVENT);
  }
  return user;
}

export function logout() {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(USER_STORAGE_KEY);
    notify(USER_CHANGED_EVENT);
  }
}

export function upgradeVip(): AthenaUser {
  const user = { ...(getUser() ?? defaultUser), membership: "vip" as const };
  if (typeof window !== "undefined") {
    window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    notify(USER_CHANGED_EVENT);
  }
  return user;
}

export function getStoredIds(key: typeof FAVORITES_STORAGE_KEY | typeof RECENT_MATCHES_STORAGE_KEY): string[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(key) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

export function saveRecentMatch(matchId: string) {
  if (typeof window === "undefined") return;
  const recent = getStoredIds(RECENT_MATCHES_STORAGE_KEY).filter((id) => id !== matchId);
  window.localStorage.setItem(RECENT_MATCHES_STORAGE_KEY, JSON.stringify([matchId, ...recent].slice(0, 5)));
}
