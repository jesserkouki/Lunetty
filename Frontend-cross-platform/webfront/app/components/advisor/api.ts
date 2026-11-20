export interface Product {
  id: string; // id de l'annonce du magasin
  name: string;
  brand: string | null;
  price: number;
  currency: string;
  shape: string | null;
  material: string | null;
  colors: string[];
  width: string | null;
  image: string | null;
  store_name: string;
  store_slug: string;
  product_slug: string;
}

export interface ChatImage {
  media_type: string;
  data: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  image?: ChatImage;
  /** Aperçu local de la photo (jamais envoyé au serveur). */
  preview?: string;
  products?: Product[];
}

const API_URL = process.env.NEXT_PUBLIC_ADVISOR_API_URL || '/api/v1';

export async function sendChat(history: ChatMessage[]): Promise<{ reply: string; products: Product[] }> {
  // Seule la dernière image part au serveur ; on n'envoie ni aperçus ni cartes produits.
  const lastIdx = history.length - 1;
  const messages = history.map((m, i) => ({
    role: m.role,
    content: m.content,
    ...(i === lastIdx && m.image ? { image: m.image } : {}),
  }));

  const res = await fetch(`${API_URL}/frame-advisor/chat`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ messages }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(typeof data?.message === 'string' ? data.message : 'Une erreur est survenue.');
  }
  return data;
}

/** Réduit la photo (max 768px, JPEG) pour limiter le poids et protéger la vie privée. */
export function fileToImage(file: File): Promise<{ image: ChatImage; preview: string }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, 768 / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      URL.revokeObjectURL(url);
      resolve({ image: { media_type: 'image/jpeg', data: dataUrl.split(',')[1] }, preview: dataUrl });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Image illisible'));
    };
    img.src = url;
  });
}