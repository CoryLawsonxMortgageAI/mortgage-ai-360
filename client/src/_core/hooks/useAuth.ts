import { useQuery } from "@tanstack/react-query";
import { useCallback } from "react";

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
};

export function useAuth(options?: UseAuthOptions) {
  const { redirectOnUnauthenticated = false } = options ?? {};

  const { data: user, isLoading, error, refetch } = useQuery({
    queryKey: ["/api/auth/user"],
    queryFn: async () => {
      const response = await fetch("/api/auth/user", {
        credentials: "include",
      });
      if (!response.ok) {
        if (response.status === 401) {
          return null;
        }
        throw new Error("Failed to fetch user");
      }
      return response.json();
    },
    retry: false,
    refetchOnWindowFocus: false,
  });

  const logout = useCallback(async () => {
    const form = document.createElement("form");
    form.method = "POST";
    form.action = "/api/logout";
    document.body.appendChild(form);
    form.submit();
  }, []);

  const login = useCallback(() => {
    window.location.href = "/api/login";
  }, []);

  return {
    user: user ?? null,
    loading: isLoading,
    error: error,
    isAuthenticated: Boolean(user),
    refresh: refetch,
    logout,
    login,
  };
}
