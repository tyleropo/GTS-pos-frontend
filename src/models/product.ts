import { T_Supplier } from "./supplier";

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
  image: string;
  description: string;
  barcode: string;
  stock_keeping_unit: string;
  supplier: T_Supplier;
  stocks: number;
  price: number;
}