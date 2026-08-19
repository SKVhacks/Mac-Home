import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  CalendarDays,
  Check,
  Clock,
  CloudSun,
  Download,
  FolderOpen,
  Github,
  Image as ImageIcon,
  ListChecks,
  Lock,
  Monitor,
  Moon,
  MousePointerClick,
  Move,
  Plus,
  Settings,
  Video,
  Wifi,
} from "lucide-react";
import { Desktop } from "@/components/desktop/Desktop";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Mac Style New Tab" },
      {
        name: "description",
        content:
          "Turn every Chrome new tab into a macOS desktop: a magnifying dock with folders, analog clock, weather and reminders widgets, light and dark mode.",
      },
      { property: "og:title", content: "Mac Home — macOS Style New Tab for Chrome" },
      {
        property: "og:description",
        content:
          "A macOS-style new tab page with a dock, folders and three customizable widgets. Free, private, works offline.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: "Mac Home",
          applicationCategory: "BrowserApplication",
          operatingSystem: "Chrome, Edge, Brave, Arc",
          description:
            "A macOS-style Chrome new tab page with a magnifying dock, folders, and clock, weather, calendar and reminders widgets.",
          offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        }),
      },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  {
    icon: Clock,
    title: "Three clock faces",
    body: "Digital squircle with animated second ticks, a classic Apple analog dial, or a minimal dark face — switch any time in settings.",
  },
  {
    icon: CloudSun,
    title: "Live weather, no API key",
    body: "Powered by Open-Meteo. Small square card or a wide 5-day forecast, °C or °F, auto-located or a city you type.",
  },
  {
    icon: CalendarDays,
    title: "Calendar, small or large",
    body: "A compact month grid by default, or the full Apple-style view with your Google Calendar events beside it.",
  },
  {
    icon: ListChecks,
    title: "Reminders that resize",
    body: "Square when empty, growing into a list as you add tasks — up to five rows, then it scrolls without an ugly scrollbar.",
  },
  {
    icon: FolderOpen,
    title: "Dock folders",
    body: "Drop one dock icon onto another to make a folder, then open a Launchpad-style grid and reorder apps inside it.",
  },
  {
    icon: Plus,
    title: "Add any web app",
    body: "Paste a URL and the icon is fetched automatically — or point it at your own custom image URL.",
  },
  {
    icon: ImageIcon,
    title: "Wallpaper your way",
    body: "Handcrafted gradients, an image link, or a picture straight from your device stored locally.",
  },
  {
    icon: Video,
    title: "Video wallpapers",
    body: "Loop a video from a link or a local file. Toggle image and video sources on or off independently.",
  },
  {
    icon: Moon,
    title: "Light & dark",
    body: "Every widget, the dock and the settings panel follow your system appearance — or lock one theme.",
  },
  {
    icon: Move,
    title: "Drag anywhere, no overlap",
    body: "Widgets snap to a grid and refuse to stack on top of each other, so the desktop always stays tidy.",
  },
  {
    icon: Monitor,
    title: "Any display",
    body: "Fluid from a 320px split-screen window to 720p laptops, 4K panels and ultrawide monitors.",
  },
  {
    icon: Lock,
    title: "Private by design",
    body: "Everything lives in your browser storage. No account, no analytics, no server holding your data.",
  },
];

const WIDGETS = [
  {
    icon: Clock,
    name: "Clock",
    points: [
      "Digital face with radial ticks that fade around once a minute",
      "Classic analog dial with a smooth sweeping second hand",
      "Minimal dark face for a quieter desktop",
      "12-hour or 24-hour, your choice",
    ],
  },
  {
    icon: CloudSun,
    name: "Weather",
    points: [
      "Small square card: condition, current temp, high and low",
      "Large card: big temperature plus a 5-day forecast row",
      "Celsius or Fahrenheit, shown right after the number",
      "Type a city or let it use your location",
    ],
  },
  {
    icon: CalendarDays,
    name: "Calendar",
    points: [
      "Small: a full month grid with today circled in red",
      "Large: Apple-style day view with your agenda",
      "Optional Google Calendar connection, read-only",
      "Guided one-time setup card built into settings",
    ],
  },
  {
    icon: ListChecks,
    name: "Reminders",
    points: [
      "Add, check off, reorder and delete tasks",
      "Grows from a square to a list as tasks pile up",
      "Long tasks truncate at 30 characters",
      "Stored locally, instantly, with no sync delay",
    ],
  },
];

const CUSTOMIZE = [
  { icon: Settings, title: "Sectioned settings", body: "Theme, wallpaper, clock, weather, calendar, dock and advanced — collapsible and scrollable, opened from the dock." },
  { icon: ImageIcon, title: "Wallpaper priority", body: "Custom image link wins, then video wallpaper, then the built-in gradients — each with its own on/off toggle." },
  { icon: Download, title: "Backup & restore", body: "Export your entire desktop to a JSON file and import it on another machine in one click." },
  { icon: Wifi, title: "Works offline", body: "Only weather and calendar need the network; the rest of your desktop loads instantly without it." },
];

const STEPS = [
  "Download and unzip the extension.",
  "Open chrome://extensions in Chrome, Edge, Brave or Arc.",
  "Turn on Developer mode in the top-right corner.",
  "Click Load unpacked and pick the unzipped folder.",
  "Open a new tab — your Mac desktop is there.",
];

const FAQ = [
  {
    q: "Does it work in browsers other than Chrome?",
    a: "Yes. Any Chromium browser that supports Manifest V3 extensions works — Chrome, Edge, Brave, Arc, Vivaldi and Opera.",
  },
  {
    q: "Where is my data stored?",
    a: "In your browser. Settings, dock apps and reminders use extension storage, and local wallpapers are kept in IndexedDB so large files survive a refresh. Nothing is uploaded.",
  },
  {
    q: "Do I need an API key for weather?",
    a: "No. Weather comes from Open-Meteo, which is free and keyless. City search uses their geocoding endpoint.",
  },
  {
    q: "How does the Google Calendar connection work?",
    a: "It is optional and read-only. Settings → Calendar walks you through creating a Google OAuth client, shows your exact redirect URI with a copy button, then one click connects the widget.",
  },
  {
    q: "Will it fit my monitor?",
    a: "The whole desktop scales fluidly — it stacks on narrow windows and scales up cleanly on 4K and ultrawide displays, with a 10px margin so nothing touches the screen edge.",
  },
];

function Landing() {
  const [status, setStatus] = useState<string | null>(null);

  const download = () => {
    setStatus("Preparing…");
    fetch("/mac-home-extension.zip")
      .then((res) => {
        if (!res.ok) throw new Error(`Download failed: ${res.status}`);
        return res.blob();
      })
      .then((blob) => {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "mac-home-extension.zip";
        a.click();
        URL.revokeObjectURL(a.href);
        setStatus(null);
      })
      .catch((err) => setStatus(err.message));
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto max-w-6xl px-4 pt-14 text-center sm:px-6 sm:pt-16">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">
          Chrome extension · free · no account
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
          Your new tab, but it&rsquo;s a Mac.
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-sm text-muted-foreground sm:text-lg">
          A macOS-style home screen with a magnifying dock, folders, and four widgets — clock,
          weather, calendar and reminders — that you can drag anywhere, resize and theme. Everything
          is customizable and everything stays on your device.
        </p>
        <div className="mt-8 flex flex-col items-center gap-3">
          <button
            onClick={download}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            <Download className="h-4 w-4" />
            Download extension
          </button>
          {status && <span className="text-xs text-muted-foreground">{status}</span>}
          <p className="text-xs text-muted-foreground">Loads unpacked in under a minute · ~1 MB</p>
        </div>
        <ul className="mx-auto mt-8 flex max-w-3xl flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
          {["No sign-in", "No tracking", "Offline-ready", "Light & dark", "Open your own apps"].map((t) => (
            <li key={t} className="inline-flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-[var(--mac-accent)]" />
              {t}
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto mt-12 max-w-6xl px-4 sm:mt-14 sm:px-6">
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
          <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
            <span className="h-3 w-3 rounded-full bg-destructive/70" />
            <span className="h-3 w-3 rounded-full bg-chart-4" />
            <span className="h-3 w-3 rounded-full bg-chart-2" />
            <span className="ml-3 text-xs text-muted-foreground">New Tab — live demo</span>
          </div>
          <Desktop className="h-[420px] w-full sm:h-[520px] lg:h-[620px]" />
        </div>
        <p className="mt-3 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <MousePointerClick className="h-3.5 w-3.5" />
          This is the real thing — drag widgets, add apps, open the gear in the dock.
        </p>
      </section>

      <section className="mx-auto mt-20 max-w-6xl px-4 sm:mt-24 sm:px-6">
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Everything is yours to move</h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Twelve things this new tab does that the default one doesn&rsquo;t.
        </p>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-2xl border border-border bg-card p-5 sm:p-6">
              <f.icon className="h-6 w-6 text-[var(--mac-accent)]" />
              <h3 className="mt-4 font-medium">{f.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-20 max-w-6xl px-4 sm:mt-24 sm:px-6">
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">The four widgets, in detail</h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Each one has its own styles and sizes, and each remembers exactly where you left it.
        </p>
        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          {WIDGETS.map((w) => (
            <div key={w.name} className="rounded-2xl border border-border bg-card p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
                  <w.icon className="h-5 w-5 text-[var(--mac-accent)]" />
                </span>
                <h3 className="text-lg font-medium">{w.name}</h3>
              </div>
              <ul className="mt-4 space-y-2">
                {w.points.map((p) => (
                  <li key={p} className="flex gap-2 text-sm text-muted-foreground">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--mac-accent)]" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-20 max-w-6xl px-4 sm:mt-24 sm:px-6">
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">A dock that behaves like the real one</h2>
        <div className="mt-8 grid gap-5 lg:grid-cols-3">
          <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
            <FolderOpen className="h-6 w-6 text-[var(--mac-accent)]" />
            <h3 className="mt-4 font-medium">Folders by dropping</h3>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Drag one icon onto another and they become a folder. Click it for a Launchpad-style
              grid, rename it inline, add more apps and reorder them by dragging inside.
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
            <Move className="h-6 w-6 text-[var(--mac-accent)]" />
            <h3 className="mt-4 font-medium">Reorder everything</h3>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Icons and folders reorder with a drag, both in the dock and inside a folder. The
              magnification effect follows your cursor, exactly like macOS.
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
            <Settings className="h-6 w-6 text-[var(--mac-accent)]" />
            <h3 className="mt-4 font-medium">Settings in the dock</h3>
            <p className="mt-1.5 text-sm text-muted-foreground">
              There is no menu bar stealing space. The gear sits in the dock and opens a sectioned
              panel for every option, then gets out of the way.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-20 max-w-6xl px-4 sm:mt-24 sm:px-6">
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Make it look like yours</h2>
        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          {CUSTOMIZE.map((c) => (
            <div key={c.title} className="flex gap-4 rounded-2xl border border-border bg-card p-5 sm:p-6">
              <c.icon className="h-6 w-6 shrink-0 text-[var(--mac-accent)]" />
              <div>
                <h3 className="font-medium">{c.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{c.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-20 max-w-3xl px-4 sm:mt-24 sm:px-6">
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Install it in a minute</h2>
        <ol className="mt-6 space-y-3">
          {STEPS.map((s, i) => (
            <li key={s} className="flex gap-3 text-sm text-muted-foreground">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-foreground">
                {i + 1}
              </span>
              {s}
            </li>
          ))}
        </ol>
        <button
          onClick={download}
          className="mt-8 inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-medium transition-colors hover:bg-accent"
        >
          <Download className="h-4 w-4" />
          Download ZIP
        </button>
      </section>

      <section className="mx-auto mt-20 max-w-3xl px-4 sm:mt-24 sm:px-6">
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Questions</h2>
        <dl className="mt-6 divide-y divide-border border-y border-border">
          {FAQ.map((f) => (
            <div key={f.q} className="py-5">
              <dt className="font-medium">{f.q}</dt>
              <dd className="mt-1.5 text-sm text-muted-foreground">{f.a}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mx-auto mt-20 max-w-3xl px-4 pb-8 text-center sm:px-6">
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Open a new tab and feel at home</h2>
        <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
          Free, private, and yours to rearrange. Download it and load it unpacked — you can always
          export a backup before you switch machines.
        </p>
        <button
          onClick={download}
          className="mt-7 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          <Download className="h-4 w-4" />
          Download extension
        </button>
      </section>

      <footer className="mx-auto mt-14 max-w-6xl border-t border-border px-4 py-8 text-center text-xs text-muted-foreground sm:px-6">
        Mac Home — a macOS-style new tab. Weather by Open-Meteo | Build by <a href="https://gadgetvishwa.vercel.app" target="_blank" rel="noopener noreferrer" className="appearance-none text-orange-600">Gadget Vishwa</a> | <a href="https://github.com/SKVhacks"><svg
          viewBox="0 0 24 24"
          fill="currentColor"
          className="w-6 h-6 text-black inline-block ml-2"
        >
          <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.757-1.333-1.757-1.087-.744.084-.729.084-.729 1.205.084 1.84 1.237 1.84 1.237 1.07 1.835 2.809 1.305 3.495.998.108-.776.418-1.305.762-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
        </svg></a>
        
  <a href="https://linktree.gadgetvishwa.xyz" target="_blank" rel="noopener noreferrer" className="appearance-none">
    <svg
  viewBox="0 0 300 300"
  fill="currentColor"
  className="w-6 h-6 text-black inline-block ml-2"
>
  <path d="M78 22L50 50L50 52L100 100L97 102L29 101L28 142L101 143L50 193L50 195L76 221L79 221L150 151L220 221L222 221L249 193L198 143L271 142L271 102L202 102L199 100L247 54L249 50L221 22L172 71L171 1L129 0L128 70L126 71Z" />
  <path d="M129 202L128 298L170 299L171 203Z" />
</svg>
  </a>
      </footer>
    </main>
  );
}
