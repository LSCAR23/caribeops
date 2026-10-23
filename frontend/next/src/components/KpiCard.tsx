// Presentational KPI card. Owns pixels only; pages own fetching.
// Contract: label and value are plain text nodes (KpiCard.test pins
// them via getByText). Two looks from the design:
//   - "compact" (Analytics): uppercase label, 34px value, short accent bar.
//   - "feature" (Dashboard): round icon, label + 38px value, and a thin
//     glowing progress track underneath (decorative only).
export type KpiIcon = "store" | "star" | "trend";

function Icon({ name }: { name: KpiIcon }) {
  const common = {
    width: 22,
    height: 22,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  if (name === "store") {
    return (
      <svg {...common}>
        <path d="M3 9l1.5-5h15L21 9" />
        <path d="M3 9h18v2a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0Z" />
        <path d="M5 13v7h14v-7" />
        <path d="M10 20v-4h4v4" />
      </svg>
    );
  }
  if (name === "trend") {
    return (
      <svg {...common}>
        <path d="m3 17 6-6 4 4 8-8" />
        <path d="M15 7h6v6" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9Z" />
    </svg>
  );
}

export default function KpiCard({
  label,
  value,
  className,
  variant = "compact",
  icon = "star",
  progress = 30,
}: {
  label: string;
  value: string;
  className?: string;
  variant?: "compact" | "feature";
  icon?: KpiIcon;
  /** Width (0–100) of the decorative track on the feature card. */
  progress?: number;
}) {
  if (variant === "feature") {
    return (
      <div
        className={`glass-card glass-hover anim-fade-up box-border flex flex-col gap-5 rounded-[18px] px-[26px] py-6 ${className ?? ""}`.trim()}
      >
        <div className="flex items-center gap-[18px]">
          <span
            aria-hidden="true"
            className="flex size-12 flex-none items-center justify-center rounded-full border border-brand-300/55 bg-brand-300/8 text-brand-300"
          >
            <Icon name={icon} />
          </span>
          <div className="flex min-w-0 flex-col gap-1.5">
            <p className="text-[13px] font-medium uppercase tracking-[0.06em] text-ink-600">
              {label}
            </p>
            <p className="text-[38px] font-bold leading-none tracking-[-0.02em] text-white tabular-nums">
              {value}
            </p>
          </div>
        </div>
        <div
          aria-hidden="true"
          className="h-[5px] overflow-hidden rounded-[5px] bg-brand-300/12"
        >
          <div
            className="anim-bar-grow h-full rounded-[5px] bg-gradient-to-r from-brand-500 to-brand-200 shadow-[0_0_10px_color-mix(in_oklab,var(--color-brand-300)_70%,transparent)]"
            style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`glass-card glass-hover anim-fade-up box-border flex flex-col gap-3 rounded-2xl px-[22px] pt-[22px] pb-5 ${className ?? ""}`.trim()}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-500">
        {label}
      </p>
      <p className="text-[34px] font-bold leading-none tracking-[-0.02em] text-white tabular-nums">
        {value}
      </p>
      <span
        aria-hidden="true"
        className="h-[3px] w-10 rounded-[3px] bg-brand-400 shadow-[0_0_8px_color-mix(in_oklab,var(--color-brand-400)_60%,transparent)]"
      />
    </div>
  );
}
