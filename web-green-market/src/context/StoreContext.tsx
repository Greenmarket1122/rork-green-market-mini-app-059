import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { CATEGORIES, PRODUCTS as FALLBACK_PRODUCTS, formatUZS } from "@/lib/products";
import type { CartItem, DeliveryAddress, Product, ShopSettings } from "@/lib/types";
import { cacheAdminPassword, fetchProducts, fetchSettings } from "@/lib/admin-api";

interface CartLine {
  product: Product;
  qty: number;
}

interface StoreContextValue {
  cartItems: CartItem[];
  cartLines: CartLine[];
  cartCount: number;
  cartTotal: number;
  addToCart: (productId: string) => void;
  decrementCart: (productId: string) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  getQty: (productId: string) => number;
  wishlist: string[];
  isWishlisted: (productId: string) => boolean;
  toggleWishlist: (productId: string) => void;
  address: DeliveryAddress | null;
  saveAddress: (address: DeliveryAddress) => void;
  products: Product[];
  categories: string[];
  settings: ShopSettings | null;
  getProductById: (id: string) => Product | undefined;
  formatUZS: (amount: number) => string;
}

const StoreContext = createContext<StoreContextValue | null>(null);

const CART_KEY = "gm_cart";
const WISHLIST_KEY = "gm_wishlist";
const ADDRESS_KEY = "gm_address";

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
};

function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>(() =>
    loadJSON<CartItem[]>(CART_KEY, []),
  );
  const [wishlist, setWishlist] = useState<string[]>(() =>
    loadJSON<string[]>(WISHLIST_KEY, []),
  );
  const [address, setAddress] = useState<DeliveryAddress | null>(() =>
    loadJSON<DeliveryAddress | null>(ADDRESS_KEY, null),
  );
  const [products, setProducts] = useState<Product[]>(FALLBACK_PRODUCTS);
  const [settings, setSettings] = useState<ShopSettings | null>(null);

  // Fetch products + settings from backend on mount
  useEffect(() => {
    const load = async () => {
      const [prodRes, setRes] = await Promise.all([
        fetchProducts(),
        fetchSettings(),
      ]);
      if (prodRes.ok && prodRes.products && prodRes.products.length > 0) {
        setProducts(prodRes.products);
      }
      if (setRes.ok && setRes.settings) {
        setSettings(setRes.settings);
        // Note: adminPassword is stripped from public settings response,
        // so the local cache keeps the default "0215" unless changed
        // via the admin panel (which also updates it locally).
      }
    };
    load();
  }, []);

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(cartItems));
  }, [cartItems]);

  useEffect(() => {
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlist));
  }, [wishlist]);

  useEffect(() => {
    if (address) {
      localStorage.setItem(ADDRESS_KEY, JSON.stringify(address));
    }
  }, [address]);

  const addToCart = useCallback((productId: string) => {
    setCartItems((prev) => {
      const existing = prev.find((i) => i.productId === productId);
      if (existing) {
        return prev.map((i) =>
          i.productId === productId ? { ...i, qty: i.qty + 1 } : i,
        );
      }
      return [...prev, { productId, qty: 1 }];
    });
  }, []);

  const decrementCart = useCallback((productId: string) => {
    setCartItems((prev) =>
      prev
        .map((i) => (i.productId === productId ? { ...i, qty: i.qty - 1 } : i))
        .filter((i) => i.qty > 0),
    );
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setCartItems((prev) => prev.filter((i) => i.productId !== productId));
  }, []);

  const clearCart = useCallback(() => {
    setCartItems([]);
  }, []);

  const getQty = useCallback(
    (productId: string) =>
      cartItems.find((i) => i.productId === productId)?.qty ?? 0,
    [cartItems],
  );

  const isWishlisted = useCallback(
    (productId: string) => wishlist.includes(productId),
    [wishlist],
  );

  const toggleWishlist = useCallback((productId: string) => {
    setWishlist((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId],
    );
  }, []);

  const saveAddress = useCallback((next: DeliveryAddress) => {
    setAddress(next);
  }, []);

  const getProductById = useCallback(
    (id: string) => products.find((p) => p.id === id),
    [products],
  );

  const categories = useMemo(() => {
    const cats = new Set(products.map((p) => p.category));
    return ["Hammasi", ...Array.from(cats)];
  }, [products]);

  const cartLines = useMemo<CartLine[]>(
    () =>
      cartItems
        .map((item) => {
          const product = products.find((p) => p.id === item.productId);
          return product ? { product, qty: item.qty } : null;
        })
        .filter((line): line is CartLine => line !== null),
    [cartItems, products],
  );

  const cartCount = useMemo(
    () => cartItems.reduce((sum, i) => sum + i.qty, 0),
    [cartItems],
  );

  const cartTotal = useMemo(
    () => cartLines.reduce((sum, line) => sum + line.product.price * line.qty, 0),
    [cartLines],
  );

  const value = useMemo<StoreContextValue>(
    () => ({
      cartItems,
      cartLines,
      cartCount,
      cartTotal,
      addToCart,
      decrementCart,
      removeFromCart,
      clearCart,
      getQty,
      wishlist,
      isWishlisted,
      toggleWishlist,
      address,
      saveAddress,
      products,
      categories,
      settings: settings ?? DEFAULT_SETTINGS,
      getProductById,
      formatUZS,
    }),
    [
      cartItems,
      cartLines,
      cartCount,
      cartTotal,
      addToCart,
      decrementCart,
      removeFromCart,
      clearCart,
      getQty,
      wishlist,
      isWishlisted,
      toggleWishlist,
      address,
      saveAddress,
      products,
      categories,
      settings,
      getProductById,
    ],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

/** Access cart, wishlist, address, products, and settings state anywhere below StoreProvider */
export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) {
    throw new Error("useStore must be used within StoreProvider");
  }
  return ctx;
}
