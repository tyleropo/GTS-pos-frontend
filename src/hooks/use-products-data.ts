import { useCallback, useEffect, useRef, useState } from "react";
import {
  fetchProductCategories,
  fetchProducts,
  fetchSuppliers,
  type Category,
  type FetchProductsParams,
  type Product,
  type Supplier,
} from "@/src/lib/api/products";

type HookOptions = {
  enabled?: boolean;
};

export function useProductsQuery(
  params: FetchProductsParams,
  options: HookOptions = {}
) {
  const { enabled = true } = options;
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  const load = useCallback(async () => {
    if (!enabled) {
      return;
    }
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await fetchProducts(params, {
        signal: controller.signal,
      });
      setProducts(data);
    } catch (cause) {
      if (controller.signal.aborted) {
        return;
      }
      setError(
        cause instanceof Error
          ? cause
          : new Error("Unable to fetch product catalogue.")
      );
    } finally {
      if (!controller.signal.aborted) {
        setIsLoading(false);
      }
    }
  }, [enabled, params]);

  useEffect(() => {
    void load();
    return () => {
      controllerRef.current?.abort();
    };
  }, [load]);

  return {
    products,
    isLoading,
    error,
    refresh: load,
    setProducts,
  };
}

export function useProductCategoriesList(options: HookOptions = {}) {
  const { enabled = true } = options;
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  const load = useCallback(async () => {
    if (!enabled) {
      return;
    }
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetchProductCategories({
        signal: controller.signal,
      });
      setCategories(response);
    } catch (cause) {
      if (controller.signal.aborted) {
        return;
      }
      setError(
        cause instanceof Error
          ? cause
          : new Error("Unable to fetch product categories.")
      );
    } finally {
      if (!controller.signal.aborted) {
        setIsLoading(false);
      }
    }
  }, [enabled]);

  useEffect(() => {
    void load();
    return () => {
      controllerRef.current?.abort();
    };
  }, [load]);

  return {
    categories,
    isLoading,
    error,
    refresh: load,
  };
}

export function useSuppliersList(options: HookOptions = {}) {
  const { enabled = true } = options;
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  const load = useCallback(async () => {
    if (!enabled) {
      return;
    }
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetchSuppliers({
        signal: controller.signal,
      });
      setSuppliers(response);
    } catch (cause) {
      if (controller.signal.aborted) {
        return;
      }
      setError(
        cause instanceof Error
          ? cause
          : new Error("Unable to fetch suppliers.")
      );
    } finally {
      if (!controller.signal.aborted) {
        setIsLoading(false);
      }
    }
  }, [enabled]);

  useEffect(() => {
    void load();
    return () => {
      controllerRef.current?.abort();
    };
  }, [load]);

  return {
    suppliers,
    isLoading,
    error,
    refresh: load,
  };
}
