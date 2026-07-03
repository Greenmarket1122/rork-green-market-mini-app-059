import {
  ArrowLeft,
  Box,
  CheckCircle2,
  Clock,
  Loader2,
  MapPin,
  Package,
  Phone,
  Search,
  Truck,
  User,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { fetchOrder, type OrderResponse } from "@/lib/api";
import { formatUZS } from "@/lib/products";
import { hapticTap } from "@/lib/telegram";
import { cn } from "@/lib/utils";

const STATUS_STEPS = [
  { key: "Yangi", label: "Buyurtma qabul qilindi", icon: Clock },
  { key: "Qabul qilindi", label: "Tayyorlanmoqda", icon: Box },
  { key: "Yo'lda", label: "Yo'lda", icon: Truck },
  { key: "Yetkazildi", label: "Yetkazildi", icon: CheckCircle2 },
];

export default function OrderTracking() {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<OrderResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState<string>(orderNumber ?? "");

  const loadOrder = async (num: string) => {
    setLoading(true);
    setError(null);
    const result = await fetchOrder(num);
    if (result.ok && result.order) {
      setOrder(result.order);
    } else {
      setOrder(null);
      setError(result.error ?? "Buyurtma topilmadi");
    }
    setLoading(false);
  };

  useEffect(() => {
    if (orderNumber) {
      loadOrder(orderNumber);
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderNumber]);

  const handleSearch = () => {
    const trimmed = searchInput.trim().toUpperCase();
    if (!trimmed) return;
    hapticTap();
    navigate(`/track/${trimmed}`);
  };

  const currentStepIndex = order
    ? STATUS_STEPS.findIndex((s) => s.key === order.status)
    : -1;

  const mapUrl =
    order?.address.lat !== undefined && order?.address.lng !== undefined
      ? `https://yandex.uz/maps/?ll=${order.address.lng}%2C${order.address.lat}&z=17&pt=${order.address.lng},${order.address.lat},pm2rdm`
      : undefined;

  return (
    <div className="mx-auto max-w-md px-4 pb-32 pt-6">
      <button
        type="button"
        onClick={() => {
          hapticTap();
          navigate(-1);
        }}
        className="flex items-center gap-1.5 text-sm font-bold text-muted-foreground transition-transform active:scale-95"
      >
        <ArrowLeft className="h-4 w-4" />
        Orqaga
      </button>

      <h1 className="mt-3 text-3xl font-extrabold tracking-tight">
        Buyurtmani kuzatish
      </h1>

      {/* Search bar */}
      <div className="mt-4 flex items-center gap-2 rounded-full border border-border bg-card px-4 py-3 shadow-sm">
        <Search className="h-5 w-5 shrink-0 text-muted-foreground" />
        <input
          className="w-full bg-transparent text-sm font-medium outline-none placeholder:text-muted-foreground/70"
          placeholder="Buyurtma raqami (GM-000001)"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        />
        <button
          type="button"
          onClick={handleSearch}
          className="rounded-full bg-primary px-4 py-1.5 text-xs font-bold text-primary-foreground transition-transform active:scale-95"
        >
          Tekshirish
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="mt-12 flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm font-semibold">Yuklanmoqda...</p>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="mt-8 rounded-3xl border border-border bg-card p-8 text-center shadow-sm">
          <Package className="mx-auto h-12 w-12 text-muted-foreground/40" />
          <p className="mt-4 text-sm font-bold">{error}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Buyurtma raqamini tekshirib qaytadan urinib ko'ring.
          </p>
        </div>
      )}

      {/* Order found */}
      {!loading && order && (
        <div className="mt-5 space-y-4">
          {/* Order number + status */}
          <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Buyurtma raqami
                </p>
                <p className="text-2xl font-extrabold text-primary">
                  {order.orderNumber}
                </p>
              </div>
              <span
                className={cn(
                  "rounded-full px-4 py-1.5 text-sm font-bold",
                  order.status === "Yetkazildi"
                    ? "bg-green-100 text-green-700"
                    : order.status === "Yo'lda"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-secondary text-primary",
                )}
              >
                {order.status}
              </span>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              {new Date(order.createdAt).toLocaleString("ru-RU", {
                timeZone: "Asia/Tashkent",
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </p>
          </div>

          {/* Status tracker */}
          <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
            <h2 className="text-lg font-extrabold">Holat</h2>
            <div className="mt-4 space-y-1">
              {STATUS_STEPS.map((step, idx) => {
                const Icon = step.icon;
                const isDone = idx <= currentStepIndex;
                const isCurrent = idx === currentStepIndex;
                const isLast = idx === STATUS_STEPS.length - 1;
                return (
                  <div key={step.key} className="flex items-start gap-3">
                    <div className="flex flex-col items-center">
                      <div
                        className={cn(
                          "flex h-9 w-9 items-center justify-center rounded-full transition-colors",
                          isDone
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground",
                          isCurrent && "ring-4 ring-primary/20",
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      {!isLast && (
                        <div
                          className={cn(
                            "h-8 w-0.5",
                            idx < currentStepIndex
                              ? "bg-primary"
                              : "bg-border",
                          )}
                        />
                      )}
                    </div>
                    <div className="pt-1.5">
                      <p
                        className={cn(
                          "text-sm font-bold",
                          isDone ? "text-foreground" : "text-muted-foreground",
                        )}
                      >
                        {step.label}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Items */}
          <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
            <h2 className="text-lg font-extrabold">Mahsulotlar</h2>
            <div className="mt-3 space-y-2.5">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 text-sm">
                  <span className="text-2xl" role="img" aria-label={item.name}>
                    {item.emoji}
                  </span>
                  <span className="min-w-0 flex-1 truncate font-semibold">
                    {item.name}
                  </span>
                  <span className="text-muted-foreground">×{item.qty}</span>
                  <span className="font-bold">
                    {formatUZS(item.price * item.qty)}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-3 flex justify-between border-t border-border pt-3 text-base font-extrabold">
              <span>Jami</span>
              <span className="text-primary">{formatUZS(order.total)}</span>
            </div>
          </div>

          {/* Delivery info */}
          <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
            <h2 className="text-lg font-extrabold">Yetkazib berish</h2>
            <div className="mt-3 space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <User className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span className="font-semibold">{order.address.fullName}</span>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span className="font-semibold">{order.address.phone}</span>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span className="text-muted-foreground">
                  {order.address.street}, {order.address.city}
                </span>
              </div>
              {mapUrl && (
                <a
                  href={mapUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 rounded-2xl bg-secondary px-4 py-2.5 text-xs font-bold text-primary transition-transform active:scale-95"
                >
                  <MapPin className="h-4 w-4" />
                  Yandex xaritada ko'rish
                </a>
              )}
            </div>
          </div>

          <Link
            to="/"
            onClick={() => hapticTap()}
            className="block w-full rounded-full bg-primary py-4 text-center text-base font-extrabold text-primary-foreground shadow-lg transition-transform active:scale-[0.98]"
          >
            Bosh sahifaga qaytish
          </Link>
        </div>
      )}

      {/* Empty — no order number searched yet */}
      {!loading && !error && !order && (
        <div className="mt-8 rounded-3xl border border-border bg-card p-8 text-center shadow-sm">
          <Search className="mx-auto h-12 w-12 text-muted-foreground/40" />
          <p className="mt-4 text-sm font-bold">
            Buyurtma raqamini kiriting
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Buyurtma berganingizda sizga unikal raqam beriladi.
          </p>
        </div>
      )}
    </div>
  );
}
