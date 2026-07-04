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

  /** Unit label */
  unit: string;

  description: string;

  rating: number;

  inStock: boolean;

  /** Hidden from storefront but kept in admin */
  hidden?: boolean;

  /**
   * fixed  = dona bo'yicha sotiladi
   * weight = kg bo'yicha sotiladi
   */
  saleType?: "fixed" | "weight";

  /** 1 kg narxi (weight mahsulotlar uchun) */
  pricePerKg?: number;

  /** Minimal og'irlik (kg) */
  minWeight?: number;

  /** Qadam (kg) */
  stepWeight?: number;
}

/** Item stored in the cart */
export interface CartItem {
  productId: string;

  /** dona soni */
  qty: number;

  /** kg bo'lsa */
  weight?: number;

  /** foydalanuvchi summa bo'yicha olgan bo'lsa */
  customPrice?: number;

  /** yakuniy hisoblangan narx */
  totalPrice?: number;
}

/** Saved delivery address */
export interface DeliveryAddress {
  fullName: string;
  phone: string;

  street: string;
  city: string;

  lat?: number;
  lng?: number;

  entrance?: string;
  floor?: string;
  apartment?: string;

  comment?: string;
}

export type PaymentMethod = "payme" | "click" | "cash";

/**
 * Hozircha faqat Yandex ishlatamiz.
 * Keyin boshqa xizmatlar qo'shilishi mumkin.
 */
export type CourierType = "yandex";

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

  /** Admin password */
  adminPassword?: string;

  /** Do'kon koordinatalari */
  shopLat?: number;
  shopLng?: number;
}

/** Order returned by the backend */
export interface OrderData {
  orderNumber: string;

  items: {
    name: string;
    emoji: string;

    price: number;

    qty: number;

    weight?: number;

    totalPrice?: number;
  }[];

  total: number;

  deliveryFee?: number;

  address: DeliveryAddress;

  payment: string;

  courier: string;

  customerName?: string;

  customerUsername?: string;

  telegramUserId?: number;

  status: string;

  createdAt: number;
}
