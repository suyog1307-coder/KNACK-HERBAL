"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { authService, type LoginPayload, type RegisterPayload } from "@/services/auth.service";
import { useAuthStore } from "@/stores/auth.store";

export function useMe() {
  const { isAuthenticated } = useAuthStore();
  return useQuery({
    queryKey: ["auth", "me"],
    queryFn: authService.me,
    enabled: isAuthenticated,
    retry: false,
  });
}

export function useLogin() {
  const { setTokens, setUser } = useAuthStore();
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (payload: LoginPayload) => authService.login(payload),
    onSuccess: async (tokens) => {
      setTokens(tokens.accessToken, tokens.refreshToken);
      const user = await authService.me();
      setUser(user);
      queryClient.setQueryData(["auth", "me"], user);
      if (user.role === "ADMIN") router.push("/admin");
      else if (user.role === "DELIVERY_PARTNER") router.push("/delivery");
      else router.push("/dashboard");
    },
  });
}

export function useRegister() {
  const router = useRouter();
  return useMutation({
    mutationFn: (payload: RegisterPayload) => authService.register(payload),
    onSuccess: () => router.push("/login?registered=1"),
  });
}

export function useLogout() {
  const { logout } = useAuthStore();
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: authService.logout,
    onSettled: () => {
      logout();
      queryClient.clear();
      router.push("/");
    },
  });
}
