import { X } from "lucide-react";
import type { AppItem, FolderItem } from "@/lib/desktop-storage";
import { faviconFor, normalizeUrl, uid } from "@/lib/desktop-storage";
import { useRef, useState } from "react";

export function FolderOverlay({
  folder,
  onClose,
  onUpdate,
}: {
  folder: FolderItem;
  onClose: () => void;
  onUpdate: (next: FolderItem) => void;
}) {
  const [url, setUrl] = useState("");
  const dragIndex = useRef<number | null>(null);

  const move = (to: number) => {
    const from = dragIndex.current;
    dragIndex.current = null;
    if (from === null || from === to) return;
    const next = [...folder.apps];
    const [moved] = next.splice(from, 1);
    if (!moved) return;
    next.splice(to, 0, moved);
    onUpdate({ ...folder, apps: next });
  };

  const addApp = () => {
    const finalUrl = normalizeUrl(url);
    if (!finalUrl) return;
    let name = finalUrl;
    try {
      name = new URL(finalUrl).hostname.replace(/^www\./, "");
    } catch {
      /* keep */
    }
    const app: AppItem = { id: uid(), type: "app", name, url: finalUrl };
    onUpdate({ ...folder, apps: [...folder.apps, app] });
    setUrl("");
  };

  return (
    <div
      className="absolute inset-0 z-40 flex items-center justify-center bg-background/40 backdrop-blur-xl"
      onClick={onClose}
    >
      <div
        className="mac-glass w-[min(560px,90vw)] rounded-[28px] bg-card/92 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <input
            value={folder.name}
            onChange={(e) => onUpdate({ ...folder, name: e.target.value })}
            className="bg-transparent text-lg font-semibold text-foreground outline-none"
            aria-label="Folder name"
          />
          <button onClick={onClose} aria-label="Close folder" className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 grid grid-cols-4 gap-5 sm:grid-cols-5">
          {folder.apps.map((a, i) => (
            <div
              key={a.id}
              draggable
              onDragStart={() => (dragIndex.current = i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => move(i)}
              className="group flex cursor-grab flex-col items-center gap-1.5 active:cursor-grabbing"
            >
              <button
                onClick={() => window.open(a.url, "_blank", "noopener")}
                className="mac-icon flex h-14 w-14 items-center justify-center bg-card"
              >
                <img src={faviconFor(a.url)} alt="" className="h-7 w-7" />
              </button>
              <span className="max-w-[70px] truncate text-xs text-foreground">{a.name}</span>
              <button
                onClick={() => onUpdate({ ...folder, apps: folder.apps.filter((x) => x.id !== a.id) })}
                className="text-[10px] text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
              >
                Remove
              </button>
            </div>
          ))}
          {folder.apps.length === 0 && (
            <p className="col-span-full py-6 text-center text-sm text-muted-foreground">
              This folder is empty.
            </p>
          )}
        </div>

        <div className="mt-6 flex items-center gap-2 border-t border-border pt-4">
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addApp()}
            placeholder="Add app to folder — example.com"
            className="flex-1 rounded-lg bg-card px-3 py-1.5 text-sm text-foreground outline-none"
          />
          <button onClick={addApp} className="rounded-lg bg-[var(--mac-accent)] px-3 py-1.5 text-sm text-background">
            Add
          </button>
        </div>
      </div>
    </div>
  );
}
