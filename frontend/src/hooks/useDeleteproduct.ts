import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { api } from "../utils/api";
import toast from "../utils/toast";
import type {
  GetProductsSuccessResponse,
  OtherProductResponse,
} from "../utils/types";

type DeleteContext = {
  previous: GetProductsSuccessResponse | undefined;
};

const useDeleteProduct = () => {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const page = Number(searchParams.get("page")) || 1;
  const category = searchParams.get("category") || "all";

  const { mutate, isPending } = useMutation<
    OtherProductResponse,
    Error,
    string,
    DeleteContext
  >({
    mutationFn: (id) => api(`/products/${id}`, { method: "DELETE" }),

    // 1. runs BEFORE the request fires
    onMutate: async (id) => {
      // cancel any in-flight fetches for this query so they don't overwrite us
      await queryClient.cancelQueries({
        queryKey: ["products", page, category],
      });

      // snapshot for rollback
      const previous = queryClient.getQueryData<GetProductsSuccessResponse>([
        "products",
        page,
        category,
      ]);

      // optimistically remove from the cache
      if (previous) {
        queryClient.setQueryData<GetProductsSuccessResponse>(
          ["products", page, category],
          {
            ...previous,
            data: previous.data.filter((p) => p._id !== id),
            totalProducts: Math.max(previous.totalProducts - 1, 0),
          },
        );
      }

      return { previous };
    },

    // 2. rollback on failure
    onError: (err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          ["products", page, category],
          context.previous,
        );
      }
      if (err.message.includes("Session expired")) return;
      toast(false, err.message);
    },

    // 3. refetch (or skip) after success
    onSuccess: () => {
      toast(true, "Product deleted successfully");
      queryClient.invalidateQueries({
        queryKey: ["products", page, category],
      });
    },
  });

  return {
    deleteProduct: mutate,
    isDeleting: isPending,
  };
};

export default useDeleteProduct;