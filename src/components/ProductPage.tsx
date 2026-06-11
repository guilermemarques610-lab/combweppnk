import { useState, useEffect, useRef } from "react";
import { Menu, User, ShoppingCart, ChevronLeft, ChevronRight, Star, AlertTriangle, X, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import product1 from "@/assets/product-1.webp";
import product2 from "@/assets/product-2.webp";
import product3 from "@/assets/product-3.webp";
import productNew from "@/assets/new-kit.webp";
import productVf27 from "@/assets/product-vf27.webp";

import reviewLiberte from "@/assets/review-liberte.webp";
import reviewLiberteBox from "@/assets/review-liberte-box.webp";
import review3produtos from "@/assets/review-3produtos.webp";
import review3produtos2 from "@/assets/review-3produtos2.webp";
import reviewGoldenPink from "@/assets/review-golden-pink.webp";
import CartDrawer from "./CartDrawer";
import type { CartItem } from "./OrderBump";

const ProductPage = ({ onCheckout }: { onCheckout?: (items: CartItem[]) => void }) => {
  const [countdown, setCountdown] = useState({ hours: "00", minutes: "20", seconds: "00" });
  const [units] = useState(37);
  const [cartOpen, setCartOpen] = useState(false);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [cpfInput, setCpfInput] = useState("");
  const [userName, setUserName] = useState("");
  const carouselRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const DURACAO = 1200;
    let fim = Number(localStorage.getItem("contador_fim"));
    if (!fim || isNaN(fim) || fim <= Date.now()) {
      fim = Date.now() + DURACAO * 1000;
      localStorage.setItem("contador_fim", String(fim));
    }

    const atualizar = () => {
      const agora = Date.now();
      let tempo = Math.floor((fim - agora) / 1000);
      if (tempo <= 0) {
        fim = Date.now() + DURACAO * 1000;
        localStorage.setItem("contador_fim", String(fim));
        tempo = DURACAO;
      }
      const h = Math.floor(tempo / 3600);
      const m = Math.floor((tempo % 3600) / 60);
      const s = tempo % 60;
      setCountdown({
        hours: String(h).padStart(2, "0"),
        minutes: String(m).padStart(2, "0"),
        seconds: String(s).padStart(2, "0"),
      });
    };

    atualizar();
    const interval = setInterval(atualizar, 1000);
    return () => clearInterval(interval);
  }, []);

  const scrollCarousel = (direction: "left" | "right") => {
    if (!carouselRef.current) return;
    const scrollAmount = carouselRef.current.clientWidth;
    carouselRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  const productImages = [product1, product2, product3, productVf27, productNew];

  return (
    <div className="min-h-screen bg-card">
      <div className="fixed top-0 left-0 right-0 z-50">
        <div className="py-2.5 bg-primary">
          <div className="mx-auto flex max-w-md items-center justify-center gap-2 text-sm font-medium text-primary-foreground">
            <span className="font-bold">Promoção encerra em:</span>
            <div className="ml-2 flex gap-1">
              <span className="text-base font-bold">{countdown.hours}</span>
              <span className="text-base font-bold">:</span>
              <span className="text-base font-bold">{countdown.minutes}</span>
              <span className="text-base font-bold">:</span>
              <span className="text-base font-bold">{countdown.seconds}</span>
            </div>
          </div>
        </div>

        <div className="border-b border-border bg-card">
          <div className="container mx-auto flex items-center justify-between px-4 py-3">
            <button className="rounded-lg p-2 transition-colors hover:bg-muted">
              <Menu className="h-6 w-6 text-muted-foreground" />
            </button>
            <span className="text-2xl font-bold lowercase text-primary">
              wepink
            </span>
            <div className="flex items-center gap-2">
              <button onClick={() => setUserModalOpen(true)} className="relative rounded-lg p-2 transition-colors hover:bg-muted">
                <User className="h-6 w-6 text-muted-foreground" />
              </button>
              <button onClick={() => setCartOpen(true)} className="relative rounded-lg p-2 transition-colors hover:bg-muted">
                <ShoppingCart className="h-6 w-6 text-muted-foreground" />
                <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">1</span>
              </button>
            </div>
          </div>
        </div>

        <div className="border-b border-border bg-white">
          <div className="container mx-auto px-4 py-2">
            <nav className="text-sm font-semibold leading-snug text-foreground">
              <div className="flex flex-wrap items-center gap-y-0.5">
                <span>Perfumaria</span>
                <span className="mx-2 text-muted-foreground">&gt;</span>
                <span>KITS</span>
                <span className="mx-2 text-muted-foreground">&gt;</span>
                <span>Promoção</span>
                <span className="mx-2 text-muted-foreground">&gt;</span>
              </div>
              <div className="font-normal text-foreground">Kit de 5 Body Splash</div>
            </nav>
          </div>
        </div>
      </div>

      <main className="pt-[170px]">
        <div className="mx-auto max-w-4xl px-4 py-8">
          <div className="relative mb-8">
            <div ref={carouselRef} className="flex snap-x snap-mandatory gap-3 overflow-x-auto rounded-xl" style={{ scrollbarWidth: "none" }}>
              {productImages.map((img, i) => (
                <div key={i} className="relative flex-none basis-full snap-center overflow-hidden rounded-xl bg-muted" style={{ aspectRatio: "1/1" }}>
                  <img alt="Body Splash Linha Vanilla" src={img} className="h-full w-full object-contain" width={800} height={800} loading={i === 0 ? "eager" : "lazy"} fetchPriority={i === 0 ? "high" : "auto"} decoding="async" />
                </div>
              ))}
            </div>
            <button onClick={() => scrollCarousel("left")} className="absolute left-2 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-card/80 shadow-md">
              <ChevronLeft className="h-5 w-5 text-muted-foreground" />
            </button>
            <button onClick={() => scrollCarousel("right")} className="absolute right-2 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-card/80 shadow-md">
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>

          <h1 className="mb-3 text-[28px] font-extrabold leading-tight tracking-tight text-foreground">
            Monte Seu Kit Vanilla Exclusivo – 5 Body Splash + Adicione Opções Premium
          </h1>
          <p className="mb-5 text-[15px] leading-relaxed text-muted-foreground">
            Monte seu kit exclusivo com os 5 Body Splash Vanilla. Quer elevar o nível? Adicione o Liberté Doré ou o VF Golden e tenha um kit completo ou edição ilimitada do VF 2.7 - WEPINK.
          </p>

          <div className="mb-5 flex items-center gap-2">
            <span className="text-sm font-bold text-foreground">4.8 de 5</span>
            <div className="flex gap-0.5">
              {[1, 2, 3, 4].map((i) => (
                <Star key={i} className="h-4 w-4 fill-primary text-primary" />
              ))}
              <Star className="h-4 w-4 fill-primary/80 text-primary/80" />
            </div>
            <span className="text-sm text-muted-foreground">(14.272)</span>
          </div>

          <div className="mb-6">
            <p className="mb-1 text-sm text-muted-foreground line-through">R$ 174,50</p>
            <div className="mb-1 flex items-baseline gap-3">
              <span className="text-4xl font-black tracking-tight text-foreground">R$ 44,90</span>
              <span className="text-sm text-muted-foreground">ou 1x de 44,90</span>
            </div>

            <div className="mt-2 inline-flex items-center rounded-full bg-green-500 px-3 py-1">
              <span className="text-xs font-extrabold text-white">ECONOMIZE R$ 129,60</span>
            </div>

            <div className="mt-3 flex items-center gap-2">
              <div className="flex items-center gap-1.5 rounded-full border border-destructive/30 bg-destructive/10 px-3 py-1.5 text-destructive">
                <AlertTriangle className="h-4 w-4 animate-pulse" />
                <span className="text-sm font-semibold">Últimas {units} unidades disponíveis</span>
              </div>
            </div>

            <div className="mt-5">
              <button
                onClick={() => setCartOpen(true)}
                className="group relative block w-full max-w-sm overflow-hidden rounded-2xl bg-primary py-5 px-6 text-center font-extrabold text-lg text-primary-foreground transition-all hover:scale-[1.03] active:scale-95 animate-pulse-glow"
              >
                <span className="relative z-10 flex items-center justify-center gap-2 text-xl">
                  <ShoppingCart className="h-6 w-6" />
                  COMPRAR AGORA
                </span>
              </button>
              <p className="text-center text-xs text-muted-foreground mt-2 animate-pulse">🔥 Oferta por tempo limitado</p>
            </div>
          </div>
        </div>

        <div className="mb-8 w-full py-10 bg-characteristics">
          <div className="mx-auto max-w-4xl px-6">
            <h2 className="mb-6 text-center text-2xl font-extrabold uppercase tracking-wide text-foreground">
              ✨ Características
            </h2>
            <div className="grid grid-cols-1 gap-3">
              {[
                { icon: "💎", text: "Fragrâncias premium com alta fixação" },
                { icon: "⏳", text: "Perfume que dura o dia inteiro na pele" },
                { icon: "🌿", text: "Fórmula exclusiva da linha Vanilla" },
                { icon: "💖", text: "Autoestima e bem-estar garantidos" },
                { icon: "🎁", text: "Embalagem ideal para presente" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 rounded-xl bg-black/10 border border-black/10 px-4 py-3.5">
                  <span className="text-lg flex-shrink-0">{item.icon}</span>
                  <span className="text-[15px] font-bold text-foreground">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DescriptionTabs />
        <ReviewsSection
          images={{ reviewLiberte, reviewLiberteBox, review3produtos, review3produtos2, reviewGoldenPink }}
        />

        <footer className="text-white bg-primary">
          <div className="px-6 pt-10 pb-8 text-center">
            <h3 className="mb-4 text-xl font-bold">receba dicas e novidades toda semana no seu e-mail</h3>
            <div className="mx-auto flex max-w-sm gap-2">
              <input type="email" placeholder="Seu e-mail" className="flex-1 rounded-full bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none" />
              <button className="rounded-full border-2 border-primary-foreground px-6 py-3 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary-foreground hover:text-primary">Enviar</button>
            </div>
          </div>

          <div className="px-6 pb-8 text-center">
            <p className="mb-6 text-2xl font-bold lowercase">wepink</p>
            <nav className="flex flex-col items-center gap-3 text-sm">
              <a href="#" className="hover:underline">sobre nós</a>
              <a href="#" className="hover:underline">troca e devoluções</a>
              <a href="#" className="hover:underline">regulamentos</a>
              <a href="#" className="hover:underline">trabalhe conosco</a>
              <a href="#" className="hover:underline">consulte sua entrega</a>
              <a href="#" className="hover:underline">franquias</a>
            </nav>
          </div>

          <div className="border-t border-primary-foreground/20 px-6 py-4 text-center text-xs opacity-80">
            <p>Todos os direitos reservados © 2023 | SAVI COSMÉTICOS LTDA |</p>
            <p>CNPJ: 22.422.967/0001-01</p>
          </div>
        </footer>

        <CartDrawer
          open={cartOpen}
          onClose={() => setCartOpen(false)}
          onCheckout={(items) => { setCartOpen(false); onCheckout?.(items); }}
        />

        {userModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setUserModalOpen(false)}>
            <div className="relative mx-4 w-full max-w-sm rounded-2xl bg-card p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
              <button onClick={() => setUserModalOpen(false)} className="absolute right-3 top-3 rounded-full p-1 text-muted-foreground hover:bg-muted">
                <X className="h-5 w-5" />
              </button>

              <div className="mb-5 text-center">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                  <User className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-lg font-bold text-foreground">Cadastre-se na Plataforma</h3>
                <p className="mt-1 text-sm text-muted-foreground">Preencha seus dados para acompanhar seus pedidos</p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-foreground">Seu nome</label>
                  <input type="text" placeholder="Digite seu nome" value={userName} onChange={e => setUserName(e.target.value)} className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-foreground">CPF</label>
                  <input type="text" placeholder="000.000.000-00" value={cpfInput} onChange={e => {
                    const v = e.target.value.replace(/\D/g, "").slice(0, 11);
                    const formatted = v.replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2");
                    setCpfInput(formatted);
                  }} className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
                </div>
              </div>

              <button
                onClick={() => {
                  if (!userName.trim()) { toast("Por favor, digite seu nome", { icon: "⚠️" }); return; }
                  setUserModalOpen(false);
                  setCartOpen(true);
                  toast.success(`Bem-vinda, ${userName.split(" ")[0]}! 🎉`);
                }}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-base font-bold text-primary-foreground shadow-lg hover:opacity-90 active:scale-[0.98]"
              >
                Continuar para o carrinho
                <ArrowRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

const DescriptionTabs = () => {
  const [activeTab, setActiveTab] = useState("descricao");
  const tabs = [
    { id: "descricao", label: "Descrição" },
    { id: "notas", label: "Notas" },
    { id: "como-usar", label: "Como usar" },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 pb-12">
      <div className="mb-6 flex border-b border-border">
        {tabs.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-6 py-3 font-bold transition-colors ${activeTab === tab.id ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-primary"}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "descricao" && (
        <div className="space-y-4 text-muted-foreground">
          <p><strong className="text-foreground">Vanilla Cuddle body splash</strong>: celebra o conforto através de notas de baunilha suave e âmbar acolhedor, evoluindo em um coração macio com toques de algodão doce.</p>
          <p><strong className="text-foreground">Vanilla Hope body splash</strong>: remete aos momentos alegres da vida, com toque refrescante de amêndoa e jasmim.</p>
          <p><strong className="text-foreground">Vanilla Dream body splash</strong>: representa a felicidade dos momentos de carinho, com toque floral delicado de rosa e jasmim.</p>
          <p><strong className="text-foreground">Vanilla Wish body splash</strong>: evoca os desejos do coração através de notas místicas de lavanda e violeta.</p>
          <p><strong className="text-foreground">Vanilla Hug body splash</strong>: desperta o poder feminino com toque frutado de ameixa e mandarina.</p>
        </div>
      )}

      {activeTab === "notas" && (
        <div className="space-y-4 text-muted-foreground">
          <p><strong className="text-foreground">Notas de saída:</strong> são percebidas nos primeiros minutos. Trazem frescor e leveza, com acordes cítricos, frutados ou aromáticos.</p>
          <p><strong className="text-foreground">Notas de corpo:</strong> aparecem em seguida e definem a personalidade da fragrância. Podem ser florais, adocicadas, cremosas ou especiadas.</p>
          <p><strong className="text-foreground">Notas de fundo:</strong> ficam por mais tempo na pele e dão fixação, geralmente com baunilha, musk, madeiras ou âmbar.</p>
        </div>
      )}

      {activeTab === "como-usar" && (
        <div className="space-y-4 text-muted-foreground">
          <p><strong className="text-foreground">1) Aplique na pele limpa:</strong> prefira após o banho, com a pele seca ou levemente hidratada.</p>
          <p><strong className="text-foreground">2) Foque nas áreas quentes:</strong> pescoço, colo, punhos e atrás das orelhas.</p>
          <p><strong className="text-foreground">3) Distância ideal:</strong> borrife a cerca de 15 a 20 cm da pele.</p>
          <p><strong className="text-foreground">4) Reaplique quando quiser:</strong> body splash é leve e ideal para reforço durante o dia.</p>
          <p><strong className="text-foreground">5) Dica extra:</strong> combine com hidratante corporal da mesma família olfativa.</p>
        </div>
      )}
    </div>
  );
};

const ReviewsSection = ({ images }: { images: Record<string, string> }) => {
  const reviews = [
    { name: "Larissa O.", date: "28/03/2026", stars: 5, text: "vou ser sincera, vi o anúncio no tiktok e fiquei COM MUITO MEDO de ser golpe kkkk mas resolvi arriscar e peguei o kit completo.. gente chegou tudo certinho, lacrado, com cheirinho maravilhoso!! me senti besta por ter duvidado 😂💕", recommends: true, images: [images.review3produtos2] },
    { name: "Fernanda B.", date: "25/03/2026", stars: 5, text: "tbm vi pelo tiktok e pensei \"é golpe com certeza\" kkkkk mas não é!! peguei o kit completo e chegou em 4 dias pelo jadlog, tudo original e lacrado. o cheiro do vanilla cuddle é viciante, to usando todo dia no trabalho. já pedi mais um kit pra minha irmã", recommends: true, images: [images.reviewLiberte, images.reviewLiberteBox] },
    { name: "Ana c.", date: "15/03/2026", stars: 5, text: "peguei o kit completo e gente eu tava com medo de comprar pela internet né, mas chegou tudo certinho lacrado.. o cheiro é DIVINO, minha filha já quer roubar o meu kkkk to apaixonada demais 😍", recommends: true, images: [images.review3produtos] },
    { name: "Maria S.", date: "02/03/2026", stars: 5, text: "Terceira vez que compro o kit completo e toda vez me surpreendo.. dessa vez peguei os 3 e não me arrependo, o vanilla cuddle é viciante!! meu marido elogia toda hora kkk", recommends: true, images: [] },
    { name: "Juliana P.", date: "28/02/2026", stars: 5, text: "Peguei o kit completo pra dar de presente pra minha mãe no aniversário e ela AMOU, chorou e tudo 🥹 o golden é muito chique, parece perfume caro de shopping", recommends: true, images: [images.reviewGoldenPink] },
    { name: "Tamires R.", date: "05/03/2026", stars: 5, text: "confesso q peguei o kit completo no escuro só pelas resenhas aqui e tava com medo.. mas meu deus do céu cada cheirinho é melhor q o outro!! o vanilla dream então nem se fala, uso todo dia pro trabalho 😂", recommends: true, images: [] },
    { name: "Camila F.", date: "18/03/2026", stars: 5, text: "peguei o kit completo e as meninas do escritório ficaram loucas perguntando que perfume eu tava usando kkkkk falei q era body splash e ninguém acreditou!! qualidade absurda por esse preço, ja indiquei pra todo mundo", recommends: true, images: [] },
    { name: "Patrícia L.", date: "10/03/2026", stars: 5, text: "eu uso o liberté doré pra sair e o vanilla hug pro dia a dia.. combinação perfeita!! to viciada nos produtos da wepink, não troco por nada 💕", recommends: true, images: [images.reviewLiberte] },
    { name: "Débora N.", date: "01/04/2026", stars: 4, text: "gostei bastante sim, só o vanilla wish q não curti tanto pessoalmente mas os outros são incríveis.. o hug é meu favorito disparado. valeu muito a pena pelo preço", recommends: true, images: [] },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8 rounded-xl border border-border bg-card p-6 text-center">
        <p className="text-5xl font-bold text-primary">
          4.8<span className="text-xl font-normal text-muted-foreground">/5</span>
        </p>
        <p className="mt-1 text-sm font-bold uppercase tracking-wide text-foreground">Nota do Produto</p>
        <div className="mt-2 flex justify-center gap-1">
          {[1, 2, 3, 4].map((i) => (
            <Star key={i} className="h-8 w-8 fill-primary text-primary" />
          ))}
          <Star className="h-8 w-8 fill-primary/80 text-primary/80" />
        </div>
        <p className="mt-2 text-sm text-muted-foreground">Baseado em 14272 avaliações</p>
        <p className="mt-3 text-sm font-bold text-primary">96% dos clientes recomendam este produto</p>
      </div>

      <h3 className="mb-4 text-center text-xl font-bold text-foreground">Avaliações mais recentes</h3>
      <div className="space-y-4">
        {reviews.map((review, idx) => (
          <div key={idx} className="rounded-xl border-l-4 border-l-primary border border-border bg-card p-5">
            <div className="mb-2 flex gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={`h-5 w-5 ${i < review.stars ? "fill-primary text-primary" : "fill-muted text-muted"}`} />
              ))}
            </div>
            <p className="mb-3 text-sm leading-relaxed text-foreground">{review.text}</p>
            {review.images && review.images.length > 0 && (
              <div className="mb-3 flex gap-2 overflow-x-auto">
                {review.images.map((img, imgIdx) => (
                  <img key={imgIdx} src={img} alt={`Foto de ${review.name}`} className="h-24 w-24 flex-shrink-0 rounded-lg object-cover border border-border shadow-sm" loading="lazy" decoding="async" />
                ))}
              </div>
            )}
            {review.recommends && (
              <p className="mb-2 text-sm text-muted-foreground">😊 <strong>Sim, eu recomendo este produto</strong></p>
            )}
            <p className="text-xs text-muted-foreground">{review.name} {review.date}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductPage;
