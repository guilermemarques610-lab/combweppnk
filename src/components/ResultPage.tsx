import { useEffect, useState } from "react";
import junhoPremiado from "@/assets/banner-junho.jpeg";
import kitsWepink from "@/assets/kits-wepink.webp";

interface ResultPageProps {
  onContinue: () => void;
}

const confettiColors = ["#FF0080", "#FFD700", "#FF69B4", "#00E5FF", "#7C4DFF", "#FF6D00"];

const playCelebrationSound = () => {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const chords = [
      { notes: [261.63, 329.63, 392.00], time: 0 },
      { notes: [293.66, 369.99, 440.00], time: 0.15 },
      { notes: [329.63, 415.30, 523.25], time: 0.30 },
      { notes: [392.00, 493.88, 587.33], time: 0.45 },
    ];
    chords.forEach(({ notes, time }) => {
      notes.forEach((freq) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "triangle";
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.15, ctx.currentTime + time);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + time + 0.4);
        osc.start(ctx.currentTime + time);
        osc.stop(ctx.currentTime + time + 0.4);
      });
    });
  } catch {
    // Silently fail
  }
};

const ResultPage = ({ onContinue }: ResultPageProps) => {
  const [phase, setPhase] = useState<"loading" | "discount" | "button">("loading");

  useEffect(() => {
    playCelebrationSound();
    const t1 = setTimeout(() => setPhase("discount"), 500);
    const t2 = setTimeout(() => setPhase("button"), 1800);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-8 relative overflow-hidden">
      {phase !== "loading" && (
        <div className="pointer-events-none absolute inset-0">
          {Array.from({ length: 30 }).map((_, i) => (
            <div
              key={i}
              className="animate-confetti absolute"
              style={{
                left: `${5 + Math.random() * 90}%`,
                top: `${-5 - Math.random() * 10}%`,
                width: `${6 + Math.random() * 10}px`,
                height: `${6 + Math.random() * 10}px`,
                backgroundColor: confettiColors[i % confettiColors.length],
                borderRadius: Math.random() > 0.5 ? "50%" : "2px",
                animationDelay: `${Math.random() * 0.8}s`,
                animationDuration: `${1.2 + Math.random() * 1.2}s`,
              }}
            />
          ))}
        </div>
      )}

      <h1 className="mb-6 text-3xl font-black lowercase tracking-tight text-primary">
        wepink
      </h1>

      {phase === "loading" && (
        <div className="flex flex-col items-center">
          <div className="h-14 w-14 animate-spin rounded-full border-4 border-secondary" style={{ borderTopColor: "hsl(var(--primary))" }} />
          <p className="mt-4 text-sm font-semibold text-muted-foreground animate-pulse">Calculando seu desconto...</p>
        </div>
      )}

      {phase !== "loading" && (
        <div className="animate-discount-pop flex flex-col items-center w-full max-w-sm">
          <div className="mb-3 flex h-20 w-20 items-center justify-center rounded-full bg-green-500 text-white shadow-xl animate-bounce-once">
            <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="mb-1 text-center text-2xl font-extrabold text-foreground">
            Desconto Aplicado! 🎉
          </p>
          <p className="mb-2 text-center text-sm text-muted-foreground">
            Seu desconto exclusivo foi ativado com sucesso!
          </p>

          <div className="my-3 animate-pulse-scale rounded-full bg-primary px-6 py-2 shadow-lg">
            <span className="text-lg font-black text-primary-foreground">-80% OFF</span>
          </div>

          <div className="w-full mt-3 rounded-xl overflow-hidden shadow-lg animate-pop-in" style={{ animationDelay: "0.3s", animationFillMode: "both" }}>
            <img
              src={junhoPremiado}
              alt="Junho Premiado Wepink - Concorra a um iPhone 17 Pro Max"
              className="w-full"
            />
          </div>

          {phase === "button" && (
            <button
              onClick={onContinue}
              className="mt-4 animate-pop-in w-full rounded-full bg-primary py-4 text-center text-lg font-extrabold text-primary-foreground shadow-xl transition-transform hover:scale-105 active:scale-95"
              style={{ animationDelay: "0.5s", animationFillMode: "both" }}
            >
              🎁 Aplicar Desconto Exclusivo
            </button>
          )}

          <div className="mt-3 text-center space-y-1 animate-pop-in" style={{ animationDelay: "0.5s", animationFillMode: "both" }}>
            <p className="text-xs font-bold text-primary">🏆 JUNHO PREMIADO WEPINK</p>
            <p className="text-[11px] text-muted-foreground leading-snug">
              Comprando 2+ produtos você concorre a um <strong className="text-foreground">iPhone 17 Pro Max</strong> e muito mais prêmios!
            </p>
          </div>

          <div className="w-full mt-3 rounded-xl overflow-hidden shadow-md animate-pop-in" style={{ animationDelay: "0.6s", animationFillMode: "both" }}>
            <img
              src={kitsWepink}
              alt="Kits Wepink - Combinações perfeitas pra você"
              className="w-full"
            />
          </div>

          {phase === "discount" && (
            <p className="mt-4 text-sm text-muted-foreground animate-pulse">
              Preparando sua oferta...
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default ResultPage;
