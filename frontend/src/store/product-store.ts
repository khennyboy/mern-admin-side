import { create } from "zustand";
import type { ProductStore } from "../utils/types";

export const useProductStore = create<ProductStore>((set) => ({
  products: [],
  setProducts: (products) => set({ products }),
  totalProducts: 0,
  pageSize: 0,
  setCounts: (totalProducts, pageSize) => set({ totalProducts, pageSize }),
}));