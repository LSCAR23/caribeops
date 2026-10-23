import Image from "next/image";
import LoginForm from "@/components/LoginForm";

// Full-bleed login ("ojo del caribe" mockup). Static page as before:
// nothing is fetched server-side, so the build never needs Laravel.
//
// Background = the login's OWN asset, public/login/caribbean-night.webp
// (the exact photo from the mockup), rendered full-bleed and VIVID: no
// navy scrim, no radial wash on top of it — per the user's "la imagen de
// fondo no debería verse opaca". The glass card carries its own contrast
// and the heading sits over the photo's dark sky region, as in the
// reference image. The shared root backdrop (general-caribbean-night.jpg)
// moved to the (app) layout, so the two photos never stack behind each
// other or double-download.
//
// Layout follows the reference image minus the navbar ("lo único que no
// va es el navbar"): brand lockup, h1, subtitle and card form a centered
// column whose contents are LEFT-aligned like the mockup.

// "ojo del caribe" wordmark: an eye whose iris is a wave.
function EyeWaveMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} fill="none" aria-hidden="true">
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
  );
}

export default function LoginPage() {
  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-5 py-12">
      {/* The mockup's own photo — decorative, eager (LCP), unfiltered */}
      <Image
        src="/login/caribbean-night.webp"
        alt=""
        fill
        sizes="100vw"
        priority
        quality={75}
        className="object-cover"
      />

      {/* Brand + heading + form, above the photo */}
      <section className="anim-breach relative z-10 w-full max-w-lg">
        <div className="flex items-center gap-2.5">
          <EyeWaveMark className="h-8 w-8" />
          <span className="font-display text-2xl font-semibold tracking-tight text-white">
            ojo del caribe
          </span>
        </div>

        <h1 className="mt-7 font-display text-5xl font-bold tracking-tight text-white sm:text-6xl">
          Log in
        </h1>
        <p className="mt-3 text-base text-brand-100/90">
          Sign in with your ojo del caribe account.
        </p>

        <LoginForm />
      </section>
    </main>
  );
}
