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
