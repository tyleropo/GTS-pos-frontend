import { T_Product } from "./product"

export type T_CartItem = T_Product & {
  quantity: number
}