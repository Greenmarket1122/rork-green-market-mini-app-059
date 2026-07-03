/**
 * API client for the Green Market backend (Cloudflare Worker).
 * Handles order submission and tracking.
 */

const API_BASE =
  import.meta.env.VITE_RORK_FUNCTIONS_URL ??
  import.meta.env.EXPO_PUBLIC_RORK_FUNCTIONS_URL ??
  "";

export interface OrderItem {
  name: string;
  emoji: string;
  price: number;
  qty: number;
}

export interface OrderResponse {
  orderNumber: string;
  items: OrderItem[];
  total: number;
  address: {
    fullName: string;
    phone: string;
    street: string;
    city: string;
    lat?: number;
    lng?: number;
  };
  payment: string;
  courier: string;
  customerName?: string;
  customerUsername?: string;
  telegramUserId?: number;
  status: string;
  createdAt: number;
}

export interface SubmitOrderPayload {
  items: OrderItem[];
  total: number;
  address: OrderResponse["address"];
  payment: string;
  courier: string;
  customerName?: string;
  customerUsername?: string;
  telegramUserId?: number;
}

/**
 * Submit a new order to the backend.
 * The backend persists it, assigns a sequential order number, and
 * sends a Telegram notification to the shop admin.
 */
export async function submitOrder(
  payload: SubmitOrderPayload,
): Promise<{ ok: boolean; order?: OrderResponse; error?: string }> {
  try {
    const resp = await fetch(`${API_BASE}/api/order`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await resp.json()) as {
      ok: boolean;
      order?: OrderResponse;
      error?: string;
    };
    return data;
  } catch {
    return {
      ok: false,
      error: "Serverga ulanib bo'lmadi. Internetingizni tekshiring.",
    };
  }
}

/**
 * Fetch a single order by its order number (e.g. "GM-000001").
 */
export async function fetchOrder(
  orderNumber: string,
): Promise<{ ok: boolean; order?: OrderResponse; error?: string }> {
  try {
    const resp = await fetch(`${API_BASE}/api/order/${orderNumber}`);
    const data = (await resp.json()) as {
      ok: boolean;
      order?: OrderResponse;
      error?: string;
    };
    return data;
  } catch {
    return {
      ok: false,
      error: "Serverga ulanib bo'lmadi.",
    };
  }
}
