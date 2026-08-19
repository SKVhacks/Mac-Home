import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import type { WidgetSize } from "@/lib/desktop-storage";
import type { CalendarEvent } from "@/lib/google-calendar";
import { fetchTodayEvents, getStoredToken, hasIdentity, signIn } from "@/lib/google-calendar";

const WEEK = ["S", "M", "T", "W", "T", "F", "S"];

function MonthGrid({ now, compact = false }: { now: Date; compact?: boolean }) {
  const year = now.getFullYear();
  const month = now.getMonth();
  const today = now.getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array.from({ length: firstDay }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const cell = compact ? "h-[22px] w-[22px] text-[12px]" : "h-[17px] w-[17px] text-[11px]";
  const row = compact ? "h-[22px]" : "h-[17px]";

  return (
    <div className={`grid grid-cols-7 gap-y-1 text-center ${compact ? "text-[11px]" : "text-[10px]"}`}>
      {WEEK.map((d, i) => (
        <span key={i} className="mac-cal-muted">
          {d}
        </span>
      ))}
      {cells.map((d, i) => {
        const weekend = i % 7 === 0 || i % 7 === 6;
        return (
          <span key={i} className={`flex ${row} items-center justify-center`}>
            {d && (
              <span
                className={`flex ${cell} items-center justify-center rounded-full ${
                  d === today
                    ? "mac-cal-today font-semibold"
                    : weekend
                      ? "mac-cal-muted"
                      : "mac-cal-day"
                }`}
              >
                {d}
              </span>
            )}
          </span>
        );
      })}
    </div>
  );
}

export function CalendarWidget({
  googleClientId,
  size = "small",
}: {
  googleClientId: string;
  size?: WidgetSize;
}) {
  const [now] = useState(() => new Date());
  const [events, setEvents] = useState<CalendarEvent[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = (token: string) => {
    setBusy(true);
    fetchTodayEvents(token)
      .then(setEvents)
      .catch((e: Error) => setError(e.message))
      .finally(() => setBusy(false));
  };

  useEffect(() => {
    if (size !== "large") return;
    const stored = getStoredToken();
    if (stored) load(stored.token);
  }, [size]);

  const connect = async () => {
    setError(null);
    setBusy(true);
    try {
      const stored = await signIn(googleClientId);
      load(stored.token);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign-in failed");
      setBusy(false);
    }
  };

  const today = now.getDate();

  if (size !== "large") {
    return (
      <div className="mac-cal-card flex h-[220px] w-[220px] max-w-full flex-col overflow-hidden rounded-[26px] p-4">
        <div className="flex items-baseline justify-between">
          <span className="mac-cal-accent text-[11px] font-bold uppercase tracking-wide">
            {now.toLocaleDateString(undefined, { month: "long" })}
          </span>
          <span className="mac-cal-muted text-[11px] font-semibold">{now.getFullYear()}</span>
        </div>
        <div className="mt-2 flex-1">
          <MonthGrid now={now} compact />
        </div>
      </div>
    );
  }

  return (
    <div className="mac-cal-card h-[220px] w-[360px] max-w-full overflow-hidden rounded-[26px] p-4">
      <div className="flex gap-4">
        <div className="flex w-[46%] min-w-0 flex-col">
          <span className="mac-cal-accent text-[11px] font-bold uppercase tracking-wide">
            {now.toLocaleDateString(undefined, { weekday: "long" })}
          </span>
          <span className="mac-cal-day -mt-1 text-[44px] font-light leading-none">{today}</span>

          <div className="mt-4 space-y-1.5 text-sm">
            {busy && <Loader2 className="mac-cal-muted h-4 w-4 animate-spin" />}
            {!busy && error && <p className="mac-cal-muted text-xs">{error}</p>}
            {!busy && !error && events && events.length > 0 && (
              <ul className="space-y-1.5">
                {events.slice(0, 4).map((e) => (
                  <li key={e.id} className="truncate">
                    <span className="mac-cal-accent text-[11px]">
                      {e.allDay
                        ? "all-day"
                        : new Date(e.start).toLocaleTimeString(undefined, {
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                    </span>
                    <span className="mac-cal-day block truncate text-[13px]">{e.title}</span>
                  </li>
                ))}
              </ul>
            )}
            {!busy && !error && events && events.length === 0 && (
              <p className="mac-cal-muted text-[15px]">No events today</p>
            )}
            {!busy && !error && !events && (
              <button onClick={connect} className="mac-cal-accent text-left text-[13px] underline">
                {hasIdentity() ? "Connect Google Calendar" : "Connect in the extension"}
              </button>
            )}
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="mac-cal-accent text-[11px] font-bold uppercase tracking-wide">
            {now.toLocaleDateString(undefined, { month: "long" })}
          </div>
          <div className="mt-2">
            <MonthGrid now={now} />
          </div>
        </div>
      </div>
    </div>
  );
}
