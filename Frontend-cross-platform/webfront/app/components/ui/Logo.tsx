import Link from "next/link";
import type { MouseEventHandler } from "react";

export default function Logo({
  onClick,
}: {
  onClick?: MouseEventHandler<HTMLAnchorElement>;
}) {
  return (
    <Link
      href="/"
      className="logo"
      data-text="LUNETTY"
      aria-label="LUNETTY - Accueil"
      onClick={onClick}
    >
      <span className="logo__face">LUNETTY</span>
    </Link>
  );
}
