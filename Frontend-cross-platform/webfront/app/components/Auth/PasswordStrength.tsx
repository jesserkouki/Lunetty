type Props = {
  password: string;
};

export default function PasswordStrength({ password }: Props) {
  const score = [
    password.length >= 12,
    /[a-z]/.test(password) && /[A-Z]/.test(password),
    /\d/.test(password),
    /[^a-zA-Z0-9]/.test(password),
  ].filter(Boolean).length;
  const label =
    score < 2 ? "Faible" : score < 3 ? "Correct" : score < 4 ? "Bon" : "Fort";
  const color =
    score < 2
      ? "bg-red-700"
      : score < 3
        ? "bg-amber-700"
        : score < 4
          ? "bg-lime-700"
          : "bg-emerald-800";

  return (
    <div
      className="mt-2"
      role="progressbar"
      aria-label="Force du mot de passe"
      aria-valuemin={0}
      aria-valuemax={4}
      aria-valuenow={score}
      aria-valuetext={label}
    >
      <div className="flex gap-1" aria-hidden="true">
        {[1, 2, 3, 4].map((step) => (
          <span
            key={step}
            className={`h-1 flex-1 rounded-full ${
              step <= score ? color : "bg-foreground/10"
            }`}
          />
        ))}
      </div>
      <p className="mt-1 text-right text-[11px] font-semibold text-muted">
        {password ? label : "12 caractères minimum"}
      </p>
    </div>
  );
}
