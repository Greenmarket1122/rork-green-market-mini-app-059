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

/** Initialize the Telegram Mini App: expand and match brand colors */
export function initTelegram(): void {
  const app = getWebApp();
  if (!app) return;
  try {
    app.ready();
    app.expand();
    app.setHeaderColor?.("#faf8f4");
    app.setBackgroundColor?.("#faf8f4");
  } catch (error) {
    console.warn("Telegram WebApp init failed", error);
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
