import RevealText from "../../motion/RevealText";

export default function Manifesto() {
  return (
    <section
      aria-labelledby="manifeste"
      className="px-6 py-32 md:px-12 md:py-48"
    >
      <div className="mx-auto max-w-[1600px]">
        <p
          id="manifeste"
          className="mb-10 text-xs tracking-[0.3em] uppercase text-accent"
        >
          Notre vision
        </p>
        <RevealText
          as="h2"
          stagger={0.03}
          text="Une paire de lunettes ne se contente pas de corriger la vue. Elle révèle un regard, une allure, une façon d'habiter le monde."
          className="max-w-6xl font-serif text-4xl font-light leading-[1.15] md:text-6xl lg:text-7xl"
        />
      </div>
    </section>
  );
}
