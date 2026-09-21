import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { useShallow } from "zustand/react/shallow";
import { useProductStore } from "../store/product-store";
import toast from "../utils/toast";
import type { OtherProductResponse, ProductDetail } from "../utils/types";
import { api } from "../utils/api";

type DeleteContext = {
    products: ProductDetail[];
    totalProducts: number;
    pageSize: number;
};

const useDeleteProduct = () => {
    const queryClient = useQueryClient();
    const [searchParams] = useSearchParams();
    const page = Number(searchParams.get("page")) || 1;

    const { setProducts, setCounts, setDeleteDialog } = useProductStore(
        useShallow((state) => ({
            setCounts: state.setCounts,
            setProducts: state.setProducts,
            setDeleteDialog: state.setDeleteDialog
        })),
    );

    const { mutate, isPending } = useMutation<
        OtherProductResponse,
        Error,
        string,
        DeleteContext // delete context parameter
    >({
        mutationFn: async (id) =>
            await api(`/products/${id}`, { method: "DELETE", }),
        onMutate: async (id) => {
            setDeleteDialog(false);

            // snapshot for rollback
            const { products, totalProducts, pageSize } =
                useProductStore.getState();

            // instantly remove from list and decrement count — no waiting on refetch
            setProducts(products.filter((p) => p._id !== id));
            setCounts(Math.max(totalProducts - 1, 0), pageSize);

            return { products, totalProducts, pageSize };
        },
        onError: (err, _id, context) => {
            if (context) {
                setProducts(context.products);
                setCounts(context.totalProducts, context.pageSize);
            }
            if (err.message.includes("Session expired")) return;
            toast(false, err.message);
        },
        onSuccess: () => {
            toast(true, "Product deleted successfully");
            // reconciles server truth in the background, no UI lag either way
            queryClient.invalidateQueries({ queryKey: ["products", page] });
        },
    });

    return {
        deleteProduct: mutate,
        isDeleting: isPending,
    };
};

export default useDeleteProduct;