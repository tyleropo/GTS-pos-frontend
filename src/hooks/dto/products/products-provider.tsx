import { T_Product } from "@/src/models/product";

export const useProductProvider = () => {
  const backendURL = "http://localhost:8000/api"

  async function getAllProducts() {
    const response = await fetch(`${backendURL}/products`, 
    {
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

  async function getCategoriesAndBrands() {
    const response = await fetch(`${backendURL}/product_/categories_brands`, 
    {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("token")}`,
      },
    })
    if (!response.ok) {
      throw await response.json();
    }
    const data = await response.json();
    return data;
  }

  return {
    getAllProducts,
    getCategoriesAndBrands,
  }
}

