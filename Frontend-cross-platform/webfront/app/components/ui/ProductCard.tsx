import Image from "next/image";
import Link from "next/link";

type Props = {
  href: string;
  name: string;
  category: string;
  image: string;
  alt: string;
  price?: string;
  priority?: boolean;
  className?: string;
};

/** Carte produit : zoom lent de l'image et légende au survol (CSS pur). */
export default function ProductCard({
  href,
  name,
  category,
  image,
  alt,
  price,
  priority,
  className = "",
}: Props) {
  return (
    <Link href={href} className={`group block ${className}`}>
      <div className="relative aspect-[4/5] overflow-hidden bg-[#ddd5c6]">
        <Image
          src={image}
          alt={alt}
          fill
          priority={priority}
          sizes="(min-width: 1024px) 33vw, 100vw"
          className="object-cover transition-transform duration-[1400ms] ease-lux group-hover:scale-110"
        />
        <span className="absolute bottom-5 left-5 translate-y-3 border border-foreground/50 bg-background/40 px-4 py-2 text-xs tracking-[0.16em] uppercase opacity-0 backdrop-blur-sm transition-all duration-500 ease-lux group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100">
          Découvrir
        </span>
      </div>
      <div className="mt-5 flex items-baseline justify-between gap-4">
        <div>
          <p className="text-xs tracking-[0.16em] uppercase text-muted">
            {category}
          </p>
          <h3 className="mt-1 font-serif text-3xl font-light">{name}</h3>
        </div>
        {price && <p className="text-sm text-muted">{price}</p>}
      </div>
    </Link>
  );
}
