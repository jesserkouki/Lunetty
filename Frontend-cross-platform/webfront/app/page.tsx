import Hero from "./components/Home/Hero";
import MarketplaceHome from "./components/Home/MarketplaceHome";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3001";

// Données structurées pour le référencement (Organization).
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Lunetty",
  url: siteUrl,
  description:
    "Plateforme d'optique : montures, verres et opticiens partenaires.",
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Hero />
      <MarketplaceHome />
    </>
  );
}
