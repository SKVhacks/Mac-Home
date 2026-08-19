import { useRef, useState } from "react";
import { Folder, Plus, Settings } from "lucide-react";
import type { AppItem, DockItem, FolderItem } from "@/lib/desktop-storage";
import { faviconFor, normalizeUrl, uid } from "@/lib/desktop-storage";

interface DockProps {
  items: DockItem[];
  onChange: (next: DockItem[]) => void;
  onOpenFolder: (id: string) => void;
  onOpenSettings: () => void;
}

function AppIcon({ item, size }: { item: AppItem; size: number }) {
  const src = item.icon?.trim() || faviconFor(item.url);
  const custom = Boolean(item.icon?.trim());
  return (
    <div
      className="mac-icon flex items-center justify-center overflow-hidden bg-card"
      style={{ width: size, height: size }}
    >
      {src ? (
        <img src={src} alt="" className={custom ? "h-full w-full object-cover" : "h-1/2 w-1/2"} draggable={false} />
      ) : (
        <span className="text-sm font-semibold text-foreground">{item.name.slice(0, 1)}</span>
      )}
    </div>
  );
}

function FolderIcon({ item, size }: { item: FolderItem; size: number }) {
  return (
    <div className="mac-icon grid grid-cols-2 gap-0.5 bg-card/80 p-1.5" style={{ width: size, height: size }}>
      {item.apps.slice(0, 4).map((a) => (
        <img key={a.id} src={a.icon?.trim() || faviconFor(a.url, 64)} alt="" className="h-full w-full object-contain" draggable={false} />
      ))}
      {item.apps.length === 0 && <Folder className="col-span-2 m-auto h-1/2 w-1/2 text-muted-foreground" />}
    </div>
  );
}

export function Dock({ items, onChange, onOpenFolder, onOpenSettings }: DockProps) {
  const [hover, setHover] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [icon, setIcon] = useState("");
  const [menu, setMenu] = useState<{ id: string; name: string; type: DockItem["type"] } | null>(null);
  const dragIndex = useRef<number | null>(null);
  const [dropZone, setDropZone] = useState<{ index: number; mode: "before" | "after" | "into" } | null>(null);

  const sizeFor = (i: number) => {
    if (hover === null) return 52;
    const d = Math.abs(hover - i);
    if (d === 0) return 74;
    if (d === 1) return 64;
    if (d === 2) return 57;
    return 52;
  };

  const addApp = () => {
    const finalUrl = normalizeUrl(url);
    if (!finalUrl) return;
    let label = name.trim();
    if (!label) {
      try {
        label = new URL(finalUrl).hostname.replace(/^www\./, "");
      } catch {
        label = finalUrl;
      }
    }
    onChange([...items, { id: uid(), type: "app", name: label, url: finalUrl, icon: icon.trim() }]);
    setName("");
    setUrl("");
    setIcon("");
    setAdding(false);
  };

  const setCustomIcon = (id: string) => {
    const item = items.find((i) => i.id === id);
    if (!item || item.type !== "app") return;
    const value = window.prompt("Custom icon image URL (leave empty to use the site favicon)", item.icon ?? "");
    if (value === null) return;
    onChange(items.map((i) => (i.id === id ? { ...i, icon: value.trim() } : i)));
  };

  const zoneFor = (e: React.DragEvent, index: number): { index: number; mode: "before" | "after" | "into" } => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    if (ratio < 0.33) return { index, mode: "before" };
    if (ratio > 0.67) return { index, mode: "after" };
    return { index, mode: "into" };
  };

  const reorder = (from: number, targetIndex: number, mode: "before" | "after") => {
    const next = [...items];
    const [moved] = next.splice(from, 1);
    if (!moved) return;
    let insert = targetIndex + (mode === "after" ? 1 : 0);
    if (from < insert) insert -= 1;
    next.splice(insert, 0, moved);
    onChange(next);
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    const from = dragIndex.current;
    const zone = dropZone ?? zoneFor(e, targetIndex);
    dragIndex.current = null;
    setDropZone(null);
    if (from === null || from === targetIndex) return;
    const source = items[from];
    const target = items[targetIndex];
    if (!source || !target) return;

    if (zone.mode !== "into") {
      reorder(from, targetIndex, zone.mode);
      return;
    }

    if (source.type === "app" && target.type === "folder") {
      const next = items
        .map((it, i) => (i === targetIndex && it.type === "folder" ? { ...it, apps: [...it.apps, source] } : it))
        .filter((_, i) => i !== from);
      onChange(next);
      return;
    }
    if (source.type === "app" && target.type === "app") {
      const folder: FolderItem = { id: uid(), type: "folder", name: "Folder", apps: [target, source] };
      const next = items.map<DockItem>((it, i) => (i === targetIndex ? folder : it)).filter((_, i) => i !== from);
      onChange(next);
      return;
    }
    reorder(from, targetIndex, "after");
  };

  const rename = (id: string) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    const value = window.prompt("Name", item.name);
    if (value === null) return;
    onChange(items.map((i) => (i.id === id ? { ...i, name: value || i.name } : i)));
  };

  return (
    <div className="pointer-events-none absolute inset-x-[10px] bottom-[10px] z-30 flex flex-col items-center gap-2">
      {menu && (
        <div className="mac-glass pointer-events-auto w-44 rounded-xl p-1 text-sm">
          <p className="truncate px-3 py-1 text-xs text-muted-foreground">{menu.name}</p>
          <button
            className="w-full rounded-lg px-3 py-1.5 text-left text-foreground hover:bg-accent"
            onClick={() => {
              rename(menu.id);
              setMenu(null);
            }}
          >
            Rename
          </button>
          {menu.type === "app" && (
            <button
              className="w-full rounded-lg px-3 py-1.5 text-left text-foreground hover:bg-accent"
              onClick={() => {
                setCustomIcon(menu.id);
                setMenu(null);
              }}
            >
              Change icon…
            </button>
          )}
          <button
            className="w-full rounded-lg px-3 py-1.5 text-left text-destructive hover:bg-accent"
            onClick={() => {
              onChange(items.filter((i) => i.id !== menu.id));
              setMenu(null);
            }}
          >
            Remove
          </button>
          <button
            className="w-full rounded-lg px-3 py-1.5 text-left text-muted-foreground hover:bg-accent"
            onClick={() => setMenu(null)}
          >
            Cancel
          </button>
        </div>
      )}

      {adding && (
        <div className="mac-glass pointer-events-auto flex max-w-full flex-wrap items-center justify-center gap-2 rounded-2xl p-2">
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name (optional)"
            className="w-32 rounded-lg bg-card px-2 py-1 text-sm text-foreground outline-none"
          />
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addApp()}
            placeholder="example.com"
            className="w-44 rounded-lg bg-card px-2 py-1 text-sm text-foreground outline-none"
          />
          <input
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addApp()}
            placeholder="Custom icon URL (optional)"
            className="w-48 rounded-lg bg-card px-2 py-1 text-sm text-foreground outline-none"
          />
          <button onClick={addApp} className="rounded-lg bg-[var(--mac-accent)] px-3 py-1 text-sm text-background">
            Add
          </button>
          <button onClick={() => setAdding(false)} className="px-2 text-sm text-muted-foreground">
            Cancel
          </button>
        </div>
      )}

      <div
        className="mac-glass pointer-events-auto flex max-w-full items-end gap-1.5 overflow-x-auto rounded-[24px] px-2 pb-2 pt-2 [zoom:0.75] min-[380px]:[zoom:0.85] sm:gap-2 sm:px-3 sm:[zoom:1]"
        onMouseLeave={() => setHover(null)}
      >
        {items.map((item, i) => {
          const size = sizeFor(i);
          return (
            <button
              key={item.id}
              draggable
              onDragStart={() => (dragIndex.current = i)}
              onDragOver={(e) => {
                e.preventDefault();
                setDropZone(zoneFor(e, i));
              }}
              onDragLeave={() => setDropZone((z) => (z?.index === i ? null : z))}
              onDragEnd={() => setDropZone(null)}
              onDrop={(e) => handleDrop(e, i)}
              onMouseEnter={() => setHover(i)}
              onContextMenu={(e) => {
                e.preventDefault();
                setMenu({ id: item.id, name: item.name, type: item.type });
              }}
              onClick={() => {
                if (item.type === "folder") onOpenFolder(item.id);
                else window.open(item.url, "_blank", "noopener");
              }}
              title={item.name}
              className={`group relative flex shrink-0 flex-col items-center transition-all duration-150 ease-out ${
                dropZone?.index === i && dropZone.mode === "before"
                  ? "border-l-2 border-[var(--mac-accent)]"
                  : dropZone?.index === i && dropZone.mode === "after"
                    ? "border-r-2 border-[var(--mac-accent)]"
                    : ""
              }`}
              style={{ width: size }}
            >
              <span className="pointer-events-none absolute -top-9 whitespace-nowrap rounded-md bg-popover px-2 py-1 text-xs text-popover-foreground opacity-0 shadow transition-opacity group-hover:opacity-100">
                {item.name}
              </span>
              {item.type === "folder" ? <FolderIcon item={item} size={size} /> : <AppIcon item={item} size={size} />}
            </button>
          );
        })}

        <div className="mx-1 h-12 w-px self-center bg-border" />
        <button
          onClick={() => setAdding((v) => !v)}
          aria-label="Add web app"
          className="mac-icon flex h-[52px] w-[52px] shrink-0 items-center justify-center bg-card/70 text-muted-foreground hover:text-foreground"
        >
          <Plus className="h-6 w-6" />
        </button>
        <button
          onClick={onOpenSettings}
          aria-label="Open settings"
          title="Settings"
          className="mac-icon flex h-[52px] w-[52px] shrink-0 items-center justify-center bg-card/70 text-muted-foreground hover:text-foreground"
        >
          <Settings className="h-6 w-6" />
        </button>
      </div>
    </div>
  );
}
