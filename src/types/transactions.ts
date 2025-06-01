export interface Transaction{
    id:string
    date: string
    time: string
    customer: string
    items:number
    total: number
    paymentMethod: "Credit Card" | "Cash" | string
    status: "Completed" | "Refunded" | string
    cashier: string
}

export type DateFileter ="all" | "today" | "yesterday" | "this-week"
export type PaymentFilter = "all" | "cash" | "credit-card"
export type StatusFilter = "all" | "completed" | "refunded"