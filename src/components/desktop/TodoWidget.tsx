import { useState } from "react";
import { Check, ChevronDown, ChevronUp, Plus, X } from "lucide-react";
import type { TodoItem } from "@/lib/desktop-storage";
import { uid } from "@/lib/desktop-storage";

export function TodoWidget({
  todos,
  onChange,
}: {
  todos: TodoItem[];
  onChange: (next: TodoItem[]) => void;
}) {
  const [text, setText] = useState("");

  const add = () => {
    const value = text.trim();
    if (!value) return;
    onChange([...todos, { id: uid(), text: value, done: false }]);
    setText("");
  };

  const move = (index: number, dir: -1 | 1) => {
    const next = [...todos];
    const target = index + dir;
    const a = next[index];
    const b = next[target];
    if (!a || !b) return;
    next[index] = b;
    next[target] = a;
    onChange(next);
  };

  const remaining = todos.filter((t) => !t.done).length;
  const hasItems = todos.length > 0;
  const visible = Math.min(todos.length, 5);
  const height = hasItems ? Math.max(220, 116 + visible * 34) : 220;
  const clip = (t: string) => (t.length > 30 ? `${t.slice(0, 30)}...` : t);

  return (
    <div
      className={`mac-glass flex w-[220px] max-w-full flex-col rounded-[26px] p-4 text-foreground ${
        hasItems ? "sm:w-[360px]" : ""
      }`}
      style={{ height }}
    >
      <div className="flex items-baseline justify-between">
        <h3 className="text-sm font-semibold">Reminders</h3>
        <span className="text-xs text-muted-foreground">{remaining} left</span>
      </div>

      <div className="no-scrollbar mt-3 flex-1 space-y-1 overflow-y-auto pr-1">
        {todos.length === 0 && (
          <p className="py-4 text-center text-xs text-muted-foreground">Nothing to do 🎉</p>
        )}
        {todos.map((todo, i) => (
          <div key={todo.id} className="group flex items-center gap-2 rounded-lg px-1 py-1 hover:bg-accent/60">
            <button
              onClick={() => onChange(todos.map((t) => (t.id === todo.id ? { ...t, done: !t.done } : t)))}
              aria-label={todo.done ? "Mark as not done" : "Mark as done"}
              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                todo.done ? "border-transparent bg-[var(--mac-accent)]" : "border-muted-foreground"
              }`}
            >
              {todo.done && <Check className="h-3 w-3 text-background" />}
            </button>
            <span
              title={todo.text}
              className={`flex-1 truncate text-sm ${todo.done ? "text-muted-foreground line-through" : ""}`}
            >
              {clip(todo.text)}
            </span>
            <div className="flex opacity-0 transition-opacity group-hover:opacity-100">
              <button onClick={() => move(i, -1)} aria-label="Move up" className="text-muted-foreground hover:text-foreground">
                <ChevronUp className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => move(i, 1)} aria-label="Move down" className="text-muted-foreground hover:text-foreground">
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => onChange(todos.filter((t) => t.id !== todo.id))}
                aria-label="Delete task"
                className="text-muted-foreground hover:text-destructive"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-center gap-2 border-t border-border pt-3">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="New reminder"
          className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
        <button onClick={add} aria-label="Add reminder" className="text-muted-foreground hover:text-foreground">
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
