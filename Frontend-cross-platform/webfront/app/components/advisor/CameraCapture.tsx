'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { ChatImage } from './api';

type Phase = 'starting' | 'live' | 'counting' | 'preview' | 'error';

interface Props {
  onCapture: (r: { image: ChatImage; preview: string }) => void;
  onClose: () => void;
  /** Ouvre le sélecteur de fichier si la caméra est indisponible. */
  onPickFile: () => void;
}

const TIPS = ['Visage de face', 'Bonne lumière', 'Cheveux dégagés', 'Sans lunettes'];

export default function CameraCapture({ onCapture, onClose, onPickFile }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const requestIdRef = useRef(0);
  const [phase, setPhase] = useState<Phase>('starting');
  const [count, setCount] = useState(3);
  const [shot, setShot] = useState<{ image: ChatImage; preview: string } | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const requestCamera = useCallback(() =>
    Promise.resolve().then(() => {
      const request = navigator.mediaDevices?.getUserMedia
        ? navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 960 } },
            audio: false,
          })
        : Promise.reject(new Error('unsupported'));
      return request;
    }), []);

  const connectStream = useCallback(async (stream: MediaStream, requestId: number) => {
    if (requestId !== requestIdRef.current) {
      stream.getTracks().forEach((track) => track.stop());
      return;
    }
    streamRef.current = stream;
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      await videoRef.current.play().catch(() => undefined);
    }
    if (requestId === requestIdRef.current) setPhase('live');
  }, []);

  const handleCameraError = useCallback((error: unknown, requestId: number) => {
    if (requestId !== requestIdRef.current) return;
    const name = error instanceof DOMException ? error.name : '';
    setErrorMsg(
      name === 'NotAllowedError'
        ? "L'accès à la caméra est bloqué. Autorisez-le dans votre navigateur, ou choisissez une photo existante."
        : name === 'NotFoundError'
          ? "Aucune caméra détectée. Vous pouvez choisir une photo existante."
          : "La caméra n'est pas disponible (elle nécessite https ou localhost). Vous pouvez choisir une photo existante.",
    );
    setPhase('error');
  }, []);

  const startCamera = useCallback(() => {
    stopStream();
    setPhase('starting');
    setShot(null);
    setErrorMsg('');
    const requestId = ++requestIdRef.current;
    void requestCamera()
      .then((stream) => connectStream(stream, requestId))
      .catch((error: unknown) => handleCameraError(error, requestId));
  }, [connectStream, handleCameraError, requestCamera, stopStream]);

  useEffect(() => {
    const requestId = ++requestIdRef.current;
    void requestCamera()
      .then((stream) => connectStream(stream, requestId))
      .catch((error: unknown) => handleCameraError(error, requestId));
    return () => {
      requestIdRef.current += 1;
      stopStream();
    };
  }, [connectStream, handleCameraError, requestCamera, stopStream]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const capture = useCallback(() => {
    const v = videoRef.current;
    if (!v || !v.videoWidth) return;
    // Réduit à 768px max (JPEG) : poids limité, photo jamais conservée côté serveur.
    const scale = Math.min(1, 768 / Math.max(v.videoWidth, v.videoHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(v.videoWidth * scale);
    canvas.height = Math.round(v.videoHeight * scale);
    const ctx = canvas.getContext('2d')!;
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1); // même rendu « miroir » que ce que voit l'utilisateur
    ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setShot({ image: { media_type: 'image/jpeg', data: dataUrl.split(',')[1] }, preview: dataUrl });
    setPhase('preview');
  }, []);

  // Compte à rebours 3-2-1 puis capture
  useEffect(() => {
    if (phase !== 'counting') return;
    if (count === 0) {
      capture();
      return;
    }
    const t = setTimeout(() => setCount((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, count, capture]);

  function startCountdown() {
    setCount(3);
    setPhase('counting');
  }

  const showVideo = phase === 'starting' || phase === 'live' || phase === 'counting';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Prendre une photo"
      className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="flex w-full max-w-md flex-col overflow-hidden border border-line bg-background shadow-[0_24px_80px_-28px_rgba(36,31,25,0.42)]">
        <div className="flex items-center justify-between px-5 pt-5">
          <div>
            <h3 className="font-serif text-xl tracking-wide text-foreground">Analyse de votre visage</h3>
            <p className="text-xs text-muted">Pour des montures vraiment adaptées</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="grid h-9 w-9 place-items-center text-muted transition hover:bg-accent/10 hover:text-foreground"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>

        {/* Zone caméra */}
        <div className="relative mx-5 mt-4 aspect-[3/4] overflow-hidden bg-foreground">
          <video
            ref={videoRef}
            playsInline
            muted
            className={`h-full w-full -scale-x-100 object-cover ${showVideo ? '' : 'hidden'}`}
          />

          {phase === 'preview' && shot && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={shot.preview} alt="Votre photo" className="h-full w-full object-cover" />
          )}

          {/* Guide ovale */}
          {(phase === 'live' || phase === 'counting') && (
            <svg viewBox="0 0 300 400" className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
              <defs>
                <mask id="adv-face-mask">
                  <rect width="300" height="400" fill="white" />
                  <ellipse cx="150" cy="185" rx="95" ry="125" fill="black" />
                </mask>
              </defs>
              <rect width="300" height="400" fill="rgba(12,10,9,0.55)" mask="url(#adv-face-mask)" />
              <ellipse cx="150" cy="185" rx="95" ry="125" fill="none" stroke="#806334" strokeWidth="2.5" strokeDasharray="6 6" />
            </svg>
          )}

          {phase === 'counting' && count > 0 && (
            <div className="absolute inset-0 grid place-items-center">
              <span className="text-7xl font-bold text-white drop-shadow-lg">{count}</span>
            </div>
          )}

          {phase === 'starting' && (
            <div className="absolute inset-0 grid place-items-center text-sm text-background/80">Ouverture de la caméra…</div>
          )}

          {phase === 'error' && (
            <div className="absolute inset-0 grid place-items-center p-6 text-center text-sm text-background/90">{errorMsg}</div>
          )}
        </div>

        {/* Conseils */}
        {(phase === 'live' || phase === 'counting' || phase === 'starting') && (
          <ul className="mx-5 mt-3 flex flex-wrap justify-center gap-2">
            {TIPS.map((t) => (
              <li key={t} className="border border-line bg-accent/10 px-3 py-1 text-xs text-muted">
                {t}
              </li>
            ))}
          </ul>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-2 px-5 pb-5 pt-4">
          {(phase === 'live' || phase === 'counting' || phase === 'starting') && (
            <button
              type="button"
              onClick={startCountdown}
              disabled={phase !== 'live'}
              className="flex h-12 items-center justify-center gap-2 bg-foreground text-sm font-semibold text-background transition-colors hover:bg-accent disabled:opacity-40"
            >
              <span className="h-4 w-4 rounded-full border-2 border-current" aria-hidden="true" />
              {phase === 'counting' ? 'Ne bougez pas…' : 'Prendre la photo'}
            </button>
          )}

          {phase === 'preview' && (
            <>
              <button
                type="button"
                onClick={() => shot && onCapture(shot)}
                className="h-12 bg-foreground text-sm font-semibold text-background transition-colors hover:bg-accent"
              >
                Utiliser cette photo
              </button>
              <button
                type="button"
                onClick={startCamera}
                className="h-11 border border-line text-sm font-medium text-foreground transition hover:border-accent hover:text-accent"
              >
                Reprendre
              </button>
            </>
          )}

          {phase === 'error' && (
            <>
              <button
                type="button"
                onClick={onPickFile}
                className="h-12 bg-foreground text-sm font-semibold text-background transition-colors hover:bg-accent"
              >
                Choisir une photo
              </button>
              <button
                type="button"
                onClick={startCamera}
                className="h-11 border border-line text-sm font-medium text-foreground transition hover:border-accent hover:text-accent"
              >
                Réessayer la caméra
              </button>
            </>
          )}

          <p className="text-center text-[11px] text-muted">
            Votre photo n&apos;est pas conservée : elle sert uniquement à analyser la forme du visage.
          </p>
        </div>
      </div>
    </div>
  );
}