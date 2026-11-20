import ProductCard from "../ui/ProductCard";
import RevealText from "../../motion/RevealText";
import Button from "../ui/Button";
/**
 * Données provisoires. Elles seront remplacées par GET /api/v1/products
 * (catalogue NestJS) à l'étape « Brancher le catalogue sur l'API ».
 */
const ITEMS = [
  {
    name: "Aurore",
    category: "Monture ronde",
    image: "/images/collection-1.svg",
    alt: "Monture ronde dorée Aurore",
  },
  {
    name: "Meridien",
    category: "Monture rectangulaire",
    image: "/images/collection-2.svg",
    alt: "Monture rectangulaire Meridien",
  },
  {
    name: "Écaille",
    category: "Monture acétate",
    image: "/images/collection-3.svg",
    alt: "Monture en écaille",
  },
];

export default function Collection() {
  return (
    <section
      id="collection"
      aria-label="Collection de montures"
      className="px-6 py-24 md:px-12 md:py-40"
    >
      <div className="mx-auto max-w-[1600px]">
        <div className="mb-16 flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-6 text-xs tracking-[0.3em] uppercase text-accent">
              La collection
            </p>
            <RevealText
              as="h2"
              text="Pièces essentielles"
              className="font-serif text-5xl font-light md:text-7xl"
            />
          </div>
          <Button href="/#collection">Voir toute la collection</Button>
        </div>

        <div className="grid gap-x-10 gap-y-20 md:grid-cols-3">
          {ITEMS.map((item, i) => (
            <ProductCard
              key={item.name}
              href="/#collection"
              name={item.name}
              category={item.category}
              image={item.image}
              alt={item.alt}
              className={i === 1 ? "md:mt-24" : i === 2 ? "md:mt-48" : ""}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
