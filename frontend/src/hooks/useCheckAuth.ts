import { useQuery } from "@tanstack/react-query";

const checkAuthFn = async () => {
  const res = await fetch("/api/auth/check");
  if (!res.ok) return false;
  return true;
};

const useCheckAuth = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["auth"],
    queryFn: checkAuthFn,
    retry: false,
  });

  return { isAuthenticated: !!data, isLoading };
};

export default useCheckAuth;