import FrameAdvisorChat from '../components/advisor/Chat';

export const metadata = {
  title: 'Conseil optique',
  description: 'Trouvez la monture idéale selon votre visage, votre budget et votre usage.',
};

export default function ConseillerPage() {
  return (
    <div className="min-h-dvh bg-background px-6 pb-16 pt-28 text-foreground sm:px-12 sm:pt-32">
      <div className="mx-auto max-w-5xl">
        <header className="mx-auto mb-8 max-w-3xl">
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.3em] text-accent">
            Le conseil Lunetty
          </p>
          <h1 className="font-serif text-4xl font-normal leading-tight md:text-5xl">
            Le conseil, à votre mesure.
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-7 text-muted">
            Décrivez votre style, votre budget ou partagez une photo : notre conseiller vous guide vers les montures qui vous correspondent.
          </p>
        </header>
        <FrameAdvisorChat />
      </div>
    </div>
  );
}