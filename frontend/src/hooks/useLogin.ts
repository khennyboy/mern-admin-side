import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import toast from "../utils/toast";

const loginFn = async (credentials: { username: string; password: string }) => {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });
  console.log(res)
  if (!res.ok) {
    const errorJson = await res.json().catch(
      () => ({
        success: false,
        message: "An unknown network error occurred",
      }),
    );
    throw new Error(errorJson.message);
  }
  const data = await res.json();
  return data;
};

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