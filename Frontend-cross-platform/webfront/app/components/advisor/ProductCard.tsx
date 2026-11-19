import type { Product } from './api';

const SHAPES: Record<string, string> = {
  round: 'Ronde', oval: 'Ovale', rectangular: 'Rectangulaire', square: 'Carrée', aviator: 'Aviateur',
  geometric: 'Géométrique', 'cat-eye': 'Cat-eye', butterfly: 'Papillon', oversize: 'Oversize',
  panto: 'Panto', wrap: 'Enveloppante',
};
const MATERIALS: Record<string, string> = {
  metal: 'Métal', acetate: 'Acétate', titanium: 'Titane', plastic: 'Plastique',
};

// Adaptez ce modèle aux vraies routes de la plateforme (variables : {store_slug}, {product_slug}, {id}).
const URL_TEMPLATE =
  process.env.NEXT_PUBLIC_ADVISOR_PRODUCT_URL || '/magasins/{store_slug}/produits/{product_slug}';

function productUrl(p: Product) {
  return URL_TEMPLATE.replace('{store_slug}', p.store_slug)
    .replace('{product_slug}', p.product_slug)
    .replace('{id}', p.id);
}

function formatPrice(price: number, currency: string) {
  try {
    return new Intl.NumberFormat('fr-TN', { style: 'currency', currency, minimumFractionDigits: 0, maximumFractionDigits: 3 }).format(price);
  } catch {
    return `${price} ${currency}`;
  }
}

export default function ProductCard({ product }: { product: Product }) {
  const meta = [
    product.shape ? SHAPES[product.shape] ?? product.shape : null,
    product.material ? MATERIALS[product.material] ?? product.material : null,
    product.colors.slice(0, 2).join(', ') || null,
  ].filter(Boolean);

  return (
    <article className="group flex flex-col overflow-hidden border border-line bg-background transition duration-300 hover:-translate-y-0.5 hover:border-accent hover:shadow-lg">
      {product.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={product.image} alt={product.name} className="aspect-[5/3] w-full bg-foreground/5 object-cover" />
      ) : (
        <div className="aspect-[5/3] w-full bg-foreground/5" aria-hidden />
      )}
      <div className="flex flex-1 flex-col p-4">
        {product.brand && (
          <p className="text-[11px] font-bold uppercase tracking-wider text-accent">{product.brand}</p>
        )}
        <h3 className="font-serif text-xl leading-snug tracking-wide text-foreground">{product.name}</h3>
        <p className="mt-1.5 text-xs text-muted">{meta.join(' · ')}</p>
        <p className="mb-3.5 text-xs text-muted">{product.store_name}</p>
        <div className="mt-auto flex items-center justify-between border-t border-line pt-3">
          <strong className="text-base text-foreground">{formatPrice(product.price, product.currency)}</strong>
          <a
            href={productUrl(product)}
            className="bg-foreground px-4 py-2 text-xs font-semibold uppercase tracking-wider text-background transition-colors hover:bg-accent"
          >
            Voir
          </a>
        </div>
      </div>
    </article>
  );
}