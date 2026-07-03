/** Product sold in the Green Market store */
export interface Product {
  id: string;
  name: string;
  category: string;
  /** Emoji used as the product visual */
  emoji: string;
  /** Price in UZS */
  price: number;
  /** Old price in UZS when discounted */
  oldPrice?: number;
  /** Unit label, e.g. "1 kg", "1 dona" */
  unit: string;
  description: string;
  rating: number;
  inStock: boolean;
  /** Hidden from storefront but kept in admin */
  hidden?: boolean;
}

/** Item stored in the cart */
export interface CartItem {
  productId: string;
  qty: number;
}

/** Saved delivery address */
export interface DeliveryAddress {
  fullName: string;
  phone: string;
  street: string;
  city: string;
  lat?: number;
  lng?: number;
}

export type PaymentMethod = "payme" | "click" | "cash";
export type CourierType = "yandex" | "milenium";

/** Shop-wide settings configurable from the admin panel */
export interface ShopSettings {
  shopName: string;
  deliveryFee: number;
  freeDeliveryThreshold: number;
  contactPhone: string;
  supportLink: string;
  isOpen: boolean;
  workingHours: string;
  bannerText: string;
  bannerEnabled: boolean;
  /** Admin password — write-only from client perspective */
  adminPassword?: string;
  /** Shop latitude for Yandex Go courier routing */
  shopLat?: number;
  /** Shop longitude for Yandex Go courier routing */
  shopLng?: number;
}

/** Order returned by the backend */
export interface OrderData {
  orderNumber: string;
  items: { name: string; emoji: string; price: number; qty: number }[];
  total: number;
  address: DeliveryAddress;
  payment: string;
  courier: string;
  customerName?: string;
  customerUsername?: string;
  telegramUserId?: number;
  status: string;
  createdAt: number;
}
