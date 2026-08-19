const TOKEN_KEY = "mac-newtab-gcal-token";

type ChromeIdentity = {
  identity?: {
    launchWebAuthFlow: (
      opts: { url: string; interactive: boolean },
      cb: (redirect?: string) => void,
    ) => void;
    getRedirectURL: (path?: string) => string;
  };
  runtime?: { lastError?: { message?: string } };
};

const chromeApi = () => (globalThis as unknown as { chrome?: ChromeIdentity }).chrome;

export const hasIdentity = () => Boolean(chromeApi()?.identity);

/** The exact redirect URI Google must have whitelisted, or "" outside the extension. */
export function getRedirectUrl(): string {
  try {
    return chromeApi()?.identity?.getRedirectURL("gcal") ?? "";
  } catch {
    return "";
  }
}

export interface StoredToken {
  token: string;
  expiresAt: number;
}

export function getStoredToken(): StoredToken | null {
  try {
    const raw = localStorage.getItem(TOKEN_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredToken;
    return parsed.expiresAt > Date.now() ? parsed : null;
  } catch {
    return null;
  }
}

export function clearToken() {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

function store(token: StoredToken) {
  try {
    localStorage.setItem(TOKEN_KEY, JSON.stringify(token));
  } catch {
    /* ignore */
  }
}

/** Opens Google's consent screen through the extension identity API. */
export function signIn(clientId: string): Promise<StoredToken> {
  const chrome = chromeApi();
  return new Promise((resolve, reject) => {
    if (!chrome?.identity) {
      reject(new Error("Google sign-in is only available inside the Chrome extension."));
      return;
    }
    if (!clientId.trim()) {
      reject(new Error("Add your Google OAuth client ID in settings first."));
      return;
    }
    const redirect = chrome.identity.getRedirectURL("gcal");
    const url =
      "https://accounts.google.com/o/oauth2/v2/auth" +
      `?client_id=${encodeURIComponent(clientId.trim())}` +
      `&redirect_uri=${encodeURIComponent(redirect)}` +
      "&response_type=token" +
      "&prompt=consent" +
      `&scope=${encodeURIComponent("https://www.googleapis.com/auth/calendar.readonly")}`;

    chrome.identity.launchWebAuthFlow({ url, interactive: true }, (redirectUrl) => {
      const err = chrome.runtime?.lastError?.message;
      if (err || !redirectUrl) {
        reject(new Error(err || "Sign-in cancelled"));
        return;
      }
      const hash = redirectUrl.split("#")[1] ?? "";
      const params = new URLSearchParams(hash);
      const token = params.get("access_token");
      const expiresIn = Number(params.get("expires_in") ?? 3600);
      if (!token) {
        reject(new Error("Google did not return an access token"));
        return;
      }
      const stored = { token, expiresAt: Date.now() + (expiresIn - 60) * 1000 };
      store(stored);
      resolve(stored);
    });
  });
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  allDay: boolean;
}

export async function fetchTodayEvents(token: string): Promise<CalendarEvent[]> {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  const url =
    "https://www.googleapis.com/calendar/v3/calendars/primary/events" +
    `?timeMin=${encodeURIComponent(start.toISOString())}` +
    `&timeMax=${encodeURIComponent(end.toISOString())}` +
    "&singleEvents=true&orderBy=startTime&maxResults=10";

  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (res.status === 401) {
    clearToken();
    throw new Error("Session expired — connect again");
  }
  if (!res.ok) throw new Error(`Calendar request failed (${res.status})`);
  const json = (await res.json()) as {
    items?: { id: string; summary?: string; start?: { dateTime?: string; date?: string } }[];
  };
  return (json.items ?? []).map((e) => ({
    id: e.id,
    title: e.summary || "(no title)",
    start: e.start?.dateTime ?? e.start?.date ?? "",
    allDay: !e.start?.dateTime,
  }));
}
