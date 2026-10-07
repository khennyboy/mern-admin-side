import { create } from "zustand";
import type { ProductStore } from "../utils/types";

export const useProductStore = create<ProductStore>((set) => ({
  updateDialog: false,
  setUpdateDialog: (open) =>
    set((state) => ({
      updateDialog: open,
      selectedProduct: open ? state.selectedProduct : null,
    })),

  products: [],
  setProducts: (products) => set({ products }),

  totalProducts: 0,
  pageSize: 0,
  setCounts: (totalProducts, pageSize) => set({ totalProducts, pageSize }),

  selectedProduct: null,
  setSelectedProduct: (product) => set({ selectedProduct: product }),

}));