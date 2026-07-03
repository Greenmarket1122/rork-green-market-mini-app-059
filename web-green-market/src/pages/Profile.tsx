import {
  ChevronRight,
  Headphones,
  Heart,
  Lock,
  MapPin,
  Moon,
  PackageSearch,
  Phone,
  Send,
  ShoppingBag,
  Sun,
  User,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { useStore } from "@/context/StoreContext";
import { getTelegramUser, hapticTap } from "@/lib/telegram";

const THEME_KEY = "gm_theme";

export default function Profile() {
  const { address, wishlist, cartCount, settings } = useStore();
  const tgUser = getTelegramUser();
  const [, setThemeTick] = useState(0);

  // Re-render when theme changes (from toggle or Telegram theme event)
  useEffect(() => {
    const handler = () => setThemeTick((t) => t + 1);
    window.addEventListener("gm-theme-change", handler);
    return () => window.removeEventListener("gm-theme-change", handler);
  }, []);

  const isDark =
    typeof document !== "undefined" &&
    document.documentElement.classList.contains("dark");

  const toggleTheme = () => {
    hapticTap();
    const root = document.documentElement;
    const next = !root.classList.contains("dark");
    root.classList.toggle("dark", next);
    localStorage.setItem(THEME_KEY, next ? "dark" : "light");
    setThemeTick((t) => t + 1);
  };

  const displayName = tgUser
    ? `${tgUser.first_name}${tgUser.last_name ? ` ${tgUser.last_name}` : ""}`
    : "Mehmon foydalanuvchi";
  const username = tgUser?.username ? `@${tgUser.username}` : "Telegram orqali";

  const menu = [
    {
      to: "/address",
      icon: MapPin,
      label: "Manzillar",
      hint: address ? address.city : "Kiritilmagan",
    },
    {
      to: "/track",
      icon: PackageSearch,
      label: "Buyurtmalarni kuzatish",
      hint: "Tekshirish",
    },
    {
      to: "/wishlist",
      icon: Heart,
      label: "Sevimlilar",
      hint: `${wishlist.length} ta`,
    },
    {
      to: "/cart",
      icon: ShoppingBag,
      label: "Savat",
      hint: `${cartCount} ta`,
    },
  ] as const;

  return (
    <div className="mx-auto max-w-md px-4 pb-32 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.25em] text-primary">
            {settings?.shopName ?? "Green Market"}
          </p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight">Profilim</h1>
        </div>
        <button
          type="button"
          onClick={toggleTheme}
          aria-label="Mavzu o'zgartirish"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card shadow-sm transition-transform active:scale-90"
        >
          {isDark ? (
            <Sun className="h-5 w-5 text-accent" />
          ) : (
            <Moon className="h-5 w-5 text-primary" />
          )}
        </button>
      </div>

      <div className="mt-4 rounded-3xl border border-border bg-card p-6 text-center shadow-sm">
        {tgUser?.photo_url ? (
          <img
            src={tgUser.photo_url}
            alt={displayName}
            className="mx-auto h-24 w-24 rounded-full object-cover"
          />
        ) : (
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-secondary">
            <User className="h-11 w-11 text-primary" strokeWidth={2.2} />
          </div>
        )}
        <h2 className="mt-4 text-xl font-extrabold">{displayName}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{username}</p>

        <div className="mt-5 space-y-1.5 border-t border-border pt-4">
          {menu.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => hapticTap()}
                className="flex items-center gap-3 rounded-2xl px-3 py-3 text-left transition-colors active:bg-secondary"
              >
                <Icon className="h-5 w-5 text-primary" />
                <span className="flex-1 text-sm font-bold">{item.label}</span>
                <span className="text-xs font-semibold text-muted-foreground">
                  {item.hint}
                </span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            );
          })}
        </div>
      </div>

      {/* Support block — always visible */}
      <div className="mt-4 rounded-3xl border border-border bg-card p-5 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <Headphones className="h-5 w-5 text-primary" />
          <h3 className="text-base font-extrabold">Yordam va aloqa</h3>
        </div>
        <div className="space-y-2.5">
          <a
            href="tel:+998200012560"
            onClick={() => hapticTap()}
            className="flex items-center gap-3 rounded-2xl bg-secondary/60 px-4 py-3.5 transition-transform active:scale-[0.98]"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Phone className="h-5 w-5 text-primary" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold">Qo'ng'iroq qilish</p>
              <p className="text-xs text-muted-foreground">+998 20 001 25 60</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </a>
          <a
            href="tg://user?id=8515369931"
            target="_blank"
            rel="noreferrer"
            onClick={() => hapticTap()}
            className="flex items-center gap-3 rounded-2xl bg-secondary/60 px-4 py-3.5 transition-transform active:scale-[0.98]"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#229ED9]/10">
              <Send className="h-5 w-5 text-[#229ED9]" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold">Telegram orqali murojaat</p>
              <p className="text-xs text-muted-foreground">To'g'ridan-to'g'ri chat</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </a>
        </div>
      </div>

      {address && (
        <div className="mt-4 rounded-3xl border border-border bg-card p-5 shadow-sm">
          <h3 className="text-base font-extrabold">Saqlangan manzil</h3>
          <p className="mt-2 text-sm font-semibold">{address.fullName}</p>
          <p className="text-sm text-muted-foreground">{address.phone}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {address.street}, {address.city}
          </p>
        </div>
      )}

      {/* Admin entry — hidden, accessible via /admin */}
      <Link
        to="/admin"
        onClick={() => hapticTap()}
        className="mt-4 flex items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-card/50 px-4 py-3 text-xs font-bold text-muted-foreground transition-colors active:bg-secondary"
      >
        <Lock className="h-3.5 w-3.5" />
        Admin panel
      </Link>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        {settings?.shopName ?? "Green Market"} Mini App · v1.0
      </p>
      {settings?.workingHours && (
        <p className="mt-1 text-center text-xs text-muted-foreground">
          Ish vaqti: {settings.workingHours}
        </p>
      )}
    </div>
  );
}
