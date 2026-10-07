import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { api } from "../utils/api";
import { capitalize } from "../utils/capitalize";
import toast from "../utils/toast";
import type {
    GetProductsSuccessResponse,
    OtherProductResponse,
    Product,
} from "../utils/types";

type UpdateParameter = {
    product: Product;
    id: string;
};

type UseUpdateProductOptions = {
    onSuccess?: () => void;
};

const useUpdateProduct = (options: UseUpdateProductOptions = {}) => {
    const queryClient = useQueryClient();
    const [searchParams] = useSearchParams();
    const page = Number(searchParams.get("page")) || 1;

    const { mutate, isPending, isSuccess } = useMutation<
        OtherProductResponse,
        Error,
        UpdateParameter
    >({
        mutationFn: ({ id, product }) =>
            api(`/products/${id}`, { method: "PUT", body: product }),

        onError: (err) => {
            if (err.message.includes("Session expired")) return;
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
            options.onSuccess?.();
        },
    });

    return {
        updateProduct: mutate,
        isUpdating: isPending,
        isUpdatedSuccessfully: isSuccess,
    };
};

export default useUpdateProduct;