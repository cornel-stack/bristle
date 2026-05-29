// Shared labeled input for the auth forms (server component). Wires the
// label↔input via htmlFor and the error <p> via aria-describedby + role="alert"
// (WCAG 2.2 AA). Token-only styling, mirroring the slice-008 contact fields.

interface AuthFieldProps {
  id: string;
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  defaultValue?: string;
  autoComplete?: string;
  minLength?: number;
  error?: string;
}

export function AuthField({
  id,
  name,
  label,
  type = "text",
  required,
  defaultValue,
  autoComplete,
  minLength,
  error,
}: AuthFieldProps) {
  const errorId = `${id}-error`;
  return (
    <div className="flex flex-col gap-tight">
      <label
        htmlFor={id}
        className="text-body-sm font-medium text-text-primary"
      >
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        required={required}
        minLength={minLength}
        autoComplete={autoComplete}
        defaultValue={defaultValue}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className="rounded-button border border-border-default bg-surface-card px-snug py-2 text-body-md text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-bristle"
      />
      {error ? (
        <p id={errorId} role="alert" className="text-body-sm text-status-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}
