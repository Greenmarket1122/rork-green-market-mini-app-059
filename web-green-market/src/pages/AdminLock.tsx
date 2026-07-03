import { Fingerprint, Lock, ScanFace } from "lucide-react";
// AdminLock: password + Face ID authentication
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  hasBiometricCredential,
  isPlatformAuthenticatorAvailable,
  registerBiometric,
  removeBiometric,
  verifyBiometric,
} from "@/lib/biometric";
import { verifyAdminPassword } from "@/lib/admin-api";
import { hapticSuccess, hapticTap } from "@/lib/telegram";
import { cn } from "@/lib/utils";

export default function AdminLock() {
  const navigate = useNavigate();
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [biometricAvailable, setBiometricAvailable] = useState<boolean>(false);
  const [hasCredential, setHasCredential] = useState<boolean>(false);
  const [showSetup, setShowSetup] = useState<boolean>(false);

  useEffect(() => {
    const checkBiometric = async () => {
      // WebAuthn requires a secure context (HTTPS) AND must NOT be inside
      // a cross-origin iframe (Telegram preview / Rork preview) unless the
      // iframe has the right allow= permissions.  In those environments
      // navigator.credentials.* will throw, so we hide the Face ID button
      // entirely and the admin can always log in with the password.
      const isSecure = typeof window !== "undefined" && window.isSecureContext;
      const inIframe = typeof window !== "undefined" && window.self !== window.top;
      if (!isSecure || inIframe) {
        setBiometricAvailable(false);
        setHasCredential(false);
        return;
      }
      const platform = await isPlatformAuthenticatorAvailable();
      setBiometricAvailable(platform);
      const hasCred = hasBiometricCredential();
      setHasCredential(hasCred);
    };
    checkBiometric();
  }, []);

  const attemptBiometric = async () => {
    hapticTap();
    setError(null);
    setLoading(true);
    const success = await verifyBiometric();
    setLoading(false);
    if (success) {
      hapticSuccess();
      sessionStorage.setItem("gm_admin_auth", "true");
      navigate("/admin/dashboard", { replace: true });
    } else {
      setError("Face ID tan olinmadi. Parolni kiriting.");
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!password.trim()) return;
    setLoading(true);
    hapticTap();
    const ok = await verifyAdminPassword(password.trim());
    if (ok) {
      hapticSuccess();
      sessionStorage.setItem("gm_admin_auth", "true");
      navigate("/admin/dashboard", { replace: true });
    } else {
      setError("Noto'g'ri parol. Qaytadan urinib ko'ring.");
      setLoading(false);
    }
  };

  const handleSetupBiometric = async () => {
    hapticTap();
    setError(null);
    // Require password verification before registering biometric
    if (!password.trim()) {
      setError("Avval parolni kiriting, so'ng Face ID ni sozlang.");
      return;
    }
    setLoading(true);
    const ok = await verifyAdminPassword(password.trim());
    if (!ok) {
      setError("Noto'g'ri parol. Face ID sozlash uchun parol kerak.");
      setLoading(false);
      return;
    }
    const registered = await registerBiometric();
    setLoading(false);
    if (registered) {
      hapticSuccess();
      setHasCredential(true);
      setShowSetup(false);
      sessionStorage.setItem("gm_admin_auth", "true");
      navigate("/admin/dashboard", { replace: true });
    } else {
      setError("Face ID sozlanmadi. Qurilmangiz qo'llab-quvvatlamasligi mumkin.");
    }
  };

  const handleRemoveBiometric = () => {
    removeBiometric();
    setHasCredential(false);
    hapticTap();
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-primary via-primary to-[hsl(340,75%,18%)] px-6">
      {/* Decorative circles */}
      <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/5" />
      <div className="pointer-events-none absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-accent/10" />

      <div className="relative z-10 w-full max-w-sm">
        {/* Logo / icon */}
        <div className="flex flex-col items-center text-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-[1.75rem] bg-white/10 backdrop-blur-md ring-1 ring-white/20">
            <span className="text-5xl">🛒</span>
          </div>
          <p className="mt-5 text-sm font-extrabold uppercase tracking-[0.3em] text-accent">
            Green Market
          </p>
          <h1 className="mt-2 text-3xl font-extrabold text-white">Admin panel</h1>
          <p className="mt-1.5 text-sm text-white/60">
            Davom etish uchun autentifikatsiya qiling
          </p>
        </div>

        {/* Face ID button — primary when available */}
        {biometricAvailable && hasCredential && (
          <button
            type="button"
            onClick={attemptBiometric}
            disabled={loading}
            className="mt-8 flex w-full items-center justify-center gap-3 rounded-2xl bg-white py-4 text-base font-extrabold text-primary shadow-xl transition-transform active:scale-[0.97] disabled:opacity-60"
          >
            <ScanFace className="h-6 w-6" />
            {loading ? "Tekshirilmoqda..." : "Face ID bilan ochish"}
          </button>
        )}

        {/* Divider */}
        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-white/15" />
          <span className="text-xs font-bold uppercase tracking-wider text-white/40">
            yoki parol
          </span>
          <div className="h-px flex-1 bg-white/15" />
        </div>

        {/* Password form */}
        <form onSubmit={handlePasswordSubmit} className="space-y-3">
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40" />
            <input
              type="password"
              inputMode="numeric"
              className="w-full rounded-2xl border border-white/10 bg-white/10 px-12 py-4 text-base font-semibold text-white outline-none transition-colors placeholder:text-white/30 focus:border-accent focus:bg-white/15"
              placeholder="Parolni kiriting"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
              autoComplete="off"
            />
            {password.length > 0 && (
              <button
                type="button"
                onClick={() => setPassword("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-white/40 transition-colors hover:text-white/70"
              >
                Tozalash
              </button>
            )}
          </div>

          {error && (
            <p className="rounded-xl bg-white/10 px-4 py-2.5 text-sm font-medium text-red-200">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !password.trim()}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-accent py-4 text-base font-extrabold text-accent-foreground shadow-lg transition-transform active:scale-[0.97] disabled:opacity-50"
          >
            {loading ? "Tekshirilmoqda..." : "Kirish"}
          </button>
        </form>

        {/* Face ID setup / remove */}
        {biometricAvailable && (
          <div className="mt-5 text-center">
            {!hasCredential ? (
              <button
                type="button"
                onClick={() => setShowSetup(true)}
                className="inline-flex items-center gap-2 text-sm font-bold text-white/60 transition-colors hover:text-white"
              >
                <Fingerprint className="h-4 w-4" />
                Face ID ni sozlash
              </button>
            ) : (
              <button
                type="button"
                onClick={handleRemoveBiometric}
                className="inline-flex items-center gap-2 text-sm font-bold text-white/40 transition-colors hover:text-white/70"
              >
                <Fingerprint className="h-4 w-4" />
                Face ID ni o'chirish
              </button>
            )}
          </div>
        )}

        {/* Setup confirmation panel */}
        {showSetup && (
          <div className="animate-gm-rise mt-4 rounded-2xl bg-white/10 p-4 text-center backdrop-blur">
            <p className="text-sm font-semibold text-white/80">
              Face ID ni sozlash uchun avval parolni kiriting va tugmani bosing.
            </p>
            <button
              type="button"
              onClick={handleSetupBiometric}
              disabled={loading}
              className="mt-3 w-full rounded-xl bg-accent py-3 text-sm font-extrabold text-accent-foreground transition-transform active:scale-95 disabled:opacity-50"
            >
              {loading ? "Sozlanmoqda..." : "Face ID ni qo'shish"}
            </button>
            <button
              type="button"
              onClick={() => setShowSetup(false)}
              className="mt-2 text-xs font-bold text-white/50 transition-colors hover:text-white/80"
            >
              Bekor qilish
            </button>
          </div>
        )}

        {/* Back to store */}
        <button
          type="button"
          onClick={() => {
            hapticTap();
            navigate("/");
          }}
          className="mt-8 block w-full text-center text-sm font-bold text-white/40 transition-colors hover:text-white/70"
        >
          ← Do'konga qaytish
        </button>
      </div>
    </div>
  );
}
