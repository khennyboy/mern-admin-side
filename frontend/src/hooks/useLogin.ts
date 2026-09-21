import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import toast from "../utils/toast";
import { api } from "../utils/api";


const loginFn = (credentials: { username: string; password: string }) =>
  api("/auth/login", { method: "POST", body: credentials });

const useLogin = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: loginFn,
    onSuccess: () => {
      queryClient.setQueryData(["auth"], true);
      navigate("/");
    },
    onError: (error: Error) => {
      toast(false, error.message)
    },
  });

  return { login: mutation.mutateAsync, isLoading: mutation.isPending };
};

export default useLogin;