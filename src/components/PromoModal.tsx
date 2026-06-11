import { Button } from "@/components/ui/button";

interface PromoModalProps {
  onContinue: () => void;
}

const PromoModal = ({ onContinue }: PromoModalProps) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 px-6">
      <div className="animate-pop-in w-full max-w-sm rounded-3xl border-2 border-primary bg-card px-6 pb-6 pt-7 text-center shadow-xl">
        <p className="mb-1 text-xl font-extrabold text-primary">✨ PARABÉNS! ✨</p>
        <p className="mb-5 text-[15px] leading-relaxed text-foreground">
          Conclua o quiz e ganhe um <strong className="text-primary">desconto exclusivo</strong> no seu kit wepink 💖
        </p>
        <Button
          className="w-full rounded-full py-5 text-[15px] font-bold shadow-md"
          onClick={onContinue}
        >
          Começar agora
        </Button>
      </div>
    </div>
  );
};

export default PromoModal;
