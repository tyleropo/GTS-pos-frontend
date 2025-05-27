import { T_Product } from "@/models/product";

export const useProductProvider = () => {
  const backendURL = "http://localhost:8000/api/products"

  async function getAllProducts() {
    const response = await fetch(backendURL, {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("token")}`,
      },
    })
    if (!response.ok) {
      throw await response.json();
    }
    const products = await response.json();
    return products as T_Product[];
  }

  return {
    getAllProducts,
  }
}

