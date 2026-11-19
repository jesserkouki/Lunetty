'use client';

import { useEffect, useRef, useState } from 'react';
import { Glasses } from 'lucide-react';
import { ChatImage, ChatMessage, fileToImage, sendChat } from './api';
import CameraCapture from './CameraCapture';
import ProductCard from './ProductCard';

const WELCOME: ChatMessage = {
  role: 'assistant',
  content:
    "Bonjour ! Je suis l'assistant style de Lunetty. Je vous aide à trouver la monture idéale selon votre visage, votre budget et votre usage. Pour commencer, quelle est la forme de votre visage ? Le plus simple : prenez une photo, je m'occupe du reste.",
};

const FACE_CHOICES = [
  { label: 'Visage rond', shape: 'round' },
  { label: 'Visage carré', shape: 'square' },
  { label: 'Visage ovale', shape: 'oval' },
] as const;

/** Réponses rapides selon la dernière question posée par l'assistant. */
function quickReplies(lastAssistant?: string): string[] {
  if (!lastAssistant) return [];
  const q = (lastAssistant.match(/[^.!?\n]*\?/g) || []).pop()?.toLowerCase() ?? '';
  if (/budget|prix|dinar|tnd/.test(q)) return ['Moins de 100 TND', '100 à 200 TND', '200 à 350 TND', 'Plus de 350 TND'];
  if (/pour qui|pour vous|homme|femme|enfant/.test(q)) return ['Pour une femme', 'Pour un homme', 'Mixte', 'Pour un enfant'];
  if (/usage|utiliser|quotidien|écran|ecran|travail/.test(q)) return ['Au quotidien', 'Au travail', 'Devant les écrans', 'Sport', 'Conduite'];
  if (/style|look|classique|tendance/.test(q)) return ['Classique', 'Tendance', 'Discret', 'Affirmé'];
  if (/mati|couleur|taille/.test(q)) return ['Métal', 'Acétate', 'Peu importe'];
  return [];
}

function FaceIcon({ shape }: { shape: 'round' | 'square' | 'oval' }) {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      {shape === 'round' && <circle cx="12" cy="12" r="8" />}
      {shape === 'square' && <rect x="4.5" y="4.5" width="15" height="15" rx="4" />}
      {shape === 'oval' && <ellipse cx="12" cy="12" rx="6.5" ry="9" />}
    </svg>
  );
}

const CameraIcon = ({ className = 'h-5 w-5' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 8h3l1.6-2h6.8L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z" />
    <circle cx="12" cy="13" r="3.5" />
  </svg>
);

const ImageIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="4" width="18" height="16" rx="2.5" />
    <circle cx="9" cy="10" r="1.6" />
    <path d="m21 16-5-5-9 9" />
  </svg>
);

const SendIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 19V5" />
    <path d="m5 12 7-7 7 7" />
  </svg>
);

function Avatar({ size = 'sm' }: { size?: 'sm' | 'lg' }) {
  return (
    <div
      className={`grid shrink-0 place-items-center border border-accent/35 bg-accent/10 text-accent ${
        size === 'lg' ? 'h-11 w-11' : 'mt-0.5 h-7 w-7'
      }`}
    >
      <Glasses className={size === 'lg' ? 'h-5 w-5' : 'h-3.5 w-3.5'} aria-hidden="true" />
    </div>
  );
}

const iconBtn =
  'grid h-11 w-11 shrink-0 place-items-center border border-line bg-background text-muted transition hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-40';
const chip =
  'border border-line bg-background px-4 py-2 text-sm text-foreground transition hover:-translate-y-px hover:border-accent hover:bg-accent/10';

export default function FrameAdvisorChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  async function submit(userMsg: ChatMessage) {
    if (loading) return;
    const next = [...messages, userMsg];
    setMessages(next);
    setInput('');
    setError(null);
    setLoading(true);
    try {
      // Le message d'accueil local est écarté côté serveur (l'historique doit commencer par "user").
      const { reply, products } = await sendChat(next);
      setMessages([...next, { role: 'assistant', content: reply, products }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  }

  function onSend(text = input) {
    const t = text.trim();
    if (t) submit({ role: 'user', content: t });
  }

  function sendPhoto(r: { image: ChatImage; preview: string }) {
    setCameraOpen(false);
    submit({
      role: 'user',
      content: input.trim() || 'Voici mon selfie, quelle est la forme de mon visage ?',
      image: r.image,
      preview: r.preview,
    });
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      sendPhoto(await fileToImage(file));
    } catch {
      setCameraOpen(false);
      setError('Impossible de lire cette image.');
    }
  }

  const isFirstTurn = messages.length === 1 && !loading;
  const last = messages[messages.length - 1];
  const replies = !loading && last.role === 'assistant' && !isFirstTurn ? quickReplies(last.content) : [];

  return (
    <div className="mx-auto w-full max-w-3xl text-foreground">
      <div className="flex h-[min(720px,calc(100dvh-300px))] min-h-[420px] flex-col overflow-hidden border border-line bg-background shadow-[0_18px_55px_-28px_rgba(36,31,25,0.28)]">
        {/* En-tête */}
        <header className="flex items-center gap-3 border-b border-line bg-background px-5 py-4">
          <Avatar size="lg" />
          <div className="min-w-0">
            <h2 className="font-serif text-xl tracking-wide">Lunetty · Conseil optique</h2>
            <p className="flex items-center gap-1.5 text-xs text-muted">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              Conseiller en ligne · Trouvez votre monture idéale
            </p>
          </div>
          <button
            type="button"
            onClick={() => setCameraOpen(true)}
            disabled={loading}
            className="ml-auto hidden items-center gap-2 border border-line px-4 py-2 text-xs font-medium uppercase tracking-wider transition hover:border-accent hover:text-accent disabled:opacity-40 sm:flex"
          >
            <CameraIcon className="h-4 w-4" />
            Analyser mon visage
          </button>
        </header>

        {/* Conversation */}
        <div className="flex flex-1 flex-col gap-4 overflow-y-auto bg-background/70 px-3 py-5 sm:px-5">
          {messages.map((m, i) => (
            <div key={i} className={`flex flex-col gap-3 ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`flex max-w-full items-start gap-2.5 ${m.role === 'user' ? 'justify-end' : ''}`}>
                {m.role === 'assistant' && <Avatar />}
                <div
                  className={`max-w-[85%] whitespace-pre-wrap break-words border px-4 py-2.5 text-[15px] leading-relaxed sm:max-w-[34rem] ${
                    m.role === 'user'
                    ? 'border-foreground bg-foreground text-background'
                    : 'border-line bg-white/70 text-foreground'
                  }`}
                >
                  {m.preview && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={m.preview} alt="Votre selfie" className="mb-2 h-36 w-36 rounded-xl object-cover" />
                  )}
                  {m.content}
                </div>
              </div>

              {m.products && m.products.length > 0 && (
                <div className="grid w-full grid-cols-1 gap-3.5 sm:grid-cols-2 sm:pl-9 lg:grid-cols-3">
                  {m.products.map((p) => (
                    <ProductCard key={p.id} product={p} />
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Écran d'accueil : photo en premier, formes en alternative */}
          {isFirstTurn && (
            <div className="flex flex-col gap-3 sm:pl-9">
              <button
                type="button"
                onClick={() => setCameraOpen(true)}
                className="flex items-center gap-4 border border-accent/30 bg-accent/10 p-4 text-left transition-colors hover:border-accent hover:bg-accent/15"
              >
                <span className="grid h-12 w-12 shrink-0 place-items-center bg-foreground text-background">
                  <CameraIcon className="h-6 w-6" />
                </span>
                <span>
                  <span className="block text-[15px] font-bold">Prendre un selfie</span>
                  <span className="block text-[13px] text-muted">
                    Je repère la forme de votre visage et je vous propose les montures qui vous vont le mieux.
                  </span>
                </span>
              </button>

              <p className="text-xs text-muted">Ou choisissez directement :</p>
              <div className="flex flex-wrap gap-2">
                {FACE_CHOICES.map((f) => (
                  <button key={f.shape} type="button" onClick={() => onSend(f.label)} className={`${chip} flex items-center gap-2`}>
                    <FaceIcon shape={f.shape} />
                    {f.label}
                  </button>
                ))}
                <button type="button" onClick={() => onSend('Je ne sais pas')} className={chip}>
                  Je ne sais pas
                </button>
              </div>
            </div>
          )}

          {replies.length > 0 && (
            <div className="flex flex-wrap gap-2 sm:pl-9">
              {replies.map((r) => (
                <button key={r} type="button" onClick={() => onSend(r)} className={chip}>
                  {r}
                </button>
              ))}
            </div>
          )}

          {loading && (
            <div className="flex items-start gap-2.5">
              <Avatar />
              <div className="flex gap-1.5 border border-line bg-background px-4 py-4" aria-label="L'assistant écrit">
                <span className="h-2 w-2 animate-bounce rounded-full bg-accent" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-accent [animation-delay:150ms]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-accent [animation-delay:300ms]" />
              </div>
            </div>
          )}

          {error && (
            <div role="alert" className="border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-800">
              {error}
            </div>
          )}
          <div ref={endRef} />
        </div>

        {/* Saisie */}
        <form
          className="flex items-center gap-2 border-t border-line bg-background px-3 pb-1.5 pt-3.5 sm:px-4"
          onSubmit={(e) => {
            e.preventDefault();
            onSend();
          }}
        >
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={onFile} />
          <button type="button" className={iconBtn} aria-label="Prendre une photo" onClick={() => setCameraOpen(true)} disabled={loading}>
            <CameraIcon />
          </button>
          <button type="button" className={`${iconBtn} hidden sm:grid`} aria-label="Choisir une photo existante" onClick={() => fileRef.current?.click()} disabled={loading}>
            <ImageIcon />
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Écrivez votre message…"
            maxLength={2000}
            disabled={loading}
            className="min-w-0 flex-1 border border-line bg-white/70 px-5 py-3 text-[15px] placeholder:text-muted/70 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/15"
          />
          <button
            type="submit"
            aria-label="Envoyer"
            disabled={loading || !input.trim()}
            className="grid h-11 w-11 shrink-0 place-items-center bg-foreground text-background transition hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40"
          >
            <SendIcon />
          </button>
        </form>
        <p className="bg-background px-4 pb-3.5 pt-1.5 text-center text-[11.5px] text-muted">
          Votre photo n&apos;est pas conservée : elle sert uniquement à analyser la forme du visage.
        </p>
      </div>

      {cameraOpen && (
        <CameraCapture
          onCapture={sendPhoto}
          onClose={() => setCameraOpen(false)}
          onPickFile={() => fileRef.current?.click()}
        />
      )}
    </div>
  );
}