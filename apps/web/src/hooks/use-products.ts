"use client";

import { useQuery } from "@tanstack/react-query";
import { productsService } from "@/services/products.service";

export function useProducts(params?: { category?: string; search?: string }) {
  return useQuery({
    queryKey: ["products", params],
    queryFn: () => productsService.getAll(params),
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: ["products", id],
    queryFn: () => productsService.getOne(id),
    enabled: !!id,
  });
}
