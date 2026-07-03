import { ArrowRight, Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { useStore } from "@/context/StoreContext";
import { formatUZS } from "@/lib/products";
import { hapticTap } from "@/lib/telegram";

export default function Cart() {
  const { cartLines, cartCount, cartTotal, addToCart, decrementCart, removeFromCart, settings } =
    useStore();
  const navigate = useNavigate();

  if (cartLines.length === 0) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center px-4 pb-32 pt-24 text-center">
        <ShoppingCart className="h-20 w-20 text-muted-foreground/30" strokeWidth={1.5} />
        <h1 className="mt-6 text-2xl font-extrabold">Savatingiz bo'sh</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Boshlash uchun mahsulot qo'shing
        </p>
        <Link
          to="/"
          onClick={() => hapticTap()}
          className="mt-6 rounded-full bg-primary px-8 py-3.5 text-sm font-bold text-primary-foreground shadow-md transition-transform active:scale-95"
        >
          Mahsulotlarni ko'rish
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 pb-32 pt-6">
      <h1 className="text-3xl font-extrabold tracking-tight">
        Savat{" "}
        <span className="text-xl font-bold text-muted-foreground">
          ({cartCount} ta mahsulot)
        </span>
      </h1>

      <div className="mt-4 space-y-3">
        {cartLines.map(({ product, qty }) => (
          <div
            key={product.id}
            className="animate-gm-rise flex items-center gap-3 rounded-3xl border border-border bg-card p-3 shadow-sm"
          >
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-secondary/60 text-4xl">
              <span role="img" aria-label={product.name}>
                {product.emoji}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold">{product.name}</p>
              <p className="text-xs text-muted-foreground">
                {formatUZS(product.price)} / {product.unit}
              </p>
              <div className="mt-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1 rounded-full border border-border px-1 py-0.5">
                  <button
                    type="button"
                    aria-label="Kamaytirish"
                    onClick={() => {
                      hapticTap();
                      decrementCart(product.id);
                    }}
                    className="flex h-7 w-7 items-center justify-center rounded-full transition-transform active:scale-75"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="min-w-5 text-center text-sm font-bold">{qty}</span>
                  <button
                    type="button"
                    aria-label="Ko'paytirish"
                    onClick={() => {
                      hapticTap();
                      addToCart(product.id);
                    }}
                    className="flex h-7 w-7 items-center justify-center rounded-full transition-transform active:scale-75"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-sm font-extrabold">{formatUZS(product.price * qty)}</p>
                <button
                  type="button"
                  aria-label="O'chirish"
                  onClick={() => {
                    hapticTap();
                    removeFromCart(product.id);
                  }}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-all active:scale-75 active:text-destructive"
                >
                  <Trash2 className="h-4.5 w-4.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 rounded-3xl border border-border bg-card p-5 shadow-sm">
        <h2 className="text-lg font-extrabold">Buyurtma xulosasi</h2>
        <div className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">
              Mahsulotlar ({cartCount} ta)
            </span>
            <span className="font-semibold">{formatUZS(cartTotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Yetkazib berish</span>
            <span className="font-semibold text-green-700">
              {settings?.deliveryFee === 0 || (settings && cartTotal >= settings.freeDeliveryThreshold) ? "Bepul" : formatUZS(settings?.deliveryFee ?? 0)}
            </span>
          </div>
          <div className="border-t border-border pt-2.5" />
          <div className="flex justify-between text-base font-extrabold">
            <span>Jami</span>
            <span className="text-primary">{formatUZS(cartTotal)}</span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            hapticTap();
            navigate("/checkout");
          }}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3.5 text-sm font-bold text-primary-foreground shadow-md transition-transform active:scale-[0.98]"
        >
          Buyurtma berish
          <ArrowRight className="h-4 w-4" />
        </button>
        <Link
          to="/"
          onClick={() => hapticTap()}
          className="mt-3 block text-center text-sm font-bold text-primary"
        >
          Xaridni davom ettirish
        </Link>
      </div>
    </div>
  );
}
