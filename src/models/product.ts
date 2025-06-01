export type T_Category = {
  id: number;
  name: string;
}

export type T_Brand = {
  id: number;
  name: string;
}

export type T_Product = {
  id: number;
  name: string;
  category: string;
  brand: string;
  description: string;
  specs: string;
  price: number;
}