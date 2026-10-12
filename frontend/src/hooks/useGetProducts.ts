import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import type {
  GetProductsErrorResponse,
  GetProductsSuccessResponse,
} from "../utils/types";

const fetchProducts = async (
  page: number,
  category: string,
  signal?: AbortSignal,
) => {
  const qs = new URLSearchParams({ page: String(page), category });
  const res = await fetch(`api/products?${qs.toString()}`, { signal });

  if (!res.ok) {
    const errorJson: GetProductsErrorResponse = await res.json().catch(
      (): GetProductsErrorResponse => ({
        success: false,
        message: "An unknown network error occurred.",
      }),
    );
    throw new Error(errorJson.message);
  }

  return await res.json();
};

const useGetProducts = () => {
  const [searchParams] = useSearchParams();
  const page = Number(searchParams.get("page")) || 1;
  const category = searchParams.get("category") || "all";

  const queryClient = useQueryClient();

  const { data, isPending, isError, error, isPlaceholderData } = useQuery<
    GetProductsSuccessResponse,
    Error
  >({
    queryKey: ["products", page, category],
    queryFn: ({ signal }) => fetchProducts(page, category, signal),
    placeholderData: (previousData) => previousData,
  });

  // prefetch neighbor pages
  useEffect(() => {
    if (!data) return;
    const totalPages = Math.max(
      Math.ceil(data.totalProducts / data.pageSize),
      1,
    );

    if (page < totalPages) {
      queryClient.prefetchQuery({
        queryKey: ["products", page + 1, category],
        queryFn: () => fetchProducts(page + 1, category),
      });
    }

    if (page > 1) {
      queryClient.prefetchQuery({
        queryKey: ["products", page - 1, category],
        queryFn: () => fetchProducts(page - 1, category),
      });
    }
  }, [data, page, category, queryClient]);

  return {
    products: data?.data ?? [],
    totalProducts: data?.totalProducts ?? 0,
    pageSize: data?.pageSize ?? 10,
    isLoading: isPending,
    isError,
    error: isError ? error.message : "",
    isPlaceholderData,
  };
};

export default useGetProducts;