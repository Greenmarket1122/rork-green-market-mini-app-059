import { DurableObject } from "cloudflare:workers";

export interface OrderItem {
  name: string;
  emoji: string;
  price: number;
  qty: number;
}

export interface Order {
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

/** Product managed via admin panel */
export interface AdminProduct {
  id: string;
  name: string;
  category: string;
  emoji: string;
  price: number;
  oldPrice?: number;
  unit: string;
  description: string;
  rating: number;
  inStock: boolean;
  hidden?: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface ShopSettings {
  shopName: string;
  deliveryFee: number;
  freeDeliveryThreshold: number;
  contactPhone: string;
  supportLink: string;
  isOpen: boolean;
  workingHours: string;
  bannerText: string;
  bannerEnabled: boolean;
  adminPassword: string;
}

const DEFAULT_SETTINGS: ShopSettings = {
  shopName: "Green Market",
  deliveryFee: 0,
  freeDeliveryThreshold: 50000,
  contactPhone: "+998 90 123 45 67",
  supportLink: "https://t.me/greenmarket_support",
  isOpen: true,
  workingHours: "08:00 — 22:00",
  bannerText: "Tanlangan mahsulotlarga 20% gacha chegirma",
  bannerEnabled: true,
  adminPassword: "0215",
};

const CATEGORIES = [
  "Ichimliklar",
  "Shirinliklar",
  "Mevalar",
  "Sabzavotlar",
  "Sut mahsulotlari",
  "Non mahsulotlari",
  "Gigiyena",
] as const;

const SEED_PRODUCTS: Omit<AdminProduct, "createdAt" | "updatedAt">[] = [
  { id: "monster-nitro", name: "Monster Energy Nitro", category: "Ichimliklar", emoji: "🥤", price: 30000, unit: "500 ml", description: "Monster Energy Nitro — kuchli energiya beruvchi ichimlik. Sport va faol hayot tarzi uchun ideal tanlov.", rating: 4.8, inStock: true },
  { id: "coca-cola", name: "Coca-Cola", category: "Ichimliklar", emoji: "🧋", price: 15000, oldPrice: 18000, unit: "1.5 L", description: "Klassik Coca-Cola gazlangan ichimligi. Sovuq holda iste'mol qilish tavsiya etiladi.", rating: 4.7, inStock: true },
  { id: "fuse-tea", name: "Fuse Tea limon", category: "Ichimliklar", emoji: "🧃", price: 12000, unit: "1 L", description: "Limon ta'mli sovuq choy. Tabiiy choy ekstrakti asosida tayyorlangan.", rating: 4.5, inStock: true },
  { id: "alpen-gold", name: "Alpen Gold shokolad", category: "Shirinliklar", emoji: "🍫", price: 25000, unit: "90 g", description: "Sutli shokolad Alpen Gold. Yong'oq va mayiz qo'shilgan mazali plitka.", rating: 4.6, inStock: true },
  { id: "snickers", name: "Snickers", category: "Shirinliklar", emoji: "🍬", price: 12000, oldPrice: 14000, unit: "50 g", description: "Yeryong'oq, karamel va nugatli shokolad batonchigi.", rating: 4.7, inStock: true },
  { id: "medovik", name: "Medovik tort", category: "Shirinliklar", emoji: "🍰", price: 85000, unit: "1 kg", description: "Asal qatlamli klassik Medovik torti. Har kuni yangi tayyorlanadi.", rating: 4.9, inStock: true },
  { id: "olma", name: "Olma (qizil)", category: "Mevalar", emoji: "🍎", price: 18000, unit: "1 kg", description: "Shirin va sersuv qizil olma. Mahalliy fermer xo'jaliklaridan yetkazilgan.", rating: 4.6, inStock: true },
  { id: "banan", name: "Banan", category: "Mevalar", emoji: "🍌", price: 28000, oldPrice: 32000, unit: "1 kg", description: "Pishgan shirin banan. Vitamin va energiya manbai.", rating: 4.5, inStock: true },
  { id: "apelsin", name: "Apelsin", category: "Mevalar", emoji: "🍊", price: 32000, unit: "1 kg", description: "Sersuv apelsin — C vitaminiga boy sitrus mevasi.", rating: 4.4, inStock: true },
  { id: "uzum", name: "Uzum (husayni)", category: "Mevalar", emoji: "🍇", price: 35000, unit: "1 kg", description: "Husayni navli mahalliy uzum. Shirin va xushbo'y.", rating: 4.8, inStock: false },
  { id: "pomidor", name: "Pomidor", category: "Sabzavotlar", emoji: "🍅", price: 14000, unit: "1 kg", description: "Yangi uzilgan qizil pomidor. Salat va taomlar uchun.", rating: 4.5, inStock: true },
  { id: "bodring", name: "Bodring", category: "Sabzavotlar", emoji: "🥒", price: 10000, unit: "1 kg", description: "Yangi va xushbo'y bodring. Issiqxonada yetishtirilgan.", rating: 4.4, inStock: true },
  { id: "kartoshka", name: "Kartoshka", category: "Sabzavotlar", emoji: "🥔", price: 8000, unit: "1 kg", description: "Sifatli mahalliy kartoshka. Har qanday taom uchun mos.", rating: 4.3, inStock: true },
  { id: "sut", name: "Sut", category: "Sut mahsulotlari", emoji: "🥛", price: 14000, unit: "1 L", description: "Pasterizatsiya qilingan tabiiy sigir suti, 3,2% yog'lilik.", rating: 4.6, inStock: true },
  { id: "qatiq", name: "Qatiq", category: "Sut mahsulotlari", emoji: "🍶", price: 9000, unit: "500 ml", description: "Uy sharoitida tayyorlangan tabiiy qatiq.", rating: 4.7, inStock: true },
  { id: "pishloq", name: "Pishloq (gollandcha)", category: "Sut mahsulotlari", emoji: "🧀", price: 45000, oldPrice: 52000, unit: "400 g", description: "Gollandcha pishloq — buterbrod va salatlar uchun ideal.", rating: 4.5, inStock: true },
  { id: "non", name: "Buxanka non", category: "Non mahsulotlari", emoji: "🍞", price: 6000, unit: "1 dona", description: "Yumshoq oq buxanka non. Har kuni yangi yopiladi.", rating: 4.4, inStock: true },
  { id: "patir", name: "Patir non", category: "Non mahsulotlari", emoji: "🫓", price: 8000, unit: "1 dona", description: "Tandirda yopilgan an'anaviy patir non.", rating: 4.9, inStock: true },
  { id: "kruassan", name: "Kruassan (shokoladli)", category: "Non mahsulotlari", emoji: "🥐", price: 15000, unit: "1 dona", description: "Shokolad qo'shilgan yumshoq fransuz kruassani.", rating: 4.6, inStock: true },
  { id: "colgate", name: "Colgate tish pastasi", category: "Gigiyena", emoji: "🪥", price: 24000, unit: "100 ml", description: "Colgate Total tish pastasi — 12 soatlik himoya.", rating: 4.5, inStock: true },
  { id: "fairy", name: "Fairy idish yuvish", category: "Gigiyena", emoji: "🧴", price: 19000, oldPrice: 22000, unit: "450 ml", description: "Fairy idish yuvish vositasi — limon xushbo'yligi bilan.", rating: 4.6, inStock: true },
  { id: "safeguard", name: "Safeguard sovun", category: "Gigiyena", emoji: "🧼", price: 9000, unit: "90 g", description: "Antibakterial Safeguard sovuni butun oila uchun.", rating: 4.4, inStock: true },
];

/**
 * Durable Object that persists orders, products and settings in SQLite.
 * Generates sequential, unique order numbers (GM-000001, GM-000002, ...).
 * Also handles admin password verification and shop settings.
 * Updated: retry-safe initialization.
 */
export class OrderStore extends DurableObject {
  constructor(ctx: DurableObjectState, env: unknown) {
    super(ctx, env);
    this.ctx.storage.sql.exec(`
      CREATE TABLE IF NOT EXISTS orders (
        order_number TEXT PRIMARY KEY,
        data TEXT NOT NULL,
        status TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        seq INTEGER NOT NULL
      )
    `);
    this.ctx.storage.sql.exec(`
      CREATE TABLE IF NOT EXISTS meta (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      )
    `);
    this.ctx.storage.sql.exec(`
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        data TEXT NOT NULL,
        seq INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `);
    this.seedProducts();
    this.seedSettings();
  }

  /** Seed products from defaults if products table is empty */
  private seedProducts(): void {
    const countRows = this.ctx.storage.sql
      .exec<{ c: number }>("SELECT COUNT(*) as c FROM products")
      .toArray();
    if (countRows[0].c > 0) return;
    const now = Date.now();
    SEED_PRODUCTS.forEach((p, idx) => {
      const full: AdminProduct = { ...p, createdAt: now, updatedAt: now };
      this.ctx.storage.sql.exec(
        "INSERT INTO products (id, data, seq, updated_at) VALUES (?, ?, ?, ?)",
        p.id,
        JSON.stringify(full),
        idx,
        now,
      );
    });
  }

  /** Seed settings from defaults if not present */
  private seedSettings(): void {
    const rows = this.ctx.storage.sql
      .exec<{ value: string }>("SELECT value FROM meta WHERE key = 'settings'")
      .toArray();
    if (rows.length === 0) {
      this.ctx.storage.sql.exec(
        "INSERT OR REPLACE INTO meta (key, value) VALUES ('settings', ?)",
        JSON.stringify(DEFAULT_SETTINGS),
      );
    }
  }

  override async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // ─── Orders ───────────────────────────────────────────────

    if (request.method === "POST" && url.pathname === "/order") {
      const body = (await request.json()) as Order;
      const seqRows = this.ctx.storage.sql
        .exec<{ value: string }>("SELECT value FROM meta WHERE key = 'seq'")
        .toArray();
      const seq = seqRows.length > 0 ? parseInt(seqRows[0].value, 10) + 1 : 1;
      this.ctx.storage.sql.exec(
        "INSERT OR REPLACE INTO meta (key, value) VALUES ('seq', ?)",
        String(seq),
      );
      const orderNumber = `GM-${String(seq).padStart(6, "0")}`;
      body.orderNumber = orderNumber;
      body.status = "Yangi";
      body.createdAt = Date.now();
      this.ctx.storage.sql.exec(
        "INSERT INTO orders (order_number, data, status, created_at, seq) VALUES (?, ?, ?, ?, ?)",
        orderNumber,
        JSON.stringify(body),
        body.status,
        body.createdAt,
        seq,
      );
      return Response.json({ ok: true, order: body });
    }

    if (request.method === "GET" && url.pathname.startsWith("/order/")) {
      const orderNumber = decodeURIComponent(url.pathname.slice("/order/".length));
      const rows = this.ctx.storage.sql
        .exec<{ data: string }>(
          "SELECT data FROM orders WHERE order_number = ?",
          orderNumber,
        )
        .toArray();
      if (rows.length === 0)
        return Response.json(
          { ok: false, error: "Buyurtma topilmadi" },
          { status: 404 },
        );
      return Response.json({ ok: true, order: JSON.parse(rows[0].data) as Order });
    }

    if (request.method === "PATCH" && url.pathname.startsWith("/order/")) {
      const orderNumber = decodeURIComponent(
        url.pathname.slice("/order/".length),
      );
      const { status } = (await request.json()) as { status: string };
      const rows = this.ctx.storage.sql
        .exec<{ data: string }>(
          "SELECT data FROM orders WHERE order_number = ?",
          orderNumber,
        )
        .toArray();
      if (rows.length === 0)
        return Response.json(
          { ok: false, error: "Buyurtma topilmadi" },
          { status: 404 },
        );
      const order = JSON.parse(rows[0].data) as Order;
      order.status = status;
      this.ctx.storage.sql.exec(
        "UPDATE orders SET data = ?, status = ? WHERE order_number = ?",
        JSON.stringify(order),
        status,
        orderNumber,
      );
      return Response.json({ ok: true, order });
    }

    if (request.method === "GET" && url.pathname === "/orders") {
      const rows = this.ctx.storage.sql
        .exec<{ data: string }>(
          "SELECT data FROM orders ORDER BY seq DESC LIMIT 50",
        )
        .toArray();
      return Response.json({
        ok: true,
        orders: rows.map((r) => JSON.parse(r.data) as Order),
      });
    }

    // ─── Products ─────────────────────────────────────────────

    if (request.method === "GET" && url.pathname === "/products") {
      const rows = this.ctx.storage.sql
        .exec<{ data: string }>("SELECT data FROM products ORDER BY seq ASC")
        .toArray();
      return Response.json({
        ok: true,
        products: rows.map((r) => JSON.parse(r.data) as AdminProduct),
      });
    }

    if (request.method === "POST" && url.pathname === "/products") {
      const product = (await request.json()) as AdminProduct;
      if (!product.id) {
        product.id = `prod-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      }
      product.createdAt = product.createdAt ?? Date.now();
      product.updatedAt = Date.now();
      const maxSeqRows = this.ctx.storage.sql
        .exec<{ m: number }>("SELECT MAX(seq) as m FROM products")
        .toArray();
      const nextSeq = (maxSeqRows[0]?.m ?? 0) + 1;
      this.ctx.storage.sql.exec(
        "INSERT OR REPLACE INTO products (id, data, seq, updated_at) VALUES (?, ?, ?, ?)",
        product.id,
        JSON.stringify(product),
        nextSeq,
        product.updatedAt,
      );
      return Response.json({ ok: true, product });
    }

    if (request.method === "PATCH" && url.pathname.startsWith("/products/")) {
      const id = decodeURIComponent(url.pathname.slice("/products/".length));
      const patch = (await request.json()) as Partial<AdminProduct>;
      const rows = this.ctx.storage.sql
        .exec<{ data: string }>("SELECT data FROM products WHERE id = ?", id)
        .toArray();
      if (rows.length === 0)
        return Response.json({ ok: false, error: "Mahsulot topilmadi" }, 404);
      const existing = JSON.parse(rows[0].data) as AdminProduct;
      const updated: AdminProduct = {
        ...existing,
        ...patch,
        id: existing.id,
        updatedAt: Date.now(),
      };
      this.ctx.storage.sql.exec(
        "UPDATE products SET data = ?, updated_at = ? WHERE id = ?",
        JSON.stringify(updated),
        updated.updatedAt,
        id,
      );
      return Response.json({ ok: true, product: updated });
    }

    if (request.method === "DELETE" && url.pathname.startsWith("/products/")) {
      const id = decodeURIComponent(url.pathname.slice("/products/".length));
      this.ctx.storage.sql.exec("DELETE FROM products WHERE id = ?", id);
      return Response.json({ ok: true });
    }

    // ─── Settings ─────────────────────────────────────────────

    if (request.method === "GET" && url.pathname === "/settings") {
      const rows = this.ctx.storage.sql
        .exec<{ value: string }>("SELECT value FROM meta WHERE key = 'settings'")
        .toArray();
      const settings: ShopSettings =
        rows.length > 0
          ? { ...DEFAULT_SETTINGS, ...JSON.parse(rows[0].value) }
          : DEFAULT_SETTINGS;
      // Don't expose admin password to public
      return Response.json({ ok: true, settings: { ...settings, adminPassword: "" } });
    }

    if (request.method === "PUT" && url.pathname === "/settings") {
      const incoming = (await request.json()) as Partial<ShopSettings>;
      const rows = this.ctx.storage.sql
        .exec<{ value: string }>("SELECT value FROM meta WHERE key = 'settings'")
        .toArray();
      const current: ShopSettings =
        rows.length > 0
          ? { ...DEFAULT_SETTINGS, ...JSON.parse(rows[0].value) }
          : DEFAULT_SETTINGS;
      // Only update adminPassword if a non-empty value is sent
      const next: ShopSettings = {
        ...current,
        ...incoming,
        adminPassword:
          incoming.adminPassword && incoming.adminPassword.length > 0
            ? incoming.adminPassword
            : current.adminPassword,
      };
      this.ctx.storage.sql.exec(
        "INSERT OR REPLACE INTO meta (key, value) VALUES ('settings', ?)",
        JSON.stringify(next),
      );
      return Response.json({ ok: true, settings: { ...next, adminPassword: "" } });
    }

    // ─── Admin auth: verify password ──────────────────────────

    if (request.method === "POST" && url.pathname === "/admin/verify") {
      const { password } = (await request.json()) as { password: string };
      const rows = this.ctx.storage.sql
        .exec<{ value: string }>("SELECT value FROM meta WHERE key = 'settings'")
        .toArray();
      const settings: ShopSettings =
        rows.length > 0
          ? { ...DEFAULT_SETTINGS, ...JSON.parse(rows[0].value) }
          : DEFAULT_SETTINGS;
      return Response.json({ ok: settings.adminPassword === password });
    }

    // ─── Admin chat ID ────────────────────────────────────────

    if (request.method === "POST" && url.pathname === "/chat-id") {
      const { chatId } = (await request.json()) as { chatId: string };
      this.ctx.storage.sql.exec(
        "INSERT OR REPLACE INTO meta (key, value) VALUES ('admin_chat_id', ?)",
        chatId,
      );
      return Response.json({ ok: true });
    }

    if (request.method === "GET" && url.pathname === "/chat-id") {
      const rows = this.ctx.storage.sql
        .exec<{ value: string }>(
          "SELECT value FROM meta WHERE key = 'admin_chat_id'",
        )
        .toArray();
      return Response.json({ ok: true, chatId: rows.length > 0 ? rows[0].value : null });
    }

    // ─── Categories ────────────────────────────────────────────

    if (request.method === "GET" && url.pathname === "/categories") {
      return Response.json({ ok: true, categories: CATEGORIES });
    }

    return new Response("not found", { status: 404 });
  }
}
