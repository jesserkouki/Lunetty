"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "../ui/Logo";

export default function Footer() {
  const pathname = usePathname();

  if (pathname.startsWith("/optician") || pathname.startsWith("/employee")) {
    return null;
  }

  return (
    <footer className="footer--dark border-t border-line px-6 py-16 md:px-12">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-12 md:flex-row md:items-end md:justify-between">
        <div className="footer__brand flex flex-col items-start gap-3">
          <Logo />
          <p className="max-w-sm text-sm leading-7 text-muted">
            L&apos;optique, autrement. Montures, verres et opticiens réunis
            dans une même expérience.
          </p>
        </div>

        <nav aria-label="Pied de page">
          <ul className="flex flex-col gap-3 text-sm tracking-[0.12em] uppercase text-muted">
            <li>
              <Link href="/lunettes" className="hover:text-foreground transition-colors">
                Collection
              </Link>
            </li>
            <li>
              <Link href="/opticiens" className="hover:text-foreground transition-colors">
                Boutiques
              </Link>
            </li>
          </ul>
        </nav>
      </div>
      <p className="mx-auto mt-16 max-w-[1600px] text-xs text-muted">
        © Lunetty. Tous droits réservés.
      </p>
    </footer>
  );
}
