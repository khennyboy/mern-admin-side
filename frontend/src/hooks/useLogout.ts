import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import toast from "../utils/toast";
import { api } from "../utils/api";

const logoutFn = () => api("/auth/logout", { method: "POST" });

const useLogout = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const mutation = useMutation({
    mutationFn: logoutFn,
    onSuccess: (data) => {
      toast(true, data.message);
      queryClient.setQueryData(["auth"], false);
      navigate("/login");
    },
    onError: (error: Error) => {
      toast(false, error.message);
    },
  });

  return { logout: mutation.mutate, isLoading: mutation.isPending };
};

export default useLogout;