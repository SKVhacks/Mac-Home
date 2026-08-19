import { useEffect, useRef, useState } from "react";
import type { ClockStyle } from "@/lib/desktop-storage";

function useNow() {
  const [now, setNow] = useState(() => new Date());
  const frame = useRef<number>(0);
  useEffect(() => {
    const tick = () => {
      setNow(new Date());
      frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame.current);
  }, []);
  return now;
}

/** Three Apple-style clock faces: digital tick card, classic numerals, minimal bars. */
export function ClockWidget({ variant = "classic", hour12 = true }: { variant?: ClockStyle; hour12?: boolean }) {
  const now = useNow();
  const ms = now.getMilliseconds() / 1000;
  const sec = now.getSeconds() + ms;
  const min = now.getMinutes() + sec / 60;
  const hr = (now.getHours() % 12) + min / 60;

  if (variant === "digital") {
    const h24 = now.getHours();
    const h = hour12 ? h24 % 12 || 12 : h24;
    const m = String(now.getMinutes()).padStart(2, "0");
    const secFloat = sec; // 0..60 with ms precision
    // Ticks follow a rounded-square (superellipse) path, like the iOS clock icon.
    const squircle = (deg: number) => {
      const a = ((deg - 90) * Math.PI) / 180;
      const c = Math.cos(a);
      const s = Math.sin(a);
      const n = 4.5;
      return 1 / Math.pow(Math.pow(Math.abs(c), n) + Math.pow(Math.abs(s), n), 1 / n);
    };
    return (
      <div className="mac-clock-digital relative flex h-[220px] w-[220px] items-center justify-center rounded-[46px] p-2">
        <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
          {Array.from({ length: 60 }).map((_, i) => {
            const deg = i * 6;
            const a = ((deg - 90) * Math.PI) / 180;
            const r = squircle(deg) * 44;
            const cx = 50 + Math.cos(a) * r;
            const cy = 50 + Math.sin(a) * r;
            const ux = Math.cos(a);
            const uy = Math.sin(a);
            const len = 5.5;
            const delta = secFloat - i;
            const active = delta >= 0 && delta < 60;
            // Freshly passed ticks are solid, then fade out behind the sweep.
            const opacity = active ? Math.max(0.18, 1 - delta / 14) : 0.18;
            return (
              <line
                key={i}
                x1={cx - ux * len}
                y1={cy - uy * len}
                x2={cx}
                y2={cy}
                className="mac-clock-digital-tick"
                strokeWidth={1.6}
                strokeLinecap="round"
                opacity={opacity}
              />
            );
          })}
        </svg>
        <span className="mac-clock-digital-text text-[62px] font-black leading-none tracking-[-0.04em] tabular-nums">
          {h}:{m}
        </span>
      </div>
    );
  }

  const minimal = variant === "minimal";

  return (
    <div
      className={`${minimal ? "mac-clock-minimal" : "mac-clock-classic"} flex h-[220px] w-[220px] items-center justify-center rounded-[34px] p-1`}
    >
      <svg viewBox="0 0 100 100" className="h-[212px] w-[212px]">
        <circle cx="50" cy="50" r="46" className="mac-clock-face" />
        {minimal ? (
          Array.from({ length: 12 }).map((_, i) => (
            <line
              key={i}
              x1="50"
              y1="10"
              x2="50"
              y2="19"
              className="mac-clock-bar"
              strokeWidth="3.4"
              strokeLinecap="round"
              transform={`rotate(${i * 30} 50 50)`}
            />
          ))
        ) : (
          <>
            {Array.from({ length: 60 }).map((_, i) => (
              <line
                key={i}
                x1="50"
                y1="8"
                x2="50"
                y2={i % 5 === 0 ? 13 : 11}
                className={i % 5 === 0 ? "mac-clock-tick-major" : "mac-clock-tick"}
                strokeWidth={i % 5 === 0 ? 1.8 : 0.9}
                transform={`rotate(${i * 6} 50 50)`}
              />
            ))}
            {Array.from({ length: 12 }).map((_, i) => {
              const n = i + 1;
              const a = ((n * 30 - 90) * Math.PI) / 180;
              return (
                <text
                  key={n}
                  x={50 + Math.cos(a) * 30}
                  y={50 + Math.sin(a) * 30}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize="9"
                  className="mac-clock-num"
                >
                  {n}
                </text>
              );
            })}
          </>
        )}

        <line
          x1="50" y1="57" x2="50" y2="31"
          className="mac-clock-hand" strokeWidth="3.6" strokeLinecap="round"
          transform={`rotate(${hr * 30} 50 50)`}
        />
        <line
          x1="50" y1="59" x2="50" y2="19"
          className="mac-clock-hand" strokeWidth="3" strokeLinecap="round"
          transform={`rotate(${min * 6} 50 50)`}
        />
        <line
          x1="50" y1="64" x2="50" y2="15"
          className="mac-clock-second" strokeWidth="1.1" strokeLinecap="round"
          transform={`rotate(${sec * 6} 50 50)`}
        />
        <circle cx="50" cy="50" r="2.4" className="mac-clock-pin" />
      </svg>
    </div>
  );
}
