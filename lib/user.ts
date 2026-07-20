export type Membership = "free" | "vip" | "enterprise";

export type AthenaUser = {
  id: string;
  name: string;
  email: string;
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
  email: "demo@project-athena.local",
  name: "Athena用户",
  avatar: "",
  membership: "free",
};

function notify(eventName: string) {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(eventName));
}

function syncUserToDatabase(user: AthenaUser) {
  if (typeof window === "undefined") return;
  void fetch("/api/users/sync", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: user.id, email: user.email, membershipLevel: user.membership, vipStatus: user.membership !== "free" }),
  }).catch(() => undefined);
}

export function getUser(): AthenaUser | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = window.localStorage.getItem(USER_STORAGE_KEY);
    if (!stored) return null;
    const parsed = JSON.parse(stored) as Partial<AthenaUser>;
    if (!parsed.id || !parsed.name) return null;
    const membership = parsed.membership === "vip" || parsed.membership === "enterprise" ? parsed.membership : "free";
    return { ...defaultUser, ...parsed, membership };
  } catch {
    return null;
  }
}

export function login(name = defaultUser.name, email = "", id = ""): AthenaUser {
  const existing = getUser();
  const user = { ...defaultUser, ...existing, id: id || existing?.id || defaultUser.id, name: name.trim() || defaultUser.name, email: email.trim() || existing?.email || defaultUser.email };
  if (typeof window !== "undefined") {
    window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    notify(USER_CHANGED_EVENT);
    syncUserToDatabase(user);
  }
  return user;
}

export function logout() {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(USER_STORAGE_KEY);
    notify(USER_CHANGED_EVENT);
  }
}

export function setMembership(membership: Membership): AthenaUser {
  const user = { ...(getUser() ?? defaultUser), membership };
  if (typeof window !== "undefined") {
    window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    notify(USER_CHANGED_EVENT);
    syncUserToDatabase(user);
  }
  return user;
}

export function upgradeVip(): AthenaUser {
  return setMembership("vip");
}

export function upgradeEnterprise(): AthenaUser {
  return setMembership("enterprise");
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
