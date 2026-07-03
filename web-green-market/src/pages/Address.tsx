import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

import AddressForm from "@/components/AddressForm";
import { hapticTap } from "@/lib/telegram";

export default function Address() {
  const navigate = useNavigate();

  return (
    <div className="mx-auto max-w-md px-4 pb-32 pt-6">
      <button
        type="button"
        onClick={() => {
          hapticTap();
          navigate(-1);
        }}
        className="flex items-center gap-1.5 text-sm font-bold text-muted-foreground transition-transform active:scale-95"
      >
        <ArrowLeft className="h-4 w-4" />
        Orqaga
      </button>

      <h1 className="mt-3 text-3xl font-extrabold tracking-tight">
        Yetkazib berish manzili
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Faqat oxirgi saqlangan manzil ishlatiladi.
      </p>

      <div className="mt-4">
        <AddressForm />
      </div>
    </div>
  );
}
