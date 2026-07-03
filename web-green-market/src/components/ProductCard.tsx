import { Heart, Minus, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useStore } from "@/context/StoreContext";
import { formatUZS } from "@/lib/products";
import { hapticTap } from "@/lib/telegram";
import { cn } from "@/lib/utils";
import type { Product } from "@/lib/types";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart, decrementCart, getQty, isWishlisted, toggleWishlist } =
    useStore();
  const navigate = useNavigate();
  const qty = getQty(product.id);
  const liked = isWishlisted(product.id);
  const discount = product.oldPrice
    ? Math.round((1 - product.price / product.oldPrice) * 100)
    : 0;

  return (
    <div className="animate-gm-rise relative flex flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
      <button
        type="button"
        aria-label="Sevimlilarga qo'shish"
        onClick={() => {
          hapticTap();
          toggleWishlist(product.id);
        }}
        className="absolute right-2.5 top-2.5 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-card/90 shadow-sm transition-transform active:scale-75"
      >
        <Heart
          className={cn(
            "h-5 w-5 transition-colors",
            liked ? "fill-primary text-primary" : "text-muted-foreground",
          )}
        />
      </button>

      {discount > 0 && (
        <span className="absolute left-2.5 top-2.5 z-10 rounded-full bg-accent px-2 py-0.5 text-[11px] font-extrabold text-accent-foreground">
          -{discount}%
        </span>
      )}

      <button
        type="button"
        onClick={() => {
          hapticTap();
          navigate(`/product/${product.id}`);
        }}
        className="flex flex-col text-left"
      >
        <div className="flex h-28 items-center justify-center bg-secondary/60 text-6xl">
          <span role="img" aria-label={product.name}>
            {product.emoji}
          </span>
        </div>
        <div className="px-3 pt-2.5">
          <p className="line-clamp-2 text-sm font-bold leading-snug">
            {product.name}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">{product.unit}</p>
        </div>
      </button>

      <div className="mt-auto flex items-end justify-between gap-2 px-3 pb-3 pt-2">
        <div className="min-w-0">
          {product.oldPrice && (
            <p className="text-[11px] text-muted-foreground line-through">
              {formatUZS(product.oldPrice)}
            </p>
          )}
          <p className="text-sm font-extrabold text-primary">
            {formatUZS(product.price)}
          </p>
        </div>

        {!product.inStock ? (
          <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
            Tugagan
          </span>
        ) : qty === 0 ? (
          <button
            type="button"
            aria-label="Savatga qo'shish"
            onClick={() => {
              hapticTap();
              addToCart(product.id);
            }}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md transition-transform active:scale-75"
          >
            <Plus className="h-5 w-5" />
          </button>
        ) : (
          <div className="flex shrink-0 items-center gap-1 rounded-full bg-primary px-1 py-1 text-primary-foreground shadow-md">
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
            <span className="min-w-4 text-center text-sm font-bold">{qty}</span>
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
        )}
      </div>
    </div>
  );
}
