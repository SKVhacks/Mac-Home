import { useCallback, useEffect, useRef, useState } from "react";
import type { DesktopState, DockItem, FolderItem, WidgetId } from "@/lib/desktop-storage";
import {
  LOCAL_IMAGE_REF,
  LOCAL_VIDEO_REF,
  defaultState,
  loadLocalImageUrl,
  loadLocalVideoUrl,
  loadState,
  saveState,
} from "@/lib/desktop-storage";
import { ClockWidget } from "./ClockWidget";
import { WeatherWidget } from "./WeatherWidget";
import { TodoWidget } from "./TodoWidget";
import { CalendarWidget } from "./CalendarWidget";
import { Dock } from "./Dock";
import { SettingsPanel } from "./SettingsPanel";
import { FolderOverlay } from "./FolderOverlay";
export function Desktop({ className = "" }: { className?: string }) {
  const [state, setState] = useState<DesktopState | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [openFolderId, setOpenFolderId] = useState<string | null>(null);
  const [prefersDark, setPrefersDark] = useState(false);
  const [localVideoUrl, setLocalVideoUrl] = useState("");
  const [localImageUrl, setLocalImageUrl] = useState("");
  const areaRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ id: WidgetId; dx: number; dy: number } | null>(null);
  const nodes = useRef<Map<WidgetId, HTMLDivElement | null>>(new Map());

  useEffect(() => {
    loadState().then(setState);
  }, []);

  useEffect(() => {
    if (state?.wallpaperVideo !== LOCAL_VIDEO_REF) return;
    let url = "";
    loadLocalVideoUrl().then((u) => {
      url = u;
      setLocalVideoUrl(u);
    });
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [state?.wallpaperVideo]);

  useEffect(() => {
    if (state?.wallpaperUrl !== LOCAL_IMAGE_REF) return;
    let url = "";
    loadLocalImageUrl().then((u) => {
      url = u;
      setLocalImageUrl(u);
    });
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [state?.wallpaperUrl]);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    setPrefersDark(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersDark(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const update = useCallback((patch: Partial<DesktopState>) => {
    setState((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...patch };
      saveState(next);
      return next;
    });
  }, []);

  const onPointerDown = (id: WidgetId) => (e: React.PointerEvent) => {
    if (typeof window !== "undefined" && window.innerWidth < 768) return;
    const target = e.target as HTMLElement;
    if (target.closest("input, button, textarea, a, select")) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    drag.current = { id, dx: e.clientX - rect.left, dy: e.clientY - rect.top };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    const area = areaRef.current;
    if (!d || !area || !state) return;
    const bounds = area.getBoundingClientRect();
    const self = nodes.current.get(d.id);
    if (!self) return;
    const w = self.offsetWidth;
    const h = self.offsetHeight;
    const px = Math.min(bounds.width - w, Math.max(0, e.clientX - d.dx - bounds.left));
    const py = Math.min(bounds.height - h - 90, Math.max(0, e.clientY - d.dy - bounds.top));

    // Keep widgets from overlapping each other.
    const pad = 8;
    for (const [id, node] of nodes.current) {
      if (id === d.id || !node) continue;
      const ox = node.offsetLeft;
      const oy = node.offsetTop;
      const overlaps =
        px < ox + node.offsetWidth + pad &&
        px + w + pad > ox &&
        py < oy + node.offsetHeight + pad &&
        py + h + pad > oy;
      if (overlaps) return;
    }

    const x = (px / bounds.width) * 100;
    const y = (py / bounds.height) * 100;
    update({
      widgets: state.widgets.map((w) =>
        w.id === d.id
          ? { ...w, x, y }
          : w,
      ),
    });
  };

  const endDrag = () => {
    drag.current = null;
  };

  if (!state) {
    return <div className={`mac-wallpaper-sonoma ${className}`} />;
  }

  const isDark = state.theme === "dark" || (state.theme === "system" && prefersDark);
  const folder = state.dock.find((d): d is FolderItem => d.type === "folder" && d.id === openFolderId);

  const renderWidget = (w: DesktopState["widgets"][number]) => {
    if (w.id === "clock") return <ClockWidget variant={state.clockStyle} hour12={state.hour12} />;
    if (w.id === "weather")
      return <WeatherWidget units={state.units} city={state.city} size={w.size ?? "small"} />;
    if (w.id === "calendar")
      return <CalendarWidget googleClientId={state.googleClientId} size={w.size ?? "small"} />;
    return <TodoWidget todos={state.todos} onChange={(todos) => update({ todos })} />;
  };

  const rawImage = state.wallpaperUrlEnabled ? state.wallpaperUrl.trim() : "";
  const customImage = rawImage === LOCAL_IMAGE_REF ? localImageUrl : rawImage;
  const rawVideo = state.wallpaperVideoEnabled ? state.wallpaperVideo.trim() : "";
  const customVideo = rawVideo === LOCAL_VIDEO_REF ? localVideoUrl : rawVideo;
  const showVideo = !customImage && !!customVideo;
  const wallpaperStyle = customImage
    ? {
        backgroundImage: `url("${customImage}")`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }
    : undefined;

  return (
    <div
      className={`${isDark ? "dark" : ""} ${customImage ? "" : `mac-wallpaper-${state.wallpaper}`} relative overflow-hidden ${className}`}
      style={wallpaperStyle}
    >
      {showVideo && (
        <video
          key={customVideo}
          src={customVideo}
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}

      <div
        ref={areaRef}
        className="absolute inset-[10px] flex flex-col items-center gap-4 overflow-y-auto overflow-x-hidden pb-32 md:block md:gap-0 md:overflow-visible md:pb-0"
      >
        {state.widgets
          .filter((w) => w.visible)
          .map((w) => (
            <div
              key={w.id}
              ref={(el) => {
                nodes.current.set(w.id, el);
              }}
              onPointerDown={onPointerDown(w.id)}
              onPointerMove={onPointerMove}
              onPointerUp={endDrag}
              onPointerCancel={endDrag}
              style={{ "--wx": `${w.x}%`, "--wy": `${w.y}%` } as React.CSSProperties}
              className="max-w-full shrink-0 origin-top select-none [zoom:0.7] min-[380px]:[zoom:0.8] min-[480px]:[zoom:0.9] sm:[zoom:1] md:absolute md:left-[var(--wx)] md:top-[var(--wy)] md:cursor-grab md:touch-none md:active:cursor-grabbing"
            >
              {renderWidget(w)}
            </div>
          ))}
      </div>

      <Dock
        items={state.dock}
        onChange={(dock: DockItem[]) => update({ dock })}
        onOpenFolder={setOpenFolderId}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      {folder && (
        <FolderOverlay
          folder={folder}
          onClose={() => setOpenFolderId(null)}
          onUpdate={(next) => update({ dock: state.dock.map((d) => (d.id === next.id ? next : d)) })}
        />
      )}

      {settingsOpen && (
        <SettingsPanel
          state={state}
          onChange={update}
          onClose={() => setSettingsOpen(false)}
          onReset={() => {
            const fresh = defaultState();
            saveState(fresh);
            setState(fresh);
          }}
        />
      )}
    </div>
  );
}
