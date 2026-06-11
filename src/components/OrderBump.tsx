import product1 from "@/assets/product-1.webp";
import bumpVfGolden from "@/assets/bump-vf-golden.webp";
import bumpLiberteDore from "@/assets/bump-liberte-dore.webp";
import bumpVf27 from "@/assets/product-vf27.webp";

export interface CartItem {
  name: string;
  price: number;
  priceLabel: string;
  image: string;
}

export const PRODUCTS: Record<string, CartItem> = {
  kit: { name: "Kit Body Splash Linha Completa - 5 Unidades", price: 44.90, priceLabel: "R$ 44,90", image: product1 },
  golden: { name: "Kit VF Golden - Body Cream + Perfume Virginia Fonseca", price: 39.90, priceLabel: "R$ 39,90", image: bumpVfGolden },
  liberte: { name: "Liberté Doré Desodorante Colônia 100ml - Wepink", price: 23.90, priceLabel: "R$ 23,90", image: bumpLiberteDore },
  vf27: { name: "Perfume VF 27 – Virginia Fonseca 75ml", price: 45.00, priceLabel: "R$ 45,00", image: bumpVf27 },
};
