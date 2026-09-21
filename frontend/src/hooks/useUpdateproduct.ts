import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import toast from "../utils/toast";
import type {
    GetProductsSuccessResponse,
    OtherProductResponse,
    Product,
} from "../utils/types";
import { useProductStore } from "../store/product-store";
import { capitalize } from "../utils/capitalize";
import { api } from "../utils/api";

type UpdateParameter = {
    product: Product;
    id: string;
};


const useUpdateProduct = () => {
    const queryClient = useQueryClient();
    const [searchParams] = useSearchParams();
    const setUpdateDialog = useProductStore((state) => state.setUpdateDialog);
    const page = Number(searchParams.get("page")) || 1;

    const { mutate, isPending, isSuccess } = useMutation<
        OtherProductResponse,
        Error,
        UpdateParameter
    >({
        mutationFn: ({ id, product }) =>
            api(`/products/${id}`, { method: "PUT", body: product }),

        onError: (err) => {
            toast(false, err.message);
        },
        onSuccess: (_, { id, product }) => {
            toast(true, "Product updated successfully");

            const formattedName = capitalize(product.name);

            // Directly update the React Query cache
            queryClient.setQueryData<GetProductsSuccessResponse>(
                ["products", page],
                (old) => {
                    if (!old) return old;
                    return {
                        ...old,
                        data: old.data.map((p) =>
                            p._id === id
                                ? {
                                    ...p,
                                    ...product,
                                    name: formattedName,
                                    updatedAt: new Date().toISOString(),
                                }
                                : p
                        ),
                    };
                }
            );
            setUpdateDialog(false)
        },
    });

    return {
        updateProduct: mutate,
        isUpdating: isPending,
        isUpdatedSuccessfully: isSuccess,
    };
};

export default useUpdateProduct;