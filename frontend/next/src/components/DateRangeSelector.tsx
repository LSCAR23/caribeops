"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

// Date range selector for the analytics dashboard (D7-05, rebuilt in the
// UI redesign, Phase 6 — Booking.com-style). Preset buttons (7d/30d/90d)
// plus a custom calendar picker. All state lives in the URL as
// ?from=/&to= so ranges are shareable, back-button-safe, and filtered
// server-side by Go. Selecting a range triggers a router push which
// remounts the server-side islands with fresh data.
//
// Phase 6 rebuild notes (behavior otherwise unchanged):
// - Timezone-safe dates: YYYY-MM-DD strings are built from LOCAL date
//   components (formatLocalDate) instead of toISOString() on local
//   midnights, which shifted the selected day in negative offsets.
// - Sunday-first grid: header SUN…SAT and the leading-cell padding both
//   use Sunday-based getDay() (the old header was Monday-first while the
//   padding was Sunday-based, so the columns were misaligned).
// - Same date as start now yields a single-day range (from = to = that
//   day) instead of clearing; documented in the hint line.
// - Full keyboard map (arrows/Home/End/PageUp/PageDown), polite live
//   region, aria-pressed state, ±5-year month bounds, reduced-motion
//   friendly transitions, 40px tap targets.
// - D7-28: preset pills light only when the URL range ends today (a
//   same-length past range lights nothing), and the month heading is
//   month/year <select>s so any month in the ±5-year window is one jump
//   away. Arrows, bounds, and keyboard map unchanged.

// ---- Local-date helpers (exported for the unit tests) --------------------

/** Format a local Date as a calendar-day string (no UTC shift). */
export function formatLocalDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Parse a YYYY-MM-DD string as a LOCAL calendar day. */
export function parseLocalDate(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

/** Add days to a local calendar day (DST-safe: date-only constructor). */
function addDays(d: Date, days: number): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + days);
}

/** Add months, clamping the day (Jan 31 + 1 → Feb 28/29). */
function addMonths(d: Date, months: number): Date {
  const target = new Date(d.getFullYear(), d.getMonth() + months, 1);
  const daysInTarget = new Date(
    target.getFullYear(),
    target.getMonth() + 1,
    0,
  ).getDate();
  return new Date(
    target.getFullYear(),
    target.getMonth(),
    Math.min(d.getDate(), daysInTarget),
  );
}

const fullDayLabel = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  month: "long",
  day: "numeric",
  year: "numeric",
});

const monthHeading = new Intl.DateTimeFormat("en-US", {
  month: "long",
  year: "numeric",
});

const WEEKDAY_HEADERS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

// English month names for the header <select> (matches the en-US Intl
// style used for the grid labels).
const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export default function DateRangeSelector() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");

  const [custom, setCustom] = useState(fromParam !== null || toParam !== null);
  const [focusMonth, setFocusMonth] = useState(
    parseLocalDate(fromParam || toParam || formatLocalDate(new Date())),
  );

  // Derive which preset matches the current URL range (pure computation;
  // local-date parsing + Math.round keeps DST hour-skew from breaking it).
  // A pill means "the last N days", so the range must ALSO end today — a
  // same-length custom range in the past lights nothing (D7-28).
  const presetDays = useMemo(() => [7, 30, 90], []);
  const activePreset = useMemo(() => {
    if (!fromParam || !toParam) return null;
    if (toParam !== formatLocalDate(new Date())) return null;
    const to = parseLocalDate(toParam);
    const from = parseLocalDate(fromParam);
    const diffDays =
      Math.round((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return presetDays.find((d) => d === diffDays) ?? null;
  }, [fromParam, toParam, presetDays]);

  const pushRange = useCallback(
    (fromDate: string | null, toDate: string | null) => {
      const params = new URLSearchParams();
      if (fromDate) params.set("from", fromDate);
      if (toDate) params.set("to", toDate);
      router.push(`/analytics?${params.toString()}`);
    },
    [router],
  );

  const handlePreset = useCallback(
    (days: number) => {
      const to = new Date();
      const from = new Date();
      from.setDate(to.getDate() - days + 1); // inclusive: today counts as day 1
      pushRange(formatLocalDate(from), formatLocalDate(to));
      setCustom(false);
    },
    [pushRange],
  );

  const handleDayClick = useCallback(
    (dateStr: string) => {
      if (!fromParam) {
        // No "from" set yet: clicking sets "from"
        pushRange(dateStr, null);
        return;
      }
      if (fromParam && !toParam) {
        // "from" set: same date becomes a single-day range; later date
        // sets "to"; earlier date predictably becomes the new "from".
        if (dateStr === fromParam) {
          pushRange(fromParam, fromParam);
        } else if (dateStr > fromParam) {
          pushRange(fromParam, dateStr);
        } else {
          pushRange(dateStr, null);
        }
        return;
      }
      // Both set: clicking restarts with new "from"
      pushRange(dateStr, null);
    },
    [fromParam, toParam, pushRange],
  );

  const handleClear = useCallback(() => {
    router.push("/analytics");
    setCustom(false);
  }, [router]);

  // Selection summary doubles as the polite live region's text.
  const summary = !fromParam
    ? "Select a start date, then an end date."
    : !toParam
      ? `Selected: ${fullDayLabel.format(parseLocalDate(fromParam))} – pick an end date`
      : fromParam === toParam
        ? `Selected: ${fullDayLabel.format(parseLocalDate(fromParam))}`
        : `Selected: ${fullDayLabel.format(parseLocalDate(fromParam))} – ${fullDayLabel.format(parseLocalDate(toParam))}`;

  return (
    <section aria-label="Date range" className="mt-6">
      <div className="flex flex-wrap items-center gap-2">
        {presetDays.map((days) => {
          const isActive = activePreset === days;
          return (
            <button
              key={days}
              type="button"
              aria-pressed={isActive}
              onClick={() => handlePreset(days)}
              className={`motion-safe:transition-colors rounded-full px-3.5 py-1.5 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-ivory ${
                isActive
                  ? "bg-brand-700 text-white"
                  : "border border-ink-200 bg-surface text-ink-600 hover:border-ink-300 hover:text-ink-900"
              }`}
            >
              Last {days} days
            </button>
          );
        })}
        <button
          type="button"
          aria-pressed={custom}
          onClick={() => {
            setCustom((c) => !c);
            if (!custom) pushRange(fromParam, toParam);
          }}
          className={`motion-safe:transition-colors inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-ivory ${
            custom
              ? "bg-brand-700 text-white"
              : "border border-ink-200 bg-surface text-ink-600 hover:border-ink-300 hover:text-ink-900"
          }`}
        >
          {custom ? "Hide custom" : "Custom range"}
          {custom ? (
            <span
              aria-hidden="true"
              className="h-1.5 w-1.5 rounded-full bg-accent-400"
            />
          ) : null}
        </button>
        <button
          type="button"
          onClick={handleClear}
          className="ml-auto rounded-full px-3 py-1.5 text-xs font-medium text-ink-500 motion-safe:transition-colors hover:text-ink-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-ivory"
        >
          Clear
        </button>
      </div>

      <p className="mt-2 text-sm text-ink-500" aria-live="polite">
        {summary}
      </p>

      {custom && (
        <CalendarPicker
          from={fromParam ?? undefined}
          to={toParam ?? undefined}
          onDayClick={handleDayClick}
          focusMonth={focusMonth}
          onFocusMonthChange={setFocusMonth}
        />
      )}
    </section>
  );
}

// Calendar date picker: pick "from" first, then "to". Selected range is
// highlighted (endpoints solid green circles, in-between days soft green;
// today gets a small mandarin dot). Single month, Sunday-first header.
function CalendarPicker({
  from,
  to,
  onDayClick,
  focusMonth,
  onFocusMonthChange,
}: {
  from?: string | null;
  to?: string | null;
  onDayClick: (dateStr: string) => void;
  focusMonth: Date;
  onFocusMonthChange: (date: Date) => void;
}) {
  // Keyboard focus that must survive a month re-render (PageUp/PageDown).
  // A ref + focusMonth effect is the DOM-sync pattern the lint rules
  // accept (no setState inside the effect).
  const pendingFocusRef = useRef<string | null>(null);
  useEffect(() => {
    if (pendingFocusRef.current) {
      document.getElementById(pendingFocusRef.current)?.focus();
      pendingFocusRef.current = null;
    }
  }, [focusMonth]);

  const year = focusMonth.getFullYear();
  const month = focusMonth.getMonth();

  // Month navigation bounds: ±5 years around today.
  const now = new Date();
  const minMonth = new Date(now.getFullYear() - 5, 0, 1);
  const maxMonth = new Date(now.getFullYear() + 5, 11, 1);
  const prevDisabled = new Date(year, month, 1) <= minMonth;
  const nextDisabled = new Date(year, month, 1) >= maxMonth;

  // Year <select> options: the same ±5-year window as the arrows, widened
  // only when the URL's focus month already sits outside it (a hand-edited
  // ?from= pointing years back must stay representable in the control).
  const minYear = Math.min(now.getFullYear() - 5, year);
  const maxYear = Math.max(now.getFullYear() + 5, year);
  const yearOptions = Array.from(
    { length: maxYear - minYear + 1 },
    (_, i) => minYear + i,
  );

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  // Sunday-based: getDay() is 0 for Sundays, matching the SUN…SAT header.
  const leadingBlanks = new Date(year, month, 1).getDay();
  // Roving tabindex: Tab lands on the start date when it is in the
  // displayed month, otherwise on the 1st — so the grid is always
  // reachable even when `from` lives in another month.
  const monthPrefix = `${year}-${String(month + 1).padStart(2, "0")}`;
  const rovingId =
    from && from.startsWith(monthPrefix)
      ? `drs-day-${from}`
      : `drs-day-${monthPrefix}-01`;

  const handleDayKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    dateStr: string,
  ) => {
    const current = parseLocalDate(dateStr);
    let target: Date | null = null;
    switch (event.key) {
      case "ArrowLeft":
        target = addDays(current, -1);
        break;
      case "ArrowRight":
        target = addDays(current, 1);
        break;
      case "ArrowUp":
        target = addDays(current, -7);
        break;
      case "ArrowDown":
        target = addDays(current, 7);
        break;
      case "Home":
        target = addDays(current, -current.getDay());
        break;
      case "End":
        target = addDays(current, 6 - current.getDay());
        break;
      case "PageUp":
        target = addMonths(current, -1);
        break;
      case "PageDown":
        target = addMonths(current, 1);
        break;
      default:
        return; // Enter/Space: native button activation selects
    }
    event.preventDefault();
    const targetStr = formatLocalDate(target);
    if (targetStr.slice(0, 7) !== dateStr.slice(0, 7)) {
      // Crossed a month boundary: navigate, then move focus after render.
      onFocusMonthChange(new Date(target.getFullYear(), target.getMonth(), 1));
      pendingFocusRef.current = `drs-day-${targetStr}`;
    } else {
      document.getElementById(`drs-day-${targetStr}`)?.focus();
    }
  };

  return (
    <div className="mt-3 rounded-2xl border border-ink-100 bg-surface p-4 shadow-[0_1px_2px_rgba(30,29,25,0.04),0_8px_24px_-12px_rgba(30,29,25,0.12)] sm:p-5">
      <div className="flex items-center justify-between px-1">
        <button
          type="button"
          aria-label="Previous month"
          disabled={prevDisabled}
          onClick={() => onFocusMonthChange(new Date(year, month - 1, 1))}
          className="flex h-10 w-10 items-center justify-center rounded-full text-lg text-ink-400 motion-safe:transition-colors hover:bg-ivory-100 hover:text-ink-800 disabled:pointer-events-none disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-ivory"
        >
          ‹
        </button>
        <h3 className="flex items-center gap-1.5 font-display text-base font-semibold tracking-tight text-ink-900">
          <select
            aria-label="Month"
            value={String(month)}
            onChange={(event) =>
              onFocusMonthChange(new Date(year, Number(event.target.value), 1))
            }
            className="h-10 cursor-pointer rounded-full border border-ink-200 bg-surface px-3 text-sm text-ink-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-ivory"
          >
            {MONTH_NAMES.map((name, index) => (
              <option key={name} value={String(index)}>
                {name}
              </option>
            ))}
          </select>
          <select
            aria-label="Year"
            value={String(year)}
            onChange={(event) =>
              onFocusMonthChange(new Date(Number(event.target.value), month, 1))
            }
            className="h-10 cursor-pointer rounded-full border border-ink-200 bg-surface px-2.5 text-sm text-ink-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-ivory"
          >
            {yearOptions.map((optionYear) => (
              <option key={optionYear} value={String(optionYear)}>
                {optionYear}
              </option>
            ))}
          </select>
        </h3>
        <button
          type="button"
          aria-label="Next month"
          disabled={nextDisabled}
          onClick={() => onFocusMonthChange(new Date(year, month + 1, 1))}
          className="flex h-10 w-10 items-center justify-center rounded-full text-lg text-ink-400 motion-safe:transition-colors hover:bg-ivory-100 hover:text-ink-800 disabled:pointer-events-none disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-ivory"
        >
          ›
        </button>
      </div>

      <div
        aria-hidden="true"
        className="mt-3 grid grid-cols-7 text-center text-[11px] font-semibold uppercase tracking-wider text-ink-400"
      >
        {WEEKDAY_HEADERS.map((day) => (
          <div key={day}>{day}</div>
        ))}
      </div>

      <div
        role="group"
        aria-label={`${monthHeading.format(focusMonth)} days`}
        className="mt-1 grid grid-cols-7"
      >
        {/* Leading blanks keep the Sunday-first columns aligned */}
        {Array.from({ length: leadingBlanks }, (_, i) => (
          <span key={`blank-${i}`} aria-hidden="true" className="h-10" />
        ))}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const dayDate = new Date(year, month, i + 1);
          const dateStr = formatLocalDate(dayDate);
          const isStart = dateStr === from;
          const isEnd = dateStr === to;
          const isEndpoint = isStart || isEnd;
          const isInRange =
            !!from && !!to && dateStr > from && dateStr < to;
          const isToday = dateStr === formatLocalDate(new Date());
          const state = isEndpoint
            ? isStart && isEnd
              ? "selected, single day"
              : isStart
                ? "selected, start of range"
                : "selected, end of range"
            : isInRange
              ? "in selected range"
              : isToday
                ? "today"
                : "";
          return (
            <button
              key={dateStr}
              id={`drs-day-${dateStr}`}
              type="button"
              tabIndex={dateStr === rovingId ? 0 : -1}
              aria-label={`${fullDayLabel.format(dayDate)}${state ? `, ${state}` : ""}`}
              aria-pressed={isEndpoint}
              onClick={() => onDayClick(dateStr)}
              onKeyDown={(event) => handleDayKeyDown(event, dateStr)}
              className={`relative mx-auto flex h-10 w-10 items-center justify-center text-sm motion-safe:transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-1 focus-visible:ring-offset-ivory ${
                isEndpoint
                  ? "rounded-full bg-brand-700 font-semibold text-white"
                  : isInRange
                    ? "rounded-none bg-brand-400/25 font-medium text-brand-100"
                    : "rounded-full text-ink-800 hover:bg-ivory-100"
              }`}
            >
              {i + 1}
              {isToday && !isEndpoint ? (
                <span
                  aria-hidden="true"
                  className="absolute bottom-1 h-1 w-1 rounded-full bg-accent-500"
                />
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
