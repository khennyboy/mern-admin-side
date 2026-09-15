import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import toast from "../utils/toast";

const logoutFn = async () => {
  const res = await fetch("/api/auth/logout", {
    method: "POST",
  });
  if (!res.ok) {
    const errorJson = await res.json().catch(
      () => ({
        success: false,
        message: "An unknown network error occurred.",
      }),
    );
    throw new Error(errorJson.message);
  }
  const data = await res.json();
  return data;
};

const useLogout = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const mutation = useMutation({
    mutationFn: logoutFn,
    onSuccess: (data) => {
      toast(true, data.message)
      queryClient.setQueryData(["auth"], false);
      navigate("/login");
    },
    onError: (error: Error) => {
      toast(false, error.message)
    },
  });

  return { logout: mutation.mutate, isLoading: mutation.isPending };
};

export default useLogout;