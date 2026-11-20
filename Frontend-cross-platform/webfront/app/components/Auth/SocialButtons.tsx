"use client";

export type SocialProvider = "google";

type Props = {
  onSelect: (provider: SocialProvider) => void;
  loadingProvider: SocialProvider | null;
  disabled?: boolean;
};

const providers: { id: SocialProvider; label: string; mark: string }[] = [
  { id: "google", label: "Google", mark: "G" },
];

export default function SocialButtons({
  onSelect,
  loadingProvider,
  disabled = false,
}: Props) {
  return (
    <div className="grid grid-cols-1 gap-2">
      {providers.map(({ id, label, mark }) => (
        <button
          key={id}
          type="button"
          aria-label={`Continuer avec ${label}`}
          onClick={() => onSelect(id)}
          disabled={disabled || loadingProvider !== null}
          className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-line bg-white/65 px-2 text-xs font-semibold text-foreground transition hover:border-accent/60 hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-55 dark:bg-white/[0.04] dark:hover:bg-white/[0.08]"
        >
          <span
            aria-hidden="true"
            className={`grid h-6 w-6 place-items-center rounded-full bg-background text-sm font-bold ${
              id === "google" ? "text-[#4285f4]" : "text-foreground"
            }`}
          >
            {loadingProvider === id ? "…" : mark}
          </span>
          <span className="hidden min-[380px]:inline">{label}</span>
        </button>
      ))}
    </div>
  );
}
