import { useState, useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";
import { User, Truck, CreditCard, ArrowLeft, Loader2, Copy, CheckCircle2, ShieldCheck, AlertTriangle } from "lucide-react";
import type { CartItem } from "./OrderBump";
import correiosLogoAsset from "@/assets/correios.webp.asset.json";
import fullLogoAsset from "@/assets/full.svg.asset.json";
import jadlogLogoAsset from "@/assets/jadlog.webp.asset.json";
const correiosLogo = correiosLogoAsset.url;
const fullLogo = fullLogoAsset.url;
const jadlogLogo = jadlogLogoAsset.url;
import { QRCodeSVG } from "qrcode.react";
import { supabase } from "@/integrations/supabase/client";

interface CheckoutPageProps {
  items: CartItem[];
}

const formatCPF = (v: string) =>
  v.replace(/\D/g, "").slice(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
const formatCEP = (v: string) => v.replace(/\D/g, "").slice(0, 8).replace(/(\d{5})(\d)/, "$1-$2");
const formatPhone = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 10) return d.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{4})(\d)/, "$1-$2");
  return d.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{5})(\d)/, "$1-$2");
};

const brl = (n: number) => `R$ ${n.toFixed(2).replace(".", ",")}`;

const ESTADOS = ["AC","AL","AM","AP","BA","CE","DF","ES","GO","MA","MG","MS","MT","PA","PB","PE","PI","PR","RJ","RN","RO","RR","RS","SC","SE","SP","TO"];

type Shipping = "full" | "correios" | "jadlog";
type Step = 0 | 1 | 2;
type PayStatus = "idle" | "loading" | "pending" | "approved";

const CheckoutPage = ({ items }: CheckoutPageProps) => {
  const subtotal = items.reduce((s, it) => s + it.price, 0);

  const [step, setStep] = useState<Step>(0);
  const [loadingCep, setLoadingCep] = useState(false);
  const [noNumber, setNoNumber] = useState(false);
  const [selectedShipping, setSelectedShipping] = useState<Shipping>("correios");
  const [form, setForm] = useState({
    email: "", nome: "", telefone: "", cpf: "",
    cep: "", numero: "", rua: "", bairro: "", cidade: "", estado: "", complemento: "",
  });

  const [payStatus, setPayStatus] = useState<PayStatus>("idle");
  const [pixTimer, setPixTimer] = useState(900);
  const [copied, setCopied] = useState(false);
  const [pixCode, setPixCode] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [checkingManual, setCheckingManual] = useState(false);
  const shippingRef = useRef<HTMLDivElement | null>(null);

  const shippingPrices: Record<Shipping, number> = { full: 18.92, correios: 0, jadlog: 9.98 };
  const shippingCost = shippingPrices[selectedShipping];
  const showShipping = step >= 1;
  const total = subtotal + (showShipping ? shippingCost : 0);

  // save state for upsell continuity
  useEffect(() => {
    try { sessionStorage.setItem("checkout_state", JSON.stringify({ form, selectedShipping })); } catch { /* */ }
  }, [form, selectedShipping]);

  // countdown when waiting for pix
  useEffect(() => {
    if (payStatus !== "pending" || pixTimer <= 0) return;
    const i = setInterval(() => setPixTimer((t) => t - 1), 1000);
    return () => clearInterval(i);
  }, [payStatus, pixTimer]);

  // Poll Zuckpay for payment confirmation every 5s
  useEffect(() => {
    if (payStatus !== "pending" || !transactionId) return;
    const interval = setInterval(async () => {
      try {
        const { data, error } = await supabase.functions.invoke("check-pix", { body: { transactionId } });
        if (error) { console.error("check-pix error", error); return; }
        if (data?.paid) {
          setPayStatus("approved");
          toast.success("Pagamento aprovado!");
          setTimeout(() => { window.location.href = "/upsell"; }, 2200);
        }
      } catch (e) { console.error("poll error", e); }
    }, 5000);
    return () => clearInterval(interval);
  }, [payStatus, transactionId]);

  const handleChange = (field: keyof typeof form, value: string) => {
    if (field === "cpf") value = formatCPF(value);
    else if (field === "cep") value = formatCEP(value);
    else if (field === "telefone") value = formatPhone(value);
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
          rua: data.logradouro || prev.rua,
          bairro: data.bairro || prev.bairro,
          cidade: data.localidade || prev.cidade,
          estado: data.uf || prev.estado,
        }));
        setTimeout(() => shippingRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 120);
      }
    } catch { /* */ } finally { setLoadingCep(false); }
  }, []);

  const canAdvance0 =
    form.email.includes("@") &&
    form.nome.trim().split(" ").length >= 2 &&
    form.telefone.replace(/\D/g, "").length >= 10 &&
    form.cpf.replace(/\D/g, "").length === 11;

  const canAdvance1 =
    form.cep.replace(/\D/g, "").length === 8 &&
    (noNumber || form.numero.trim()) &&
    form.rua.trim() && form.bairro.trim() && form.cidade.trim() && form.estado.trim();

  const handlePay = async () => {
    setPayStatus("loading");
    try {
      const { data, error } = await supabase.functions.invoke("create-pix", {
        body: {
          amount: total,
          customer: {
            name: form.nome,
            email: form.email,
            document: form.cpf,
            phone: form.telefone,
          },
          address: {
            zipCode: form.cep,
            street: form.rua,
            number: noNumber ? "S/N" : form.numero,
            complement: form.complemento,
            neighborhood: form.bairro,
            city: form.cidade,
            state: form.estado,
          },
          items: items.map((it) => ({ title: it.name, unitPrice: it.price, quantity: 1 })),
        },
      });
      if (error) throw error;
      if (!data?.pixCode) throw new Error("PIX não gerado");
      setPixCode(data.pixCode);
      setTransactionId(data.transactionId || "");
      setPayStatus("pending");
      setPixTimer(900);
    } catch (err) {
      console.error("create-pix failed", err);
      const msg = err instanceof Error ? err.message : "Erro ao gerar PIX";
      toast.error(`Falha ao gerar PIX: ${msg}`);
      setPayStatus("idle");
    }
  };

  const handleCheckManual = async () => {
    if (!transactionId || checkingManual) return;
    setCheckingManual(true);
    try {
      const { data, error } = await supabase.functions.invoke("check-pix", { body: { transactionId } });
      if (error) throw error;
      if (data?.paid) {
        setPayStatus("approved");
        toast.success("Pagamento aprovado!");
        setTimeout(() => { window.location.href = "/upsell"; }, 2200);
      } else {
        toast.info("Ainda não identificamos seu pagamento. Aguarde alguns instantes.");
      }
    } catch (e) {
      console.error(e);
      toast.error("Erro ao verificar pagamento.");
    } finally {
      setCheckingManual(false);
    }
  };

  const goBack = () => {
    if (payStatus === "pending" || payStatus === "loading") return;
    if (step === 0) window.history.back();
    else setStep((step - 1) as Step);
  };

  // ---------- rendering ----------

  return (
    <div className="min-h-screen bg-[#f6f7fb] pb-10">
      {/* Cart summary card */}
      <div className="mx-auto max-w-md px-3 pt-3">
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold text-foreground">Seu carrinho</h2>
            <div className="h-2.5 w-2.5 rounded-full bg-primary" />
          </div>

          {items.map((it, idx) => (
            <div key={idx} className={`flex items-start gap-3 ${idx > 0 ? "mt-3 border-t border-border pt-3" : ""}`}>
              <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-muted/40">
                <img src={it.image} alt={it.name} className="h-full w-full object-contain" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold leading-tight text-foreground">{it.name}</p>
                <p className="mt-0.5 text-xs text-muted-foreground leading-tight">{it.name}</p>
              </div>
              <span className="text-sm text-muted-foreground">1x</span>
            </div>
          ))}

          <div className="mt-4 space-y-1.5 border-t border-border pt-3">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Subtotal</span><span>{brl(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Frete:</span>
              <span>{showShipping ? (shippingCost === 0 ? brl(0) : brl(shippingCost)) : "–"}</span>
            </div>
            <div className="flex justify-between border-t border-border pt-2 text-base font-semibold text-foreground">
              <span>Total</span><span>{brl(total)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Form card */}
      <div className="mx-auto max-w-md px-3 pt-3">
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          {/* Stepper */}
          <Stepper step={payStatus === "pending" || payStatus === "loading" || payStatus === "approved" ? 2 : step} />

          {/* Back arrow (except on step 0 root and on pix screen) */}
          {(step > 0 || payStatus !== "idle") && payStatus !== "pending" && payStatus !== "approved" && (
            <button onClick={goBack} className="mt-4 mb-2 text-foreground" aria-label="Voltar">
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}

          {/* STEP 0 — Personal */}
          {step === 0 && (
            <div className="mt-5 space-y-4">
              <Field label="Email" placeholder="Email" type="email" value={form.email} onChange={(v) => handleChange("email", v)} />
              <Field label="Nome completo" placeholder="Nome e sobrenome" value={form.nome} onChange={(v) => handleChange("nome", v)} />
              <Field label="Telefone" placeholder="(00) 00000-0000" value={form.telefone} onChange={(v) => handleChange("telefone", v)} />
              <Field label="CPF" placeholder="000.000.000-00" value={form.cpf} onChange={(v) => handleChange("cpf", v)} />
              <button
                disabled={!canAdvance0}
                onClick={() => { setStep(1); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                className="mt-2 w-full rounded-full bg-primary py-3.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
              >
                Continuar
              </button>
            </div>
          )}

          {/* STEP 1 — Address + Shipping */}
          {step === 1 && (
            <div className="mt-3 space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Preencha seu endereço...</h3>
                <p className="mt-1 text-sm text-muted-foreground">Este é o endereço onde você receberá os produtos.</p>
              </div>

              <div className="relative">
                <Field label="CEP" placeholder="CEP" value={form.cep} onChange={(v) => handleChange("cep", v)} onBlur={() => fetchCep(form.cep)} />
                {loadingCep && <Loader2 className="absolute right-3 top-9 h-4 w-4 animate-spin text-muted-foreground" />}
              </div>

              <Field label="Número" placeholder="N° da residência" value={form.numero} onChange={(v) => handleChange("numero", v)} disabled={noNumber} />
              <label className="flex items-center gap-2 -mt-1 select-none">
                <input type="checkbox" checked={noNumber} onChange={(e) => setNoNumber(e.target.checked)} className="peer sr-only" />
                <span className={`h-4 w-4 rounded-full border-2 ${noNumber ? "border-primary bg-primary" : "border-primary/60"} transition-all flex items-center justify-center`}>
                  {noNumber && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                </span>
                <span className="text-sm text-primary">Meu endereço não possui número</span>
              </label>

              <Field label="Rua" placeholder="Rua" value={form.rua} onChange={(v) => handleChange("rua", v)} />
              <Field label="Bairro" placeholder="Bairro" value={form.bairro} onChange={(v) => handleChange("bairro", v)} />
              <Field label="Cidade" placeholder="Cidade" value={form.cidade} onChange={(v) => handleChange("cidade", v)} />

              <div>
                <label className="mb-1 block text-xs font-semibold text-foreground">Estado</label>
                <select
                  value={form.estado}
                  onChange={(e) => handleChange("estado", e.target.value)}
                  className="w-full appearance-none rounded-xl border border-border bg-white bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2212%22 height=%2212%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%23888%22 stroke-width=%222%22><polyline points=%226 9 12 15 18 9%22/></svg>')] bg-[right_1rem_center] bg-no-repeat px-4 py-3 pr-10 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">Selecione</option>
                  {ESTADOS.map((uf) => <option key={uf} value={uf}>{uf}</option>)}
                </select>
              </div>

              <Field label="Complemento" placeholder="Complemento" value={form.complemento} onChange={(v) => handleChange("complemento", v)} />

              <div ref={shippingRef} className="space-y-3 pt-2">
                <p className="text-sm font-semibold text-foreground">Escolha o melhor frete para você</p>
                {([
                  { id: "full" as const, logo: fullLogo, desc: "entrega de 12h a 24h", price: 18.92 },
                  { id: "correios" as const, logo: correiosLogo, desc: "entrega de 10 a 12 dias", price: 0 },
                  { id: "jadlog" as const, logo: jadlogLogo, desc: "entrega de 5 dias úteis", price: 9.98 },
                ]).map((opt) => {
                  const active = selectedShipping === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setSelectedShipping(opt.id)}
                      className={`flex w-full items-center gap-4 rounded-2xl border bg-white px-4 py-4 text-left transition ${active ? "border-primary ring-1 ring-primary" : "border-border"}`}
                    >
                      <span className={`h-5 w-5 flex-shrink-0 rounded-full border-2 flex items-center justify-center ${active ? "border-primary" : "border-[#e11d48]/70"}`}>
                        {active && <span className="h-2.5 w-2.5 rounded-full bg-primary" />}
                      </span>
                      <div className="flex-1 min-w-0">
                        <img src={opt.logo} alt={opt.id} className="h-5 w-auto object-contain object-left mb-1" />
                        <p className="text-xs text-muted-foreground">{opt.desc}</p>
                      </div>
                      <span className="text-sm font-semibold text-foreground whitespace-nowrap">{opt.price === 0 ? "R$ 0,00" : brl(opt.price)}</span>
                    </button>
                  );
                })}
              </div>

              <button
                disabled={!canAdvance1}
                onClick={() => { setStep(2); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                className="mt-2 w-full rounded-full bg-primary py-3.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
              >
                Continuar
              </button>
            </div>
          )}

          {/* STEP 2 — Payment */}
          {step === 2 && payStatus === "idle" && (
            <div className="mt-3 space-y-5">
              <h3 className="text-lg font-semibold text-foreground">Escolha um método de pagamento...</h3>

              <button className="flex w-full items-center gap-3 rounded-2xl border border-border bg-white p-4 text-left">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted/60">
                  <PixDiamond />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">Pagamento via Pix</p>
                  <p className="text-xs text-muted-foreground">Aprovação imediata.</p>
                </div>
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary">
                  <CheckCircle2 className="h-4 w-4 text-primary-foreground" />
                </span>
              </button>

              <button onClick={handlePay} className="w-full rounded-full bg-primary py-3.5 text-sm font-semibold text-primary-foreground">
                Pagar
              </button>

              <p className="text-center text-[11px] text-muted-foreground">
                Ao finalizar o pagamento você concorda com nossos termos de uso e privacidade.
              </p>
            </div>
          )}

          {/* Pagando... */}
          {step === 2 && payStatus === "loading" && (
            <div className="mt-3 space-y-5">
              <h3 className="text-lg font-semibold text-foreground">Escolha um método de pagamento...</h3>
              <div className="flex w-full items-center gap-3 rounded-2xl border border-border bg-white p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted/60">
                  <PixDiamond />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">Pagamento via Pix</p>
                  <p className="text-xs text-muted-foreground">Aprovação imediata.</p>
                </div>
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary">
                  <CheckCircle2 className="h-4 w-4 text-primary-foreground" />
                </span>
              </div>
              <button disabled className="flex w-full items-center justify-center gap-2 rounded-full bg-primary/60 py-3.5 text-sm font-semibold text-primary-foreground">
                Pagando... <Loader2 className="h-4 w-4 animate-spin" />
              </button>
            </div>
          )}

          {/* PIX code screen */}
          {step === 2 && payStatus === "pending" && (
            <div className="mt-3 space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Escaneie o QR-code ou copie o código.</h3>

              <div className="flex justify-center">
                <div className="rounded-xl border border-border bg-white p-3">
                  <QRCodeSVG value={pixCode} size={180} />
                </div>
              </div>

              <div className="flex items-center gap-2 rounded-xl bg-green-50 border border-green-200 px-3 py-2.5">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <span className="text-sm font-semibold text-green-700">Código pix gerado com sucesso</span>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-sm text-muted-foreground">Valor PIX:</span>
                <span className="text-base font-bold text-foreground">{brl(total)}</span>
              </div>

              <p className="truncate text-xs text-muted-foreground">{pixCode}</p>

              <button
                onClick={() => { navigator.clipboard?.writeText(pixCode); setCopied(true); toast.success("Código PIX copiado!"); setTimeout(() => setCopied(false), 2500); }}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3.5 text-sm font-semibold text-primary-foreground"
              >
                {copied ? <><CheckCircle2 className="h-4 w-4" /> Copiado!</> : <><Copy className="h-4 w-4" /> Copiar PIX</>}
              </button>

              <button
                onClick={handleCheckManual}
                disabled={checkingManual}
                className="flex w-full items-center justify-center gap-2 rounded-full border border-border bg-white py-3.5 text-sm font-semibold text-foreground disabled:opacity-60"
              >
                {checkingManual ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                Já efetuei o pagamento!
              </button>

              <p className="text-xs text-muted-foreground">
                → Você será redirecionado automaticamente após a confirmação do pagamento. Se preferir, clique em <strong>"Já efetuei o pagamento!"</strong> para verificar se o pagamento foi aprovado.
              </p>

              <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/30 p-3">
                <ShieldCheck className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-sm font-semibold text-foreground">Seu banco pode exibir um alerta</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Alguns bancos mostram um aviso automático em qualquer Pix para um destinatário novo. Isso é normal e não significa que a compra é golpe. Confira os dados e conclua o pagamento com tranquilidade.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 rounded-xl border border-orange-200 bg-orange-50 p-3">
                <AlertTriangle className="h-4 w-4 flex-shrink-0 text-orange-500" />
                <p className="text-xs text-orange-700">
                  PIX expira em {String(Math.floor(pixTimer / 60)).padStart(2, "0")}:{String(pixTimer % 60).padStart(2, "0")}
                </p>
              </div>

              <div className="space-y-2 pt-1">
                <p className="text-sm font-semibold text-foreground">Como pagar:</p>
                {[
                  "Abra o aplicativo do seu banco e selecione a opção de pagamento PIX",
                  "Escolha pagar usando o código QR ou copie o código PIX acima",
                  "Confirme os detalhes do pagamento e o destinatário",
                ].map((txt, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">{i + 1}</span>
                    <p className="text-xs leading-snug text-foreground">{txt}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 2 && payStatus === "approved" && (
            <div className="flex flex-col items-center gap-3 py-10">
              <CheckCircle2 className="h-16 w-16 text-green-500" />
              <h3 className="text-xl font-bold text-foreground">Pagamento Aprovado!</h3>
              <p className="text-sm text-muted-foreground text-center">Redirecionando...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ---------- helpers ----------

const Stepper = ({ step }: { step: number }) => {
  const items = [User, Truck, CreditCard];
  return (
    <div className="flex items-center justify-between px-2">
      {items.map((Icon, i) => {
        const active = i <= step;
        return (
          <div key={i} className="flex flex-1 items-center last:flex-none">
            <div className={`flex h-9 w-9 items-center justify-center rounded-full transition-all ${active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
              <Icon className="h-4 w-4" />
            </div>
            {i < items.length - 1 && (
              <div className={`h-[2px] flex-1 mx-1 ${i < step ? "bg-primary" : "bg-primary/30"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
};

const Field = ({
  label, placeholder, value, onChange, type = "text", onBlur, disabled,
}: {
  label: string; placeholder: string; value: string; onChange: (v: string) => void;
  type?: string; onBlur?: () => void; disabled?: boolean;
}) => (
  <div>
    <label className="mb-1 block text-xs font-semibold text-foreground">{label}</label>
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
    />
  </div>
);

const PixDiamond = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5 text-foreground" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2 L22 12 L12 22 L2 12 Z" />
    <path d="M7 12 L12 7 L17 12 L12 17 Z" />
  </svg>
);

export default CheckoutPage;
