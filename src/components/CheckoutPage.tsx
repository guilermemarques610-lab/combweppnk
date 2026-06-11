import { useState, useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";
import { User, Mail, ChevronRight, Package, Truck, CheckCircle2, Loader2, QrCode, Copy, Smartphone, Clock, AlertTriangle, Lock, CreditCard, Shield, Zap } from "lucide-react";
import type { CartItem } from "./OrderBump";
import correiosLogo from "@/assets/correios-logo.png";
import fullLogo from "@/assets/full-logo.png";
import jadlogLogo from "@/assets/jadlog-logo.png";
import { QRCodeSVG } from "qrcode.react";

interface CheckoutPageProps {
  items: CartItem[];
}

const formatCPF = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 11);
  return d.replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2");
};
const formatCEP = (v: string) => v.replace(/\D/g, "").slice(0, 8).replace(/(\d{5})(\d)/, "$1-$2");
const formatPhone = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 10) return d.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{4})(\d)/, "$1-$2");
  return d.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{5})(\d)/, "$1-$2");
};

const CheckoutPage = ({ items }: CheckoutPageProps) => {
  const subtotal = items.reduce((sum, item) => sum + item.price, 0);
  const subtotalLabel = `R$ ${subtotal.toFixed(2).replace(".", ",")}`;

  const [step, setStep] = useState(0);
  const [loadingCep, setLoadingCep] = useState(false);
  const [showShipping, setShowShipping] = useState(false);
  const [selectedShipping, setSelectedShipping] = useState("correios");
  const shippingRef = useRef<HTMLDivElement | null>(null);
  const [form, setForm] = useState({ nome: "", telefone: "", email: "", cpf: "", cep: "", endereco: "", numero: "", complemento: "", bairro: "", cidade: "", estado: "" });
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "loading" | "pending" | "approved">("idle");
  const [pixTimer, setPixTimer] = useState(900);
  const [copied, setCopied] = useState(false);

  // Save state for upsell
  useEffect(() => {
    try { sessionStorage.setItem("checkout_state", JSON.stringify({ form, selectedShipping })); } catch {/* */}
  }, [form, selectedShipping]);

  const shippingPrices: Record<string, number> = { correios: 0, full: 19.90, jadlog: 9.98 };
  const shippingCost = shippingPrices[selectedShipping] ?? 0;
  const total = subtotal + (showShipping ? shippingCost : 0);
  const totalLabel = `R$ ${total.toFixed(2).replace(".", ",")}`;
  const parcela = `R$ ${(total / 3).toFixed(2).replace(".", ",")}`;
  const shippingLabel = shippingCost === 0 ? "Grátis" : `R$ ${shippingCost.toFixed(2).replace(".", ",")}`;

  const pixKey = `00020126360014BR.GOV.BCB.PIX0114+5511999999999520400005303986540${total.toFixed(2)}5802BR5913WEPINK PAGAMENTO6009SAO PAULO62070503***6304ABCD`;

  useEffect(() => {
    if (paymentStatus !== "pending" || pixTimer <= 0) return;
    const interval = setInterval(() => setPixTimer((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [paymentStatus, pixTimer]);

  // Simulated payment approval after some seconds
  useEffect(() => {
    if (paymentStatus !== "pending") return;
    const t = setTimeout(() => {
      setPaymentStatus("approved");
      toast.success("Pagamento aprovado! ✅");
      setTimeout(() => { window.location.href = "/upsell"; }, 2500);
    }, 60000); // 60s simulated
    return () => clearTimeout(t);
  }, [paymentStatus]);

  const handleChange = (field: string, value: string) => {
    if (field === "cpf") value = formatCPF(value);
    if (field === "cep") value = formatCEP(value);
    if (field === "telefone") value = formatPhone(value);
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const fetchCep = useCallback(async (cep: string) => {
    const digits = cep.replace(/\D/g, "");
    if (digits.length !== 8) return;
    setLoadingCep(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setForm((prev) => ({
          ...prev,
          endereco: data.logradouro || prev.endereco,
          bairro: data.bairro || prev.bairro,
          cidade: data.localidade || prev.cidade,
          estado: data.uf || prev.estado,
        }));
        setShowShipping(true);
        setTimeout(() => shippingRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 100);
      }
    } catch {/* */} finally { setLoadingCep(false); }
  }, []);

  const handleCreatePix = () => {
    if (!form.nome.trim()) { toast.error("Preencha o nome completo."); return; }
    if (!form.email.includes("@")) { toast.error("E-mail inválido."); return; }
    if (form.cpf.replace(/\D/g, "").length !== 11) { toast.error("CPF inválido."); return; }
    setPaymentStatus("loading");
    setStep(3);
    setTimeout(() => { setPaymentStatus("pending"); setPixTimer(900); }, 1500);
  };

  const stepLabels = [
    { label: "Identificação", icon: User },
    { label: "Entrega", icon: Truck },
    { label: "Pagamento", icon: CreditCard },
    { label: "Finalizar", icon: CheckCircle2 },
  ];

  const canAdvance0 = form.nome.trim() && form.telefone.replace(/\D/g, "").length >= 10 && form.cpf.replace(/\D/g, "").length === 11;
  const canAdvance1 = form.email.includes("@") && form.cep.replace(/\D/g, "").length === 8 && form.endereco.trim() && form.numero.trim();

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="w-full py-2.5 text-center text-primary-foreground bg-primary">
        <div className="flex items-center justify-center gap-2">
          <span className="text-xs font-semibold tracking-wide uppercase">🔥 Último dia de promoção</span>
        </div>
      </div>

      <div className="border-b border-border bg-white">
        <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3">
          <button onClick={() => window.history.back()} className="flex items-center gap-1 text-sm font-semibold text-muted-foreground">
            <ChevronRight className="h-4 w-4 rotate-180" />
            Voltar
          </button>
          <span className="text-xl font-bold lowercase text-primary">wepink</span>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Lock className="h-3.5 w-3.5" />
            <span>Compra segura</span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-xs px-4 pt-6 pb-2">
        <div className="flex items-center justify-center">
          {stepLabels.map((s, i) => (
            <div key={i} className="flex flex-1 items-center">
              <div className="flex flex-col items-center gap-1.5">
                <div className={`flex h-10 w-10 items-center justify-center rounded-full transition-all ${i <= step ? "bg-primary text-primary-foreground shadow-lg" : "border-2 border-border bg-white text-muted-foreground"}`}>
                  {i < step ? <CheckCircle2 className="h-5 w-5" /> : <s.icon className="h-5 w-5" />}
                </div>
                <span className={`text-[11px] font-semibold ${i <= step ? "text-foreground" : "text-muted-foreground"}`}>{s.label}</span>
              </div>
              {i < stepLabels.length - 1 && (
                <div className={`mx-2 mb-5 h-0.5 flex-1 rounded-full ${i < step ? "bg-primary" : "bg-border"}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-lg px-4 pb-10">
        {/* Resumo */}
        <div className="mb-6 overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
          <div className="border-b border-border px-5 py-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Package className="h-4 w-4 text-primary" />
              Resumo do pedido
            </div>
          </div>
          <div className="p-5">
            {items.map((item, idx) => (
              <div key={idx} className={`flex items-center gap-4 ${idx > 0 ? "mt-3 border-t border-border pt-3" : "mb-4"}`}>
                <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-muted/40 p-1">
                  <img src={item.image} alt={item.name} className="h-full w-full object-contain" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-foreground">{item.name}</h3>
                  <p className="mt-0.5 text-xs text-muted-foreground">1x unidade</p>
                </div>
                <span className="text-sm font-semibold text-foreground">{item.priceLabel}</span>
              </div>
            ))}
            <div className="mt-4 space-y-2 rounded-xl bg-muted/40 p-4">
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Subtotal</span><span>{subtotalLabel}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Frete</span><span className={shippingCost === 0 ? "text-green-600 font-semibold" : ""}>{shippingLabel}</span></div>
              <div className="border-t border-border pt-2">
                <div className="flex justify-between text-base font-bold"><span>Total</span><span className="text-primary">{totalLabel}</span></div>
                <p className="mt-0.5 text-right text-[11px] text-muted-foreground">ou 3x de {parcela} sem juros</p>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
          <div className="border-b border-border px-5 py-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <User className="h-4 w-4 text-primary" />
              {step === 0 ? "Dados pessoais" : step === 1 ? "Endereço de entrega" : step === 2 ? "Selecionar pagamento" : "Pagamento"}
            </div>
          </div>

          <div className="p-5 space-y-4">
            {step === 0 && (
              <>
                <Field label="Nome completo" placeholder="Nome e sobrenome" value={form.nome} onChange={(v) => handleChange("nome", v)} />
                <Field label="Telefone" placeholder="(85) 9 9999-9999" value={form.telefone} onChange={(v) => handleChange("telefone", v)} />
                <Field label="CPF" placeholder="Número do documento" value={form.cpf} onChange={(v) => handleChange("cpf", v)} />
                <button disabled={!canAdvance0} onClick={() => setStep(1)} className="w-full rounded-xl bg-primary py-3.5 text-base font-bold text-primary-foreground disabled:opacity-50">Continuar</button>
              </>
            )}

            {step === 1 && (
              <>
                <Field icon={<Mail className="h-4 w-4 text-muted-foreground" />} label="E-mail" placeholder="seu@email.com" type="email" value={form.email} onChange={(v) => handleChange("email", v)} />
                <div className="relative">
                  <Field label="CEP" placeholder="00000-000" value={form.cep} onChange={(v) => handleChange("cep", v)} onBlur={() => fetchCep(form.cep)} />
                  {loadingCep && <Loader2 className="absolute right-3 top-9 h-4 w-4 animate-spin text-muted-foreground" />}
                </div>
                <Field label="Número" placeholder="N da residência" value={form.numero} onChange={(v) => handleChange("numero", v)} />
                <Field label="Rua" placeholder="Rua" value={form.endereco} onChange={(v) => handleChange("endereco", v)} />
                <Field label="Cidade" placeholder="Cidade" value={form.cidade} onChange={(v) => handleChange("cidade", v)} />
                <Field label="Estado" placeholder="Estado" value={form.estado} onChange={(v) => handleChange("estado", v)} />
                {showShipping && (
                  <div ref={shippingRef} className="space-y-3 pt-2">
                    <p className="text-sm font-bold text-foreground">Escolha o melhor frete</p>
                    {[
                      { id: "correios", logo: correiosLogo, desc: "entrega de 10 a 12 dias", price: "R$ 0,00", priceClass: "text-green-600" },
                      { id: "full", logo: fullLogo, desc: "entrega de 12h a 24h", price: "R$ 19,90", priceClass: "text-foreground" },
                      { id: "jadlog", logo: jadlogLogo, desc: "entrega em até 5 dias úteis", price: "R$ 9,98", priceClass: "text-foreground" },
                    ].map((opt) => (
                      <button key={opt.id} type="button" onClick={() => setSelectedShipping(opt.id)} className={`flex w-full items-center gap-3 rounded-2xl border bg-white p-4 text-left ${selectedShipping === opt.id ? "border-primary" : "border-border"}`}>
                        <div className={`h-5 w-5 flex-shrink-0 rounded-full ${selectedShipping === opt.id ? "border-[5px] border-primary" : "border-2 border-border"}`} />
                        <img src={opt.logo} alt={opt.id} className="h-8 w-auto object-contain" />
                        <div className="flex-1">
                          <p className="text-xs text-muted-foreground">{opt.desc}</p>
                        </div>
                        <span className={`text-sm font-semibold ${opt.priceClass}`}>{opt.price}</span>
                      </button>
                    ))}
                  </div>
                )}
                <button disabled={!canAdvance1} onClick={() => setStep(2)} className="w-full rounded-xl bg-primary py-3.5 text-base font-bold text-primary-foreground disabled:opacity-50">Continuar</button>
              </>
            )}

            {step === 2 && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-lg font-bold text-foreground">Selecione a forma de pagamento</h3>
                  <p className="text-sm text-muted-foreground mt-1">Escolha como deseja pagar</p>
                </div>

                <button className="flex w-full items-center gap-4 rounded-2xl border-2 border-primary bg-primary/5 p-4 text-left">
                  <div className="h-6 w-6 rounded-full border-[5px] border-primary" />
                  <div className="flex items-center gap-3 flex-1">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                      <QrCode className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">PIX</p>
                      <p className="text-xs text-muted-foreground">Aprovação instantânea</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-primary">{totalLabel}</p>
                    <p className="text-[10px] text-green-600 font-semibold">5% OFF</p>
                  </div>
                </button>

                <div className="flex items-center gap-4 rounded-2xl border border-border p-4 opacity-50">
                  <div className="h-6 w-6 rounded-full border-2 border-border" />
                  <div className="flex items-center gap-3 flex-1">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
                      <CreditCard className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-muted-foreground">Cartão de Crédito</p>
                      <p className="text-xs text-muted-foreground">Em breve</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-xl bg-primary/5 border border-primary/15 p-3">
                  <Zap className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-foreground">Pagamento via PIX é mais rápido!</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Confirmado em segundos. Sem taxas.</p>
                  </div>
                </div>

                <button onClick={handleCreatePix} className="w-full rounded-xl bg-primary py-3.5 text-base font-bold text-primary-foreground animate-pulse-glow">Gerar PIX e Pagar</button>
              </div>
            )}

            {step === 3 && paymentStatus === "loading" && (
              <div className="flex flex-col items-center gap-4 py-10">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-sm font-semibold text-muted-foreground">Gerando pagamento PIX...</p>
              </div>
            )}

            {step === 3 && paymentStatus === "pending" && (
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-2 rounded-xl bg-destructive/10 border border-destructive/30 py-3">
                  <Clock className="h-5 w-5 text-destructive animate-pulse" />
                  <span className="text-sm font-bold text-destructive">
                    Pague em {String(Math.floor(pixTimer / 60)).padStart(2, "0")}:{String(pixTimer % 60).padStart(2, "0")}
                  </span>
                </div>

                <h3 className="text-center text-base font-bold text-foreground">Escaneie o QR Code ou copie o código</h3>

                <div className="flex justify-center">
                  <div className="rounded-2xl border-2 border-primary p-4 shadow-md bg-white">
                    <QRCodeSVG value={pixKey} size={200} />
                  </div>
                </div>

                <div className="rounded-xl bg-primary/5 p-4 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Valor a pagar</p>
                  <p className="text-2xl font-extrabold text-primary">{totalLabel}</p>
                </div>

                <div className="rounded-xl bg-muted/40 border border-border p-3">
                  <p className="text-[10px] text-muted-foreground mb-1 font-semibold">CÓDIGO PIX:</p>
                  <p className="break-all text-[11px] text-foreground select-all">{pixKey}</p>
                </div>

                <button
                  onClick={() => {
                    navigator.clipboard?.writeText(pixKey);
                    setCopied(true);
                    toast.success("Código PIX copiado!");
                    setTimeout(() => setCopied(false), 3000);
                  }}
                  className={`flex w-full items-center justify-center gap-2 rounded-xl py-4 text-base font-bold text-white shadow-lg ${copied ? "bg-green-500" : "bg-primary animate-pulse"}`}
                >
                  {copied ? <><CheckCircle2 className="h-5 w-5" /> Copiado!</> : <><Copy className="h-5 w-5" /> Copiar Código PIX</>}
                </button>

                <div className="flex items-center gap-2 rounded-xl bg-yellow-50 border border-yellow-200 py-3 px-3">
                  <Loader2 className="h-4 w-4 animate-spin text-yellow-600" />
                  <span className="text-sm font-semibold text-yellow-700">Aguardando pagamento...</span>
                </div>

                <div className="flex items-center gap-3 rounded-xl bg-green-50 border border-green-200 p-3">
                  <Shield className="h-8 w-8 text-green-500" />
                  <div>
                    <p className="text-xs font-bold text-green-700">Pagamento 100% seguro</p>
                    <p className="text-[11px] text-green-600">Confirmação automática.</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 rounded-xl bg-orange-50 border border-orange-200 p-3">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  <p className="text-xs text-orange-700 font-medium">Não feche esta página!</p>
                </div>

                <div className="space-y-3 pt-1">
                  <p className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Smartphone className="h-4 w-4 text-primary" />
                    Como pagar:
                  </p>
                  {[
                    { emoji: "📱", text: "Abra o app do seu banco" },
                    { emoji: "📋", text: "Toque em PIX → Copia e Cola" },
                    { emoji: "✅", text: "Confirme o pagamento" },
                  ].map((it, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-sm">{it.emoji}</div>
                      <p className="text-sm text-muted-foreground pt-0.5">{it.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {step === 3 && paymentStatus === "approved" && (
              <div className="flex flex-col items-center gap-4 py-10">
                <CheckCircle2 className="h-20 w-20 text-green-500" />
                <h3 className="text-xl font-extrabold text-foreground">Pagamento Aprovado! 🎉</h3>
                <p className="text-sm text-muted-foreground text-center">Seu pedido foi confirmado. Redirecionando...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const Field = ({ label, placeholder, value, onChange, type = "text", icon, onBlur }: { label: string; placeholder: string; value: string; onChange: (v: string) => void; type?: string; icon?: React.ReactNode; onBlur?: () => void }) => (
  <div>
    <label className="mb-1 block text-xs font-semibold text-foreground">{label}</label>
    <div className="relative">
      {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2">{icon}</div>}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        className={`w-full rounded-xl border border-border bg-white py-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 ${icon ? "pl-10 pr-3" : "px-4"}`}
      />
    </div>
  </div>
);

export default CheckoutPage;
