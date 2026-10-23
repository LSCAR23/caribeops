// Shared class helpers for the design system. One definition per
// pattern — components compose these instead of copy-pasting utility
// strings. Colours come from the page theme (globals.css), so the same
// class is cyan on the dashboard, olive on analytics, green on
// businesses and orange on login.

// Keyboard focus treatment used on every interactive element. The ring
// offset is the page background so the gap reads over glass.
export const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 focus-visible:ring-offset-ivory";

export type ButtonVariant = "primary" | "secondary" | "ghost";

// Button/link surface styles. Links (next/link) and <button> elements
// share this so CTAs look identical everywhere: the primary is the
// design's gradient pill with dark text; secondary is a glass pill.
export function buttonClassName(
  variant: ButtonVariant = "primary",
  className = "",
): string {
  const base =
    "inline-flex cursor-pointer items-center justify-center gap-2.5 rounded-full text-[15px] disabled:opacity-50 disabled:pointer-events-none";
  const variants: Record<ButtonVariant, string> = {
    primary: "btn-accent h-[46px] px-6 font-bold",
    secondary: "btn-glass h-[46px] px-6 font-medium text-ink-800",
    ghost:
      "rounded-lg font-medium text-ink-600 transition-colors hover:bg-white/8 hover:text-white",
  };
  return `${base} ${variants[variant]} ${focusRing} ${className}`.trim();
}

// Text inputs, textareas and selects share one dark glass field.
export const inputClassName =
  "glass-field mt-2 box-border w-full min-h-[46px] rounded-xl px-3.5 py-2.5 text-[15px] text-ink-800 placeholder:text-ink-400/80";

export const labelClassName = "block text-sm font-semibold text-ink-800";

export const errorClassName = "mt-1.5 text-sm font-medium text-red-300";

// Inline text link in the page accent.
export const textLinkClassName = `rounded font-medium text-brand-300 underline-offset-4 transition-colors hover:text-brand-200 hover:underline ${focusRing}`;
