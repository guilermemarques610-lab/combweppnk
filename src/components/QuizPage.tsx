import { useState, useRef, useCallback } from "react";
import { Lock } from "lucide-react";

interface QuizPageProps {
  step: number;
  totalSteps: number;
  question: string;
  subtitle?: string | null;
  options: string[];
  allOption: string;
  onAnswer: () => void;
}

const playSuccessSound = () => {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "triangle";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.25, ctx.currentTime + i * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.06 + 0.2);
      osc.start(ctx.currentTime + i * 0.06);
      osc.stop(ctx.currentTime + i * 0.06 + 0.2);
    });
  } catch {
    // Silently fail
  }
};

const discountSteps = [15, 30, 50, 65, 80];

const QuizPage = ({
  step,
  totalSteps,
  question,
  subtitle,
  options,
  allOption,
  onAnswer,
}: QuizPageProps) => {
  const progress = (step / totalSteps) * 100;
  const currentDiscount = discountSteps[step - 1] ?? 0;
  const [clickedIdx, setClickedIdx] = useState<number | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleClick = useCallback((idx: number) => {
    if (clickedIdx !== null) return;
    setClickedIdx(idx);
    playSuccessSound();
    timeoutRef.current = setTimeout(() => {
      setClickedIdx(null);
      onAnswer();
    }, 500);
  }, [clickedIdx, onAnswer]);

  return (
    <div className="flex min-h-screen flex-col items-center bg-background px-5 pb-10 pt-5">
      <h1 className="mb-4 text-[26px] font-black lowercase tracking-tight text-primary">
        wepink
      </h1>

      <div className="mb-4 flex w-full max-w-sm items-center gap-2.5 rounded-2xl bg-primary px-4 py-3.5 shadow-md">
        <span className="text-xl">🎉</span>
        <span className="text-[13px] font-semibold leading-tight text-primary-foreground">
          Responda e desbloqueie até <strong>80% OFF</strong> exclusivo!
        </span>
      </div>

      <div className="mb-5 w-full max-w-sm">
        <div className="mb-2.5 flex items-center justify-between">
          <span className="text-[12px] font-medium text-muted-foreground">
            {step}/{totalSteps}
          </span>
          <span className="rounded-md bg-primary px-2.5 py-1 text-[12px] font-bold text-primary-foreground">
            {currentDiscount}% OFF
          </span>
        </div>

        <div className="relative h-3 w-full overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full bg-primary transition-all duration-700 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="mt-2 flex justify-between px-0.5">
          {discountSteps.map((d, i) => {
            const done = step > i;
            const active = step === i + 1;
            return (
              <div key={i} className="flex flex-col items-center gap-0.5">
                <div
                  className={`flex h-[22px] w-[22px] items-center justify-center rounded-full text-[9px] font-bold transition-all duration-500 ${
                    done
                      ? "bg-green-500 text-white"
                      : active
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "bg-secondary text-muted-foreground"
                  }`}
                  style={active ? { boxShadow: "0 0 0 3px hsl(var(--primary) / 0.2)" } : {}}
                >
                  {done ? "✓" : `${d}%`}
                </div>
              </div>
            );
          })}
        </div>

        {step < totalSteps ? (
          <p className="mt-2 text-center text-[11px] text-muted-foreground">
            Próximo: <span className="font-bold text-primary">{discountSteps[step]}% OFF</span>
          </p>
        ) : (
          <p className="mt-2 text-center text-[12px] font-bold text-green-600">
            Desconto máximo desbloqueado! 🎉
          </p>
        )}
      </div>

      <h2 className="mb-1 max-w-sm text-center text-[20px] font-extrabold leading-tight text-foreground">
        {question}
      </h2>

      {subtitle && (
        <p className="mb-5 text-center text-[13px] text-muted-foreground">{subtitle}</p>
      )}
      {!subtitle && <div className="mb-5" />}

      <div className="flex w-full max-w-sm flex-col gap-2.5">
        {options.map((option, idx) => (
          <button
            key={option}
            onClick={() => handleClick(idx)}
            className={`animate-slide-up w-full rounded-full border-2 border-primary px-5 py-3.5 text-center text-[15px] font-semibold transition-all active:scale-[0.97] ${
              clickedIdx === idx
                ? "animate-answer-pulse border-green-500 bg-green-500 text-white"
                : "bg-primary text-primary-foreground"
            }`}
            style={{ animationDelay: `${idx * 0.06}s`, animationFillMode: "both" }}
          >
            {clickedIdx === idx ? "✓ " : ""}{option}
          </button>
        ))}
      </div>

      <div className="my-3 flex w-full max-w-sm items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-[12px] text-muted-foreground">ou</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <button
        onClick={() => handleClick(options.length)}
        className={`w-full max-w-sm rounded-full py-4 text-[15px] font-bold transition-all active:scale-[0.97] ${
          clickedIdx === options.length
            ? "animate-answer-pulse bg-green-500 text-white"
            : "bg-primary text-primary-foreground"
        }`}
      >
        {clickedIdx === options.length ? "✓ " : ""}{allOption}
      </button>

      <div className="mt-6 flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <Lock className="h-3 w-3" />
        <span>Suas respostas são 100% confidenciais</span>
      </div>
    </div>
  );
};

export default QuizPage;
