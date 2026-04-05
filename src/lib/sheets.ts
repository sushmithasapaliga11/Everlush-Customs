import { GOOGLE_SCRIPT_URL } from "./constants";

export interface OrderItem {
  product: string;
  option: string;
  quantity: number;
  price: number;
  subtotal: number;
}

export interface Order {
  id?: number;
  name: string;
  phone: string;
  items: OrderItem[];
  total: number;
  status: string;
  cancelRequest: string;
  createdAt: string;
}

async function callScript(action: string, data?: Record<string, unknown>) {
  if (!GOOGLE_SCRIPT_URL) {
    throw new Error("Google Apps Script URL not configured. Please set GOOGLE_SCRIPT_URL in src/lib/constants.ts");
  }
  const res = await fetch(GOOGLE_SCRIPT_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: JSON.stringify({ action, ...data }),
  });
  const json = await res.json();
  if (json.error) throw new Error(json.error);
  return json;
}

export async function placeOrder(order: Omit<Order, "id" | "status" | "cancelRequest" | "createdAt">) {
  return callScript("placeOrder", { order });
}

export async function getOrdersByPhone(phone: string): Promise<Order[]> {
  const res = await callScript("getOrders", { phone });
  return res.orders || [];
}

export async function requestCancel(orderId: number) {
  return callScript("requestCancel", { orderId });
}

export async function getAllOrders(): Promise<Order[]> {
  const res = await callScript("getAllOrders");
  return res.orders || [];
}

export async function updateCancelRequest(orderId: number, action: "Approved" | "Rejected") {
  return callScript("updateCancel", { orderId, action });
}
