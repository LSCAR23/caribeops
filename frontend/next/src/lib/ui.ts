// Shared class helpers for the design system (UI redesign, Phase 2).
// One definition per pattern — components compose these instead of
// copy-pasting utility strings (the duplication the audit found in
// LoginForm/BusinessForm/SearchInput/CategoryFilter).

// Keyboard focus treatment used on every interactive element. The ring
// offset is the night base so the gap reads over glass cards.
export const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 focus-visible:ring-offset-ivory";

export type ButtonVariant = "primary" | "secondary" | "ghost";

// Button/link surface styles. Links (next/link) and <button> elements
// share this so CTAs look identical everywhere. The primary is the
// glowing cyan gradient from the dashboard mockup; secondary is glass.
export function buttonClassName(
  variant: ButtonVariant = "primary",
  className = "",
): string {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-150 disabled:opacity-50 disabled:pointer-events-none";
  const variants: Record<ButtonVariant, string> = {
    primary:
      "bg-gradient-to-r from-brand-400 to-brand-600 text-white shadow-[0_10px_30px_-12px_rgba(53,205,196,0.8)] hover:shadow-[0_14px_34px_-10px_rgba(53,205,196,0.95)] hover:brightness-110 active:brightness-100",
    secondary:
      "border border-white/20 bg-white/8 text-ink-800 backdrop-blur-md hover:border-brand-400/50 hover:text-white",
    ghost: "text-ink-600 hover:text-ink-900 hover:bg-white/8",
  };
  return `${base} ${variants[variant]} ${focusRing} ${className}`.trim();
}

// Text inputs, textareas and selects share one glass surface.
export const inputClassName =
  "mt-1.5 w-full rounded-xl border border-white/16 bg-white/7 px-3.5 py-2.5 text-sm text-ink-50 placeholder:text-ink-400 transition-colors focus:border-brand-400/70 focus:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/40";

export const labelClassName = "block text-sm font-medium text-ink-700";

export const errorClassName = "mt-1.5 text-sm font-medium text-red-300";
