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

### Локальный реестр компонентов

`registry.json` описывает собственный реестр; первым элементом добавлен
существующий `tabs.tsx`. После изменения компонента или списка элементов:

```bash
pnpm registry:build
pnpm dev
```

Сборка создаёт каталог `public/r/registry.json` и JSON-файлы компонентов.
Проверить Tabs можно командой:

```bash
pnpm exec shadcn view http://localhost:3000/r/tabs.json
```

Для установки Tabs в другой подготовленный проект:

```bash
pnpm exec shadcn add http://localhost:3000/r/tabs.json
```

Перед публикацией реестра замените `homepage` в `registry.json` на адрес сайта
и повторите сборку. При добавлении элементов указывайте исходные файлы и
внешние зависимости по [документации реестра](https://ui.shadcn.com/docs/registry/getting-started).
