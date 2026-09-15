import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useRef, useEffect } from "react";
import toast from "../utils/toast";
import type { CreateProductErrorResponse, Product, ProductDetail } from "../utils/types";

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

            const res = await fetch("/api/products", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(newProduct),
                signal: abortControllerRef.current.signal,
            });
            if (!res.ok) {
                const errorJson: CreateProductErrorResponse = await res.json().catch(
                    (): CreateProductErrorResponse => ({
                        success: false,
                        message: "An unknown network error occurred.",
                    })
                );
                throw new Error(errorJson.message);
            }
            const json = await res.json();
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