import Image from "next/image";
import LoginForm from "@/components/LoginForm";

// Login — "Login Ojo del Caribe" design, lapa (scarlet macaw) theme.
// Static page: nothing is fetched server-side, so the build never needs
// Laravel. Near-black page with a warm orange glow behind the form, the
// macaw emerging bottom-right, and a left-aligned column: brand lockup
// ("Caribe Ops" + orange dot — always this brand), heading, subtitle
// and the glass sign-in card. On narrow screens the macaw shrinks,
// moves to the top-right corner and fades behind the heading.
export default function LoginPage() {
  return (
    <main
      data-theme="lapa"
      className="theme-page flex items-center overflow-hidden"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-0 bottom-0 h-[min(927px,103dvh)] max-[820px]:top-0 max-[820px]:bottom-auto max-[820px]:-right-[8vw] max-[820px]:h-[min(440px,50dvh)] max-[820px]:opacity-45"
      >
        <Image
          src="/animals/lapa.png"
          alt=""
          width={640}
          height={1120}
          preload
          sizes="(max-width: 820px) 100vw, 530px"
          className="anim-emerge h-full w-auto"
          style={{
            transformOrigin: "70% 60%",
            maskImage: "linear-gradient(to bottom, #000 72%, transparent 100%)",
            WebkitMaskImage:
              "linear-gradient(to bottom, #000 72%, transparent 100%)",
          }}
        />
      </div>

      <section className="relative z-[1] ml-[clamp(24px,24vw,380px)] box-border flex w-full max-w-[600px] flex-col gap-8 py-16 max-[820px]:mx-5 max-[820px]:w-auto max-[820px]:max-w-none max-[820px]:flex-1 max-[820px]:py-12">
        {/* Warm orange glow centred behind the form */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-[58%] left-1/2 -z-10 size-[min(1000px,140vw)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,122,26,0.24)_0%,rgba(226,35,26,0.10)_38%,transparent_68%)]"
        />
        <div className="flex items-baseline gap-2">
          <span className="text-[28px] font-bold tracking-[-0.02em] text-white">
            Caribe Ops
          </span>
          <span aria-hidden="true" className="brand-dot size-2" />
        </div>

        <div className="flex flex-col gap-2.5">
          <h1 className="text-[72px] leading-none font-bold tracking-[-0.035em] text-white max-[480px]:text-5xl">
            Log in
          </h1>
          <p className="text-lg text-ink-700/80">
            Sign in with your Caribe Ops account.
          </p>
        </div>

        <LoginForm />
      </section>
    </main>
  );
}
