export type ThemeMode = "system" | "light" | "dark";
export type Units = "metric" | "imperial";
export type WidgetId = "clock" | "weather" | "todo" | "calendar";
export type WidgetSize = "small" | "large";
export type ClockStyle = "digital" | "classic" | "minimal";

export interface WidgetState {
  id: WidgetId;
  visible: boolean;
  x: number;
  y: number;
  size?: WidgetSize;
}

export interface AppItem {
  id: string;
  type: "app";
  name: string;
  url: string;
  icon?: string;
}

export interface FolderItem {
  id: string;
  type: "folder";
  name: string;
  apps: AppItem[];
}

export type DockItem = AppItem | FolderItem;

export interface TodoItem {
  id: string;
  text: string;
  done: boolean;
}

export interface DesktopState {
  theme: ThemeMode;
  wallpaper: string;
  wallpaperUrl: string;
  wallpaperVideo: string;
  wallpaperUrlEnabled: boolean;
  wallpaperVideoEnabled: boolean;
  units: Units;
  hour12: boolean;
  clockStyle: ClockStyle;
  city: string;
  googleClientId: string;
  widgets: WidgetState[];
  dock: DockItem[];
  todos: TodoItem[];
}

export const WALLPAPERS = [
  { id: "sonoma", name: "Sonoma" },
  { id: "ventura", name: "Ventura" },
  { id: "monterey", name: "Monterey" },
  { id: "graphite", name: "Graphite" },
] as const;

export const uid = () => Math.random().toString(36).slice(2, 10);

const app = (name: string, url: string): AppItem => ({
  id: uid(),
  type: "app",
  name,
  url,
});

export const defaultState = (): DesktopState => ({
  theme: "system",
  wallpaper: "sonoma",
  wallpaperUrl: "https://images.wallpapersden.com/image/download/the-mountain_bGZnbW6UmZqaraWkpJRobWllrWdma2U.jpg",
  wallpaperVideo: "",
  wallpaperUrlEnabled: true,
  wallpaperVideoEnabled: false,
  units: "metric",
  hour12: true,
  clockStyle: "digital",
  city: "",
  googleClientId: "",
  widgets: [
    { id: "clock", visible: true, x: 0, y: 0 },
    { id: "weather", visible: true, x: 21, y: 0, size: "small" },
    { id: "todo", visible: true, x: 66, y: 0 },
    { id: "calendar", visible: true, x: 66, y: 38, size: "large" },
  ],
  dock: [
    app("Claude", "https://claude.ai/"),
    app("Figma", "https://figma.com"),
    app("YouTube", "https://youtube.com"),
    {
      id: uid(),
      type: "folder",
      name: "Social",
      apps: [
        app("X", "https://x.com"),
        app("Reddit", "https://reddit.com"),
        app("LinkedIn", "https://linkedin.com"),
      ],
    },
    app("GitHub", "https://github.com"),
  ],
  todos: [
    { id: uid(), text: "Try dragging a widget", done: false },
    { id: uid(), text: "Drop a dock icon on another to make a folder", done: false },
  ],
});

const KEY = "mac-newtab-state";

type ChromeLike = {
  storage?: { local?: { get: (k: string, cb: (r: Record<string, unknown>) => void) => void; set: (o: Record<string, unknown>) => void } };
};

const chromeApi = (): ChromeLike["storage"] | undefined =>
  (globalThis as unknown as { chrome?: ChromeLike }).chrome?.storage;

export function loadState(): Promise<DesktopState> {
  return new Promise((resolve) => {
    const api = chromeApi();
    if (api?.local) {
      api.local.get(KEY, (res) => {
        resolve(merge(res?.[KEY] as Partial<DesktopState> | undefined));
      });
      return;
    }
    try {
      const raw = localStorage.getItem(KEY);
      resolve(merge(raw ? (JSON.parse(raw) as Partial<DesktopState>) : undefined));
    } catch {
      resolve(defaultState());
    }
  });
}

export function saveState(state: DesktopState) {
  // Never persist huge inline data URLs — they blow the storage quota and
  // cause the entire state write to fail.
  const safe: DesktopState = state.wallpaperVideo.startsWith("data:")
    ? { ...state, wallpaperVideo: "" }
    : state;
  const api = chromeApi();
  if (api?.local) {
    api.local.set({ [KEY]: safe });
    return;
  }
  try {
    localStorage.setItem(KEY, JSON.stringify(safe));
  } catch {
    /* ignore */
  }
}

function merge(saved?: Partial<DesktopState>): DesktopState {
  const base = defaultState();
  if (!saved) return base;
  return {
    ...base,
    ...saved,
    widgets: base.widgets.map((w) => saved.widgets?.find((s) => s.id === w.id) ?? w),
    dock: saved.dock ?? base.dock,
    todos: saved.todos ?? base.todos,
  };
}

export function faviconFor(url: string, size = 128) {
  try {
    const host = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${host}&sz=${size}`;
  } catch {
    return "";
  }
}

/* ---- Large media (local video wallpaper) stored in IndexedDB ---- */

export const LOCAL_VIDEO_REF = "idb:wallpaper-video";
export const LOCAL_IMAGE_REF = "idb:wallpaper-image";
const DB_NAME = "mac-home-media";
const STORE = "media";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveLocalVideo(file: Blob): Promise<string> {
  const db = await openDb();
  await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(file, "video");
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
  return LOCAL_VIDEO_REF;
}

export async function saveLocalImage(file: Blob): Promise<string> {
  const db = await openDb();
  await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(file, "image");
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
  return LOCAL_IMAGE_REF;
}

export async function loadLocalImageUrl(): Promise<string> {
  try {
    const db = await openDb();
    const blob = await new Promise<Blob | undefined>((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).get("image");
      req.onsuccess = () => resolve(req.result as Blob | undefined);
      req.onerror = () => reject(req.error);
    });
    return blob ? URL.createObjectURL(blob) : "";
  } catch {
    return "";
  }
}

export async function loadLocalVideoUrl(): Promise<string> {
  try {
    const db = await openDb();
    const blob = await new Promise<Blob | undefined>((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).get("video");
      req.onsuccess = () => resolve(req.result as Blob | undefined);
      req.onerror = () => reject(req.error);
    });
    return blob ? URL.createObjectURL(blob) : "";
  } catch {
    return "";
  }
}

export function normalizeUrl(input: string) {
  const trimmed = input.trim();
  if (!trimmed) return "";
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

export function exportState(state: DesktopState) {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `mac-home-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
}

export async function importStateFile(file: File): Promise<DesktopState> {
  const text = await file.text();
  return merge(JSON.parse(text) as Partial<DesktopState>);
}
