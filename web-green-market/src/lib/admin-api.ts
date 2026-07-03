/**
 * Admin API client for the Green Market backend.
 * Handles products CRUD, settings, orders, and password verification.
 * Includes a local password fallback so the admin can always log in
 * even if the backend is temporarily unreachable.
 */

const API_BASE =
  import.meta.env.VITE_RORK_FUNCTIONS_URL ??
  import.meta.env.EXPO_PUBLIC_RORK_FUNCTIONS_URL ??
  "";

import type { OrderData, Product, ShopSettings } from "./types";

export type { OrderData };

/* ─── Products ──────────────────────────────────────────── */

export async function fetchProducts(): Promise<{ ok: boolean; products?: Product[]; error?: string }> {
  try {
    const resp = await fetch(`${API_BASE}/api/products`);
    const data = (await resp.json()) as { ok: boolean; products?: Product[]; error?: string };
    return data;
  } catch {
    return { ok: false, error: "Serverga ulanib bo'lmadi." };
  }
}

export async function createProduct(product: Product): Promise<{ ok: boolean; product?: Product; error?: string }> {
  try {
    const resp = await fetch(`${API_BASE}/api/products`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(product),
    });
    const data = (await resp.json()) as { ok: boolean; product?: Product; error?: string };
    return data;
  } catch {
    return { ok: false, error: "Serverga ulanib bo'lmadi." };
  }
}

export async function updateProduct(id: string, patch: Partial<Product>): Promise<{ ok: boolean; product?: Product; error?: string }> {
  try {
    const resp = await fetch(`${API_BASE}/api/products/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    const data = (await resp.json()) as { ok: boolean; product?: Product; error?: string };
    return data;
  } catch {
    return { ok: false, error: "Serverga ulanib bo'lmadi." };
  }
}

export async function deleteProduct(id: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const resp = await fetch(`${API_BASE}/api/products/${id}`, { method: "DELETE" });
    const data = (await resp.json()) as { ok: boolean; error?: string };
    return data;
  } catch {
    return { ok: false, error: "Serverga ulanib bo'lmadi." };
  }
}

/* ─── Settings ──────────────────────────────────────────── */

export async function fetchSettings(): Promise<{ ok: boolean; settings?: ShopSettings; error?: string }> {
  try {
    const resp = await fetch(`${API_BASE}/api/settings`);
    const data = (await resp.json()) as { ok: boolean; settings?: ShopSettings; error?: string };
    return data;
  } catch {
    return { ok: false, error: "Serverga ulanib bo'lmadi." };
  }
}

export async function saveSettings(settings: Partial<ShopSettings>): Promise<{ ok: boolean; settings?: ShopSettings; error?: string }> {
  try {
    const resp = await fetch(`${API_BASE}/api/settings`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    const data = (await resp.json()) as { ok: boolean; settings?: ShopSettings; error?: string };
    return data;
  } catch {
    return { ok: false, error: "Serverga ulanib bo'lmadi." };
  }
}

/* ─── Orders ────────────────────────────────────────────── */

export async function fetchOrders(): Promise<{ ok: boolean; orders?: OrderData[]; error?: string }> {
  try {
    const resp = await fetch(`${API_BASE}/api/orders`);
    const data = (await resp.json()) as { ok: boolean; orders?: OrderData[]; error?: string };
    return data;
  } catch {
    return { ok: false, error: "Serverga ulanib bo'lmadi." };
  }
}

export async function updateOrderStatus(orderNumber: string, status: string): Promise<{ ok: boolean; order?: OrderData; error?: string }> {
  try {
    const resp = await fetch(`${API_BASE}/api/order/${orderNumber}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const data = (await resp.json()) as { ok: boolean; order?: OrderData; error?: string };
    return data;
  } catch {
    return { ok: false, error: "Serverga ulanib bo'lmadi." };
  }
}

/* ─── Admin auth ────────────────────────────────────────── */

const DEFAULT_ADMIN_PASSWORD = "0215";
const LOCAL_PASSWORD_KEY = "gm_admin_password";

/**
 * Verify the admin password.
 * 1) Always check the hardcoded default "0215" first — guaranteed to work.
 * 2) Check a locally cached custom password (if admin changed it).
 * 3) Fall back to the backend in case the password was changed remotely.
 */
export async function verifyAdminPassword(password: string): Promise<boolean> {
  // 1. Hardcoded default — always works, zero dependencies
  if (password === DEFAULT_ADMIN_PASSWORD) {
    return true;
  }

  // 2. Locally cached custom password
  const cached = localStorage.getItem(LOCAL_PASSWORD_KEY);
  if (cached && cached === password) {
    return true;
  }

  // 3. Backend check — in case password was changed remotely
  try {
    const resp = await fetch(`${API_BASE}/api/admin/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (resp.ok) {
      const data = (await resp.json()) as { ok: boolean };
      if (data.ok) {
        cacheAdminPassword(password);
        return true;
      }
    }
  } catch {
    // backend unreachable — local checks already failed
  }

  return false;
}

/**
 * Cache a custom admin password locally (called after fetching settings
 * or when the admin changes the password). Keeps the fallback in sync.
 */
export function cacheAdminPassword(password: string): void {
  if (password && password.length > 0) {
    localStorage.setItem(LOCAL_PASSWORD_KEY, password);
  }
}

/* ─── Categories ────────────────────────────────────────── */

export async function fetchCategories(): Promise<{ ok: boolean; categories?: string[]; error?: string }> {
  try {
    const resp = await fetch(`${API_BASE}/api/categories`);
    const data = (await resp.json()) as { ok: boolean; categories?: string[]; error?: string };
    return data;
  } catch {
    return { ok: false, error: "Serverga ulanib bo'lmadi." };
  }
}
