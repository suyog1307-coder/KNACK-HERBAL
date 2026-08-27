import { apiClient } from "./api-client";
import type { ApiResponse, AuthTokens, User } from "@/types";

export interface RegisterPayload {
  email: string;
  password: string;
  firstName: string;
  lastName?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export const authService = {
  async register(payload: RegisterPayload) {
    const { data } = await apiClient.post<ApiResponse<{ user: User }>>(
      "/auth/register",
      payload
    );
    return data.data;
  },

  async login(payload: LoginPayload) {
    const { data } =
      await apiClient.post<ApiResponse<AuthTokens>>("/auth/login", payload);
    return data.data;
  },

  async refresh(refreshToken: string) {
    const { data } = await apiClient.post<ApiResponse<AuthTokens>>(
      "/auth/refresh",
      { refreshToken }
    );
    return data.data;
  },

  async me() {
    const { data } = await apiClient.get<ApiResponse<User>>("/auth/me");
    return data.data;
  },

  async logout() {
    await apiClient.post("/auth/logout");
  },
};
