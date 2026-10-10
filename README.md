This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `src/app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Структура проекта

Код приложения находится в `src/`:

```text
src/
  app/          # маршруты, компоненты и стили
  lib/          # общие функции
  paraglide/    # автоматически сгенерированный код локализации
messages/       # исходные переводы
project.inlang/ # настройки локализации
public/         # статические файлы
scripts/        # скрипты разработки
```

Конфигурационные файлы остаются в корне. Алиас `@/*` указывает на `src/*`.

## Локализация

Используется Paraglide JS. Основной язык — русский (`ru`); также доступен
английский (`en`). Кнопка в шапке показывает текущий язык (`RU` / `EN`),
переключает русский и английский и сохраняет выбор
в cookie `PARAGLIDE_LOCALE` и перезагружает текущую страницу. Адреса страниц
остаются `/` и `/flowers`.

Переводы находятся в `messages/{locale}.json`, список языков — в
`project.inlang/settings.json`. `pnpm dev` генерирует сообщения перед запуском
Next.js и автоматически перекомпилирует их при изменениях. `pnpm build`
также сначала выполняет компиляцию. Для отдельной генерации:

```bash
pnpm i18n:compile
```

Каталог `src/paraglide/` генерируется автоматически и не хранится в Git.
Сообщения импортируются через `@/paraglide/messages.js`:

```tsx
import * as m from "@/paraglide/messages.js";
import { getRequestLocale } from "@/lib/i18n";

const locale = await getRequestLocale();
const title = m.site_name({}, { locale });
```

В серверных компонентах используйте `getRequestLocale()`, а в клиентские
передавайте `locale` из серверного компонента и указывайте его в сообщениях.
Это сохраняет одинаковый язык при SSR и гидратации и изолирует параллельные
запросы. Не вызывайте `setLocale()` на сервере. Приоритет выбора языка:
сохранённая cookie → язык браузера → русский. При первом посещении сервер
определяет язык по `Accept-Language`, клиент — по `navigator.languages`.
Региональные варианты (`en-US`, `ru-RU`) соответствуют `en` и `ru`.
При добавлении языка также обновите логику переключения
в `src/app/components/language-select.tsx`.

## Данные рецептов

В `src/lib/recipes.json` (schemaVersion `3`) названия рецептов, ингредиентов,
категорий и эффектов хранятся в объектах `name` с ключами `ru`, `en`, `fr`, `es`,
`de`, `it`, `pt`, как названия цветов. На странице используется `name[locale]`;
поиск работает по названию на выбранном языке. Русские названия и составы
сохранены, переводы блюд взяты из игровых ресурсов `live_0.95`.
Общий список `effects` хранит ID и локализованные названия пяти эффектов.
Рецепт ссылается на него через `effect.effectId`, например
`"effect": { "effectId": "mighty-strike", "level": 1 }`.
Уровень хранится в `effect.level`; `effect: null` означает, что эффект не указан.
ID рецепта — английское название в `kebab-case`, например
`sizzling-mixed-fruit-skewers`. Поле `image` содержит один путь к WebP-иконке,
общий для всех языков: `/images/recipes/sizzling-mixed-fruit-skewers.webp`.

## Изображения рецептов

В `public/images/recipes` находятся 76 оригинальных WebP-иконок блюд, извлечённых
из локальных ресурсов Petit Planet `live_0.95`, revision `1217551`.
Пути к иконкам хранятся в поле `image` рецептов в `src/lib/recipes.json`.
Названия в исходном списке рецептов сохранены: семь из них отличаются от игровых
написанием, кавычками или локализацией.
Изображения извлечены из Texture2D и сохранены в исходном разрешении без генерации.
WebP использует сжатие без потерь с сохранением прозрачности.
Обзор всех иконок — `public/images/recipes/preview.webp`. В игровых данных фруктовый
боул Тафиса использует ту же иконку, что и фруктово-овощной сок.

## Данные цветов

Локальная база `src/lib/flowers.json` содержит три списка:

- `species`: 13 видов цветов с `id` и локализованным названием `name`.
- `flowers`: 61 вариант цветов. Каждый содержит `id`, ссылку `speciesId`,
  локализованное название оттенка `colorName` и путь к одному изображению `image`.
  При отсутствии изображения значение `image` равно `null`.
  Для четырёх вариантов портулака и красного, жёлтого и зелёного подсолнухов
  добавлены прозрачные WebP размером 256×256
  в `public/images/flowers`. Это реконструкции по скриншотам с помощью imagegen;
  детали могут отличаться от исходных игровых изображений.
  Оттенки принадлежат конкретным видам, общего справочника цветов нет.
- `crosses`: 40 сочетаний с двумя ID родителей в `parentIds` и ID результата
  в `resultId`. Все участники каждого сочетания принадлежат одному виду.
  Пустой `parentIds` означает неизвестное сочетание для известного результата;
  на странице оба родителя отображаются как «Неизвестно» (Unknown).

Переводы видов и оттенков хранятся непосредственно в данных:
`name` и `colorName` содержат объекты с полями `ru` и `en`.
В `messages/ru.json` и `messages/en.json` остаются тексты интерфейса.
ID вариантов состоят из ID вида и английского названия оттенка в нижнем регистре
с дефисами, например `moss-rose-fuchsia`. Они не зависят от языка интерфейса;
при изменении перевода существующий ID сохраняется.

Источник — таблица «Цветы»,
лист `Лист1`, снимок от 7 октября 2026 года.
Это JSON-набор данных для приложения и последующего импорта,
а не подключение к MongoDB.

Для таблицы скрещивания на сайте список `flowers`, отфильтрованный по `speciesId`,
задаёт варианты на обеих осях в порядке источника
(оттенки, встречающиеся только в результатах, идут в конце).
Ячейка находится по паре идентификаторов родителей в `crosses`;
`parentIds` отсортированы по ID, поэтому обратные сочетания не дублируются.
Два одинаковых ID обозначают скрещивание одинаковых вариантов.
Вариант результата берётся из `flowers` по `resultId`. `resultId: null` обозначает
явно неизвестный результат; отсутствие записи означает отсутствие данных.
Розовый результат скрещивания оранжевых и красных канн в исходных данных был
предположительным.
Список оттенков отражает данные источника, а не полный игровой каталог.
По игровым скриншотам добавлены обычная и бирюзовая фиалки, оранжевый и белый горицвет,
а также оранжевый георгин. Для горицвета добавлено сочетание белого и красного
с результатом Blush (кремово-персиковый); данных о скрещиваниях фиалок и оранжевого георгина нет.
Родители определяются по подписям
строк и столбцов даже при их расхождениях на диагонали.
Перед импортом в MongoDB строковые идентификаторы нужно сопоставить с ObjectId.

## Предложения скрещиваний в Telegram

Кнопка «Отправить» в модалке отправляет предложение через серверный маршрут
`/api/flower-suggestions`. Сообщение содержит итоговый цветок, двух родителей,
их ID, комментарий и ссылку на раздел. Сайт не добавляет предложение в каталог
автоматически. Сервер проверяет вид цветов и допустимое качество родителей.

Настройка для Vercel:

1. Создайте отдельного бота через [@BotFather](https://t.me/BotFather) командой
   `/newbot` и получите токен. Откройте нового бота и отправьте ему `/start`.
2. Для получения ID чата создайте локальный `.env.local` в корне проекта
   с переменной `TELEGRAM_BOT_TOKEN`, затем выполните:

   ```bash
   pnpm exec node --env-file=.env.local scripts/telegram-chat-id.mjs
   ```

   Команда выводит ID личных чатов из последних сообщений боту; выберите свой.
   Она предназначена для нового бота без webhook. `.env.local` исключён из Git.
3. В настройках проекта Vercel → Environment Variables добавьте:
   - `TELEGRAM_BOT_TOKEN` — токен бота;
   - `TELEGRAM_CHAT_ID` — ID вашего чата;
   - `SITE_URL` — адрес сайта (необязательно, по умолчанию используется
     `VERCEL_PROJECT_PRODUCTION_URL`).
4. Добавьте переменные для Production и, если нужно проверять отправку на
   preview-деплоях, для Preview. Сделайте новый deployment, затем отправьте
   предложение через сайт и проверьте сообщение в Telegram.

Для локальной проверки добавьте `TELEGRAM_CHAT_ID` в `.env.local` и запустите
`pnpm dev`. Значения токена и ID чата используются только на сервере:
не добавляйте к именам префикс `NEXT_PUBLIC_`.

Если команда получения ID чата сообщает `ETIMEDOUT`, `ENETUNREACH` или
`EAI_AGAIN`, запрос не дошёл до Telegram API: проверьте подключение и VPN
для всей системы, включая терминал. Прокси, настроенный только внутри
Telegram, не применяется к команде Node.js. Ошибки HTTP 401/404 указывают на
проблему с токеном, а HTTP 409 — на конфликт с webhook или другим процессом
получения сообщений. Скрипт выводит диагностику без токена.

Если в WSL `curl` обращается к Telegram успешно, а Node.js получает сетевую
ошибку, можно получить ID чата через режим `--curl`:

```bash
pnpm exec node --env-file=.env.local scripts/telegram-chat-id.mjs --curl
```

Этот режим требует Node.js 22.18 или новее и установленный `curl`. Токен
и тело запроса передаются через stdin, не через аргументы командной строки.
При запуске `pnpm dev` в WSL (переменная `WSL_DISTRO_NAME`) отправка предложений
также использует `curl`, чтобы обойти различия сетевого подключения Node.js
и `curl`. В production, включая Vercel, используется Node.js `fetch`.

При отсутствии настроек или ошибке Telegram форма показывает ошибку и
сохраняет выбранные цветы и комментарий для повторной отправки. Сообщение об
успехе появляется только после подтверждения Telegram API. Для публичного
сайта ограничение частоты обращений можно настроить в Vercel Firewall.

Документация: [sendMessage](https://core.telegram.org/bots/api#sendmessage),
[getUpdates](https://core.telegram.org/bots/api#getupdates).

## UI-компоненты и shadcn

Конфигурация CLI находится в `components.json`: стиль `base-nova`, Base UI,
TypeScript и Tailwind CSS v4. UI-компоненты добавляются в `src/app/components/ui`.
Общий помощник для CSS-классов доступен как `cn` из `@/lib/utils`.
Цвета shadcn связаны с палитрой сайта в `src/app/globals.css`, а вариант `dark:`
использует существующий атрибут `data-theme="dark"`.

Добавление компонента:

```bash
pnpm exec shadcn add button
```
