import Image from "next/image";
import type { AppTheme } from "@/lib/theme";

// Decorative background of the authenticated pages: a soft radial glow
// in the page colour plus the page's animal, which "emerges" (blur →
// sharp, small → full size) on entry. Positions, sizes and masks follow
// the design artboards. Everything is aria-hidden and ignores the
// pointer; the parent keys this component by theme so the entrance
// replays when the user moves to another section.
export default function AnimalBackdrop({ theme }: { theme: AppTheme }) {
  if (theme === "jaguar") {
    return (
      <div aria-hidden="true" className="pointer-events-none">
        <div className="fixed -left-[12%] top-0 size-[1000px] rounded-full bg-[radial-gradient(circle,rgba(120,145,50,0.16)_0%,rgba(80,100,35,0.06)_45%,transparent_70%)]" />
        <div className="fixed left-0 top-[96px] h-[min(840px,calc(100vh-96px))] max-[1000px]:opacity-35 max-[720px]:top-[84px] max-[720px]:-left-[22vw] max-[720px]:h-[min(420px,55vh)] max-[720px]:opacity-30">
        <Image
          src="/animals/jaguar.png"
          alt=""
          width={843}
          height={1190}
          preload
          sizes="(max-width: 1000px) 60vw, 600px"
          className="anim-emerge h-full w-auto"
          style={{
            transformOrigin: "30% 40%",
            ["--emerge-x" as string]: "40px",
            maskImage:
              "linear-gradient(to bottom, #000 66%, transparent 100%), linear-gradient(to left, transparent 0%, rgba(0,0,0,0.35) 5%, #000 13%)",
            maskComposite: "intersect",
            WebkitMaskImage:
              "linear-gradient(to bottom, #000 66%, transparent 100%), linear-gradient(to left, transparent 0%, rgba(0,0,0,0.35) 5%, #000 13%)",
            WebkitMaskComposite: "source-in",
          }}
        />
        </div>
      </div>
    );
  }

  if (theme === "perezoso") {
    return (
      <div aria-hidden="true" className="pointer-events-none">
        <Image
          src="/animals/palmera.png"
          alt=""
          width={706}
          height={1101}
          preload
          sizes="(max-width: 1000px) 70vw, 700px"
          className="anim-palm fixed left-1/2 top-0 h-screen w-auto -translate-x-1/2 max-[720px]:h-[70vh]"
          style={{
            maskImage: "linear-gradient(to bottom, #000 55%, transparent 100%)",
            WebkitMaskImage:
              "linear-gradient(to bottom, #000 55%, transparent 100%)",
          }}
        />
        <div className="fixed -left-[10%] -top-[10%] size-[900px] rounded-full bg-[radial-gradient(circle,rgba(130,190,90,0.12)_0%,rgba(90,140,60,0.04)_45%,transparent_70%)]" />
        <div className="fixed -right-[14%] top-0 size-[1000px] rounded-full bg-[radial-gradient(circle,rgba(170,120,70,0.16)_0%,rgba(110,80,50,0.06)_45%,transparent_70%)]" />
        <div className="fixed right-0 top-[96px] h-[min(880px,calc(100vh-96px))] max-[1000px]:opacity-30 max-[720px]:top-[84px] max-[720px]:-right-[16vw] max-[720px]:h-[min(440px,58vh)] max-[720px]:opacity-35">
        <Image
          src="/animals/perezoso.png"
          alt=""
          width={696}
          height={1313}
          preload
          sizes="(max-width: 1000px) 50vw, 470px"
          className="anim-emerge h-full w-auto"
          style={{
            transformOrigin: "40% 40%",
            maskImage: "linear-gradient(to bottom, #000 68%, transparent 100%)",
            WebkitMaskImage:
              "linear-gradient(to bottom, #000 68%, transparent 100%)",
          }}
        />
        </div>
      </div>
    );
  }

  // tortuga (dashboard): scrolls with the page, top-right.
  return (
    <div aria-hidden="true" className="pointer-events-none">
      <div className="absolute -right-[8%] -top-[10%] size-[900px] rounded-full bg-[radial-gradient(circle,rgba(20,184,170,0.14)_0%,rgba(14,116,144,0.05)_45%,transparent_70%)]" />
      <div className="absolute right-[3%] top-10 w-[min(44vw,620px)] max-[820px]:-right-[25%] max-[820px]:top-[120px] max-[820px]:w-[90%] max-[820px]:opacity-35 max-[720px]:-right-[18vw] max-[720px]:top-[76px] max-[720px]:w-[78vw] max-[720px]:opacity-40">
        <Image
          src="/animals/tortuga.png"
          alt=""
          width={1108}
          height={1520}
          preload
          sizes="(max-width: 820px) 90vw, 620px"
          className="anim-emerge block h-auto w-full"
        />
      </div>
    </div>
  );
}
