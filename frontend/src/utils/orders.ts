import { api } from "./api";
import type { ProductDetail } from "./types";

export interface PopulatedProduct {
    _id: string;
    name: string;
}

export interface OrderItem {
    product?: PopulatedProduct;
    name: string;
    price: number;
    quantity: number;
}

export interface Order {
    _id: string;
    customerName: string;
    customerEmail: string;
    shippingAddress: string;
    phone: string;
    items: OrderItem[];
    refundItems?: OrderItem[];
    refundAmount?: number;
    refundStatus?: "refund_needed" | "refunded";
    totalAmount: number;
    paystackReference: string;
    deliveryStatus?: "pending" | "delivered";
    createdAt: string;
    updatedAt: string;
}
// return type of fetch order if successful
export interface OrdersResponse {
    success: boolean;
    data: Order[];
    totalOrders: number;
    pageSize: number;
    message?: string;
}

export type ItemFlag = "unavailable" | "refunded" | null;
export type DisplayItem = OrderItem & { flag: ItemFlag };
export type ActionKind = "refund" | "complete" | "delete";
export type ConfirmAction = { kind: ActionKind; order?: Order, product?: ProductDetail } | null;
export type PendingAction = { id: string; kind: ActionKind } | null;

export const money = (amount: number) => `₦${amount.toLocaleString()}`;

// to display the items name and quantity together in a single order
export const itemNames = (items: OrderItem[] = []) =>
    items.map((i) => `${i.name} ×${i.quantity}`).join(", ");

// to show the status of each items in a single order
export const getAllItems = (order: Order): DisplayItem[] => {
    const flag: ItemFlag =
        order.refundStatus === "refund_needed" ? "unavailable" : "refunded";

    return [
        ...order.items.map((item) => ({ ...item, flag: null as ItemFlag })),
        ...(order.refundItems ?? []).map((item) => ({ ...item, flag })),
    ];
};

// to know if the items is unavailable or needs to be refunded
export const flagLabel = (flag: ItemFlag) =>
    flag === "unavailable"
        ? "(unavailable)"
        : flag === "refunded"
            ? "(refunded)"
            : "";

// flag color 
export const flagColor = (flag: ItemFlag) =>
    flag === "unavailable" ? "red.500" : "gray.500";


export const fetchOrders = (
    page: number,
    status: string,
): Promise<OrdersResponse> => api(`/orders?pageO=${page}&status=${status}`);

export const deliverOrder = (id: string) =>
    api(`/orders/${id}/deliver`, { method: "PATCH" });

export const refundOrder = (id: string) =>
    api(`/orders/${id}/refund`, { method: "PATCH" });