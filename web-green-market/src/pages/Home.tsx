import { Search, SlidersHorizontal, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import ProductCard from "@/components/ProductCard";
import { useStore } from "@/context/StoreContext";
import { hapticTap } from "@/lib/telegram";
import { cn } from "@/lib/utils";

const RECENT_SEARCHES_KEY = "gm_recent_searches";
const MAX_RECENT = 5;

/** Skeleton card placeholder shown while products are loading */
function SkeletonCard() {
  return (
    <div className="flex flex-col overflow-hidden rounded-3xl border border-border bg-card">
      <div className="gm-skeleton flex h-28 items-center justify-center bg-muted/40" />
      <div className="px-3 pt-2.5">
        <div className="gm-skeleton h-4 w-3/4 rounded bg-muted/40" />
        <div className="gm-skeleton mt-1.5 h-3 w-1/2 rounded bg-muted/40" />
      </div>
      <div className="flex items-end justify-between px-3 pb-3 pt-2">
        <div className="gm-skeleton h-5 w-20 rounded bg-muted/40" />
        <div className="gm-skeleton h-9 w-9 rounded-full bg-muted/40" />
      </div>
    </div>
  );
}

export default function Home() {
  const { products, categories, settings } = useStore();
  const [query, setQuery] = useState<string>("");
  const [debouncedQuery, setDebouncedQuery] = useState<string>("");
  const [category, setCategory] = useState<string>("Hammasi");
  const [showRecent, setShowRecent] = useState<boolean>(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (raw) setRecentSearches(JSON.parse(raw) as string[]);
    } catch {
      // ignore
    }
  }, []);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query.trim().toLowerCase());
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const visibleProducts = useMemo(
    () => products.filter((p) => !p.hidden),
    [products],
  );

  const filtered = useMemo(() => {
    return visibleProducts.filter((p) => {
      const matchesCategory = category === "Hammasi" || p.category === category;
      const matchesQuery =
        debouncedQuery.length === 0 ||
        p.name.toLowerCase().includes(debouncedQuery) ||
        p.category.toLowerCase().includes(debouncedQuery);
      return matchesCategory && matchesQuery;
    });
  }, [visibleProducts, debouncedQuery, category]);

  const saveRecentSearch = (term: string) => {
    if (!term.trim()) return;
    const next = [
      term,
      ...recentSearches.filter((s) => s !== term),
    ].slice(0, MAX_RECENT);
    setRecentSearches(next);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
  };

  const handleSearchFocus = () => {
    if (recentSearches.length > 0 && !query) setShowRecent(true);
  };

  const handleSearchBlur = () => {
    // Delay to allow click on recent item
    setTimeout(() => setShowRecent(false), 200);
  };

  const handleRecentClick = (term: string) => {
    setQuery(term);
    setShowRecent(false);
    hapticTap();
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem(RECENT_SEARCHES_KEY);
    hapticTap();
  };

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
          <div className="mt-2 rounded-xl bg-amber-100 px-4 py-2 text-sm font-bold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
            Hozir do'kon yopiq. Buyurtmalar qabul qilinmaydi.
          </div>
        )}
      </header>

      <div className="sticky top-3 z-30 mt-4">
        <div className="relative">
          <div className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-3 shadow-sm">
            <Search className="h-5 w-5 shrink-0 text-muted-foreground" />
            <input
              className="w-full bg-transparent text-sm font-medium outline-none placeholder:text-muted-foreground/70"
              placeholder="Mahsulotlar va turkumlar izlash"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                if (e.target.value.trim()) setShowRecent(false);
              }}
              onFocus={handleSearchFocus}
              onBlur={handleSearchBlur}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  saveRecentSearch(query.trim());
                  setShowRecent(false);
                }
              }}
            />
            {query ? (
              <button
                type="button"
                aria-label="Tozalash"
                onClick={() => {
                  setQuery("");
                  hapticTap();
                }}
                className="shrink-0 text-muted-foreground transition-transform active:scale-90"
              >
                <X className="h-5 w-5" />
              </button>
            ) : (
              <SlidersHorizontal className="h-5 w-5 shrink-0 text-primary" />
            )}
          </div>

          {/* Recent searches dropdown */}
          {showRecent && recentSearches.length > 0 && (
            <div className="animate-gm-rise absolute left-0 right-0 top-full mt-2 rounded-2xl border border-border bg-card p-2 shadow-lg">
              <div className="flex items-center justify-between px-2 py-1">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  So'nggi qidiruvlar
                </span>
                <button
                  type="button"
                  onClick={clearRecentSearches}
                  className="text-xs font-bold text-primary transition-transform active:scale-90"
                >
                  Tozalash
                </button>
              </div>
              {recentSearches.map((term) => (
                <button
                  key={term}
                  type="button"
                  onClick={() => handleRecentClick(term)}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors active:bg-secondary"
                >
                  <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="flex-1 truncate">{term}</span>
                </button>
              ))}
            </div>
          )}
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

      {category === "Hammasi" && debouncedQuery.length === 0 && bannerEnabled && (
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

      {/* Skeleton loading state — shown briefly while products sync */}
      {visibleProducts.length === 0 && (
        <div className="mt-3 grid grid-cols-2 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {visibleProducts.length > 0 && filtered.length === 0 ? (
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
