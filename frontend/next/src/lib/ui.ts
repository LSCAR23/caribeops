// Shared class helpers for the design system (UI redesign, Phase 2).
// One definition per pattern — components compose these instead of
// copy-pasting utility strings (the duplication the audit found in
// LoginForm/BusinessForm/SearchInput/CategoryFilter).

// Keyboard focus treatment used on every interactive element.
export const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-ivory";

export type ButtonVariant = "primary" | "secondary" | "ghost";

// Button/link surface styles. Links (next/link) and <button> elements
// share this so CTAs look identical everywhere.
export function buttonClassName(
  variant: ButtonVariant = "primary",
  className = "",
): string {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors duration-150 disabled:opacity-50 disabled:pointer-events-none";
  const variants: Record<ButtonVariant, string> = {
    primary:
      "bg-brand-600 text-white shadow-sm hover:bg-brand-700 active:bg-brand-800",
    secondary:
      "border border-ink-200 bg-surface text-ink-700 hover:border-ink-300 hover:text-ink-900",
    ghost: "text-ink-600 hover:text-ink-900 hover:bg-ink-100",
  };
  return `${base} ${variants[variant]} ${focusRing} ${className}`.trim();
}

// Text inputs, textareas and selects share one surface.
export const inputClassName =
  "mt-1.5 w-full rounded-xl border border-ink-200 bg-surface px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-ink-400 transition-colors focus:border-brand-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30";

export const labelClassName = "block text-sm font-medium text-ink-700";

export const errorClassName = "mt-1.5 text-sm font-medium text-red-600";
