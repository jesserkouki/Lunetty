"use client";

import { useState, type ReactNode } from "react";

type Props = {
  id: string;
  label: string;
  type?: "email" | "password" | "text";
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  autoComplete?: string;
  inputMode?: "email" | "text";
  error?: string;
  required?: boolean;
  maxLength?: number;
  endAdornment?: ReactNode;
};

export default function FloatingInput({
  id,
  label,
  type = "text",
  value,
  onChange,
  onBlur,
  autoComplete,
  inputMode,
  error,
  required = false,
  maxLength,
  endAdornment,
}: Props) {
  const [focused, setFocused] = useState(false);
  const floating = focused || value.length > 0;
  const errorId = `${id}-error`;

  return (
    <div>
      <div
        className={`relative rounded-xl border bg-white/70 transition-[border-color,box-shadow] focus-within:ring-4 focus-within:ring-accent/15 dark:bg-white/[0.04] ${
          error
            ? "border-red-700 focus-within:border-red-700 focus-within:ring-red-700/10"
            : "border-line focus-within:border-accent"
        }`}
      >
        <input
          id={id}
          name={id}
          type={type}
          value={value}
          required={required}
          maxLength={maxLength}
          autoComplete={autoComplete}
          inputMode={inputMode}
          placeholder=" "
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          onChange={(event) => onChange(event.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setFocused(false);
            onBlur?.();
          }}
          className={`peer block min-h-[58px] w-full rounded-xl bg-transparent px-4 pb-2 pt-6 text-sm font-medium text-foreground outline-none placeholder:text-muted ${
            endAdornment ? "pr-12" : ""
          }`}
        />
        <label
          htmlFor={id}
          className={`pointer-events-none absolute left-4 text-muted transition-all ${
            floating
              ? "top-2 text-[10px] font-bold uppercase tracking-[0.1em]"
              : "top-1/2 -translate-y-1/2 text-sm"
          }`}
        >
          {label}
          {required && <span aria-hidden="true"> *</span>}
        </label>
        {endAdornment && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            {endAdornment}
          </div>
        )}
      </div>
      {error && (
        <p id={errorId} role="alert" className="mt-1.5 text-xs font-medium text-red-800 dark:text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}
