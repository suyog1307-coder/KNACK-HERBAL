import { apiClient } from "./api-client";
import type { ApiResponse, Product } from "@/types";

export const productsService = {
  async getAll(params?: { category?: string; search?: string; page?: number }) {
    const { data } = await apiClient.get<ApiResponse<Product[]>>("/products", {
      params,
    });
    return data.data;
  },

  async getOne(id: string) {
    const { data } = await apiClient.get<ApiResponse<Product>>(
      `/products/${id}`
    );
    return data.data;
  },
};
