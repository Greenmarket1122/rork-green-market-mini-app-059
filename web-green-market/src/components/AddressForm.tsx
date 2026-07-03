import { LocateFixed, MapPin } from "lucide-react";
import { useState } from "react";

import { useStore } from "@/context/StoreContext";
import { hapticSuccess, hapticTap } from "@/lib/telegram";
import type { DeliveryAddress } from "@/lib/types";

interface AddressFormProps {
  onSaved?: () => void;
}

const inputClass =
  "w-full rounded-2xl border border-input bg-card px-4 py-3 text-sm font-medium outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary focus:ring-2 focus:ring-primary/20";

/** Delivery address form with an optional map location picker */
export default function AddressForm({ onSaved }: AddressFormProps) {
  const { address, saveAddress } = useStore();
  const [fullName, setFullName] = useState<string>(address?.fullName ?? "");
  const [phone, setPhone] = useState<string>(address?.phone ?? "");
  const [street, setStreet] = useState<string>(address?.street ?? "");
  const [city, setCity] = useState<string>(address?.city ?? "");
  const [lat, setLat] = useState<number | undefined>(address?.lat);
  const [lng, setLng] = useState<number | undefined>(address?.lng);
  const [showMap, setShowMap] = useState<boolean>(Boolean(address?.lat));
  const [locating, setLocating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<boolean>(false);

  const requestLocation = () => {
    hapticTap();
    setError(null);
    if (!navigator.geolocation) {
      setError("Brauzeringiz lokatsiyani qo'llab-quvvatlamaydi.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(Number(pos.coords.latitude.toFixed(5)));
        setLng(Number(pos.coords.longitude.toFixed(5)));
        setShowMap(true);
        setLocating(false);
      },
      () => {
        setError("Lokatsiyani aniqlab bo'lmadi. Manzilni qo'lda kiriting.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const handleSave = () => {
    setError(null);
    if (!fullName.trim() || !phone.trim() || !street.trim() || !city.trim()) {
      setError("Iltimos, barcha maydonlarni to'ldiring.");
      return;
    }
    const next: DeliveryAddress = {
      fullName: fullName.trim(),
      phone: phone.trim(),
      street: street.trim(),
      city: city.trim(),
      lat,
      lng,
    };
    saveAddress(next);
    hapticSuccess();
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2000);
    onSaved?.();
  };

  const mapSrc =
    lat !== undefined && lng !== undefined
      ? `https://yandex.uz/map-widget/v1/?ll=${lng}%2C${lat}&z=17&pt=${lng}%2C${lat}%2Cpm2rdm`
      : undefined;

  return (
    <div className="rounded-3xl bg-muted/60 p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-lg font-extrabold">Yangi manzil</h3>
        <button
          type="button"
          onClick={() => {
            hapticTap();
            setShowMap((v) => !v);
          }}
          className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-2 text-sm font-semibold transition-transform active:scale-95"
        >
          <MapPin className="h-4 w-4" />
          {showMap ? "Xaritani yopish" : "Xaritadan tanlash"}
        </button>
      </div>

      {showMap && (
        <div className="animate-gm-rise mt-3 space-y-2.5">
          <button
            type="button"
            onClick={requestLocation}
            disabled={locating}
            className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-bold text-primary transition-transform active:scale-95 disabled:opacity-60"
          >
            <LocateFixed className="h-4 w-4" />
            {locating ? "Aniqlanmoqda..." : "Mening lokatsiyam"}
          </button>
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            {mapSrc ? (
              <iframe
                title="Yetkazib berish xaritasi"
                src={mapSrc}
                className="h-56 w-full"
                loading="lazy"
                style={{ border: 0 }}
              />
            ) : (
              <div className="flex h-52 flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
                <MapPin className="h-8 w-8 text-muted-foreground/50" />
                <p className="px-6">
                  Lokatsiyangizni aniqlash uchun yuqoridagi tugmani bosing
                </p>
              </div>
            )}
          </div>
          {lat !== undefined && lng !== undefined && (
            <p className="text-xs text-muted-foreground">
              {lat}, {lng} — pin joylashuvi manzil bilan saqlanadi va yetkazib
              berishda ishlatiladi.
            </p>
          )}
        </div>
      )}

      <div className="mt-4 space-y-3.5">
        <div>
          <label className="mb-1.5 block text-sm font-bold" htmlFor="gm-name">
            Ism va familiya
          </label>
          <input
            id="gm-name"
            className={inputClass}
            placeholder="Abdulfattox Qurbonov"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            autoComplete="name"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-bold" htmlFor="gm-phone">
            Telefon
          </label>
          <input
            id="gm-phone"
            className={inputClass}
            placeholder="+998 90 123 45 67"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            inputMode="tel"
            autoComplete="tel"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-bold" htmlFor="gm-street">
            Ko'cha va uy
          </label>
          <input
            id="gm-street"
            className={inputClass}
            placeholder="Ko'cha, uy, xonadon"
            value={street}
            onChange={(e) => setStreet(e.target.value)}
            autoComplete="street-address"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-bold" htmlFor="gm-city">
            Shahar
          </label>
          <input
            id="gm-city"
            className={inputClass}
            placeholder="Toshkent"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />
        </div>

        {error && (
          <p className="rounded-xl bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={handleSave}
          className="rounded-full bg-primary px-8 py-3 text-sm font-bold text-primary-foreground shadow-md transition-transform active:scale-95"
        >
          {saved ? "Saqlandi ✓" : "Saqlash"}
        </button>
      </div>
    </div>
  );
}
