import { buttonClassName, type ButtonVariant } from "@/lib/ui";

// Button primitive (UI redesign, Phase 2): pixels only — callers keep
// owning state machines (disabled/pending) exactly as before.
export default function Button({
  variant = "primary",
  type = "button",
  disabled = false,
  className,
  children,
  onClick,
}: {
  variant?: ButtonVariant;
  type?: "button" | "submit";
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={buttonClassName(variant, className)}
    >
      {children}
    </button>
  );
}
