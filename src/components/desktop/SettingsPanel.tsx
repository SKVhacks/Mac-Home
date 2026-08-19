import { useRef, useState } from "react";
import { Check, ChevronDown, Copy, X } from "lucide-react";
import { getRedirectUrl } from "@/lib/google-calendar";
import type { ClockStyle, DesktopState, ThemeMode, Units, WidgetId } from "@/lib/desktop-storage";
import {
  LOCAL_IMAGE_REF,
  LOCAL_VIDEO_REF,
  WALLPAPERS,
  exportState,
  importStateFile,
  saveLocalImage,
  saveLocalVideo,
} from "@/lib/desktop-storage";

const WIDGET_LABELS: Record<WidgetId, string> = {
  clock: "Analog clock",
  weather: "Weather",
  todo: "Reminders",
  calendar: "Calendar",
};

type SectionId =
  | "appearance"
  | "widgets"
  | "clock"
  | "weather"
  | "calendar"
  | "wallpaper"
  | "backup"
  | "advanced";

function Section({
  id,
  title,
  open,
  setOpen,
  children,
}: {
  id: SectionId;
  title: string;
  open: SectionId | null;
  setOpen: React.Dispatch<React.SetStateAction<SectionId | null>>;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-border">
      <button
        onClick={() => setOpen((v) => (v === id ? null : id))}
        className="flex w-full items-center justify-between py-3 text-left text-sm font-medium text-foreground"
      >
        {title}
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open === id ? "rotate-180" : ""}`} />
      </button>
      {open === id && <div className="pb-4">{children}</div>}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      {children}
    </div>
  );
}

function CalendarSetup() {
  const [copied, setCopied] = useState(false);
  const redirect = getRedirectUrl();
  const copy = () => {
    navigator.clipboard?.writeText(redirect);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="mt-3 rounded-xl border border-border p-3">
      <p className="text-xs font-medium text-foreground">One-time Google setup</p>
      <ol className="mt-2 list-decimal space-y-1.5 pl-4 text-[11px] leading-relaxed text-muted-foreground">
        <li>
          Open{" "}
          <a
            href="https://console.cloud.google.com/apis/library/calendar-json.googleapis.com"
            target="_blank"
            rel="noreferrer"
            className="underline"
          >
            Google Calendar API
          </a>{" "}
          and click Enable.
        </li>
        <li>
          In{" "}
          <a
            href="https://console.cloud.google.com/auth/audience"
            target="_blank"
            rel="noreferrer"
            className="underline"
          >
            Audience
          </a>
          , set the user type to <b>External</b> and add your Gmail as a test user
          (Internal causes “org_internal”).
        </li>
        <li>
          In{" "}
          <a
            href="https://console.cloud.google.com/auth/clients"
            target="_blank"
            rel="noreferrer"
            className="underline"
          >
            Clients
          </a>
          , create a client of type <b>Web application</b> and paste the redirect URI below.
        </li>
        <li>Copy its client ID into the field above, then press Connect on the calendar widget.</li>
      </ol>

      <p className="mt-3 text-[11px] text-muted-foreground">Authorised redirect URI</p>
      <div className="mt-1 flex items-center gap-2">
        <code className="flex-1 truncate rounded-lg bg-muted px-2 py-1.5 text-[11px] text-foreground">
          {redirect || "Open this panel inside the extension to see your URI"}
        </code>
        <button
          onClick={copy}
          disabled={!redirect}
          aria-label="Copy redirect URI"
          className="rounded-lg border border-border p-1.5 text-muted-foreground disabled:opacity-40"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
      </div>
    </div>
  );
}

function Segmented<T extends string>({
  value,
  options,
  onSelect,
}: {
  value: T;
  options: { value: T; label: string }[];
  onSelect: (v: T) => void;
}) {
  return (
    <div className="flex rounded-lg bg-muted p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onSelect(o.value)}
          className={`rounded-md px-2.5 py-1 text-xs transition-colors ${
            value === o.value ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

const field = "mt-2 w-full rounded-lg bg-card px-3 py-1.5 text-sm text-foreground outline-none";

export function SettingsPanel({
  state,
  onChange,
  onClose,
  onReset,
}: {
  state: DesktopState;
  onChange: (patch: Partial<DesktopState>) => void;
  onClose: () => void;
  onReset: () => void;
}) {
  const videoFileRef = useRef<HTMLInputElement>(null);
  const imageFileRef = useRef<HTMLInputElement>(null);
  const backupFileRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState<SectionId | null>("appearance");

  const pickVideoFile = async (file: File) => {
    const ref = await saveLocalVideo(file);
    onChange({ wallpaperVideo: ref, wallpaperVideoEnabled: true });
  };

  const pickImageFile = async (file: File) => {
    const ref = await saveLocalImage(file);
    onChange({ wallpaperUrl: ref, wallpaperUrlEnabled: true });
  };

  return (
    <div
      className="absolute inset-0 z-50 flex items-start justify-center overflow-hidden bg-background/25 p-[10px] sm:justify-end"
      onClick={onClose}
    >
      <div
        className="mac-glass flex max-h-full w-full max-w-[340px] flex-col rounded-[24px] bg-card/92"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 pb-3 pt-5">
          <h2 className="text-base font-semibold text-foreground">Desktop settings</h2>
          <button onClick={onClose} aria-label="Close settings" className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5">
          <Section id="appearance" title="Appearance" open={open} setOpen={setOpen}>
            <Row label="Theme">
              <Segmented<ThemeMode>
                value={state.theme}
                onSelect={(theme) => onChange({ theme })}
                options={[
                  { value: "system", label: "Auto" },
                  { value: "light", label: "Light" },
                  { value: "dark", label: "Dark" },
                ]}
              />
            </Row>
            <Row label="Units">
              <Segmented<Units>
                value={state.units}
                onSelect={(units) => onChange({ units })}
                options={[
                  { value: "metric", label: "°C" },
                  { value: "imperial", label: "°F" },
                ]}
              />
            </Row>
          </Section>

          <Section id="widgets" title="Widgets" open={open} setOpen={setOpen}>
            <div className="space-y-1.5">
              {state.widgets.map((w) => (
                <label key={w.id} className="flex items-center justify-between text-sm text-muted-foreground">
                  {WIDGET_LABELS[w.id]}
                  <input
                    type="checkbox"
                    checked={w.visible}
                    onChange={(e) =>
                      onChange({
                        widgets: state.widgets.map((x) =>
                          x.id === w.id ? { ...x, visible: e.target.checked } : x,
                        ),
                      })
                    }
                    className="h-4 w-4 accent-[var(--mac-accent)]"
                  />
                </label>
              ))}
            </div>
          </Section>

          <Section id="clock" title="Clock" open={open} setOpen={setOpen}>
            <div className="grid grid-cols-3 gap-2">
              {([
                { id: "digital", label: "Digital" },
                { id: "classic", label: "Classic" },
                { id: "minimal", label: "Minimal" },
              ] as { id: ClockStyle; label: string }[]).map((c) => (
                <button
                  key={c.id}
                  onClick={() => onChange({ clockStyle: c.id })}
                  className={`rounded-xl border-2 p-2 text-[11px] transition-colors ${
                    state.clockStyle === c.id
                      ? "border-[var(--mac-accent)] text-foreground"
                      : "border-transparent text-muted-foreground"
                  }`}
                >
                  <div
                    className={`mb-1.5 h-12 w-full rounded-lg ${
                      c.id === "digital"
                        ? "mac-clock-digital"
                        : c.id === "classic"
                          ? "mac-clock-classic"
                          : "mac-clock-minimal"
                    }`}
                  />
                  {c.label}
                </button>
              ))}
            </div>
            <Row label="Time format">
              <Segmented<string>
                value={state.hour12 ? "12" : "24"}
                onSelect={(v) => onChange({ hour12: v === "12" })}
                options={[
                  { value: "12", label: "12h" },
                  { value: "24", label: "24h" },
                ]}
              />
            </Row>
          </Section>

          <Section id="weather" title="Weather" open={open} setOpen={setOpen}>
            <Row label="Card size">
              <Segmented<string>
                value={state.widgets.find((w) => w.id === "weather")?.size ?? "small"}
                onSelect={(size) =>
                  onChange({
                    widgets: state.widgets.map((w) =>
                      w.id === "weather" ? { ...w, size: size === "large" ? "large" : "small" } : w,
                    ),
                  })
                }
                options={[
                  { value: "small", label: "Small" },
                  { value: "large", label: "Large" },
                ]}
              />
            </Row>
            <label className="text-sm text-muted-foreground" htmlFor="weather-city">
              Location
            </label>
            <input
              id="weather-city"
              value={state.city}
              onChange={(e) => onChange({ city: e.target.value })}
              placeholder="Leave empty to use your location"
              className={field}
            />
          </Section>

          <Section id="calendar" title="Calendar" open={open} setOpen={setOpen}>
            <Row label="Card size">
              <Segmented<string>
                value={state.widgets.find((w) => w.id === "calendar")?.size ?? "small"}
                onSelect={(size) =>
                  onChange({
                    widgets: state.widgets.map((w) =>
                      w.id === "calendar" ? { ...w, size: size === "large" ? "large" : "small" } : w,
                    ),
                  })
                }
                options={[
                  { value: "small", label: "Small" },
                  { value: "large", label: "Large" },
                ]}
              />
            </Row>
            <p className="text-xs text-muted-foreground">
              Small shows the month grid. Large shows today, your Google Calendar events and the month.
            </p>
            <label className="mt-4 block text-sm text-muted-foreground" htmlFor="google-client-id">
              Google OAuth client ID
            </label>
            <input
              id="google-client-id"
              value={state.googleClientId}
              onChange={(e) => onChange({ googleClientId: e.target.value })}
              placeholder="…apps.googleusercontent.com"
              className={field}
            />
            <p className="mt-1 text-[11px] text-muted-foreground">
              Used to sign in to Google Calendar (extension only).
            </p>
            <CalendarSetup />
          </Section>

          <Section id="wallpaper" title="Wallpaper" open={open} setOpen={setOpen}>
            <div className="grid grid-cols-4 gap-2">
              {WALLPAPERS.map((w) => (
                <button
                  key={w.id}
                  onClick={() => onChange({ wallpaper: w.id })}
                  title={w.name}
                  aria-label={w.name}
                  className={`mac-wallpaper-${w.id} h-12 rounded-lg border-2 transition-all ${
                    state.wallpaper === w.id ? "border-[var(--mac-accent)]" : "border-transparent"
                  }`}
                />
              ))}
            </div>

            <div className="mt-4 flex items-center justify-between">
              <label className="text-sm text-muted-foreground" htmlFor="wallpaper-url">
                Custom wallpaper link
              </label>
              <input
                type="checkbox"
                aria-label="Enable custom wallpaper link"
                checked={state.wallpaperUrlEnabled}
                onChange={(e) => onChange({ wallpaperUrlEnabled: e.target.checked })}
                className="h-4 w-4 accent-[var(--mac-accent)]"
              />
            </div>
            <input
              id="wallpaper-url"
              value={state.wallpaperUrl === LOCAL_IMAGE_REF ? "" : state.wallpaperUrl}
              onChange={(e) => onChange({ wallpaperUrl: e.target.value })}
              placeholder={state.wallpaperUrl === LOCAL_IMAGE_REF ? "Local image loaded" : "https://…/photo.jpg"}
              disabled={!state.wallpaperUrlEnabled}
              className={`${field} disabled:opacity-50`}
            />
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <button
                onClick={() => imageFileRef.current?.click()}
                disabled={!state.wallpaperUrlEnabled}
                className="rounded-lg bg-card px-2.5 py-1 text-xs text-foreground disabled:opacity-50"
              >
                Choose local image
              </button>
              <button
                onClick={() => onChange({ wallpaperUrl: "" })}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Clear
              </button>
              <input
                ref={imageFileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) pickImageFile(f);
                }}
              />
            </div>

            <div className="mt-4 flex items-center justify-between">
              <label className="text-sm text-muted-foreground" htmlFor="wallpaper-video">
                Video wallpaper
              </label>
              <input
                type="checkbox"
                aria-label="Enable video wallpaper"
                checked={state.wallpaperVideoEnabled}
                onChange={(e) => onChange({ wallpaperVideoEnabled: e.target.checked })}
                className="h-4 w-4 accent-[var(--mac-accent)]"
              />
            </div>
            <input
              id="wallpaper-video"
              value={state.wallpaperVideo === LOCAL_VIDEO_REF ? "" : state.wallpaperVideo}
              onChange={(e) => onChange({ wallpaperVideo: e.target.value })}
              placeholder={state.wallpaperVideo === LOCAL_VIDEO_REF ? "Local video loaded" : "https://…/loop.mp4"}
              disabled={!state.wallpaperVideoEnabled}
              className={`${field} disabled:opacity-50`}
            />
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <button
                onClick={() => videoFileRef.current?.click()}
                disabled={!state.wallpaperVideoEnabled}
                className="rounded-lg bg-card px-2.5 py-1 text-xs text-foreground disabled:opacity-50"
              >
                Choose local video
              </button>
              <button
                onClick={() => onChange({ wallpaperVideo: "" })}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Clear
              </button>
              <input
                ref={videoFileRef}
                type="file"
                accept="video/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) pickVideoFile(f);
                }}
              />
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">
              When both toggles are off, the gradient above is used. Otherwise the custom link wins, then the video.
            </p>
          </Section>

          <Section id="backup" title="Backup" open={open} setOpen={setOpen}>
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => exportState(state)}
                className="rounded-lg bg-card px-2.5 py-1 text-xs text-foreground"
              >
                Export settings
              </button>
              <button
                onClick={() => backupFileRef.current?.click()}
                className="rounded-lg bg-card px-2.5 py-1 text-xs text-foreground"
              >
                Restore backup
              </button>
              <input
                ref={backupFileRef}
                type="file"
                accept="application/json"
                className="hidden"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  try {
                    onChange(await importStateFile(f));
                  } catch {
                    window.alert("That file isn't a valid backup.");
                  }
                }}
              />
            </div>
          </Section>

          <Section id="advanced" title="Advanced" open={open} setOpen={setOpen}>
            <button onClick={onReset} className="text-xs text-destructive hover:underline">
              Reset to defaults
            </button>
          </Section>
            <p className="text-xs text-center mt-2 text-gray-400">Designed by <a href="http://gadgetvishwa.vercel.app" target="_blank" rel="noreferrer" className="appearance-none text-orange-600">gadget_vishwa</a>.</p>
        </div>
      </div>
    </div>
  );
}
