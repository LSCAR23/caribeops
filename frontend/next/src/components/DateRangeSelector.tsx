"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";

// Date range selector for the analytics dashboard (D7-05). Preset buttons
// (7d/30d/90d) plus a Custom calendar picker. All state lives in the URL as
// ?from=/&to= so ranges are shareable, back-button-safe, and filtered
// server-side by Go. Selecting a range triggers a router push which remounts
// the server-side islands with fresh data.
export default function DateRangeSelector() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");

  const [custom, setCustom] = useState(fromParam !== null || toParam !== null);
  const [focusMonth, setFocusMonth] = useState(
    new Date(fromParam || toParam || new Date()),
  );

  // Derive which preset matches the current URL range (pure computation).
  const presetDays = useMemo(() => [7, 30, 90], []);
  const activePreset = useMemo(() => {
    if (!fromParam || !toParam) return null;
    const to = new Date(toParam);
    const from = new Date(fromParam);
    const diffDays =
      Math.floor((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)) + 1;
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
      const toStr = to.toISOString().slice(0, 10);
      const fromStr = from.toISOString().slice(0, 10);
      pushRange(fromStr, toStr);
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
        // "from" set: clicking same date clears; clicking later date sets "to"
        if (dateStr === fromParam) {
          pushRange(null, null);
        } else if (new Date(dateStr) > new Date(fromParam)) {
          pushRange(fromParam, dateStr);
        } else {
          // Clicked earlier date: it becomes the new "from"
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

  return (
    <section aria-label="Date range" className="mt-8 flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-4">
        <span className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
          Date range
        </span>
        {presetDays.map((days) => {
          const isActive = activePreset === days;
          return (
            <button
              key={days}
              type="button"
              onClick={() => handlePreset(days)}
              className={`rounded border px-3 py-1.5 text-sm font-medium transition-colors ${
                isActive
                  ? "border-teal-700 bg-teal-700 text-white dark:bg-teal-600"
                  : "border-zinc-300 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              }`}
            >
              Last {days} days
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => {
            setCustom((c) => !c);
            if (!custom) pushRange(fromParam, toParam);
          }}
          className="rounded border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          {custom ? "Hide custom" : "Custom range"}
        </button>
        <button
          type="button"
          onClick={handleClear}
          className="text-xs font-medium text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300"
        >
          Clear
        </button>
      </div>

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
// highlighted (from/to dark blue circles, between light blue). Single month
// view with Monday-first weekday header, matching the reference design.
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
  const fromDate = from ? new Date(from) : null;
  const toDate = to ? new Date(to) : null;

  const isSelected = (d: Date) => {
    const ds = d.toISOString().slice(0, 10);
    return ds === from || ds === to;
  };
  const isInRange = (d: Date) => {
    if (!fromDate || !toDate) return false;
    return d > fromDate && d < toDate;
  };
  const isToday = (d: Date) => {
    const today = new Date();
    return d.toISOString().slice(0, 10) === today.toISOString().slice(0, 10);
  };

  const daysInMonth = (year: number, month: number) =>
    new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) =>
    new Date(year, month, 1).getDay();

  const monthGrid = (year: number, month: number) => {
    const days = daysInMonth(year, month);
    const firstDay = firstDayOfMonth(year, month);
    const cells: Array<React.ReactNode> = [];

    // Pad leading empty cells for days before the 1st of the month
    for (let i = 0; i < firstDay; i++) {
      cells.push(<div key={`empty-${i}`} className="h-9" />);
    }

    for (let day = 1; day <= days; day++) {
      const d = new Date(year, month, day);
      const ds = d.toISOString().slice(0, 10);
      const selected = isSelected(d);
      const inRange = isInRange(d);
      const today = isToday(d);
      const classes = [
        "rounded h-9 w-9 text-sm text-center cursor-pointer",
        selected ? "bg-teal-700 text-white" : "bg-white text-zinc-900",
        inRange ? "bg-teal-100" : "",
        today ? "ring-1 ring-teal-700" : "",
        darkModeClass(),
      ].join(" ");

      cells.push(
        <button
          key={ds}
          type="button"
          onClick={() => onDayClick(ds)}
          className={classes}
        >
          {day}
        </button>
      );
    }

    return cells;
  };

  const monthLabel = (date: Date) =>
    date.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const year = focusMonth.getFullYear();
  const month = focusMonth.getMonth();

  const darkModeClass = () =>
    "dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50";

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between px-2">
        <button
          type="button"
          onClick={() =>
            onFocusMonthChange(
              new Date(focusMonth.getFullYear(), focusMonth.getMonth() - 1, 1),
            )
          }
          className="rounded-full h-9 w-9 flex items-center justify-center text-zinc-400 hover:text-zinc-600 dark:text-zinc-400 dark:hover:text-zinc-300"
        >
          〈
        </button>
        <span className="font-semibold text-zinc-900 dark:text-zinc-50">
          {monthLabel(focusMonth)}
        </span>
        <button
          type="button"
          onClick={() =>
            onFocusMonthChange(
              new Date(focusMonth.getFullYear(), focusMonth.getMonth() + 1, 1),
            )
          }
          className="rounded-full h-9 w-9 flex items-center justify-center text-zinc-400 hover:text-zinc-600 dark:text-zinc-400 dark:hover:text-zinc-300"
        >
          〉
        </button>
      </div>
      <div className="grid grid-cols-7 text-xs text-zinc-500 dark:text-zinc-400">
        {["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"].map((d) => (
          <div key={d} className="text-center">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">{monthGrid(year, month)}</div>
    </div>
  );
}
