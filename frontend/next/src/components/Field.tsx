import { errorClassName, labelClassName } from "@/lib/ui";

// Field primitive (UI redesign, Phase 2): label + control + error with
// the accessibility contract the forms already use (htmlFor wiring,
// role="alert" errors). The control itself is passed in so text inputs,
// textareas, selects and number inputs all keep their own attributes.
export default function Field({
  htmlFor,
  label,
  error,
  children,
}: {
  htmlFor: string;
  label: string;
  error?: string | undefined;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className={labelClassName}>
        {label}
      </label>
      {children}
      {error !== undefined ? (
        <p role="alert" className={errorClassName}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
