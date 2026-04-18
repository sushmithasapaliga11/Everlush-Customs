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

const STORAGE_KEY = "everlush_orders";

function mockScriptFallback(action: string, data?: Record<string, any>): Promise<any> {
  return new Promise((resolve) => {
    setTimeout(() => {
      let orders: Order[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      
      switch (action) {
        case "placeOrder": {
          const newOrder: Order = {
            ...data?.order,
            id: Math.floor(Math.random() * 1000000), // Random ID
            status: "Pending",
            cancelRequest: "No",
            createdAt: new Date().toLocaleString(),
          };
          orders.push(newOrder);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
          resolve({ orderId: newOrder.id });
          break;
        }
        case "getOrders": {
          const phone = data?.phone;
          const filtered = orders.filter(o => o.phone === phone);
          resolve({ orders: filtered });
          break;
        }
        case "getAllOrders": {
          resolve({ orders });
          break;
        }
        case "requestCancel": {
          const orderId = data?.orderId;
          orders = orders.map(o => o.id === orderId ? { ...o, cancelRequest: "Yes" } : o);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
          resolve({ success: true });
          break;
        }
        case "updateCancel": {
          const { orderId, action: cancelAction } = data as any;
          orders = orders.map(o => {
            if (o.id === orderId) {
               return { 
                  ...o, 
                  cancelRequest: cancelAction,
                  status: cancelAction === "Approved" ? "Cancelled" : o.status 
               };
            }
            return o;
          });
          localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
          resolve({ success: true });
          break;
        }
        default:
          resolve({ error: "Unknown action" });
      }
    }, 500); // simulate network delay
  });
}

async function callScript(action: string, data?: Record<string, unknown>) {
  if (!GOOGLE_SCRIPT_URL) {
    console.warn("Google Apps Script URL not configured. Using localStorage fallback.");
    return mockScriptFallback(action, data);
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
