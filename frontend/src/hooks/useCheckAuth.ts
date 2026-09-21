import { useQuery } from "@tanstack/react-query";
import { api } from "../utils/api";

const checkAuthFn = async () => await api("/auth/check");


const useCheckAuth = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["auth"],
    queryFn: checkAuthFn,
    retry: false,
  });

  return { isAuthenticated: !!data, isLoading };
};

export default useCheckAuth;