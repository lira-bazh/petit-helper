import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

type Name = { ru: string; en: string };
type RecipeEntry = {
  name: Name;
  recipeItemName: Name;
  kind: "standard" | "secret" | "share";
  source: { tableOffset: number; ruStringOffset: number; dishNameTableOffset?: number };
};

const gamePath = process.argv[2];
if (!gamePath) {
  throw new Error("Usage: pnpm exec node scripts/find-missing-recipes.mts <game directory>");
}

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

// Short names use a length-dependent key and mirrored byte positions.
// Long descriptions are unnecessary for the recipe-name comparison.
function shortString(position: number): string | null {
  const length = uint32(position);
  if (length > 240) return null;
  const keys = [0x57 ^ length, 0x02, 0x35, 0x01];
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
const dishes = missing.filter((recipe) => recipe.kind !== "share");
const sharing = missing.filter((recipe) => recipe.kind === "share");
if (dishes.some((recipe) => !recipe.source.dishNameTableOffset)) {
  throw new Error("A dish name could not be matched to its recipe item");
}

writeFileSync(join(projectPath, "missing-recipes.json"), `${JSON.stringify({
  source: { file: "GenerateAssets/ed.obb", branch: revision.branch, revision: revision.revision },
  comparison: "English names, ignoring case and punctuation; sharing portions remain separate",
  counts: { game: unique.size, database: database.recipes.length, dishes: dishes.length, sharing: sharing.length },
  unmatchedDatabaseNames: unmatched.map((recipe) => recipe.name),
  dishes,
  sharing,
}, null, 2)}\n`);

const escapeCell = (text: string) => text.replaceAll("|", "\\|").replaceAll("\n", " ");
const table = (rows: RecipeEntry[], sharingPortions: boolean) => [
  "| Русское название | English | Особый рецепт |",
  "| --- | --- | --- |",
  ...rows.map((recipe) => `| ${escapeCell(sharingPortions ? recipe.recipeItemName.ru : recipe.name.ru)} | ${escapeCell(recipe.name.en)} | ${recipe.kind === "secret" ? "Да" : "—"} |`),
].join("\n");
writeFileSync(join(projectPath, "missing-recipes.md"), [
  "# Рецепты, отсутствующие в базе",
  "",
  `Источник: локальный клиент Petit Planet, ${revision.branch}, revision ${revision.revision}; GenerateAssets/ed.obb.`,
  "",
  `В локализации найдено ${unique.size} уникальных названий предметов-рецептов. В базе — ${database.recipes.length}. Отсутствуют: ${dishes.length} запись блюда и ${sharing.length} записи порций на компанию.`,
  "",
  unmatched.length === 0
    ? "Все названия из базы найдены в игровом списке. Сравнение выполнено по английским названиям без учёта регистра и пунктуации."
    : `Не найдены в игровом списке: ${unmatched.map((recipe) => recipe.name.en).join(", ")}.`,
  "",
  "Это перечень записей в ресурсах клиента: наличие названия не подтверждает доступность рецепта в текущем игровом режиме. Ингредиенты не извлекались. Основная база рецептов не изменялась.",
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
  table(sharing, true),
  "",
  "## Повторная проверка",
  "",
  "```sh",
  "pnpm exec node scripts/find-missing-recipes.mts '/mnt/f/GAMES/PetitPlanet Game'",
  "```",
  "",
  "Скрипт читает игровые файлы и базу, затем обновляет только missing-recipes.json и missing-recipes.md. Смещения исходных записей сохранены в JSON.",
  "",
].join("\n"));

console.log(`Game: ${unique.size}; database: ${database.recipes.length}; missing dishes: ${dishes.length}; sharing portions: ${sharing.length}; unmatched database names: ${unmatched.length}`);
