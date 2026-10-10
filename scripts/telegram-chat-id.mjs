import { requestTelegramWithCurl } from "../src/lib/telegram-curl.ts";

const token = process.env.TELEGRAM_BOT_TOKEN;

async function getUpdates() {
  const url = `https://api.telegram.org/bot${token}/getUpdates`;
  const body = JSON.stringify({ allowed_updates: ["message"] });

  if (!process.argv.includes("--curl")) {
    return fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      signal: AbortSignal.timeout(10000),
    });
  }

  return requestTelegramWithCurl(url, body);
}

if (!token) {
  console.error("Добавьте TELEGRAM_BOT_TOKEN в .env.local.");
  process.exitCode = 1;
} else if (!/^\d+:[A-Za-z0-9_-]+$/.test(token)) {
  console.error("Неверный формат TELEGRAM_BOT_TOKEN. Скопируйте только токен из BotFather, целиком и без пробелов.");
  process.exitCode = 1;
} else {
  try {
    const response = await getUpdates();
    const data = await response.json();
    if (!response.ok || data.ok !== true || !Array.isArray(data.result)) {
      console.error(`Telegram отклонил запрос (HTTP ${response.status}).`);
      if (typeof data.description === "string") {
        console.error(data.description.replaceAll(token, "[TOKEN]"));
      }
      if (response.status === 401 || response.status === 404) {
        console.error("Проверьте актуальный токен бота в BotFather.");
      } else if (response.status === 409) {
        console.error("Запрос конфликтует с webhook или другим процессом получения сообщений. Используйте отдельного бота без webhook.");
      }
      process.exitCode = 1;
    } else {
      const chats = new Map();
      for (const update of data.result) {
        const chat = update.message?.chat;
        if (chat?.type === "private") chats.set(chat.id, chat);
      }
      if (chats.size === 0) {
        console.log("Напишите боту /start и запустите команду ещё раз. Бот должен быть новым, без настроенного webhook.");
      }
      for (const chat of chats.values()) {
        console.log(`${chat.first_name ?? "Личный чат"}: TELEGRAM_CHAT_ID=${chat.id}`);
      }
    }
  } catch (error) {
    // Avoid printing errors containing the bot token in the request URL.
    const causes = [error?.cause, ...(error?.cause?.errors ?? [])];
    const codes = [...new Set(causes.map((cause) => cause?.code)
      .filter((code) => typeof code === "string" && /^[A-Z_0-9]{2,60}$/.test(code)))];
    if (error?.name === "TimeoutError" || error?.name === "AbortError") {
      console.error("Telegram API не ответил за 10 секунд. Проверьте доступ к api.telegram.org, VPN или прокси.");
    } else if (codes.length > 0) {
      console.error(`Ошибка подключения к Telegram API: ${codes.join(", ")}. Проверьте интернет, DNS, VPN или прокси.`);
      if (codes.includes("ENOENT") && process.argv.includes("--curl")) {
        console.error("Команда curl не найдена. Установите curl или запустите скрипт без --curl.");
      }
    } else {
      console.error("Не удалось прочитать ответ Telegram API. Проверьте подключение, VPN или прокси.");
    }
    process.exitCode = 1;
  }
}
