import Link from "next/link";
import type { CSSProperties } from "react";

type LogoWordmarkProps = {
  variant?: "gold" | "dark" | "auto";
  size?: "sm" | "md" | "lg";
  spacing?: CSSProperties["letterSpacing"];
  className?: string;
  as?: "div" | "h1";
  href?: string;
};

export default function LogoWordmark({
  variant = "gold",
  size = "md",
  spacing = "0.2em",
  className = "",
  as: Element = "div",
  href,
}: LogoWordmarkProps) {
  const wordmarkClassName = [
    "logo-wordmark",
    `logo-wordmark--${variant}`,
    `logo-wordmark--${size}`,
    className,
  ].filter(Boolean).join(" ");

  const wordmark = (
    <Element
      className={wordmarkClassName}
      style={{ letterSpacing: spacing }}
    >
      LUNETTY
    </Element>
  );

  if (!href) return wordmark;

  return (
    <Link href={href} className="logo-wordmark__link" aria-label="Lunetty, accueil">
      {wordmark}
    </Link>
  );
}
