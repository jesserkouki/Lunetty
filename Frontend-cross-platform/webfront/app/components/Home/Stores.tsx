import ParallaxImage from "../../motion/ParallaxImage";
import RevealText from "../../motion/RevealText";
import Button from "../ui/Button";

export default function Stores() {
  return (
    <section
      id="boutiques"
      aria-labelledby="titre-boutiques"
      className="relative"
    >
      <ParallaxImage
        src="/images/boutiques.svg"
        alt=""
        sizes="100vw"
        className="h-[85svh] min-h-[560px]"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-background/60"
      />

      <div className="absolute inset-0 flex items-center px-6 md:px-12">
        <div className="mx-auto w-full max-w-[1600px]">
          <p className="mb-6 text-xs tracking-[0.3em] uppercase text-accent">
            Boutiques partenaires
          </p>
          <h2 id="titre-boutiques" className="sr-only">
            Trouver une boutique
          </h2>
          <RevealText
            as="p"
            text="Essayez, ajustez, repartez avec la paire qui vous ressemble."
            className="max-w-3xl font-serif text-5xl font-light leading-[1.05] md:text-7xl"
          />
          <div className="mt-10">
            <Button href="/#boutiques" variant="solid">
              Trouver une boutique
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
