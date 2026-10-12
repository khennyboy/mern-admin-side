import { useQuery } from "@tanstack/react-query";
import { api } from "../utils/api";
import type { ProductDetail } from "../utils/types";

type SingleProductResponse = {
    success: boolean;
    data: ProductDetail;
};

const fetchProductBySlug = async (slug: string): Promise<ProductDetail> => {
    const res = await api(`/products/${slug}`);   // ← no "/api", just "/products/..."
    return (res as SingleProductResponse).data;
};

const useGetProduct = (slug: string | undefined) => {
    return useQuery({
        queryKey: ["product", slug],
        queryFn: () => fetchProductBySlug(slug as string),
        enabled: !!slug,
    });
};

export default useGetProduct;