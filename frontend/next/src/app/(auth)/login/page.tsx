import LoginForm from "@/components/LoginForm";

// Full-bleed login ("ojo del caribe" mockup). Static page as before:
// nothing is fetched server-side, so the build never needs Laravel.
//
// The Caribbean night photo is rendered ONCE at the root layout
// (NightBackdrop) and shared with every app view — one cached download.
// This page therefore adds no backdrop of its own (the old heavy
// vertical scrim that dulled the globe is gone); it only paints a soft
// radial wash behind the centered column so the heading and glass card
// keep WCAG AA while the glowing globe on the right stays vivid.

export default function LoginPage() {
  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-5 py-12">
      {/* Soft radial wash behind the centered column — contrast only,
          kept light and tight so it never reaches the globe on the right
          (the root backdrop's directional scrim does the heavy lifting). */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(46%_52%_at_48%_46%,rgba(3,18,25,0.6)_0%,rgba(3,18,25,0.26)_60%,transparent_100%)]"
      />

      {/* Brand lockup + heading + form, above the backdrop */}
      <section className="anim-breach relative z-10 w-full max-w-md">
        {/* "ojo del caribe" wordmark: an eye whose iris is a wave */}
        <div className="flex items-center justify-center gap-2.5">
          <svg
            viewBox="0 0 32 32"
            className="h-8 w-8"
            fill="none"
            aria-hidden="true"
          >
            <circle
              cx="16"
              cy="16"
              r="14.5"
              stroke="url(#ojo-ring)"
              strokeWidth="1.6"
            />
            <path
              d="M5 17c2.5-3 5-3 7.5 0s5 3 7.5 0 5-3 7.5 0"
              stroke="url(#ojo-wave)"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
            <circle cx="16" cy="16" r="2.4" fill="#7fe6dd" />
            <defs>
              <linearGradient id="ojo-ring" x1="2" y1="2" x2="30" y2="30">
                <stop stopColor="#8ff0e6" />
                <stop offset="1" stopColor="#2ea39e" />
              </linearGradient>
              <linearGradient id="ojo-wave" x1="5" y1="17" x2="27" y2="17">
                <stop stopColor="#8ff0e6" />
                <stop offset="1" stopColor="#cdeae8" />
              </linearGradient>
            </defs>
          </svg>
          <span className="font-display text-2xl font-semibold tracking-tight text-white">
            ojo del caribe
          </span>
        </div>

        <h1 className="mt-8 text-center font-display text-5xl font-bold tracking-tight text-white">
          Log in
        </h1>
        <p className="mt-2 text-center text-sm text-brand-100/90">
          Sign in with your ojo del caribe account.
        </p>

        <LoginForm />
      </section>
    </main>
  );
}
