import { useState, useMemo } from "react";

interface VerificationPageProps {
  onComplete: () => void;
}

type Item = { emoji: string; isLipstick: boolean };

const DECOY_EMOJIS = ["👑", "🌹", "🎀", "💋", "💖", "🌸", "💎", "🦋", "🌷", "✨"];

const shuffle = <T,>(arr: T[]): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const buildItems = (): Item[] => {
  const positions = shuffle([0, 1, 2, 3, 4, 5]);
  const lipstickPositions = new Set([positions[0], positions[1]]);
  const decoys = shuffle(DECOY_EMOJIS);
  let d = 0;
  return Array.from({ length: 6 }, (_, i) =>
    lipstickPositions.has(i)
      ? { emoji: "💄", isLipstick: true }
      : { emoji: decoys[d++], isLipstick: false }
  );
};

const VerificationPage = ({ onComplete }: VerificationPageProps) => {
  const items = useMemo(() => buildItems(), []);
  const [selected, setSelected] = useState<number[]>([]);
  const [error, setError] = useState(false);

  const toggle = (idx: number) => {
    setError(false);
    setSelected((prev) => {
      const next = prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx];
      if (next.length === 2 && next.every((i) => items[i].isLipstick)) {
        setTimeout(() => onComplete(), 350);
      }
      return next;
    });
  };

  const handleConfirm = () => {
    const ok = selected.length === 2 && selected.every((i) => items[i].isLipstick);
    if (ok) {
      onComplete();
    } else {
      setError(true);
      setSelected([]);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-5">
      <div className="w-full max-w-sm rounded-3xl bg-card p-7 shadow-2xl">
        <h1 className="text-center text-[19px] font-extrabold text-foreground">
          Prove que você é humano 💄
        </h1>
        <p className="mt-2 text-center text-[15px] font-bold text-primary">
          Toque nos 2 batons
        </p>

        <div className="mt-6 grid grid-cols-3 gap-3">
          {items.map((item, idx) => {
            const isSel = selected.includes(idx);
            return (
              <button
                key={idx}
                onClick={() => toggle(idx)}
                className={`flex aspect-square items-center justify-center rounded-2xl bg-secondary/40 text-4xl transition-all active:scale-95 ${
                  isSel ? "ring-4 ring-primary bg-primary/10" : ""
                }`}
              >
                {item.emoji}
              </button>
            );
          })}
        </div>

        {error && (
          <p className="mt-4 text-center text-[13px] font-semibold text-destructive">
            Tente novamente! Selecione apenas os 2 batons.
          </p>
        )}

        <button
          onClick={handleConfirm}
          disabled={selected.length === 0}
          className="mt-6 w-full rounded-full bg-primary py-4 text-[16px] font-bold text-primary-foreground shadow-lg transition-all active:scale-[0.98] disabled:opacity-60"
        >
          Confirmar
        </button>
      </div>
    </div>
  );
};

export default VerificationPage;
