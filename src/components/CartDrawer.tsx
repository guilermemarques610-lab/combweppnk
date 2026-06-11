import { useState, useEffect } from "react";
import { X, ShoppingBag, Gift } from "lucide-react";
import junhoPremiado from "@/assets/banner-junho.jpeg";
import product1 from "@/assets/product-1.webp";
import bumpLiberteDore from "@/assets/bump-liberte-dore.webp";
import bumpVfGolden from "@/assets/bump-vf-golden.webp";
import bumpVf27 from "@/assets/product-vf27.webp";


import productNew from "@/assets/new-kit.webp";
import type { CartItem } from "./OrderBump";

const PRODUCTS = {
  kit: { id: "kit", name: "Kit Body Splash Linha Completa - 5 Unidades", price: 44.90, originalPrice: 174.50, priceLabel: "R$ 44,90", image: product1 },
  liberte: { id: "liberte", name: "Liberté Doré Colônia 100ml", price: 23.90, originalPrice: 59.90, priceLabel: "R$ 23,90", image: bumpLiberteDore },
  golden: { id: "golden", name: "Kit VF Golden - Body Cream + Perfume Virginia Fonseca", price: 39.90, originalPrice: 129.90, priceLabel: "R$ 39,90", image: bumpVfGolden },
  vf27: { id: "vf27", name: "Perfume VF 27 – Virginia Fonseca 75ml", price: 45.00, originalPrice: 149.90, priceLabel: "R$ 45,00", image: bumpVf27 },
  newKit: { id: "newKit", name: "Kit Body Splash Elowen + Pure Pear + Heaven + Tyrie Royale + Fatal White - Wepink", price: 59.85, originalPrice: 124.90, priceLabel: "R$ 59,85", image: productNew },
};

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
  onCheckout: (items: CartItem[]) => void;
}

const CartDrawer = ({ open, onClose, onCheckout }: CartDrawerProps) => {
  const [selected, setSelected] = useState<Record<string, boolean>>({ kit: true, liberte: false, golden: false, vf27: false, newKit: false });
  const [isVisible, setIsVisible] = useState(false);
  const selectedCount = Object.values(selected).filter(Boolean).length;
  const [showTicketAnimation, setShowTicketAnimation] = useState(false);
  const [lastTicketAmount, setLastTicketAmount] = useState(1);
  const [prevCountState, setPrevCountState] = useState(selectedCount);
  const [prevSelectedRef, setPrevSelectedRef] = useState<Record<string, boolean>>({ ...selected });

  useEffect(() => {
    if (selectedCount > prevCountState) {
      const addedProduct = Object.keys(selected).find(key => selected[key] && !prevSelectedRef[key]);
      let ticketCount = 1;
      
      if (addedProduct === 'golden') ticketCount = 2;
      else if (addedProduct === 'vf27') ticketCount = 3;
      else if (addedProduct === 'newKit') ticketCount = 4;

      setLastTicketAmount(ticketCount);
      setShowTicketAnimation(true);
      const timer = setTimeout(() => setShowTicketAnimation(false), 2000);
      setPrevCountState(selectedCount);
      setPrevSelectedRef({...selected});
      return () => clearTimeout(timer);
    }
    setPrevCountState(selectedCount);
    setPrevSelectedRef({...selected});
  }, [selectedCount]);

  useEffect(() => {
    if (open) requestAnimationFrame(() => setIsVisible(true));
    else setIsVisible(false);
  }, [open]);

  // No effect needed for rewardComplete as it's not used

  if (!open && !isVisible) return null;

  const toggle = (id: string) => {
    if (id === "kit") return;
    setSelected((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const calculateTotalTickets = () => {
    let totalTickets = 0;
    if (selected.kit) {
      // O kit inicial não dá ticket ou dá o primeiro dependendo da regra de negócio?
      // Pela lógica atual: selectedCount <= 1 ? "0" : selectedCount - 1
      // Mas o usuário quer somar os extras.
      // Vamos assumir que se tiver pelo menos 2 produtos (kit + outro), começa a contar.
      // Ou talvez o kit valha 1 se houver outro?
      // Baseado na mensagem "quando seleciona todos os produtos está aparecendo apenas 4 tickets, tem que aparecer o total certo"
      // Se tivermos: Kit(1) + Liberte(1) + Golden(2) + VF27(3) + NewKit(4) = 11?
      // Ou se o Kit não conta sozinho: 1+2+3+4 = 10?
      // O usuário disse que selecionando todos aparece 4. 
      // Atualmente a lógica é: selectedCount - 1. Com 5 produtos -> 4 tickets.
      
      // Vamos definir os pesos:
      const weights: Record<string, number> = {
        kit: 0, // Kit inicial desbloqueia a participação mas o primeiro ticket vem com o segundo item?
        liberte: 1,
        golden: 2,
        vf27: 3,
        newKit: 4
      };
      
      Object.entries(selected).forEach(([key, isSelected]) => {
        if (isSelected) {
          totalTickets += weights[key] || 0;
        }
      });
    }
    return totalTickets;
  };

  const totalTickets = calculateTotalTickets();

  const selectedItems = Object.entries(selected).filter(([, v]) => v).map(([k]) => PRODUCTS[k as keyof typeof PRODUCTS]);
  const total = selectedItems.reduce((sum, item) => sum + item.price, 0);
  const originalTotal = selectedItems.reduce((sum, item) => sum + item.originalPrice, 0);
  const savings = originalTotal - total;
  const discountPercent = originalTotal > 0 ? Math.round((savings / originalTotal) * 100) : 0;
  // No longer using needsMore or progressPercent as they are handled in the component JSX

  

  const CHECKOUT_LINKS: Record<string, string> = {
    "kit": "https://pay.pagmentosseguro.shop/69bd69eea55884748913a11e",
    "kit+liberte": "https://pay.pagmentosseguro.shop/69bd6d266ca66bffaa00d8db",
    "kit+golden": "https://pay.pagmentosseguro.shop/69c20c042751f02352215f07",
    "kit+vf27": "https://pay.pagmentosseguro.shop/69d513ac652d1bca7a1a2872",
    "kit+newKit": "https://pay.pagmentosseguro.shop/6a2afcaec34af41e52fa1f6c",
    "kit+golden+liberte": "https://pay.pagmentosseguro.shop/69c3f00e758c42c0d3b2ca1b",
    "kit+liberte+vf27": "https://pay.pagmentosseguro.shop/69db0f9c094b1616eaf6f0c8",
    "kit+golden+vf27": "https://pay.pagmentosseguro.shop/69db1162e1285315d41cda2b",
    "kit+golden+liberte+vf27": "https://pay.pagmentosseguro.shop/69d51b0435ab37f9f43991f3",
    "kit+liberte+newKit": "https://pay.pagmentosseguro.shop/6a2b02d0c34af41e52fa2521",
    "kit+golden+newKit": "https://pay.pagmentosseguro.shop/6a2b041acbd053c9936e15a2",
    "kit+vf27+newKit": "https://pay.pagmentosseguro.shop/6a2b0557c34af41e52fa278b",
    "kit+golden+liberte+vf27+newKit": "https://pay.pagmentosseguro.shop/6a2afde7cbd053c9936e119e",
  };

  const handleCheckout = () => {
    executeCheckout();
  };

  const executeCheckout = (updatedSelected = selected) => {
    const currentKeys = Object.keys(updatedSelected).filter(k => updatedSelected[k]).sort();
    
    const link = Object.entries(CHECKOUT_LINKS).find(([k]) => {
      const parts = k.split("+").sort();
      return parts.length === currentKeys.length && parts.every((p, i) => p === currentKeys[i]);
    })?.[1];

    if (link) {
      window.location.href = link;
    } else {
      onCheckout(selectedItems.map(({ name, price, priceLabel, image }) => ({ name, price, priceLabel, image })));
    }
  };

  return (
    <>
      <div className={`fixed inset-0 z-[60] bg-black/50 transition-opacity duration-300 ${isVisible ? "opacity-100" : "opacity-0"}`} onClick={onClose} />
      
      {showTicketAnimation && (
        <div className="fixed inset-0 flex items-center justify-center z-[200] pointer-events-none animate-in fade-in zoom-in duration-300">
          <div className="bg-[#f03a7a] text-white px-5 py-2 rounded-full shadow-2xl flex items-center gap-2 border-2 border-[#ffcbdc]">
            <span className="text-sm sm:text-base font-black tracking-tight whitespace-nowrap">
              +{lastTicketAmount} {lastTicketAmount === 1 ? 'Ticket Ganho!' : 'Tickets Extras!'} 🎟️
            </span>
          </div>
        </div>
      )}

      <div className={`fixed top-0 right-0 z-[70] flex h-full w-full max-w-md flex-col bg-card shadow-2xl transition-transform duration-300 ease-out ${isVisible ? "translate-x-0" : "translate-x-full"}`}>
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-extrabold text-foreground">Seu Carrinho</h2>
            <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-primary-foreground">{selectedCount}</span>
          </div>
          <button onClick={onClose} className="rounded-full p-2 hover:bg-muted">
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          <div className="rounded-2xl border-2 border-primary bg-primary/5 p-4 space-y-4 animate-slide-up shadow-[0_0_15px_rgba(231,52,122,0.2)]">
            <div className="rounded-xl overflow-hidden shadow-md">
              <img src={junhoPremiado} alt="Junho Premiado Wepink" className="w-full" />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-primary">
                  {selectedCount === 1 && "🎁 FALTA APENAS 1 PRODUTO"}
                  {selectedCount === 2 && "🎉 PARTICIPAÇÃO LIBERADA"}
                  {selectedCount === 3 && "🔥 CHANCE EXTRA LIBERADA"}
                  {selectedCount === 4 && "🚀 SUAS CHANCES ESTÃO AUMENTANDO"}
                  {selectedCount >= 5 && "🏆 CLIENTE PREMIUM DO SORTEIO"}
                </span>
                <div className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1 shadow-sm border border-primary/10">
                  <span className="text-[10px] font-bold text-muted-foreground">🎟️ Tickets:</span>
                  <span className="text-sm font-black text-primary animate-pop-in" key={totalTickets}>
                    {totalTickets}
                  </span>
                </div>
              </div>

              <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-muted/30 border border-primary/5">
                <div 
                  className={`h-full transition-all duration-700 ease-out ${selectedCount >= 2 ? "bg-gradient-to-r from-green-400 to-green-500" : "bg-gradient-to-r from-primary/70 to-primary"}`} 
                  style={{ width: `${selectedCount === 1 ? 50 : 100}%` }} 
                />
              </div>

              <p className="text-[11px] leading-snug font-medium text-muted-foreground">
                {selectedCount === 1 && "Adicione mais 1 produto ao seu carrinho para desbloquear sua participação no sorteio do iPhone 17 Pro Max."}
                {selectedCount === 2 && "Parabéns! Você já está concorrendo ao iPhone 17 Pro Max. Adicione mais produtos para ganhar tickets extras e aumentar suas chances."}
                {selectedCount >= 3 && "Você já está concorrendo ao iPhone 17 Pro Max. Continue adicionando produtos para aumentar suas chances."}
              </p>

              <button 
                onClick={() => {
                  const element = document.getElementById("recommended-products");
                  element?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="w-full rounded-xl bg-primary py-2.5 text-[11px] font-black uppercase tracking-wider text-primary-foreground shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
              >
                {selectedCount >= 2 ? "GANHAR MAIS TICKETS" : "ESCOLHER MAIS PRODUTOS"}
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-black uppercase tracking-tight text-foreground/80 flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 text-primary" />
              Seu Pedido
            </h3>
            {(["kit", "liberte", "golden", "vf27", "newKit"] as const).filter(k => selected[k]).map((key) => {
              const product = PRODUCTS[key];
              const isKit = key === "kit";
              const itemDiscount = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
              return (
                <div
                  key={key}
                  className={`relative animate-slide-up rounded-2xl border-2 bg-card p-4 flex items-center gap-4 shadow-md transition-all duration-300 ${isKit ? "border-primary shadow-[0_0_15px_rgba(231,52,122,0.2)]" : "border-primary/10 shadow-sm"}`}
                >
                  <div className="relative flex-shrink-0">
                    <div className="h-16 w-16 rounded-xl bg-muted/30 p-1 flex items-center justify-center">
                      <img src={product.image} alt={product.name} className="h-full w-full rounded-lg object-contain" />
                    </div>
                    <span className="absolute -top-2 -right-2 rounded-full bg-green-500 px-1.5 py-0.5 text-[9px] font-extrabold text-white shadow">-{itemDiscount}%</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[12px] font-bold text-foreground leading-tight truncate">{product.name}</h3>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-[10px] text-muted-foreground line-through">R$ {product.originalPrice.toFixed(2).replace(".", ",")}</span>
                      <span className="text-[14px] font-extrabold text-primary">{product.priceLabel}</span>
                    </div>
                  </div>
                  {!isKit && (
                    <button 
                      onClick={() => toggle(key)}
                      className="text-muted-foreground/40 hover:text-destructive transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          <div id="recommended-products" className="pt-2 space-y-4">
            <h3 className="text-sm font-black uppercase tracking-tight text-foreground/80 flex items-center gap-2 px-1">
              <Gift className="h-4 w-4 text-primary" />
              Recomendados para você
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {(["liberte", "golden", "vf27", "newKit"] as const).map((key) => {
                const product = PRODUCTS[key];
                const isSelected = selected[key];
                if (isSelected) return null;
                
                return (
                  <div key={key} className="flex flex-col rounded-2xl border border-primary/10 bg-card p-3 shadow-sm hover:border-primary/30 transition-all group">
                    <div className="relative mb-2 aspect-square rounded-xl bg-muted/30 p-2 flex items-center justify-center">
                      <img src={product.image} alt={product.name} className="h-full w-full object-contain transition-transform group-hover:scale-110" />
                      <div className="absolute -top-1 -right-1 flex flex-col items-end gap-1">
                        <span className="rounded-full bg-green-500 px-2 py-0.5 text-[8px] font-black text-white shadow-sm uppercase">
                          {key === 'golden' && "+2 TICKETS EXTRAS"}
                          {key === 'vf27' && "+3 TICKETS EXTRAS"}
                          {key === 'newKit' && "+4 TICKETS EXTRAS"}
                          {key === 'liberte' && "+1 TICKET EXTRA"}
                        </span>
                      </div>
                    </div>
                    <div className="flex-1 space-y-1">
                      <h4 className="text-[10px] font-bold text-foreground leading-tight line-clamp-2 min-h-[2.5em]">{product.name}</h4>
                      <div className="flex flex-col">
                        <span className="text-[9px] text-muted-foreground line-through">R$ {product.originalPrice.toFixed(2).replace(".", ",")}</span>
                        <span className="text-[13px] font-black text-primary">{product.priceLabel}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => toggle(key)}
                      className="mt-2 w-full rounded-lg bg-primary py-2 text-[10px] font-black uppercase text-primary-foreground shadow-md hover:brightness-110 active:scale-95 transition-all"
                    >
                      ADICIONAR
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="border-t border-border px-5 py-3 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-muted-foreground">Total</span>
              {savings > 0 && <span className="rounded-full bg-green-500/15 px-2 py-0.5 text-[10px] font-extrabold text-green-600">-{discountPercent}% OFF</span>}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground line-through">R$ {originalTotal.toFixed(2).replace(".", ",")}</span>
              <span className="text-xl font-extrabold text-foreground">R$ {total.toFixed(2).replace(".", ",")}</span>
            </div>
          </div>
          <button
            onClick={handleCheckout}
            className="w-full rounded-full bg-primary py-3.5 text-center text-base font-extrabold text-primary-foreground shadow-lg hover:scale-[1.02] active:scale-95 animate-pulse-glow"
          >
            Finalizar Compra Segura 🔒
          </button>
        </div>
      </div>
    </>
  );
};

export default CartDrawer;
