// functions/index.ts — Green Market Telegram bot backend
// Admin panel + product/settings management v2 + Yandex Go integration
//
// Handles:
//   POST   /api/order         — create order, persist via OrderStore DO, notify Telegram
//   GET    /api/order/:num    — fetch order by number
//   PATCH  /api/order/:num    — update order status (admin)
//   GET    /api/orders        — list recent orders (admin)
//   GET    /api/products      — list all products (public)
//   POST   /api/products      — create product (admin)
//   PATCH  /api/products/:id  — update product (admin)
//   DELETE /api/products/:id  — delete product (admin)
//   GET    /api/settings      — get shop settings (public, password hidden)
//   PUT    /api/settings      — update shop settings (admin)
//   POST   /api/admin/verify  — verify admin password
//   GET    /api/categories    — list categories
//   POST   /webhook           — Telegram bot webhook (captures admin chat_id, sends order updates)
//   GET    /ping              — health check
import { OrderStore, type Order } from "./order-store";


export { OrderStore };

type Env = {
  DO: Fetcher;
  TELEGRAM_BOT_TOKEN: string;
  TELEGRAM_CHAT_ID: string;
  SUPABASE_SERVICE_KEY: string;
};

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}

function formatOrderMessage(order: Order): string {
  const items = order.items
    .map((i) => `  ${i.emoji} ${i.name} ×${i.qty} — ${formatUZS(i.price * i.qty)}`)
    .join("\n");

  const locationLine =
    order.address.lat !== undefined && order.address.lng !== undefined
      ? `\n📍 Lokatsiya: https://yandex.uz/maps/?ll=${order.address.lng}%2C${order.address.lat}&z=17&pt=${order.address.lng},${order.address.lat},pm2rdm`
      : "";

  const paymentLabel =
    order.payment === "payme"
      ? "Payme"
      : order.payment === "click"
        ? "Click"
        : "Naqd (kuryerga)";

  const courierLabel =
    order.courier === "yandex" ? "Yandex kuryer" : "Milenium";

  return (
    `🛒 Yangi buyurtma #${order.orderNumber}\n` +
    `━━━━━━━━━━━━━━━━\n` +
    `👤 Mijoz: ${order.address.fullName}\n` +
    `📞 Tel: ${order.address.phone}\n` +
    `💬 Telegram: ${order.customerName ?? "—"}` +
    (order.customerUsername ? ` (@${order.customerUsername})` : "") +
    `\n\n📦 Mahsulotlar:\n${items}\n\n` +
    `💰 Jami: ${formatUZS(order.total)}\n` +
    `💳 To'lov: ${paymentLabel}\n` +
    `🚚 Kuryer: ${courierLabel}\n` +
    `━━━━━━━━━━━━━━━━\n` +
    `🏠 Manzil: ${order.address.street}, ${order.address.city}` +
    locationLine +
    `\n\n🕐 ${new Date(order.createdAt).toLocaleString("ru-RU", { timeZone: "Asia/Tashkent" })}`
  );
}

function formatUZS(amount: number): string {
  return new Intl.NumberFormat("ru-RU").format(amount) + " so'm";
}
async function saveOrderToSupabase(
  env: Env,
  order: Order,
): Promise<void> {
  try {
    const response = await fetch(
      "https://wucxfpinzsqfsnkvtdcr.supabase.co/rest/v1/orders",
      {
        method: "POST",
        headers: {
          apikey: env.SUPABASE_SERVICE_KEY,
          Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify({
          order_number: order.orderNumber,
          payment_method: order.payment,
          courier: order.courier,
          subtotal: order.total,
          delivery_price: 0,
          discount: 0,
          total_price: order.total,
          status: order.status,
          note: "",
          created_at: new Date(order.createdAt).toISOString(),
          updated_at: new Date(order.createdAt).toISOString(),
        }),
      },
    );

    if (!response.ok) {
      console.error(await response.text());
    }
  } catch (e) {
    console.error(e);
  }
}
interface InlineButton {
  text: string;
  url?: string;
  web_app?: { url: string };
}

async function sendTelegramMessage(
  token: string,
  chatId: string,
  text: string,
  inlineButtons?: InlineButton[][],
): Promise<boolean> {
  try {
    const body: Record<string, unknown> = {
      chat_id: chatId,
      text,
      parse_mode: "HTML",
      disable_web_page_preview: false,
    };
    if (inlineButtons && inlineButtons.length > 0) {
      body.reply_markup = {
        inline_keyboard: inlineButtons.map((row) =>
          row.map((btn) => {
            const key: Record<string, unknown> = { text: btn.text };
            if (btn.url) key.url = btn.url;
            if (btn.web_app) key.web_app = btn.web_app;
            return key;
          }),
        ),
      };
    }
    const resp = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
    );
    return resp.ok;
  } catch {
    return false;
  }
}

/**
 * Generate a Yandex Go deep link that opens the app with a pre-set route.
 * Uses the AppMetrica redirect format which opens Yandex Go if installed,
 * or redirects to the app store if not.
 *
 * @param fromLat - shop latitude
 * @param fromLng - shop longitude
 * @param toLat - customer latitude
 * @param toLng - customer longitude
 * @returns Yandex Go redirect URL
 */
function buildYandexGoLink(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number,
): string {
  const params = new URLSearchParams({
    "start-lat": String(fromLat),
    "start-lon": String(fromLng),
    "end-lat": String(toLat),
    "end-lon": String(toLng),
    ref: "greenmarket",
    appmetrica_tracking_id: "1178268795219780156",
  });
  return `https://3.redirect.appmetrica.yandex.com/route?${params.toString()}`;
}

/**
 * Fetch shop settings from the DO to get shop coordinates.
 */
async function getShopSettings(
  env: Env,
): Promise<{ shopLat?: number; shopLng?: number }> {
  try {
    const storeReq = new Request("https://do/settings", {
      method: "GET",
      headers: {
        "X-Rork-DO-Class": "OrderStore",
        "X-Rork-DO-Id": "global",
      },
    });
    const resp = await env.DO.fetch(storeReq);
    const result = (await resp.json()) as {
      ok: boolean;
      settings?: { shopLat?: number; shopLng?: number };
    };
    if (result.ok && result.settings) {
      return {
        shopLat: result.settings.shopLat,
        shopLng: result.settings.shopLng,
      };
    }
  } catch {
    // ignore
  }
  return {};
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    // Health check
    if (url.pathname === "/ping") {
      return json({ ok: true, now: new Date().toISOString() });
    }

    // ─── Telegram bot webhook ───────────────────────────────────
    // Handles:
    //   /start from admin → capture & store their chat_id
    //   /start from customer → welcome message
    //   /status <order_number> → check order status
    if (url.pathname === "/webhook" && request.method === "POST") {
      try {
        const update = (await request.json()) as {
          message?: {
            chat: { id: number; type: string };
            from?: { id: number; first_name: string; username?: string };
            text?: string;
          };
        };
        const msg = update.message;
        if (!msg || !msg.text) return json({ ok: true });

        const chatId = String(msg.chat.id);
        const text = msg.text.trim();

        if (text.startsWith("/start")) {
          // Store the chat ID — whoever sends /start becomes the admin recipient
          const storeReq = new Request("https://do/chat-id", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Rork-DO-Class": "OrderStore",
              "X-Rork-DO-Id": "global",
            },
            body: JSON.stringify({ chatId }),
          });
          await env.DO.fetch(storeReq);

          const name = msg.from?.first_name ?? "Do'stim";
          await sendTelegramMessage(
            env.TELEGRAM_BOT_TOKEN,
            chatId,
            `Assalomu alaykum, ${name}! 👋\n\n` +
              `<b>Green Market</b> botiga xush kelibsiz!\n\n` +
              `🛒 Buyurtmalarni mini app orqali qabul qilamiz.\n` +
              `Pastdagi tugmani bosing va mahsulotlarni tanlang!`,
            [
              [
                {
                  text: "🛒 Green Market — buyurtma berish",
                  web_app: {
                    url: "https://bheef6jwevy37zmpttcxs-web-green-market.rork.live",
                  },
                },
              ],
            ],
          );
          return json({ ok: true });
        }

        if (text.startsWith("/status")) {
          const orderNum = text.split(" ")[1];
          if (!orderNum) {
            await sendTelegramMessage(
              env.TELEGRAM_BOT_TOKEN,
              chatId,
              "Iltimos, buyurtma raqamini kiriting.\nMisol: `/status GM-000001`",
            );
            return json({ ok: true });
          }
          const storeReq = new Request(`https://do/order/${orderNum}`, {
            method: "GET",
            headers: {
              "X-Rork-DO-Class": "OrderStore",
              "X-Rork-DO-Id": "global",
            },
          });
          const resp = await env.DO.fetch(storeReq);
          const result = (await resp.json()) as { ok: boolean; order?: Order };
          if (!result.ok || !result.order) {
            await sendTelegramMessage(
              env.TELEGRAM_BOT_TOKEN,
              chatId,
              `Buyurtma #${orderNum} topilmadi ❌`,
            );
            return json({ ok: true });
          }
          const order = result.order;
          await sendTelegramMessage(
            env.TELEGRAM_BOT_TOKEN,
            chatId,
            `📦 Buyurtma #${order.orderNumber}\n` +
              `Holat: ${order.status}\n` +
              `Mijoz: ${order.address.fullName}\n` +
              `Jami: ${formatUZS(order.total)}\n` +
              `Manzil: ${order.address.street}, ${order.address.city}`,
          );
          return json({ ok: true });
        }

        // Order status update commands from admin
        const statusMatch = text.match(
          /^\/(accept|deliver|done)\s+(GM-\d+)/i,
        );
        if (statusMatch) {
          const [, cmd, orderNum] = statusMatch;
          const statusMap: Record<string, string> = {
            accept: "Qabul qilindi",
            deliver: "Yo'lda",
            done: "Yetkazildi",
          };
          const newStatus = statusMap[cmd.toLowerCase()] ?? "Yangi";
          const storeReq = new Request(`https://do/order/${orderNum}`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              "X-Rork-DO-Class": "OrderStore",
              "X-Rork-DO-Id": "global",
            },
            body: JSON.stringify({ status: newStatus }),
          });
          const resp = await env.DO.fetch(storeReq);
          const result = (await resp.json()) as { ok: boolean; order?: Order };
          if (result.ok && result.order) {
            // Also notify the customer if we have their telegram ID
            if (result.order.telegramUserId) {
              await sendTelegramMessage(
                env.TELEGRAM_BOT_TOKEN,
                String(result.order.telegramUserId),
                `📦 Buyurtma #${result.order.orderNumber} holati yangilandi:\n` +
                  `✅ ${newStatus}`,
              );
            }
            await sendTelegramMessage(
              env.TELEGRAM_BOT_TOKEN,
              chatId,
              `✅ Buyurtma #${orderNum} holati o'zgartirildi: ${newStatus}`,
            );
          } else {
            await sendTelegramMessage(
              env.TELEGRAM_BOT_TOKEN,
              chatId,
              `Buyurtma #${orderNum} topilmadi ❌`,
            );
          }
          return json({ ok: true });
        }

        return json({ ok: true });
      } catch (err) {
        console.error("webhook error", err);
        return json({ ok: true });
      }
    }

    // ─── Create order ───────────────────────────────────────────
    if (url.pathname === "/api/order" && request.method === "POST") {
      try {
        const orderData = (await request.json()) as Omit<
          Order,
          "orderNumber" | "status" | "createdAt"
        >;

        // Persist via DO
        const storeReq = new Request("https://do/order", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Rork-DO-Class": "OrderStore",
            "X-Rork-DO-Id": "global",
          },
          body: JSON.stringify(orderData),
        });
        const resp = await env.DO.fetch(storeReq);
        const result = (await resp.json()) as { ok: boolean; order: Order };
        if (!result.ok || !result.order) {
          return json({ ok: false, error: "Buyurtma yaratishda xatolik" }, 500);
        }

        const order = result.order;

        // Send notification to Telegram
        // 1) Try the env var TELEGRAM_CHAT_ID first
        // 2) Fall back to the stored admin chat_id from /start
        let targetChatId = env.TELEGRAM_CHAT_ID || "";
        if (!targetChatId) {
          const chatIdReq = new Request("https://do/chat-id", {
            method: "GET",
            headers: {
              "X-Rork-DO-Class": "OrderStore",
              "X-Rork-DO-Id": "global",
            },
          });
          const chatIdResp = await env.DO.fetch(chatIdReq);
          const chatResult = (await chatIdResp.json()) as {
            ok: boolean;
            chatId: string | null;
          };
          targetChatId = chatResult.chatId ?? "";
        }

        if (targetChatId) {
          const message = formatOrderMessage(order);

          // Build inline buttons: Yandex Go route + Yandex Map
          const buttons: InlineButton[][] = [];

          // Yandex Go deep link — only if both shop and customer locations are known
          if (
            order.address.lat !== undefined &&
            order.address.lng !== undefined
          ) {
            const shop = await getShopSettings(env);
            if (shop.shopLat !== undefined && shop.shopLng !== undefined) {
              const goLink = buildYandexGoLink(
                shop.shopLat,
                shop.shopLng,
                order.address.lat,
                order.address.lng,
              );
              buttons.push([
                {
                  text: "🚕 Yandex Go — kuryer chaqirish",
                  url: goLink,
                },
              ]);
            }
            // Always show the map link
            const mapLink = `https://yandex.uz/maps/?ll=${order.address.lng}%2C${order.address.lat}&z=17&pt=${order.address.lng},${order.address.lat},pm2rdm`;
            buttons.push([
              { text: "📍 Xaritada ko'rish", url: mapLink },
            ]);
          }

          const sent = await sendTelegramMessage(
            env.TELEGRAM_BOT_TOKEN,
            targetChatId,
            message,
            buttons.length > 0 ? buttons : undefined,
          );
          if (!sent) {
            console.warn("Telegram message failed to send");
          }
        } else {
          console.warn(
            "No target chat ID — admin must send /start to the bot first",
          );
        }

        return json({ ok: true, order });
      } catch (err) {
        console.error("order creation error", err);
        return json({ ok: false, error: "Server xatoligi" }, 500);
      }
    }

    // ─── Get single order ───────────────────────────────────────
    if (
      url.pathname.startsWith("/api/order/") &&
      request.method === "GET"
    ) {
      const orderNum = decodeURIComponent(
        url.pathname.slice("/api/order/".length),
      );
      const storeReq = new Request(`https://do/order/${orderNum}`, {
        method: "GET",
        headers: {
          "X-Rork-DO-Class": "OrderStore",
          "X-Rork-DO-Id": "global",
        },
      });
      const resp = await env.DO.fetch(storeReq);
      return new Response(resp.body, {
        status: resp.status,
        headers: { "Content-Type": "application/json", ...CORS_HEADERS },
      });
    }

    // ─── List recent orders ─────────────────────────────────────
    if (url.pathname === "/api/orders" && request.method === "GET") {
      const storeReq = new Request("https://do/orders", {
        method: "GET",
        headers: {
          "X-Rork-DO-Class": "OrderStore",
          "X-Rork-DO-Id": "global",
        },
      });
      const resp = await env.DO.fetch(storeReq);
      return new Response(resp.body, {
        status: resp.status,
        headers: { "Content-Type": "application/json", ...CORS_HEADERS },
      });
    }

    // ─── Products: public list ──────────────────────────────────
    if (url.pathname === "/api/products" && request.method === "GET") {
      const storeReq = new Request("https://do/products", {
        method: "GET",
        headers: {
          "X-Rork-DO-Class": "OrderStore",
          "X-Rork-DO-Id": "global",
        },
      });
      const resp = await env.DO.fetch(storeReq);
      return new Response(resp.body, {
        status: resp.status,
        headers: { "Content-Type": "application/json", ...CORS_HEADERS },
      });
    }

    // ─── Products: create (admin) ───────────────────────────────
    if (url.pathname === "/api/products" && request.method === "POST") {
      const body = await request.json();
      const storeReq = new Request("https://do/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Rork-DO-Class": "OrderStore",
          "X-Rork-DO-Id": "global",
        },
        body: JSON.stringify(body),
      });
      const resp = await env.DO.fetch(storeReq);
      return new Response(resp.body, {
        status: resp.status,
        headers: { "Content-Type": "application/json", ...CORS_HEADERS },
      });
    }

    // ─── Products: update (admin) ───────────────────────────────
    if (
      url.pathname.startsWith("/api/products/") &&
      request.method === "PATCH"
    ) {
      const id = decodeURIComponent(
        url.pathname.slice("/api/products/".length),
      );
      const body = await request.json();
      const storeReq = new Request(`https://do/products/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "X-Rork-DO-Class": "OrderStore",
          "X-Rork-DO-Id": "global",
        },
        body: JSON.stringify(body),
      });
      const resp = await env.DO.fetch(storeReq);
      return new Response(resp.body, {
        status: resp.status,
        headers: { "Content-Type": "application/json", ...CORS_HEADERS },
      });
    }

    // ─── Products: delete (admin) ───────────────────────────────
    if (
      url.pathname.startsWith("/api/products/") &&
      request.method === "DELETE"
    ) {
      const id = decodeURIComponent(
        url.pathname.slice("/api/products/".length),
      );
      const storeReq = new Request(`https://do/products/${id}`, {
        method: "DELETE",
        headers: {
          "X-Rork-DO-Class": "OrderStore",
          "X-Rork-DO-Id": "global",
        },
      });
      const resp = await env.DO.fetch(storeReq);
      return new Response(resp.body, {
        status: resp.status,
        headers: { "Content-Type": "application/json", ...CORS_HEADERS },
      });
    }

    // ─── Settings: public GET ───────────────────────────────────
    if (url.pathname === "/api/settings" && request.method === "GET") {
      const storeReq = new Request("https://do/settings", {
        method: "GET",
        headers: {
          "X-Rork-DO-Class": "OrderStore",
          "X-Rork-DO-Id": "global",
        },
      });
      const resp = await env.DO.fetch(storeReq);
      return new Response(resp.body, {
        status: resp.status,
        headers: { "Content-Type": "application/json", ...CORS_HEADERS },
      });
    }

    // ─── Settings: update (admin) ───────────────────────────────
    if (url.pathname === "/api/settings" && request.method === "PUT") {
      const body = await request.json();
      const storeReq = new Request("https://do/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-Rork-DO-Class": "OrderStore",
          "X-Rork-DO-Id": "global",
        },
        body: JSON.stringify(body),
      });
      const resp = await env.DO.fetch(storeReq);
      return new Response(resp.body, {
        status: resp.status,
        headers: { "Content-Type": "application/json", ...CORS_HEADERS },
      });
    }

    // ─── Admin: verify password ─────────────────────────────────
    if (url.pathname === "/api/admin/verify" && request.method === "POST") {
      const body = await request.json();
      const storeReq = new Request("https://do/admin/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Rork-DO-Class": "OrderStore",
          "X-Rork-DO-Id": "global",
        },
        body: JSON.stringify(body),
      });
      const resp = await env.DO.fetch(storeReq);
      return new Response(resp.body, {
        status: resp.status,
        headers: { "Content-Type": "application/json", ...CORS_HEADERS },
      });
    }

    // ─── Categories ─────────────────────────────────────────────
    if (url.pathname === "/api/categories" && request.method === "GET") {
      const storeReq = new Request("https://do/categories", {
        method: "GET",
        headers: {
          "X-Rork-DO-Class": "OrderStore",
          "X-Rork-DO-Id": "global",
        },
      });
      const resp = await env.DO.fetch(storeReq);
      return new Response(resp.body, {
        status: resp.status,
        headers: { "Content-Type": "application/json", ...CORS_HEADERS },
      });
    }

    return json({ ok: false, error: "Not found" }, 404);
  },
} satisfies ExportedHandler<Env>;
