import { Heart, Home, ShoppingCart, User } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";

import { useStore } from "@/context/StoreContext";
import { cn } from "@/lib/utils";
import { hapticTap } from "@/lib/telegram";

const tabs = [
  { to: "/", label: "Bosh sahifa", icon: Home },
  { to: "/cart", label: "Savat", icon: ShoppingCart },
  { to: "/wishlist", label: "Sevimlilar", icon: Heart },
  { to: "/profile", label: "Profil", icon: User },
] as const;

export default function BottomNav() {
  const { cartCount, wishlist } = useStore();
  const location = useLocation();

  // Hide bottom nav on admin routes
  if (location.pathname.startsWith("/admin")) {
    return null;
  }

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40">
      <div className="mx-auto max-w-md px-3 pb-3">
        <div className="safe-bottom flex items-center justify-around rounded-3xl border border-border bg-card/95 px-2 py-2 shadow-[0_-4px_24px_rgba(122,15,43,0.08)] backdrop-blur">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active =
              tab.to === "/"
                ? location.pathname === "/"
                : location.pathname.startsWith(tab.to);
            const badge =
              tab.to === "/cart"
                ? cartCount
                : tab.to === "/wishlist"
                  ? wishlist.length
                  : 0;
            return (
              <NavLink
                key={tab.to}
                to={tab.to}
                onClick={() => hapticTap()}
                className="relative flex min-w-[64px] flex-col items-center gap-1 rounded-2xl px-3 py-1.5 transition-transform active:scale-90"
              >
                <span className="relative">
                  <Icon
                    className={cn(
                      "h-6 w-6 transition-colors",
                      active ? "text-primary" : "text-muted-foreground",
                    )}
                    strokeWidth={active ? 2.4 : 2}
                    fill={active && tab.to === "/wishlist" ? "currentColor" : "none"}
                  />
                  {badge > 0 && (
                    <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-accent-foreground">
                      {badge}
                    </span>
                  )}
                </span>
                <span
                  className={cn(
                    "text-[11px] font-semibold transition-colors",
                    active ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  {tab.label}
                </span>
                {active && (
                  <span className="absolute -bottom-0.5 h-1 w-6 rounded-full bg-primary" />
                )}
              </NavLink>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
