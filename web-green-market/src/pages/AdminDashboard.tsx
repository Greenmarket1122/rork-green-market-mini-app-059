import {
  ArrowLeft,
  Check,
  ChevronRight,
  Eye,
  EyeOff,
  LocateFixed,
  Loader2,
  LogOut,
  MapPin,
  Package,
  Pencil,
  Phone,
  Plus,
  Save,
  Search,
  Settings as SettingsIcon,
  ShoppingCart,
  Store,
  Trash2,
  Truck,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  buildYandexGoLink,
  createProduct,
  deleteProduct,
  fetchCategories,
  fetchOrders,
  fetchProducts,
  fetchSettings,
  saveSettings,
  updateOrderStatus,
  updateProduct,
} from "@/lib/admin-api";
import type { OrderData, Product, ShopSettings } from "@/lib/types";
import { hapticSuccess, hapticTap } from "@/lib/telegram";
import { cn } from "@/lib/utils";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";

type Tab = "products" | "orders" | "settings";

const ORDER_STATUSES = ["Yangi", "Qabul qilindi", "Yo'lda", "Yetkazildi"] as const;

/* ─── Product Editor Dialog ─────────────────────────────── */

interface ProductEditorProps {
  product: Product | null;
  categories: string[];
  open: boolean;
  onClose: () => void;
  onSave: (product: Product) => Promise<void>;
}

function ProductEditor({ product, categories, open, onClose, onSave }: ProductEditorProps) {
  const isEditing = product !== null;
  const [form, setForm] = useState<Product>(
    product ?? {
      id: "",
      name: "",
      category: categories[0] ?? "Ichimliklar",
      emoji: "📦",
      price: 0,
      oldPrice: undefined,
      unit: "1 dona",
      description: "",
      rating: 4.5,
      inStock: true,
      hidden: false,
    },
  );
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (product) {
      setForm(product);
    } else {
      setForm({
        id: "",
        name: "",
        category: categories[0] ?? "Ichimliklar",
        emoji: "📦",
        price: 0,
        oldPrice: undefined,
        unit: "1 dona",
        description: "",
        rating: 4.5,
        inStock: true,
        hidden: false,
      });
    }
    setError(null);
  }, [product, categories, open]);

  const handleSave = async () => {
    setError(null);
    if (!form.name.trim()) {
      setError("Mahsulot nomini kiriting.");
      return;
    }
    if (form.price <= 0) {
      setError("Narx 0 dan katta bo'lishi kerak.");
      return;
    }
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  const inputCls =
    "w-full rounded-2xl border border-input bg-card px-4 py-3 text-sm font-medium outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20";
  const labelCls = "mb-1.5 block text-sm font-bold";

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[85vh] max-w-md overflow-y-auto rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-extrabold">
            {isEditing ? "Mahsulotni tahrirlash" : "Yangi mahsulot"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3.5">
          <div>
            <label className={labelCls}>Nomi</label>
            <input
              className={inputCls}
              placeholder="Mahsulot nomi"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Emoji</label>
              <input
                className={cn(inputCls, "text-center text-2xl")}
                placeholder="🥤"
                value={form.emoji}
                onChange={(e) => setForm({ ...form, emoji: e.target.value })}
              />
            </div>
            <div>
              <label className={labelCls}>Birlik</label>
              <input
                className={inputCls}
                placeholder="1 kg, 500 ml"
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className={labelCls}>Kategoriya</label>
            <select
              className={inputCls}
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Narx (so'm)</label>
              <input
                type="number"
                className={inputCls}
                placeholder="15000"
                value={form.price || ""}
                onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className={labelCls}>Eski narx (ixtiyoriy)</label>
              <input
                type="number"
                className={inputCls}
                placeholder="18000"
                value={form.oldPrice || ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    oldPrice: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
              />
            </div>
          </div>

          <div>
            <label className={labelCls}>Tavsif</label>
            <textarea
              className={cn(inputCls, "min-h-[80px] resize-none")}
              placeholder="Mahsulot tavsifi"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-3">
            <span className="text-sm font-bold">Omborda bor</span>
            <Switch
              checked={form.inStock}
              onCheckedChange={(v) => setForm({ ...form, inStock: v })}
            />
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-3">
            <div>
              <span className="text-sm font-bold">Yashirin</span>
              <p className="text-xs text-muted-foreground">Mijozlarga ko'rinmaydi</p>
            </div>
            <Switch
              checked={form.hidden ?? false}
              onCheckedChange={(v) => setForm({ ...form, hidden: v })}
            />
          </div>

          {error && (
            <p className="rounded-xl bg-destructive/10 px-4 py-2.5 text-sm font-medium text-destructive">
              {error}
            </p>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-full border border-border bg-card py-3 text-sm font-bold transition-transform active:scale-95"
            >
              Bekor qilish
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex flex-1 items-center justify-center gap-2 rounded-full bg-primary py-3 text-sm font-bold text-primary-foreground shadow-md transition-transform active:scale-95 disabled:opacity-60"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Saqlash
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ─── Products Tab ──────────────────────────────────────── */

function ProductsTab() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>("");
  const [filterCat, setFilterCat] = useState<string>("Hammasi");
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    const [prodRes, catRes] = await Promise.all([fetchProducts(), fetchCategories()]);
    if (prodRes.ok && prodRes.products) setProducts(prodRes.products);
    if (catRes.ok && catRes.categories) setCategories(catRes.categories);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      const matchesCat = filterCat === "Hammasi" || p.category === filterCat;
      const matchesQuery =
        q.length === 0 ||
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q);
      return matchesCat && matchesQuery;
    });
  }, [products, search, filterCat]);

  const handleSave = async (product: Product) => {
    setSaving(true);
    hapticTap();
    if (editingProduct) {
      const res = await updateProduct(product.id, product);
      if (res.ok) {
        hapticSuccess();
        setDialogOpen(false);
        setEditingProduct(null);
        loadProducts();
      }
    } else {
      const res = await createProduct(product);
      if (res.ok) {
        hapticSuccess();
        setDialogOpen(false);
        loadProducts();
      }
    }
    setSaving(false);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`"${name}" mahsulotini o'chirishni tasdiqlaysizmi?`)) return;
    hapticTap();
    const res = await deleteProduct(id);
    if (res.ok) {
      hapticSuccess();
      loadProducts();
    }
  };

  const allCats = ["Hammasi", ...categories];

  return (
    <div className="space-y-4">
      {/* Search + add */}
      <div className="flex items-center gap-2">
        <div className="flex flex-1 items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 shadow-sm">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            className="w-full bg-transparent text-sm font-medium outline-none placeholder:text-muted-foreground/70"
            placeholder="Mahsulot qidirish..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button
          type="button"
          onClick={() => {
            hapticTap();
            setEditingProduct(null);
            setDialogOpen(true);
          }}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md transition-transform active:scale-90"
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>

      {/* Category filter */}
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
        {allCats.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => {
              hapticTap();
              setFilterCat(cat);
            }}
            className={cn(
              "shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold transition-all active:scale-95",
              filterCat === cat
                ? "bg-primary text-primary-foreground shadow-sm"
                : "border border-border bg-card text-foreground",
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Product list */}
      {loading ? (
        <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm font-semibold">Yuklanmoqda...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-3xl border border-border bg-card p-8 text-center">
          <Package className="mx-auto h-10 w-10 text-muted-foreground/40" />
          <p className="mt-3 text-sm font-bold">Mahsulotlar topilmadi</p>
          <p className="mt-1 text-xs text-muted-foreground">Yangi mahsulot qo'shing</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((product) => (
            <div
              key={product.id}
              className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 shadow-sm"
            >
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-secondary/60 text-3xl">
                <span role="img" aria-label={product.name}>
                  {product.emoji}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-bold">{product.name}</p>
                  {product.hidden && (
                    <EyeOff className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {product.category} · {product.unit}
                </p>
                <div className="mt-0.5 flex items-center gap-2">
                  <span className="text-sm font-extrabold text-primary">
                    {Math.round(product.price).toLocaleString("ru-RU")} so'm
                  </span>
                  {product.oldPrice && (
                    <span className="text-xs text-muted-foreground line-through">
                      {Math.round(product.oldPrice).toLocaleString("ru-RU")}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    hapticTap();
                    setEditingProduct(product);
                    setDialogOpen(true);
                  }}
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary text-primary transition-transform active:scale-90"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(product.id, product.name)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-destructive/10 text-destructive transition-transform active:scale-90"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ProductEditor
        product={editingProduct}
        categories={categories}
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setEditingProduct(null);
        }}
        onSave={handleSave}
      />
    </div>
  );
}

/* ─── Orders Tab ────────────────────────────────────────── */

function OrdersTab() {
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [shopSettings, setShopSettings] = useState<ShopSettings | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterStatus, setFilterStatus] = useState<string>("Hammasi");

  const loadOrders = useCallback(async () => {
    setLoading(true);
    const [ordRes, setRes] = await Promise.all([fetchOrders(), fetchSettings()]);
    if (ordRes.ok && ordRes.orders) setOrders(ordRes.orders);
    if (setRes.ok && setRes.settings) setShopSettings(setRes.settings);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleStatusChange = async (orderNumber: string, status: string) => {
    hapticTap();
    const res = await updateOrderStatus(orderNumber, status);
    if (res.ok) {
      hapticSuccess();
      loadOrders();
    }
  };

  const filtered = useMemo(() => {
    if (filterStatus === "Hammasi") return orders;
    return orders.filter((o) => o.status === filterStatus);
  }, [orders, filterStatus]);

  const statusColors: Record<string, string> = {
    Yangi: "bg-blue-100 text-blue-700",
    "Qabul qilindi": "bg-amber-100 text-amber-700",
    "Yo'lda": "bg-purple-100 text-purple-700",
    Yetkazildi: "bg-green-100 text-green-700",
  };

  const statusFilters = ["Hammasi", ...ORDER_STATUSES];

  return (
    <div className="space-y-4">
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
        {statusFilters.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => {
              hapticTap();
              setFilterStatus(s);
            }}
            className={cn(
              "shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold transition-all active:scale-95",
              filterStatus === s
                ? "bg-primary text-primary-foreground shadow-sm"
                : "border border-border bg-card text-foreground",
            )}
          >
            {s}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm font-semibold">Yuklanmoqda...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-3xl border border-border bg-card p-8 text-center">
          <ShoppingCart className="mx-auto h-10 w-10 text-muted-foreground/40" />
          <p className="mt-3 text-sm font-bold">Buyurtmalar yo'q</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Yangi buyurtmalar shu yerda ko'rinadi
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((order) => (
            <div
              key={order.orderNumber}
              className="rounded-2xl border border-border bg-card p-4 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    {order.orderNumber}
                  </p>
                  <p className="mt-0.5 text-sm font-bold">{order.address.fullName}</p>
                </div>
                <span
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-bold",
                    statusColors[order.status] ?? "bg-secondary text-primary",
                  )}
                >
                  {order.status}
                </span>
              </div>

              <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                <Phone className="h-3.5 w-3.5" />
                <span>{order.address.phone}</span>
              </div>

              <div className="mt-2 text-sm">
                {order.items.map((item, idx) => (
                  <span key={idx} className="text-muted-foreground">
                    {item.emoji} {item.name} ×{item.qty}
                    {idx < order.items.length - 1 ? ", " : ""}
                  </span>
                ))}
              </div>

              <div className="mt-2 flex items-center justify-between border-t border-border pt-2">
                <span className="text-base font-extrabold text-primary">
                  {Math.round(order.total).toLocaleString("ru-RU")} so'm
                </span>
                <span className="text-xs text-muted-foreground">
                  {new Date(order.createdAt).toLocaleString("ru-RU", {
                    timeZone: "Asia/Tashkent",
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                </span>
              </div>

              {/* Status changer */}
              <div className="mt-3 flex gap-1.5 overflow-x-auto no-scrollbar">
                {ORDER_STATUSES.map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => handleStatusChange(order.orderNumber, status)}
                    className={cn(
                      "shrink-0 rounded-full px-3 py-1.5 text-xs font-bold transition-all active:scale-95",
                      order.status === status
                        ? "bg-primary text-primary-foreground"
                        : "border border-border bg-card text-foreground",
                    )}
                  >
                    {order.status === status && <Check className="mr-1 inline h-3 w-3" />}
                    {status}
                  </button>
                ))}
              </div>

              {/* Yandex Go + map buttons */}
              {order.address.lat !== undefined &&
                order.address.lng !== undefined && (
                  <div className="mt-2.5 flex gap-2">
                    {shopSettings?.shopLat !== undefined &&
                      shopSettings?.shopLng !== undefined && (
                        <a
                          href={buildYandexGoLink(
                            shopSettings.shopLat,
                            shopSettings.shopLng,
                            order.address.lat!,
                            order.address.lng!,
                          )}
                          target="_blank"
                          rel="noreferrer"
                          onClick={() => hapticTap()}
                          className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-[#FFCC00] px-3 py-2.5 text-xs font-extrabold text-black transition-transform active:scale-95"
                        >
                          <Truck className="h-3.5 w-3.5" />
                          Yandex Go
                        </a>
                      )}
                    <a
                      href={`https://yandex.uz/maps/?ll=${order.address.lng}%2C${order.address.lat}&z=17&pt=${order.address.lng},${order.address.lat},pm2rdm`}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => hapticTap()}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-border bg-secondary px-3 py-2.5 text-xs font-bold text-primary transition-transform active:scale-95"
                    >
                      <MapPin className="h-3.5 w-3.5" />
                      Xarita
                    </a>
                    <a
                      href={`tel:${order.address.phone}`}
                      onClick={() => hapticTap()}
                      className="flex items-center justify-center rounded-full border border-border bg-card px-3 py-2.5 text-xs font-bold text-primary transition-transform active:scale-95"
                    >
                      <Phone className="h-3.5 w-3.5" />
                    </a>
                  </div>
                )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Settings Tab ──────────────────────────────────────── */

function SettingsTab() {
  const [settings, setSettings] = useState<ShopSettings | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [saved, setSaved] = useState<boolean>(false);
  const [newPassword, setNewPassword] = useState<string>("");

  const loadSettings = useCallback(async () => {
    setLoading(true);
    const res = await fetchSettings();
    if (res.ok && res.settings) setSettings(res.settings);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    hapticTap();
    const payload: Partial<ShopSettings> = { ...settings };
    if (newPassword.trim()) {
      payload.adminPassword = newPassword.trim();
    }
    const res = await saveSettings(payload);
    setSaving(false);
    if (res.ok) {
      hapticSuccess();
      setSaved(true);
      setNewPassword("");
      window.setTimeout(() => setSaved(false), 2000);
      if (res.settings) setSettings(res.settings);
    }
  };

  if (loading || !settings) {
    return (
      <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm font-semibold">Yuklanmoqda...</p>
      </div>
    );
  }

  const inputCls =
    "w-full rounded-2xl border border-input bg-card px-4 py-3 text-sm font-medium outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20";
  const labelCls = "mb-1.5 block text-sm font-bold";

  return (
    <div className="space-y-4">
      {/* Shop info */}
      <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <Store className="h-5 w-5 text-primary" />
          <h3 className="text-base font-extrabold">Do'kon ma'lumotlari</h3>
        </div>
        <div className="space-y-3">
          <div>
            <label className={labelCls}>Do'kon nomi</label>
            <input
              className={inputCls}
              value={settings.shopName}
              onChange={(e) => setSettings({ ...settings, shopName: e.target.value })}
            />
          </div>
          <div>
            <label className={labelCls}>Aloqa telefoni</label>
            <input
              className={inputCls}
              value={settings.contactPhone}
              onChange={(e) => setSettings({ ...settings, contactPhone: e.target.value })}
            />
          </div>
          <div>
            <label className={labelCls}>Support havolasi</label>
            <input
              className={inputCls}
              value={settings.supportLink}
              onChange={(e) => setSettings({ ...settings, supportLink: e.target.value })}
            />
          </div>
          <div>
            <label className={labelCls}>Ish vaqti</label>
            <input
              className={inputCls}
              value={settings.workingHours}
              onChange={(e) => setSettings({ ...settings, workingHours: e.target.value })}
            />
          </div>
        </div>
      </div>

      {/* Delivery */}
      <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <Truck className="h-5 w-5 text-primary" />
          <h3 className="text-base font-extrabold">Yetkazib berish</h3>
        </div>
        <div className="space-y-3">
          <div>
            <label className={labelCls}>Yetkazib berish narxi (so'm)</label>
            <input
              type="number"
              className={inputCls}
              value={settings.deliveryFee || ""}
              onChange={(e) =>
                setSettings({ ...settings, deliveryFee: Number(e.target.value) })
              }
            />
          </div>
          <div>
            <label className={labelCls}>Bepul yetkazib berish chegarasi (so'm)</label>
            <input
              type="number"
              className={inputCls}
              value={settings.freeDeliveryThreshold || ""}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  freeDeliveryThreshold: Number(e.target.value),
                })
              }
            />
          </div>
          <div className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3">
            <span className="text-sm font-bold">Do'kon ochiq</span>
            <Switch
              checked={settings.isOpen}
              onCheckedChange={(v) => setSettings({ ...settings, isOpen: v })}
            />
          </div>
        </div>
      </div>

      {/* Yandex Go — shop location */}
      <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="mb-1 flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          <h3 className="text-base font-extrabold">Do'kon lokatsiyasi</h3>
        </div>
        <p className="mb-3 text-xs text-muted-foreground">
          Yandex Go kuryer yo'nalishi uchun boshlang'ich nuqta. "Mening lokatsiyam" tugmasi bilan joriy pozitsiyangizni olishingiz yoki qo'lda kiriting.
        </p>
        <div className="space-y-3">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                hapticTap();
                if (!navigator.geolocation) return;
                navigator.geolocation.getCurrentPosition(
                  (pos) =>
                    setSettings({
                      ...settings,
                      shopLat: Number(pos.coords.latitude.toFixed(5)),
                      shopLng: Number(pos.coords.longitude.toFixed(5)),
                    }),
                  () => {},
                  { enableHighAccuracy: true, timeout: 10000 },
                );
              }}
              className="flex items-center gap-1.5 rounded-full border border-border bg-secondary px-4 py-2 text-xs font-bold text-primary transition-transform active:scale-95"
            >
              <LocateFixed className="h-3.5 w-3.5" />
              Mening lokatsiyam
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Kenglik (lat)</label>
              <input
                type="number"
                step="0.00001"
                className={inputCls}
                placeholder="41.31108"
                value={settings.shopLat ?? ""}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    shopLat: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
              />
            </div>
            <div>
              <label className={labelCls}>Uzunlik (lng)</label>
              <input
                type="number"
                step="0.00001"
                className={inputCls}
                placeholder="69.24062"
                value={settings.shopLng ?? ""}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    shopLng: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
              />
            </div>
          </div>
          {settings.shopLat !== undefined &&
            settings.shopLng !== undefined && (
              <a
                href={`https://yandex.uz/map-widget/v1/?ll=${settings.shopLng}%2C${settings.shopLat}&z=17&pt=${settings.shopLng}%2C${settings.shopLat}%2Cpm2gnm`}
                target="_blank"
                rel="noreferrer"
                className="block rounded-2xl overflow-hidden border border-border"
              >
                <iframe
                  title="Do'kon lokatsiyasi"
                  src={`https://yandex.uz/map-widget/v1/?ll=${settings.shopLng}%2C${settings.shopLat}&z=17&pt=${settings.shopLng}%2C${settings.shopLat}%2Cpm2gnm`}
                  className="h-40 w-full"
                  loading="lazy"
                  style={{ border: 0 }}
                />
              </a>
            )}
        </div>
      </div>

      {/* Banner */}
      <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <Eye className="h-5 w-5 text-primary" />
          <h3 className="text-base font-extrabold">Bosh sahifa banneri</h3>
        </div>
        <div className="space-y-3">
          <div>
            <label className={labelCls}>Banner matni</label>
            <input
              className={inputCls}
              value={settings.bannerText}
              onChange={(e) => setSettings({ ...settings, bannerText: e.target.value })}
            />
          </div>
          <div className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3">
            <span className="text-sm font-bold">Bannerni ko'rsatish</span>
            <Switch
              checked={settings.bannerEnabled}
              onCheckedChange={(v) => setSettings({ ...settings, bannerEnabled: v })}
            />
          </div>
        </div>
      </div>

      {/* Security */}
      <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <SettingsIcon className="h-5 w-5 text-primary" />
          <h3 className="text-base font-extrabold">Xavfsizlik</h3>
        </div>
        <div>
          <label className={labelCls}>Yangi parol (bo'sh = o'zgartirilmasin)</label>
          <input
            type="password"
            className={inputCls}
            placeholder="••••"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="off"
          />
        </div>
      </div>

      {/* Save button */}
      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-4 text-base font-extrabold text-primary-foreground shadow-lg transition-transform active:scale-[0.98] disabled:opacity-60"
      >
        {saving ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : saved ? (
          <Check className="h-5 w-5" />
        ) : (
          <Save className="h-5 w-5" />
        )}
        {saved ? "Saqlandi ✓" : saving ? "Saqlanmoqda..." : "Sozlamalarni saqlash"}
      </button>
    </div>
  );
}

/* ─── Main Dashboard ────────────────────────────────────── */

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("products");

  const tabs: { id: Tab; label: string; icon: typeof Package }[] = [
    { id: "products", label: "Mahsulotlar", icon: Package },
    { id: "orders", label: "Buyurtmalar", icon: ShoppingCart },
    { id: "settings", label: "Sozlamalar", icon: SettingsIcon },
  ];

  const handleLogout = () => {
    hapticTap();
    sessionStorage.removeItem("gm_admin_auth");
    navigate("/admin", { replace: true });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-md items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                hapticTap();
                navigate("/");
              }}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border transition-transform active:scale-90"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-primary">
                Green Market
              </p>
              <h1 className="text-lg font-extrabold leading-tight">Admin panel</h1>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-destructive/10 text-destructive transition-transform active:scale-90"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>

        {/* Tab bar */}
        <div className="mx-auto flex max-w-md gap-1 px-4 pb-2">
          {tabs.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  hapticTap();
                  setTab(t.id);
                }}
                className={cn(
                  "flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-bold transition-all",
                  active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {t.label}
              </button>
            );
          })}
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-md px-4 pb-12 pt-4">
        {tab === "products" && <ProductsTab />}
        {tab === "orders" && <OrdersTab />}
        {tab === "settings" && <SettingsTab />}
      </main>
    </div>
  );
}
