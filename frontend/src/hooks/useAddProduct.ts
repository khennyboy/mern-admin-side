import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../utils/api";
import toast from "../utils/toast";
import type { Product, ProductDetail } from "../utils/types";

const useAddProduct = () => {
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const abortControllerRef = useRef<AbortController | null>(null);

    useEffect(() => {
        return () => {
            abortControllerRef.current?.abort();
        };
    }, []);

    const { mutate, isPending, isSuccess, data } = useMutation<
        ProductDetail,
        Error,
        Product
    >({
        mutationFn: async (newProduct) => {
            abortControllerRef.current = new AbortController();

            const json = await api("/products", {
                method: "POST",
                body: newProduct,
                signal: abortControllerRef.current.signal,
            });
            return json.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["products"] });
            toast(true, "Product created successfully");
            navigate("/");
        },
        onError: (err) => {
            if (err.name === "AbortError") return; // silently ignore — user navigated away on purpose
            toast(false, err.message);
        },
    });

    return {
        addProduct: mutate,
        isAdding: isPending,
        isSuccess,
        data,
    };
};

export default useAddProduct;