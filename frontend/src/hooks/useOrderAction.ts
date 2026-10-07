import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "../utils/toast";
import type { ActionKind, PendingAction } from "../utils/orders";

export const useOrderAction = (
  action: (id: string) => Promise<unknown>,
  successMessage: string,
  kind: ActionKind,
  setPending: (pending: PendingAction) => void,
) => {
  const queryClient = useQueryClient();

  return useMutation<unknown, Error, string>({
    mutationFn: action,
    onMutate: (id) => setPending({ id, kind }),
    onSuccess: async () => {
      toast(true, successMessage);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin-orders"] }),
        queryClient.invalidateQueries({ queryKey: ["orders-count"] }),
      ]);
    },
    onError: (error) => toast(false, error.message || "Failed to update order"),
    onSettled: () => setPending(null),
  });
};
