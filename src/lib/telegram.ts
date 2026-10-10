import "server-only";
import { requestTelegramWithCurl } from "@/lib/telegram-curl";

export async function sendFlowerSuggestion(text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return "unavailable";
  if (!/^\d+:[A-Za-z0-9_-]+$/.test(token)) return "error";

  try {
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const body = JSON.stringify({
      chat_id: chatId,
      text,
      link_preview_options: { is_disabled: true },
    });
    const response = process.env.NODE_ENV === "development" && process.env.WSL_DISTRO_NAME
      ? await requestTelegramWithCurl(url, body)
      : await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        signal: AbortSignal.timeout(10000),
        cache: "no-store",
      });
    const data: unknown = await response.json();
    if (!response.ok || typeof data !== "object" || data === null || !("ok" in data) || data.ok !== true) {
      return "error";
    }
    return "sent";
  } catch {
    // Do not log fetch errors: their URLs can contain the bot token.
    return "error";
  }
}
