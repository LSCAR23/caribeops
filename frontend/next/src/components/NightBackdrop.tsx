import Image from "next/image";

// Fixed full-viewport Caribbean night backdrop, shared by the (app)
// routes via the authenticated layout. One <Image> download is cached
// and reused across client navigations; `fixed` + `fill` keeps it
// compositor-only (no reflow as content scrolls over it). /login does
// not use this component — it renders its own vivid mockup photo
// (public/login/caribbean-night.webp) with no scrim.
//
// Layering (all compositor-only):
//   1. base   — deep-sea gradient: the paint shown before the photo decodes
//               AND the fallback if it never loads (no white flash, no 404
//               noise because the gradient stands alone).
//   2. photo  — next/image, eager + high priority (it is the LCP element).
//   3. scrim  — directional navy wash: heavier on the LEFT where text lives,
//               clear on the RIGHT so the glowing globe keeps its punch
//               (WCAG AA for overlaid white text regardless of photo).
//
// alt="" = decorative, no layout shift. Pointer-events-none so it never
// intercepts clicks meant for content above it.
export default function NightBackdrop() {
  return (
    <div aria-hidden="true" className="fixed inset-0 -z-10">
      {/* Layer 1 — deep-sea base / decode paint / load fallback */}
      <div className="absolute inset-0 bg-[radial-gradient(130%_100%_at_74%_42%,#0e6b74_0%,#0a4756_30%,#07303c_55%,#041d26_82%,#03141b_100%)]" />
      {/* Layer 2 — the photographic backdrop (globe sits right-of-centre) */}
      <Image
        src="/general-caribbean-night.webp"
        alt=""
        fill
        sizes="100vw"
        quality={75}
        loading="eager"
        fetchPriority="high"
        className="object-cover object-[72%_center]"
      />
      {/* Layer 3 — contrast scrim: dark where text sits, clear over the globe */}
      <div className="absolute inset-0 bg-[linear-gradient(95deg,rgba(3,18,25,0.94)_0%,rgba(3,18,25,0.82)_34%,rgba(3,18,25,0.5)_62%,rgba(3,18,25,0.14)_100%)]" />
      {/* Layer 3b — vertical wash so the sticky top nav and page foot stay legible */}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,18,25,0.6)_0%,rgba(3,18,25,0.12)_16%,rgba(3,18,25,0.12)_80%,rgba(3,18,25,0.55)_100%)]" />
    </div>
  );
}
