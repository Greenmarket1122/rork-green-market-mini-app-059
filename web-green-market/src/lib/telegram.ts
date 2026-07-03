/** Minimal typing for the Telegram Mini App SDK injected by telegram-web-app.js */
export interface TelegramWebAppUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
}

interface TelegramHapticFeedback {
  impactOccurred: (style: "light" | "medium" | "heavy" | "rigid" | "soft") => void;
  notificationOccurred: (type: "error" | "success" | "warning") => void;
}

interface TelegramWebApp {
  ready: () => void;
  expand: () => void;
  initDataUnsafe?: {
    user?: TelegramWebAppUser;
  };
  HapticFeedback?: TelegramHapticFeedback;
  setHeaderColor?: (color: string) => void;
  setBackgroundColor?: (color: string) => void;
  colorScheme?: "light" | "dark";
  onEvent?: (event: string, handler: () => void) => void;
  /** Telegram WebApp version string, e.g. "6.0", "7.2" */
  version?: string;
}

/** Compare Telegram WebApp version (e.g. "6.0" >= "6.1" → false) */
function tgVersionAtLeast(min: string): boolean {
  const v = getWebApp()?.version;
  if (!v) return false;
  const [a1, b1] = v.split(".").map(Number);
  const [a2, b2] = min.split(".").map(Number);
  if (a1 !== a2) return a1 > a2;
  return (b1 ?? 0) >= (b2 ?? 0);
}

declare global {
  interface Window {
    Telegram?: {
      WebApp?: TelegramWebApp;
    };
  }
}

function getWebApp(): TelegramWebApp | undefined {
  return window.Telegram?.WebApp;
}

/** Initialize the Telegram Mini App: expand and match brand colors.
 *  Color APIs require Telegram WebApp ≥ 6.1 — older clients log warnings
 *  if we call them, so we gate on version. */
export function initTelegram(): void {
  const app = getWebApp();
  if (!app) return;
  try {
    app.ready();
    app.expand();
    // setHeaderColor requires version ≥ 6.2, setBackgroundColor ≥ 6.1
    if (tgVersionAtLeast("6.2")) {
      app.setHeaderColor?.("#faf8f4");
    }
    if (tgVersionAtLeast("6.1")) {
      app.setBackgroundColor?.("#faf8f4");
    }
  } catch {
    // silently ignore — color setting is cosmetic
  }
}

export function getTelegramUser(): TelegramWebAppUser | undefined {
  return getWebApp()?.initDataUnsafe?.user;
}

/** Light haptic tap for button presses (no-op outside Telegram) */
export function hapticTap(): void {
  try {
    getWebApp()?.HapticFeedback?.impactOccurred("light");
  } catch {
    // ignore
  }
}

/** Success haptic for completed actions (no-op outside Telegram) */
export function hapticSuccess(): void {
  try {
    getWebApp()?.HapticFeedback?.notificationOccurred("success");
  } catch {
    // ignore
  }
}
