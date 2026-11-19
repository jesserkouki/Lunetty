import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import Groq from 'groq-sdk';
import { FrameCatalogService } from './catalog.service';
import { SearchParams, toCard } from './catalog.logic';
import { SYSTEM_PROMPT } from './prompt';
import { TOOLS } from './tools';

export interface ChatImage {
  media_type: string;
  data: string; // base64 sans préfixe data:
}
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  image?: ChatImage;
}
export interface AgentResult {
  reply: string;
  products: ReturnType<typeof toCard>[];
}

const MAX_TURNS = 20; // messages d'historique conservés
const MAX_TOOL_LOOPS = 6; // sécurité contre les boucles d'outils
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

@Injectable()
export class FrameAdvisorService {
  private readonly logger = new Logger(FrameAdvisorService.name);
  private client?: Groq;

  constructor(private readonly catalog: FrameCatalogService) {}

  get hasKey(): boolean {
    return Boolean(process.env.GROQ_API_KEY);
  }

  get textModel(): string {
    return process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
  }

  get visionModel(): string {
    return process.env.GROQ_VISION_MODEL || 'meta-llama/llama-4-scout-17b-16e-instruct';
  }

  private getClient(): Groq {
    if (!this.client) this.client = new Groq({ apiKey: process.env.GROQ_API_KEY });
    return this.client;
  }

  /** Valide l'historique reçu du navigateur et le convertit au format Groq. */
  private sanitize(messages: unknown): { msgs: any[]; hasImage: boolean } {
    if (!Array.isArray(messages) || messages.length === 0) {
      throw new BadRequestException('messages manquants');
    }
    const trimmed = (messages as ChatMessage[]).slice(-MAX_TURNS);
    while (trimmed.length && trimmed[0].role !== 'user') trimmed.shift();
    if (!trimmed.length) throw new BadRequestException('aucun message utilisateur');

    let hasImage = false;
    const msgs = trimmed.map((m, idx) => {
      if (!['user', 'assistant'].includes(m?.role) || typeof m.content !== 'string') {
        throw new BadRequestException('message invalide');
      }
      const text = m.content.slice(0, 2000);
      const isLast = idx === trimmed.length - 1;
      if (m.role === 'user' && isLast && m.image) {
        if (!IMAGE_TYPES.includes(m.image.media_type) || typeof m.image.data !== 'string') {
          throw new BadRequestException('image invalide');
        }
        hasImage = true;
        return {
          role: 'user',
          content: [
            { type: 'text', text: text || 'Voici mon selfie, quelle est la forme de mon visage ?' },
            {
              type: 'image_url',
              image_url: { url: `data:${m.image.media_type};base64,${m.image.data}` },
            },
          ],
        };
      }
      return { role: m.role, content: text || '(vide)' };
    });
    return { msgs, hasImage };
  }

  /** Les petits modèles envoient parfois des nombres en chaîne ou des enums vides. */
  private cleanSearchArgs(raw: any): SearchParams {
    const num = (v: unknown) => (v === undefined || v === null || v === '' ? undefined : Number(v));
    const arr = (v: unknown) => (Array.isArray(v) && v.length ? (v as string[]) : undefined);
    const str = (v: unknown) => (typeof v === 'string' && v ? v : undefined);
    const n = (v: number | undefined) => (v !== undefined && Number.isFinite(v) ? v : undefined);
    return {
      max_price: n(num(raw?.max_price)),
      min_price: n(num(raw?.min_price)),
      face_shape: str(raw?.face_shape),
      shapes: arr(raw?.shapes),
      materials: arr(raw?.materials),
      styles: arr(raw?.styles),
      usage: str(raw?.usage),
      width: str(raw?.width),
      audience: str(raw?.audience),
      limit: n(num(raw?.limit)),
    };
  }

  async run(rawMessages: unknown): Promise<AgentResult> {
    const { msgs, hasImage } = this.sanitize(rawMessages);
    const model = hasImage ? this.visionModel : this.textModel;
    const convo: any[] = [{ role: 'system', content: SYSTEM_PROMPT }, ...msgs];
    let products: AgentResult['products'] = [];

    for (let i = 0; i < MAX_TOOL_LOOPS; i++) {
      let completion;
      try {
        completion = await this.getClient().chat.completions.create({
          model,
          messages: convo,
          tools: TOOLS,
          tool_choice: 'auto',
          temperature: 0.4,
          max_tokens: 1024,
        });
      } catch (err: any) {
        // Llama génère parfois un appel d'outil mal formé : Groq répond 400 tool_use_failed → on retente.
        if (err?.status === 400 && String(err?.error?.error?.code) === 'tool_use_failed') {
          this.logger.warn('tool_use_failed, nouvelle tentative');
          continue;
        }
        throw err;
      }

      const message = completion.choices[0].message;
      const calls = message.tool_calls ?? [];

      if (!calls.length) {
        return { reply: (message.content ?? '').trim(), products };
      }

      convo.push({ role: 'assistant', content: message.content ?? '', tool_calls: calls });

      for (const call of calls) {
        let output: unknown;
        try {
          const args = call.function.arguments ? JSON.parse(call.function.arguments) : {};
          if (call.function.name === 'search_catalog') {
            const found = await this.catalog.search(this.cleanSearchArgs(args));
            // Le modèle n'a besoin ni de l'image, ni des slugs, ni des tags bruts.
            output = found.map(({ image, store_slug, product_slug, tags, stock, ...rest }) => rest);
          } else if (call.function.name === 'show_recommendations') {
            const ids = Array.isArray(args.product_ids) ? args.product_ids.slice(0, 3) : [];
            products = (await this.catalog.getByIds(ids)).map(toCard);
            output = { displayed: products.map((p) => p.id) };
          } else {
            output = { error: `Outil inconnu: ${call.function.name}` };
          }
        } catch (err: any) {
          output = { error: String(err?.message || err) };
        }
        convo.push({ role: 'tool', tool_call_id: call.id, content: JSON.stringify(output) });
      }
    }

    return {
      reply: 'Désolé, je n\'arrive pas à finaliser ma recherche. Pouvez-vous reformuler votre demande ?',
      products,
    };
  }
}