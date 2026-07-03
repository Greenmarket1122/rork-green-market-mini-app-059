import { Search, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";

import ProductCard from "@/components/ProductCard";
import { useStore } from "@/context/StoreContext";
import { hapticTap } from "@/lib/telegram";
import { cn } from "@/lib/utils";

export default function Home() {
  const { products, categories, settings } = useStore();
  const [query, setQuery] = useState<string>("");
  const [category, setCategory] = useState<string>("Hammasi");

  const visibleProducts = useMemo(
    () => products.filter((p) => !p.hidden),
    [products],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return visibleProducts.filter((p) => {
      const matchesCategory = category === "Hammasi" || p.category === category;
      const matchesQuery =
        q.length === 0 ||
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    });
  }, [visibleProducts, query, category]);

  const shopName = settings?.shopName ?? "Green Market";
  const bannerEnabled = settings?.bannerEnabled ?? true;
  const bannerText = settings?.bannerText ?? "Tanlangan mahsulotlarga 20% gacha chegirma";
  const isOpen = settings?.isOpen ?? true;

  return (
    <div className="mx-auto max-w-md px-4 pb-32 pt-4">
      <header>
        <p className="text-xs font-extrabold uppercase tracking-[0.25em] text-primary">
          {shopName}
        </p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight">
          Xush kelibsiz! 👋
        </h1>
        {!isOpen && (
          <div className="mt-2 rounded-xl bg-amber-100 px-4 py-2 text-sm font-bold text-amber-700">
            Hozir do'kon yopiq. Buyurtmalar qabul qilinmaydi.
          </div>
        )}
      </header>

      <div className="sticky top-3 z-30 mt-4">
        <div className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-3 shadow-sm">
          <Search className="h-5 w-5 shrink-0 text-muted-foreground" />
          <input
            className="w-full bg-transparent text-sm font-medium outline-none placeholder:text-muted-foreground/70"
            placeholder="Mahsulotlar va turkumlar izlash"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <SlidersHorizontal className="h-5 w-5 shrink-0 text-primary" />
        </div>
      </div>

      <div className="no-scrollbar -mx-4 mt-4 flex gap-2 overflow-x-auto px-4">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => {
              hapticTap();
              setCategory(cat);
            }}
            className={cn(
              "shrink-0 rounded-full px-4 py-2 text-sm font-bold transition-all active:scale-95",
              category === cat
                ? "bg-primary text-primary-foreground shadow-md"
                : "border border-border bg-card text-foreground",
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {category === "Hammasi" && query.trim().length === 0 && bannerEnabled && (
        <div className="relative mt-4 overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary to-[hsl(340,75%,22%)] p-5 text-primary-foreground shadow-lg">
          <div className="absolute -right-6 -top-8 text-[110px] opacity-20" aria-hidden>
            🧺
          </div>
          <p className="text-xs font-extrabold uppercase tracking-widest text-accent">
            Haftalik aksiya
          </p>
          <p className="mt-1 max-w-[220px] text-xl font-extrabold leading-snug">
            {bannerText}
          </p>
          <p className="mt-2 text-sm text-primary-foreground/80">
            Yetkazib berish — {settings?.deliveryFee === 0 ? "bepul" : `${settings?.deliveryFee ?? 0} so'm`} 🚚
          </p>
        </div>
      )}

      <div className="mt-5 flex items-baseline justify-between">
        <h2 className="text-lg font-extrabold">
          {category === "Hammasi" ? "Mahsulotlar" : category}
        </h2>
        <span className="text-sm font-semibold text-muted-foreground">
          {filtered.length} ta
        </span>
      </div>

      {filtered.length === 0 ? (
        <div className="mt-10 flex flex-col items-center gap-3 text-center">
          <span className="text-6xl" aria-hidden>
            🔍
          </span>
          <p className="text-lg font-bold">Hech narsa topilmadi</p>
          <p className="text-sm text-muted-foreground">
            Boshqa so'z bilan qidirib ko'ring
          </p>
        </div>
      ) : (
        <div className="mt-3 grid grid-cols-2 gap-3">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
