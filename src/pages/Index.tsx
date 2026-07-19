import { useState, useEffect, lazy, Suspense } from "react";
import QuizPage from "@/components/QuizPage";
import PromoModal from "@/components/PromoModal";
import VerificationPage from "@/components/VerificationPage";
import { CartItem } from "@/components/OrderBump";

const ResultPage = lazy(() => import("@/components/ResultPage"));
const ProductPage = lazy(() => import("@/components/ProductPage"));
const CheckoutPage = lazy(() => import("@/components/CheckoutPage"));

const quizQuestions = [
  {
    question: "Qual fragrância combina mais com você?",
    subtitle: "Escolha a que mais te representa 💖",
    options: ["🌸 Floral e sofisticado", "✨ Oriental e marcante", "🌿 Fresco e delicado", "🪵 Amadeirado e sensual"],
    allOption: "💕 Amo todas!",
  },
  {
    question: "O que te conquista na hora de comprar?",
    subtitle: "O que faz seus olhos brilharem? 👀",
    options: ["💎 Qualidade premium", "🎁 Embalagem luxuosa", "👃 Fragrância marcante", "🏷️ Promoções imperdíveis"],
    allOption: "💕 Tudo isso junto!",
  },
  {
    question: "Qual o seu momento favorito de se cuidar?",
    subtitle: "Cada momento merece um toque especial 🧖‍♀️",
    options: ["☀️ No dia a dia", "🚿 Após o banho", "💧 Para hidratar a pele", "🌙 Em eventos especiais"],
    allOption: "💕 Todos os momentos!",
  },
  {
    question: "O que não pode faltar no seu kit de beleza?",
    subtitle: "Seu kit dos sonhos precisa ter... ✨",
    options: ["💧 Hidratação profunda", "🌹 Fragrância duradoura", "🎀 Embalagem de presente", "🌿 Ingredientes naturais"],
    allOption: "💕 Quero tudo isso!",
  },
  {
    question: "Com que frequência você se dedica ao skincare?",
    subtitle: "Seja sincera, sem julgamentos! 😄",
    options: ["💪 Todos os dias", "📅 Algumas vezes por semana", "🛋️ Só nos finais de semana", "🙈 Quase nunca, mas quero começar!"],
    allOption: "💕 Depende do momento!",
  },
];

type FunnelStage = "verification" | "quiz" | "result" | "product" | "checkout";

const loadState = () => {
  try {
    const raw = sessionStorage.getItem("funnel_state");
    if (!raw) return null;
    return JSON.parse(raw) as {
      stage: FunnelStage;
      quizStep: number;
      cartItems: CartItem[] | null;
      modalDismissed: boolean;
    };
  } catch {
    return null;
  }
};

const saveState = (stage: FunnelStage, quizStep: number, cartItems: CartItem[] | null, modalDismissed: boolean) => {
  try {
    sessionStorage.setItem("funnel_state", JSON.stringify({ stage, quizStep, cartItems, modalDismissed }));
  } catch { /* ignore */ }
};

const Spinner = () => (
  <div className="flex h-screen items-center justify-center">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-secondary" style={{ borderTopColor: "hsl(var(--primary))" }} />
  </div>
);

const Index = () => {
  const saved = loadState();

  const [showModal, setShowModal] = useState(saved ? !saved.modalDismissed : true);
  const [currentStep, setCurrentStep] = useState(saved?.quizStep ?? 0);
  const [stage, setStage] = useState<FunnelStage>(saved?.stage ?? "verification");
  const [cartItems, setCartItems] = useState<CartItem[] | null>(saved?.cartItems ?? null);

  useEffect(() => {
    saveState(stage, currentStep, cartItems, !showModal);
  }, [stage, currentStep, cartItems, showModal]);

  const handleAnswer = () => {
    if (currentStep < quizQuestions.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      setStage("result");
    }
  };

  if (stage === "checkout" && cartItems) {
    return <Suspense fallback={<Spinner />}><CheckoutPage items={cartItems} /></Suspense>;
  }

  if (stage === "product") {
    return (
      <Suspense fallback={<Spinner />}>
        <ProductPage onCheckout={(items) => { setCartItems(items); setStage("checkout"); window.scrollTo(0, 0); }} />
      </Suspense>
    );
  }

  if (stage === "result") {
    return <Suspense fallback={<Spinner />}><ResultPage onContinue={() => setStage("product")} /></Suspense>;
  }

  if (stage === "verification") {
    return (
      <>
        {showModal && <PromoModal onContinue={() => setShowModal(false)} />}
        <VerificationPage onComplete={() => setStage("quiz")} />
      </>
    );
  }

  const q = quizQuestions[currentStep];

  return (
    <>
      {showModal && <PromoModal onContinue={() => setShowModal(false)} />}
      <QuizPage
        step={currentStep + 1}
        totalSteps={quizQuestions.length}
        question={q.question}
        subtitle={q.subtitle}
        options={q.options}
        allOption={q.allOption}
        onAnswer={handleAnswer}
      />
    </>
  );
};

export default Index;
