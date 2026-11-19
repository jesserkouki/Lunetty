/**
 * Logique pure (sans base de données) : normalisation des données Lunnety
 * et classement des montures. Testable sans PostgreSQL.
 */

export type FaceShape = 'oval' | 'round' | 'square' | 'heart' | 'long';
export type Audience = 'femme' | 'homme' | 'mixte' | 'enfant';

/** Une monture proposable : une annonce de magasin, avec sa variante en stock la moins chère. */
export interface CatalogItem {
  id: string; // id de l'AnnonceMagasin
  name: string;
  brand: string | null;
  price: number;
  currency: string;
  shape: string | null; // forme canonique (round, oval, rectangular…) ou null si non reconnue
  material: string | null; // metal | acetate | titanium | plastic ou null
  colors: string[];
  width: 'small' | 'medium' | 'large' | null;
  audience: Audience;
  stock: number;
  image: string | null;
  store_name: string;
  store_slug: string;
  product_slug: string;
  /** Texte normalisé (étiquettes, catégorie, attributs) servant au score style/usage. Jamais envoyé au client. */
  tags: string;
}

export type ScoredItem = CatalogItem & { score: number; match_reasons: string[] };

export interface SearchParams {
  max_price?: number;
  min_price?: number;
  face_shape?: string;
  shapes?: string[];
  materials?: string[];
  styles?: string[];
  usage?: string;
  width?: string;
  audience?: string;
  limit?: number;
}

export const stripAccents = (s: string) =>
  s
    .toLowerCase()
    .replace(/œ/g, 'oe') // ligatures françaises : « Œil de chat »
    .replace(/æ/g, 'ae')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const clean = (s: string) => stripAccents(s).replace(/[^a-z0-9]+/g, ' ').trim();

/** `forme_monture` est un texte libre en base : on le ramène à une forme connue. */
export function canonicalShape(raw?: string | null): string | null {
  if (!raw) return null;
  const s = clean(raw);
  const rules: [RegExp, string][] = [
    [/cat ?eye|oeil de chat/, 'cat-eye'],
    [/papillon|butterfly/, 'butterfly'],
    [/aviat|pilot/, 'aviator'],
    [/oversize|surdimension/, 'oversize'],
    [/panto/, 'panto'],
    [/geometr|hexagon|octagon|polygon/, 'geometric'],
    [/rectang/, 'rectangular'],
    [/carre|square/, 'square'],
    [/ovale|oval/, 'oval'],
    [/rond|round|circul/, 'round'],
    [/wrap|envelopp/, 'wrap'],
  ];
  return rules.find(([re]) => re.test(s))?.[1] ?? null;
}

export function canonicalMaterial(raw?: string | null): string | null {
  if (!raw) return null;
  const s = clean(raw);
  if (/titan/.test(s)) return 'titanium';
  if (/acetat/.test(s)) return 'acetate';
  if (/metal|acier|inox|alumin|alliage/.test(s)) return 'metal';
  if (/plast|tr ?90|nylon|injecte/.test(s)) return 'plastic';
  return null;
}

/** Seuils indicatifs sur la largeur de monture (mm). À ajuster avec vos opticiens. */
export function widthClass(mm?: number | null): 'small' | 'medium' | 'large' | null {
  if (mm == null || !Number.isFinite(mm) || mm <= 0) return null;
  if (mm < 130) return 'small';
  if (mm < 140) return 'medium';
  return 'large';
}

/** Formes de monture qui équilibrent chaque forme de visage (null = presque toutes). */
export const FACE_RULES: Record<FaceShape, string[] | null> = {
  round: ['rectangular', 'square', 'geometric'],
  square: ['round', 'oval', 'aviator', 'panto'],
  oval: null,
  heart: ['oval', 'round', 'panto', 'aviator', 'butterfly'],
  long: ['oversize', 'aviator', 'square', 'butterfly'],
};

const STYLE_KEYWORDS: Record<string, string[]> = {
  classique: ['classique', 'classic', 'intemporel'],
  tendance: ['tendance', 'trend', 'mode', 'fashion'],
  discret: ['discret', 'minimal', 'leger', 'fin', 'subtle'],
  affirme: ['affirme', 'bold', 'statement', 'epais'],
};

const USAGE_KEYWORDS: Record<string, string[]> = {
  quotidien: ['quotidien', 'daily', 'tous les jours'],
  travail: ['travail', 'bureau', 'office', 'professionnel', 'work'],
  ecran: ['ecran', 'screen', 'lumiere bleue', 'blue light', 'digital'],
  sport: ['sport', 'active'],
  conduite: ['conduite', 'driving'],
};

const hasAny = (haystack: string, words: string[]) => words.some((w) => haystack.includes(w));
const norm = (s: string) => stripAccents(s).trim();

export function audienceMatches(item: Audience, wanted?: string): boolean {
  const w = wanted ? norm(wanted) : undefined;
  if (w === 'enfant') return item === 'enfant';
  if (item === 'enfant') return false; // jamais de monture enfant à un adulte par défaut
  if (w === 'homme' || w === 'femme') return item === w || item === 'mixte';
  return true;
}

/**
 * Filtres durs : budget, formes/matières demandées, public cible.
 * Score souple : visage (+3), style (+1 chacun), usage (+2), taille (+1).
 */
export function searchItems(items: CatalogItem[], params: SearchParams = {}): ScoredItem[] {
  const { max_price, min_price, face_shape, shapes, materials, styles, usage, width, audience } = params;
  const limit = Math.min(Math.max(Number(params.limit) || 6, 1), 10);
  const wantedShapes = shapes?.map(norm);
  const wantedMaterials = materials?.map(norm);
  const face = face_shape ? (norm(face_shape) as FaceShape) : undefined;

  return items
    .filter((p) => p.stock > 0)
    .filter((p) => (max_price == null ? true : p.price <= max_price))
    .filter((p) => (min_price == null ? true : p.price >= min_price))
    .filter((p) => audienceMatches(p.audience, audience))
    .filter((p) => (wantedShapes?.length ? !!p.shape && wantedShapes.includes(p.shape) : true))
    .filter((p) => (wantedMaterials?.length ? !!p.material && wantedMaterials.includes(p.material) : true))
    .map((p) => {
      let score = 0;
      const reasons: string[] = [];

      if (face && face in FACE_RULES && p.shape) {
        const ok = FACE_RULES[face];
        if (ok === null) {
          score += 2;
          reasons.push(`forme ${p.shape} : convient à presque tous les visages`);
        } else if (ok.includes(p.shape)) {
          score += 3;
          reasons.push(`forme ${p.shape} : équilibre un visage ${face}`);
        }
      }
      const styleHits = (styles || []).filter((s) => hasAny(p.tags, STYLE_KEYWORDS[norm(s)] ?? []));
      if (styleHits.length) {
        score += styleHits.length;
        reasons.push(`style ${styleHits.join('/')}`);
      }
      if (usage && hasAny(p.tags, USAGE_KEYWORDS[norm(usage)] ?? [])) {
        score += 2;
        reasons.push(`adaptée à l'usage ${usage}`);
      }
      if (width && p.width === norm(width)) {
        score += 1;
        reasons.push(`taille ${width}`);
      }
      return { ...p, score, match_reasons: reasons };
    })
    .sort((a, b) => b.score - a.score || a.price - b.price)
    .slice(0, limit);
}

/** Ce que le navigateur reçoit pour afficher une carte produit. */
export function toCard(item: CatalogItem) {
  const { tags, ...card } = item;
  return card;
}