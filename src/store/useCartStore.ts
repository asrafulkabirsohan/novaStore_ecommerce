import { create } from "zustand";
import { persist } from "zustand/middleware";
import { IProduct } from "@/types";

export interface CartItem {
  product: IProduct;
  quantity: number;
}

interface CartStore {
  items: CartItem[];
  addItem: (product: IProduct, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: () => number;
  subtotal: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (product, quantity = 1) => {
        const items = get().items;
        const productId = typeof product._id === "object" ? product._id.toString() : product._id;
        const existingIndex = items.findIndex(
          (item) => (typeof item.product._id === "object" ? item.product._id.toString() : item.product._id) === productId
        );

        if (existingIndex > -1) {
          const newItems = [...items];
          newItems[existingIndex].quantity += quantity;
          set({ items: newItems });
        } else {
          set({ items: [...items, { product, quantity }] });
        }
      },
      removeItem: (productId) => {
        set({
          items: get().items.filter(
            (item) => (typeof item.product._id === "object" ? item.product._id.toString() : item.product._id) !== productId
          ),
        });
      },
      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }
        set({
          items: get().items.map((item) =>
            (typeof item.product._id === "object" ? item.product._id.toString() : item.product._id) === productId
              ? { ...item, quantity }
              : item
          ),
        });
      },
      clearCart: () => set({ items: [] }),
      totalItems: () => get().items.reduce((sum, item) => sum + item.quantity, 0),
      subtotal: () =>
        get().items.reduce((sum, item) => {
          const price = item.product.discountPrice || item.product.price;
          return sum + price * item.quantity;
        }, 0),
    }),
    {
      name: "ecommerce-cart-storage",
    }
  )
);
