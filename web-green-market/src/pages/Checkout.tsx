import {
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronDown,
  CreditCard,
  Loader2,
  MapPin,
  Truck,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";

import AddressForm from "@/components/AddressForm";
import { submitOrder, type OrderResponse } from "@/lib/api";
import { useStore } from "@/context/StoreContext";
import { formatUZS } from "@/lib/products";
import { getTelegramUser, hapticSuccess, hapticTap } from "@/lib/telegram";
import { cn } from "@/lib/utils";
import type { CourierType, PaymentMethod } from "@/lib/types";

interface PaymentOption {
  id: PaymentMethod;
  title: string;
  subtitle: string;
  icon: typeof CreditCard;
  recommended: boolean;
}

const paymentOptions: PaymentOption[] = [
  {
    id: "payme",
    title: "Payme orqali",
    subtitle: "Uzcard, Humo, Visa, Mastercard",
    icon: CreditCard,
    recommended: true,
  },
  {
    id: "click",
    title: "Click orqali",
    subtitle: "Click ilovasi yoki karta orqali",
    icon: CreditCard,
    recommended: false,
  },
  {
    id: "cash",
    title: "Buyurtmani olganda",
    subtitle: "Kuryerga naqd yoki karta orqali",
    icon: Truck,
    recommended: false,
  },
];

const couriers: { id: CourierType; label: string }[] = [
  { id: "yandex", label: "Yandex kuryer" },
  { id: "milenium", label: "Milenium" },
];

export default function Checkout() {
  const { cartLines, cartCount, cartTotal, address, clearCart, settings } = useStore();
  const navigate = useNavigate();
  const [editingAddress, setEditingAddress] = useState<boolean>(!address);
  const [payment, setPayment] = useState<PaymentMethod | null>("payme");
  const [courier, setCourier] = useState<CourierType>("yandex");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [completedOrder, setCompletedOrder] = useState<OrderResponse | null>(null);

  const deliveryFee = useMemo(() => {
    if (!settings) return 0;
    if (settings.deliveryFee === 0) return 0;
    if (cartTotal >= settings.freeDeliveryThreshold) return 0;
    return settings.deliveryFee;
  }, [settings, cartTotal]);

  const orderTotal = useMemo(() => cartTotal, [cartTotal]);
  const tgUser = getTelegramUser();

  if (cartLines.length === 0 && !completedOrder) {
    return <Navigate to="/cart" replace />;
  }

  if (completedOrder) {
    const mapUrl =
      completedOrder.address.lat !== undefined &&
      completedOrder.address.lng !== undefined
        ? `https://yandex.uz/maps/?ll=${completedOrder.address.lng}%2C${completedOrder.address.lat}&z=17&pt=${completedOrder.address.lng},${completedOrder.address.lat},pm2rdm`
        : undefined;
    return (
      <div className="mx-auto flex max-w-md flex-col items-center px-4 pb-32 pt-20 text-center">
        <div className="relative">
          <CheckCircle2
            className="animate-gm-pop h-24 w-24 text-green-600"
            strokeWidth={1.5}
          />
        </div>
        <h1 className="mt-6 text-3xl font-extrabold">Buyurtma qabul qilindi!</h1>
        <div className="mt-3 rounded-full border-2 border-primary/20 bg-secondary px-5 py-1.5">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Buyurtma raqami
          </span>
          <p className="text-xl font-extrabold text-primary">
            {completedOrder.orderNumber}
          </p>
        </div>
        <div className="mt-6 w-full rounded-3xl border border-border bg-card p-5 text-left shadow-sm">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Holat</span>
            <span className="font-bold text-green-600">
              {completedOrder.status}
            </span>
          </div>
          <div className="mt-2 flex justify-between text-sm">
            <span className="text-muted-foreground">Jami summa</span>
            <span className="font-extrabold text-primary">
              {formatUZS(completedOrder.total)}
            </span>
          </div>
          {address && (
            <div className="mt-3 border-t border-border pt-3 text-sm">
              <p className="font-bold">{address.fullName}</p>
              <p className="text-muted-foreground">
                {address.street}, {address.city}
              </p>
              {mapUrl && (
                <a
                  href={mapUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-xs font-bold text-primary"
                >
                  <MapPin className="h-3.5 w-3.5" />
                  Yandex xaritada ko'rish
                </a>
              )}
            </div>
          )}
          <p className="mt-3 border-t border-border pt-3 text-sm text-muted-foreground">
            Buyurtmangiz botga yuborildi. Kuryer tez orada siz bilan
            bog'lanadi. 🚚
          </p>
        </div>
        <div className="mt-5 flex w-full gap-3">
          <Link
            to={`/track/${completedOrder.orderNumber}`}
            onClick={() => hapticTap()}
            className="flex-1 rounded-full border-2 border-primary bg-card px-6 py-3.5 text-sm font-bold text-primary transition-transform active:scale-95"
          >
            Buyurtmani kuzatish
          </Link>
          <Link
            to="/"
            onClick={() => hapticTap()}
            className="flex-1 rounded-full bg-primary px-6 py-3.5 text-sm font-bold text-primary-foreground shadow-md transition-transform active:scale-95"
          >
            Bosh sahifa
          </Link>
        </div>
      </div>
    );
  }

  const confirmOrder = async () => {
    setError(null);
    if (!address) {
      setError("Iltimos, avval yetkazib berish manzilini saqlang.");
      setEditingAddress(true);
      return;
    }
    if (!payment) {
      setError("Iltimos, to'lov turini tanlang.");
      return;
    }
    setSubmitting(true);
    try {
      const result = await submitOrder({
        items: cartLines.map(({ product, qty }) => ({
          name: product.name,
          emoji: product.emoji,
          price: product.price,
          qty,
        })),
        total: orderTotal + deliveryFee,
        address,
        payment,
        courier,
        customerName: tgUser
          ? `${tgUser.first_name}${tgUser.last_name ? ` ${tgUser.last_name}` : ""}`
          : address.fullName,
        customerUsername: tgUser?.username,
        telegramUserId: tgUser?.id,
      });
      if (result.ok && result.order) {
        hapticSuccess();
        clearCart();
        setCompletedOrder(result.order);
        window.scrollTo({ top: 0 });
      } else {
        hapticTap();
        setError(result.error ?? "Buyurtma yuborishda xatolik yuz berdi.");
      }
    } catch {
      hapticTap();
      setError("Tarmoq xatoligi. Qaytadan urinib ko'ring.");
    } finally {
      setSubmitting(false);
    }
  };

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
        Savatga qaytish
      </button>

      <h1 className="mt-3 text-3xl font-extrabold tracking-tight">
        Buyurtmani rasmiylashtirish
      </h1>

      {/* Delivery address */}
      <section className="mt-5 rounded-3xl border border-border bg-card p-5 shadow-sm">
        <h2 className="text-xl font-extrabold">Yetkazib berish manzili</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Faqat oxirgi saqlangan manzil ishlatiladi.
        </p>

        {address && !editingAddress ? (
          <div className="mt-4 rounded-2xl bg-muted/60 p-4">
            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <div className="min-w-0 flex-1 text-sm">
                <p className="font-bold">{address.fullName}</p>
                <p className="text-muted-foreground">{address.phone}</p>
                <p className="mt-1">
                  {address.street}, {address.city}
                </p>
                {address.lat !== undefined && address.lng !== undefined && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    📍 {address.lat}, {address.lng}
                  </p>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                hapticTap();
                setEditingAddress(true);
              }}
              className="mt-3 rounded-full border border-border bg-card px-4 py-2 text-sm font-bold text-primary transition-transform active:scale-95"
            >
              O'zgartirish
            </button>
          </div>
        ) : (
          <div className="mt-4">
            <AddressForm onSaved={() => setEditingAddress(false)} />
          </div>
        )}
      </section>

      {/* Order summary */}
      <section className="mt-4 rounded-3xl border border-border bg-card p-5 shadow-sm">
        <h2 className="text-xl font-extrabold">Sizning buyurtmangiz</h2>
        <div className="mt-3 space-y-2.5">
          {cartLines.map(({ product, qty }) => (
            <div key={product.id} className="flex items-center gap-3 text-sm">
              <span className="text-2xl" role="img" aria-label={product.name}>
                {product.emoji}
              </span>
              <span className="min-w-0 flex-1 truncate font-semibold">
                {product.name}
              </span>
              <span className="text-muted-foreground">×{qty}</span>
              <span className="font-bold">{formatUZS(product.price * qty)}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 space-y-1.5 border-t border-border pt-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Mahsulotlar ({cartCount} ta)</span>
            <span className="font-semibold">{formatUZS(cartTotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Yetkazib berish</span>
            <span className={cn("font-semibold", deliveryFee === 0 ? "text-green-700" : "")}>
              {deliveryFee === 0 ? "Bepul" : formatUZS(deliveryFee)}
            </span>
          </div>
          <div className="flex justify-between pt-1 text-base font-extrabold">
            <span>Jami</span>
            <span className="text-primary">{formatUZS(orderTotal + deliveryFee)}</span>
          </div>
        </div>
      </section>

      {/* Payment */}
      <section className="mt-4">
        <h2 className="text-2xl font-extrabold">To'lov turi</h2>
        <div className="mt-3 space-y-3">
          {paymentOptions.map((option) => {
            const Icon = option.icon;
            const selected = payment === option.id;
            return (
              <div
                key={option.id}
                className={cn(
                  "overflow-hidden rounded-3xl border bg-card shadow-sm transition-colors",
                  selected ? "border-primary" : "border-border",
                )}
              >
                <button
                  type="button"
                  onClick={() => {
                    hapticTap();
                    setPayment(selected ? null : option.id);
                  }}
                  className="flex w-full items-center gap-3 p-4 text-left"
                >
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-secondary">
                    <Icon className="h-5 w-5 text-primary" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="text-base font-extrabold">{option.title}</span>
                      {option.recommended && (
                        <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-primary">
                          Tavsiya
                        </span>
                      )}
                    </span>
                    <span className="mt-0.5 block text-sm text-muted-foreground">
                      {option.subtitle}
                    </span>
                  </span>
                  <ChevronDown
                    className={cn(
                      "h-5 w-5 shrink-0 text-muted-foreground transition-transform",
                      selected && "rotate-180",
                    )}
                  />
                </button>

                {selected && (
                  <div className="animate-gm-rise border-t border-border p-4">
                    <div className="flex items-start gap-3">
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-secondary">
                        <Truck className="h-5 w-5 text-primary" />
                      </span>
                      <div>
                        <p className="text-base font-extrabold">Kuryer turini tanlang</p>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                          Buyurtmani qaysi kuryer olib kelishini tanlang.
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 space-y-2.5">
                      {couriers.map((c) => {
                        const active = courier === c.id;
                        return (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => {
                              hapticTap();
                              setCourier(c.id);
                            }}
                            className={cn(
                              "flex w-full items-center justify-between rounded-2xl border px-4 py-3.5 text-left text-sm font-bold transition-all active:scale-[0.98]",
                              active
                                ? "border-primary bg-secondary text-primary"
                                : "border-border bg-card",
                            )}
                          >
                            {c.label}
                            {active && <Check className="h-4 w-4" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {error && (
        <p className="mt-4 rounded-xl bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={confirmOrder}
        disabled={submitting}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-primary py-4 text-base font-extrabold text-primary-foreground shadow-lg transition-transform active:scale-[0.98] disabled:opacity-70"
      >
        {submitting ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Yuborilmoqda...
          </>
        ) : (
          `Buyurtmani tasdiqlash · ${formatUZS(orderTotal + deliveryFee)}`
        )}
      </button>
    </div>
  );
}
