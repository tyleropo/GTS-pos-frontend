export interface TransactionItem {
    product_id: string;
    product_name: string;
    quantity: number;
    unit_price: number;
    line_total: number;
}

export interface Transaction{
    id:string
    invoice_number: string
    date: string
    time: string
    customer: string
    items:number
    lineItems: TransactionItem[]
    total: number
    paymentMethod: "Credit Card" | "Cash" | string
    status: "Completed" | "Refunded" | string
    cashier: string
    meta?: Record<string, any>
}

export type DateFileter ="all" | "today" | "yesterday" | "this-week"
export type PaymentFilter = "all" | "cash" | "credit-card"
export type StatusFilter = "all" | "completed" | "refunded"