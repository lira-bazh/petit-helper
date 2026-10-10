import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

type Name = { ru: string; en: string };
type RecipeEntry = {
  name: Name;
  recipeItemName: Name;
  kind: "standard" | "secret" | "share";
  source: { tableOffset: number; ruStringOffset: number; dishNameTableOffset?: number };
  cooking?: {
    status: "confirmed" | "base-recipe-only" | "not-found";
    recipeItemId: number;
    tableOffset?: number;
    baseRecipeId?: number;
    ingredientCount: number | null;
    baseIngredientCount: number | null;
    slots: { slot: number; condition: string | null; itemId: number | null; quantity: number; label: string }[];
  };
};

const gamePath = process.argv[2];
const exportAll = process.argv[3] === "--all";
if (!gamePath) {
  throw new Error("Usage: pnpm exec node scripts/find-missing-recipes.mts <game directory> [--all]");
}
if (process.argv.length > 4 || (process.argv[3] && !exportAll)) throw new Error("Unknown arguments; use --all to export the complete list.");

const projectPath = fileURLToPath(new URL("../", import.meta.url));
const assetsPath = join(gamePath, "PetitPlanet_Data", "StreamingAssets");
const revision: { branch: string; revision: number } = JSON.parse(
  readFileSync(join(assetsPath, "res_revision.json"), "utf8"),
);
if (revision.branch !== "live_0.95" || revision.revision !== 1217551) {
  throw new Error("This extractor supports live_0.95, revision 1217551 only.");
}

const data = readFileSync(join(assetsPath, "GenerateAssets", "ed.obb"));
const uint32 = (position: number) => (data.readUInt32BE(position) ^ 0x53020253) >>> 0;
const int32 = (position: number) => data.readInt32BE(position) ^ 0x53020253;
const uint16 = (position: number) => data.readUInt16BE(position) ^ 0x5555;
const indirect = (position: number) => position + uint32(position);

function field(table: number, index: number) {
  const vtable = table - int32(table);
  const entry = vtable + 4 + index * 2;
  if (entry + 2 > vtable + uint16(vtable)) return 0;
  const offset = uint16(entry);
  return offset ? table + offset : 0;
}

// Full exports also read long recipe labels. The default missing-only export
// retains its existing short-name selection.
function shortString(position: number): string | null {
  const length = uint32(position);
  if (length > (exportAll ? 4096 : 240)) return null;
  const keys = [
    0x57 ^ (length & 255), 0x02 ^ ((length >>> 8) & 255),
    0x35 ^ ((length >>> 16) & 255), 0x01 ^ ((length >>> 24) & 255),
  ];
  const decoded = Buffer.alloc(length);
  for (let index = 0; index < length; index++) {
    const mirrored = Math.min(index, length - 1 - index);
    const keyIndex = length % 2 === 1 && index === Math.floor(length / 2)
      ? 0
      : mirrored % 4;
    decoded[length - 1 - index] = data[position + 4 + index] ^ keys[keyIndex];
  }
  return new TextDecoder("utf-8", { fatal: true }).decode(decoded);
}

const root = uint32(0);
const textMapWrapper = indirect(field(root, 1));
const textMap = indirect(field(textMapWrapper, 0));
const entries = indirect(field(textMap, 4));
const entryCount = uint32(entries);
if (entryCount !== uint32(field(textMap, 0))) throw new Error("TextMap count mismatch");

const recipes: RecipeEntry[] = [];
const itemNames = new Map<string, { ru: string; tableOffset: number }>();
for (let index = 0; index < entryCount; index++) {
  const table = indirect(entries + 4 + index * 4);
  const enField = field(table, 0);
  const ruField = field(table, 7);
  if (!enField || !ruField) continue;
  const enPosition = indirect(enField);
  const ruPosition = indirect(ruField);
  const en = shortString(enPosition);
  const ru = shortString(ruPosition);
  if (!en || !ru) continue;

  if (!/^(?:Особый рецепт:|Рецепт[: ])/u.test(ru)) {
    itemNames.set(en, { ru, tableOffset: table });
    continue;
  }
  if (ru.startsWith("Рецепт блюда.") || !en.includes("Recipe")) continue;

  const nameEn = en.replace(/^(?:Secret )?Recipe:\s*/u, "").replace(/ Recipe(?= \(|$)/u, "");
  if (nameEn === en) throw new Error(`Unrecognized recipe label: ${en}`);
  recipes.push({
    name: { ru: ru.replace(/^(?:Особый рецепт:|Рецепт:|Рецепт)\s*/u, ""), en: nameEn },
    recipeItemName: { ru, en },
    kind: /\((?:Share|Sharing) Size\)/u.test(en)
      ? "share"
      : en.startsWith("Secret Recipe:") ? "secret" : "standard",
    source: { tableOffset: table, ruStringOffset: ruPosition },
  });
}

const normalize = (name: string) => name.toLocaleLowerCase("en").replace(/[^\p{L}\p{N}]/gu, "");
const unique = new Map<string, RecipeEntry>();
for (const recipe of recipes) {
  const item = itemNames.get(recipe.name.en);
  if (item) {
    recipe.name.ru = item.ru;
    recipe.source.dishNameTableOffset = item.tableOffset;
  }
  unique.set(normalize(recipe.name.en), recipe);
}

const database: { recipes: { name: Name }[] } = JSON.parse(
  readFileSync(join(projectPath, "src", "lib", "recipes.json"), "utf8"),
);
const known = new Set(database.recipes.map((recipe) => normalize(recipe.name.en)));
const unmatched = database.recipes.filter((recipe) => !unique.has(normalize(recipe.name.en)));
const missing = [...unique.entries()].filter(([name]) => !known.has(name)).map(([, recipe]) => recipe);
const selected = exportAll ? [...unique.values()] : missing;
const dishes = selected.filter((recipe) => recipe.kind !== "share");
const sharing = selected.filter((recipe) => recipe.kind === "share");
if (dishes.some((recipe) => !recipe.source.dishNameTableOffset)) {
  throw new Error("A dish name could not be matched to its recipe item");
}

// TextMap uses packed hash slots: a text hash and a 24-bit entry index with
// an 8-bit probe distance. This links localization records to item IDs,
// including sharing recipes whose names differ from their current base dish.
const textHashes = new Map<number, number>();
const hashSlots = indirect(field(textMap, 3));
for (let index = 0; index < uint32(hashSlots); index++) {
  const position = hashSlots + 4 + index * 8;
  const entryIndex = (data.readUInt32BE(position + 4) ^ 0x0135025f) >>> 8;
  if (entryIndex >= entryCount) continue;
  const table = indirect(entries + 4 + entryIndex * 4);
  textHashes.set(table, (data.readUInt32BE(position) ^ 0x5f023501) >>> 0);
}
if (textHashes.size !== entryCount) throw new Error("TextMap hash count mismatch");

function rows(rootField: number) {
  const vector = indirect(field(indirect(field(root, rootField)), 0));
  return Array.from({ length: uint32(vector) }, (_, index) => indirect(vector + 4 + index * 4));
}
const value = (table: number, index: number) => field(table, index) ? uint32(field(table, index)) : 0;
const itemTables = rows(318);
const cookingTables = rows(122);
const itemsByHash = new Map(itemTables.map((table) => [value(table, 1), value(table, 0)]));
const tablesByHash = new Map([...textHashes].map(([table, hash]) => [hash, table]));
const itemNamesById = new Map(itemTables.map((table) => {
  const nameTable = tablesByHash.get(value(table, 1));
  const ruField = nameTable ? field(nameTable, 7) : 0;
  return [value(table, 0), ruField ? shortString(indirect(ruField)) : null];
}));

// Human-readable translations of condition tags; original expressions remain
// in JSON. '&' requires both tags, while '|' permits either alternative.
const conditionLabels: Record<string, string> = {
  金色: "золотое качество", 紫色: "фиолетовое качество",
  水果: "фрукты", 鲜花: "цветы", 甜瓜: "дыня", 鱼: "рыба",
  海鱼: "морская рыба", 淡水鱼: "пресноводная рыба", 海鲜: "морепродукты",
  蔬菜: "овощи", 谷物: "зерновые", 龙虾: "лобстер", 贝类: "моллюски",
  蘑菇: "грибы", 虾: "креветки", 海胆: "морской ёж", 蟹: "краб", 蛋: "яйцо",
  竹子: "бамбук", 稻米: "рис", 小麦: "пшеница", 奶: "молоко", 肉: "мясо",
  土豆: "картофель", 茄子: "баклажан", 辣椒: "перец", 番茄: "помидор",
  黄色水果: "жёлтые фрукты", 绿色水果: "зелёные фрукты", 红色水果: "красные фрукты",
  蓝色水果: "синие фрукты", 绿色蔬菜: "зелёные овощи", 红色蔬菜: "красные овощи",
  蓝莓: "черника", 芒果: "манго", 苹果: "яблоко", 百香果: "маракуйя",
  大蒜: "чеснок", 草莓: "клубника", 菠萝: "ананас", 玉米: "кукуруза",
  胡萝卜: "морковь", 卷心菜: "капуста", 素菜: "растительный ингредиент", 荤菜: "животный ингредиент",
  李子: "слива", 黄瓜: "огурец", 黄色蔬菜: "жёлтые овощи",
};
function conditionLabel(condition: string) {
  return condition.split("|").map((alternative) => alternative.split("&").map((tag) => {
    const label = conditionLabels[tag.replace(/^食材_/u, "")];
    if (!label) throw new Error(`Unknown cooking condition: ${tag}`);
    return label;
  }).join(" + ")).join(" или ");
}

for (const recipe of selected) {
  const hash = textHashes.get(recipe.source.tableOffset);
  const recipeItemId = hash === undefined ? undefined : itemsByHash.get(hash);
  if (recipeItemId === undefined) throw new Error(`Recipe item not found: ${recipe.name.en}`);
  const table = cookingTables.find((table) => value(table, recipe.kind === "share" ? 3 : 0) === recipeItemId);
  const slots = table === undefined ? [] : [20, 25, 30, 35].flatMap((index, slot) => {
    const conditionField = field(table, index);
    const condition = conditionField ? shortString(indirect(conditionField)) : null;
    const itemId = value(table, index + 1) || null;
    if (!condition && !itemId) return [];
    const quantity = value(table, index + 3);
    if (!quantity) throw new Error(`Missing slot quantity: ${recipe.name.en}`);
    const label = condition ? conditionLabel(condition) : itemNamesById.get(itemId ?? 0);
    if (!label) throw new Error(`Ingredient name not found: ${itemId}`);
    return [{ slot: slot + 1, condition, itemId, quantity, label }];
  });
  const count = slots.length ? slots.reduce((sum, slot) => sum + slot.quantity, 0) : null;
  recipe.cooking = {
    status: count === null ? "not-found" : recipe.kind === "share" ? "base-recipe-only" : "confirmed",
    recipeItemId,
    ...(table === undefined ? {} : { tableOffset: table, baseRecipeId: value(table, 0) }),
    ingredientCount: recipe.kind === "share" ? null : count,
    baseIngredientCount: count,
    slots,
  };
}

const outputName = exportAll ? "all-recipes" : "missing-recipes";
writeFileSync(join(projectPath, `${outputName}.json`), `${JSON.stringify({
  source: { file: "GenerateAssets/ed.obb", branch: revision.branch, revision: revision.revision },
  ...(exportAll ? {
    scope: "All named recipe items found in the source localization, including recipes already present in the application database.",
    notes: [
      "Ingredient slots preserve item IDs, original tag conditions, quantities and source table offsets. '&' requires both tags; '|' allows alternatives.",
      "Sharing portions contain only the linked cooking record's ingredient requirements. Their separate ingredient count or consumption multiplier is not confirmed; ingredientCount remains null.",
      "not-found means a linked ingredient list was not found, not that the recipe requires zero ingredients.",
    ],
  } : {}),
  comparison: "English names, ignoring case and punctuation; sharing portions remain separate",
  counts: {
    game: unique.size, database: database.recipes.length, dishes: dishes.length, sharing: sharing.length,
    ...(exportAll ? {
      confirmedDishes: dishes.filter((recipe) => recipe.cooking?.status === "confirmed").length,
      sharingWithBaseIngredients: sharing.filter((recipe) => recipe.cooking?.status === "base-recipe-only").length,
      sharingIngredientsNotFound: sharing.filter((recipe) => recipe.cooking?.status === "not-found").length,
    } : {}),
  },
  unmatchedDatabaseNames: unmatched.map((recipe) => recipe.name),
  dishes,
  sharing,
}, null, 2)}\n`);

const escapeCell = (text: string) => text.replaceAll("|", "\\|").replaceAll("\n", " ");
const table = (rows: RecipeEntry[], sharingPortions: boolean) => [
  `| Русское название | English | Особый рецепт | ${sharingPortions ? "Ингредиентов в базовом рецепте" : "Ингредиентов, шт."} | Состав по слотам |`,
  "| --- | --- | --- | --- | --- |",
  ...rows.map((recipe) => {
    const count = recipe.cooking?.baseIngredientCount ?? "Не найдено";
    const ingredients = recipe.cooking?.slots.map((slot) => `${slot.label} × ${slot.quantity}`).join("; ") || "—";
    return `| ${escapeCell(sharingPortions ? recipe.recipeItemName.ru : recipe.name.ru)} | ${escapeCell(recipe.name.en)} | ${recipe.kind === "secret" ? "Да" : "—"} | ${count} | ${escapeCell(ingredients)} |`;
  }),
].join("\n");
writeFileSync(join(projectPath, `${outputName}.md`), [
  exportAll ? "# Все найденные рецепты с ингредиентами" : "# Рецепты, отсутствующие в базе",
  "",
  `Источник: локальный клиент Petit Planet, ${revision.branch}, revision ${revision.revision}; GenerateAssets/ed.obb.`,
  "",
  exportAll
    ? `Выгружены все ${unique.size} найденных названий предметов-рецептов: ${dishes.length} записей блюд и ${sharing.length} записей порций на компанию.`
    : `В локализации найдено ${unique.size} уникальных названий предметов-рецептов. В базе — ${database.recipes.length}. Отсутствуют: ${dishes.length} запись блюда и ${sharing.length} записи порций на компанию.`,
  "",
  unmatched.length === 0
    ? "Все названия из базы найдены в игровом списке. Сравнение выполнено по английским названиям без учёта регистра и пунктуации."
    : `Не найдены в игровом списке: ${unmatched.map((recipe) => recipe.name.en).join(", ")}.`,
  "",
  "Количество ингредиентов и состав извлечены из таблицы приготовления (поле 122 корня ed.obb, группы полей 20–24, 25–29, 30–34 и 35–39). Сопоставление выполнено через хеш локализации → ID предмета → запись приготовления, а не по сходству названий. Повторяющиеся ингредиенты считаются отдельно. Основная база рецептов не изменялась.",
  ...(exportAll ? [
    "",
    `У ${sharing.filter((recipe) => recipe.cooking?.status === "not-found").length} записей порций на компанию состав не найден. Они сохранены с пустыми slots и статусом not-found; это не означает отсутствие ингредиентов.`,
  ] : []),
  "",
  "Наличие записи не подтверждает доступность рецепта в текущем игровом режиме. «Фиолетовое/золотое качество» — условия из игровых тегов. «Растительный/животный ингредиент» — перевод общих тегов 素菜/荤菜, без уточнения состава этих категорий.",
  "",
  `## Блюда (${dishes.length})`,
  "",
  "Русские названия взяты из записей блюд, сопоставленных с предметами-рецептами. Отметка «Особый рецепт» соответствует Secret Recipe в локализации.",
  "",
  table(dishes, false),
  "",
  `## Порции на компанию (${sharing.length})`,
  "",
  "Сохранены полные русские названия предметов-рецептов: у части записей название блюда находится в родительном падеже. Эти записи учитываются отдельно от обычных порций.",
  "",
  "Здесь указаны только требования базового рецепта, связанного с предметом порции на компанию через поле 3 таблицы приготовления. Отдельное количество ингредиентов или множитель расхода для большой порции не подтверждены; ingredientCount в JSON оставлен null. Названия некоторых больших порций устарели и отличаются от текущего базового блюда. «Не найдено» означает отсутствие связанной записи приготовления, а не нулевой расход.",
  "",
  table(sharing, true),
  "",
  "## Повторная проверка",
  "",
  "```sh",
  `pnpm exec node scripts/find-missing-recipes.mts '/mnt/f/GAMES/PetitPlanet Game'${exportAll ? " --all" : ""}`,
  "```",
  "",
  `Скрипт читает игровые файлы и базу, затем обновляет только ${outputName}.json и ${outputName}.md. ID предметов, смещения таблиц, исходные условия слотов и количества сохранены в JSON.`,
  "",
].join("\n"));

console.log(`Game: ${unique.size}; database: ${database.recipes.length}; ${exportAll ? "exported" : "missing"} dishes: ${dishes.length}; sharing portions: ${sharing.length}; unmatched database names: ${unmatched.length}`);
