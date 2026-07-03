import { ArrowLeft, Heart, Minus, Plus, ShoppingCart, Star } from "lucide-react";
import { useMemo } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";

import ProductCard from "@/components/ProductCard";
import { useStore } from "@/context/StoreContext";
import { formatUZS } from "@/lib/products";
import { hapticTap } from "@/lib/telegram";
import { cn } from "@/lib/utils";

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { products, addToCart, decrementCart, getQty, isWishlisted, toggleWishlist, getProductById } =
    useStore();

  const product = id ? getProductById(id) : undefined;

  const related = useMemo(
    () =>
      product
        ? products
            .filter(
              (p) =>
                p.category === product.category &&
                p.id !== product.id &&
                !p.hidden,
            )
            .slice(0, 4)
        : [],
    [product, products],
  );

  if (!product) {
    return <Navigate to="/" replace />;
  }

  const qty = getQty(product.id);
  const liked = isWishlisted(product.id);
  const discount = product.oldPrice
    ? Math.round((1 - product.price / product.oldPrice) * 100)
    : 0;

  return (
    <div className="mx-auto max-w-md px-4 pb-32 pt-6">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => {
            hapticTap();
            navigate(-1);
          }}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card shadow-sm transition-transform active:scale-90"
          aria-label="Orqaga"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={() => {
            hapticTap();
            toggleWishlist(product.id);
          }}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card shadow-sm transition-transform active:scale-90"
          aria-label="Sevimlilarga qo'shish"
        >
          <Heart
            className={cn(
              "h-5 w-5",
              liked ? "fill-primary text-primary" : "text-muted-foreground",
            )}
          />
        </button>
      </div>

      <div className="animate-gm-pop relative mt-4 flex h-56 items-center justify-center rounded-3xl bg-secondary/60 text-[110px]">
        <span role="img" aria-label={product.name}>
          {product.emoji}
        </span>
        {discount > 0 && (
          <span className="absolute left-4 top-4 rounded-full bg-accent px-3 py-1 text-xs font-extrabold text-accent-foreground">
            -{discount}% chegirma
          </span>
        )}
      </div>

      <div className="mt-5">
        <div className="flex items-center gap-2 text-sm">
          <span className="rounded-full bg-secondary px-3 py-1 font-bold text-primary">
            {product.category}
          </span>
          <span className="flex items-center gap-1 font-semibold text-muted-foreground">
            <Star className="h-4 w-4 fill-accent text-accent" />
            {product.rating}
          </span>
        </div>
        <h1 className="mt-2 text-2xl font-extrabold tracking-tight">
          {product.name}
        </h1>
        <p className="mt-0.5 text-sm text-muted-foreground">{product.unit}</p>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {product.description}
        </p>
      </div>

      <div className="mt-5 flex items-center justify-between rounded-3xl border border-border bg-card p-4 shadow-sm">
        <div>
          {product.oldPrice && (
            <p className="text-sm text-muted-foreground line-through">
              {formatUZS(product.oldPrice)}
            </p>
          )}
          <p className="text-xl font-extrabold text-primary">
            {formatUZS(product.price)}
          </p>
        </div>

        {!product.inStock ? (
          <span className="rounded-full bg-muted px-4 py-2 text-sm font-bold text-muted-foreground">
            Tugagan
          </span>
        ) : qty === 0 ? (
          <button
            type="button"
            onClick={() => {
              hapticTap();
              addToCart(product.id);
            }}
            className="flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-md transition-transform active:scale-95"
          >
            <ShoppingCart className="h-4 w-4" />
            Savatga
          </button>
        ) : (
          <div className="flex items-center gap-2 rounded-full bg-primary px-2 py-2 text-primary-foreground shadow-md">
            <button
              type="button"
              aria-label="Kamaytirish"
              onClick={() => {
                hapticTap();
                decrementCart(product.id);
              }}
              className="flex h-8 w-8 items-center justify-center rounded-full transition-transform active:scale-75"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="min-w-5 text-center text-base font-bold">{qty}</span>
            <button
              type="button"
              aria-label="Ko'paytirish"
              onClick={() => {
                hapticTap();
                addToCart(product.id);
              }}
              className="flex h-8 w-8 items-center justify-center rounded-full transition-transform active:scale-75"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {related.length > 0 && (
        <div className="mt-7">
          <h2 className="text-lg font-extrabold">O'xshash mahsulotlar</h2>
          <div className="mt-3 grid grid-cols-2 gap-3">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
