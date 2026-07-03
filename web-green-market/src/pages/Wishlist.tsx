import { Heart } from "lucide-react";
import { useMemo } from "react";
import { Link } from "react-router-dom";

import ProductCard from "@/components/ProductCard";
import { useStore } from "@/context/StoreContext";
import { hapticTap } from "@/lib/telegram";

export default function Wishlist() {
  const { wishlist, products } = useStore();

  const wishlistProducts = useMemo(
    () => products.filter((p) => wishlist.includes(p.id) && !p.hidden),
    [wishlist, products],
  );

  if (wishlistProducts.length === 0) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center px-4 pb-32 pt-24 text-center">
        <Heart className="h-20 w-20 text-muted-foreground/30" strokeWidth={1.5} />
        <h1 className="mt-6 text-2xl font-extrabold">Sevimlilar bo'sh</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Yoqqan mahsulotlarga ♥ belgisini bosing
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
        Sevimlilar{" "}
        <span className="text-xl font-bold text-muted-foreground">
          ({wishlistProducts.length} ta)
        </span>
      </h1>
      <div className="mt-4 grid grid-cols-2 gap-3">
        {wishlistProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
