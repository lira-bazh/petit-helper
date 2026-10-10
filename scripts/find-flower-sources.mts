import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

type Name = { ru: string; en: string };
type FlowerDatabase = {
  species: { id: string; name: Name }[];
  flowers: { id: string; speciesId: string; colorName: Name }[];
  crosses: { parentIds: string[]; resultId: string }[];
};
const gamePath = process.argv[2];
if (!gamePath) throw new Error("Usage: pnpm exec node scripts/find-flower-sources.mts <game directory>");
const projectPath = fileURLToPath(new URL("../", import.meta.url));
const assetsPath = join(gamePath, "PetitPlanet_Data", "StreamingAssets");
const revision: { branch: string; revision: number } = JSON.parse(readFileSync(join(assetsPath, "res_revision.json"), "utf8"));
if (revision.branch !== "live_0.95" || revision.revision !== 1217551) {
  throw new Error("This extractor supports live_0.95, revision 1217551 only.");
}
const data = readFileSync(join(assetsPath, "GenerateAssets", "ed.obb"));
const uint32 = (position: number) => (data.readUInt32BE(position) ^ 0x53020253) >>> 0;
const int32 = (position: number) => data.readInt32BE(position) ^ 0x53020253;
const uint16 = (position: number) => data.readUInt16BE(position) ^ 0x5555;
const indirect = (position: number) => position + uint32(position);
function field(table: number, index: number): number {
  const vtable = table - int32(table);
  const entry = vtable + 4 + index * 2;
  if (entry + 2 > vtable + uint16(vtable)) return 0;
  const offset = uint16(entry);
  return offset ? table + offset : 0;
}
const value = (table: number, index: number) => field(table, index) ? uint32(field(table, index)) : 0;
function string(position: number): string {
  const length = uint32(position);
  if (position + 4 + length > data.length) throw new Error("String extends past the source file.");
  const keys = [
    0x57 ^ (length & 255), 0x02 ^ ((length >>> 8) & 255),
    0x35 ^ ((length >>> 16) & 255), 0x01 ^ ((length >>> 24) & 255),
  ];
  const decoded = Buffer.alloc(length);
  for (let index = 0; index < length; index++) {
    const mirrored = Math.min(index, length - 1 - index);
    const keyIndex = length % 2 === 1 && index === Math.floor(length / 2) ? 0 : mirrored % 4;
    decoded[length - 1 - index] = data[position + 4 + index] ^ keys[keyIndex];
  }
  return new TextDecoder("utf-8", { fatal: true }).decode(decoded);
}
const root = uint32(0);
function rows(rootField: number): number[] {
  const wrapperField = field(root, rootField);
  if (!wrapperField) throw new Error(`Missing root field ${rootField}.`);
  const vector = indirect(field(indirect(wrapperField), 0));
  const count = uint32(vector);
  if (count > data.length / 4 || vector + 4 + count * 4 > data.length) throw new Error("Invalid table vector.");
  return Array.from({ length: count }, (_, index) => indirect(vector + 4 + index * 4));
}
const textMap = indirect(field(indirect(field(root, 1)), 0));
const textEntries = indirect(field(textMap, 4));
const textCount = uint32(textEntries);
if (textCount !== value(textMap, 0)) throw new Error("TextMap count mismatch.");
const textsByHash = new Map<number, number>();
const slots = indirect(field(textMap, 3));
for (let index = 0; index < uint32(slots); index++) {
  const position = slots + 4 + index * 8;
  const entryIndex = (data.readUInt32BE(position + 4) ^ 0x0135025f) >>> 8;
  if (entryIndex >= textCount) continue;
  const table = indirect(textEntries + 4 + entryIndex * 4);
  textsByHash.set((data.readUInt32BE(position) ^ 0x5f023501) >>> 0, table);
}
if (textsByHash.size !== textCount) throw new Error("TextMap hash count mismatch.");
const itemRows = rows(318);
const itemsById = new Map(itemRows.map((table) => [value(table, 0), table]));
function item(id: number) {
  const itemTable = itemsById.get(id);
  if (itemTable === undefined) throw new Error(`Item ${id} is missing.`);
  const nameHash = value(itemTable, 1);
  const localizationTable = textsByHash.get(nameHash);
  if (localizationTable === undefined || !field(localizationTable, 0) || !field(localizationTable, 7)) {
    throw new Error(`Item ${id} has no English/Russian name.`);
  }
  return {
    id,
    name: {
      ru: string(indirect(field(localizationTable, 7))),
      en: string(indirect(field(localizationTable, 0))),
    },
    source: { itemTableOffset: itemTable, localizationTableOffset: localizationTable, nameHash },
  };
}
const flowerRows = rows(241);
const flowerRecords = flowerRows.filter((table) => value(table, 1)).map((table) => ({
  table, fields: Array.from({ length: (uint16(table - int32(table)) - 4) / 2 }, (_, index) => value(table, index)),
  flower: item(value(table, 1)),
}));
const database: FlowerDatabase = JSON.parse(readFileSync(join(projectPath, "src", "lib", "flowers.json"), "utf8"));
const normalize = (name: string) => name.toLocaleLowerCase("en").replace(/[^\p{L}\p{N}]/gu, "");
const mappedFlowers = database.flowers.map((flower) => {
  const species = database.species.find((entry) => entry.id === flower.speciesId);
  if (!species) throw new Error(`Unknown species: ${flower.speciesId}.`);
  const expected = normalize(`${flower.colorName.en} ${species.name.en}`);
  // The ordinary violet is named "Violet", rather than "Violet Violet".
  const matches = flowerRecords.filter((entry) => {
    const name = normalize(entry.flower.name.en);
    return name === expected || (flower.id === "violet-violet" && name === "violet");
  });
  if (matches.length !== 1) throw new Error(`Expected one source match for ${flower.id}, got ${matches.length}.`);
  const entry = matches[0];
  return {
    id: flower.id, speciesId: flower.speciesId, name: entry.flower.name,
    gameItems: {
      plant: item(entry.fields[0]), flower: entry.flower,
      bud: entry.fields[3] ? item(entry.fields[3]) : null,
    },
    source: { flowerTableOffset: entry.table, rawFields: entry.fields },
  };
});
const hybrids = database.crosses.map((cross) => {
  const result = mappedFlowers.find((flower) => flower.id === cross.resultId);
  if (!result) throw new Error(`Unknown hybrid: ${cross.resultId}.`);
  const parents = cross.parentIds.map((id) => mappedFlowers.find((flower) => flower.id === id));
  if (parents.some((parent) => !parent)) throw new Error(`Unknown parent of ${cross.resultId}.`);
  return {
    resultId: cross.resultId,
    gameResultItemId: result.gameItems.flower.id,
    breeding: { status: "not-confirmed" as const, sourceTableOffset: null, parentItemIds: null },
    existingDatabaseParents: parents.map((parent) => {
      if (!parent) throw new Error("Missing parent.");
      return { id: parent.id, plantItemId: parent.gameItems.plant.id, flowerItemId: parent.gameItems.flower.id };
    }),
  };
});
const output = {
  source: { file: "GenerateAssets/ed.obb", branch: revision.branch, revision: revision.revision },
  scope: "Flower item identities and phase associations; crossbreeding pairs are not confirmed by these records.",
  notes: [
    "Offsets are absolute byte offsets in ed.obb. rootFields identify fields of the root FlatBuffer table.",
    "rawFields preserve all uint32 field values of the flower phase record; field 2 is preserved without assigning an unverified meaning.",
    "existingDatabaseParents are copied from flowers.json and linked to source item IDs; they are not newly confirmed crossbreeding recipes.",
    "not-confirmed means this extraction does not identify a breeding rule. It does not mean the combination is impossible or that ed.obb has no other relevant tables.",
  ],
  rootFields: { item: 318, flowerPhases: 241, localization: 1 },
  counts: {
    sourcePhaseRecords: flowerRows.length, databaseFlowersMatched: mappedFlowers.length,
    hybrids: hybrids.length, existingDatabasePairs: hybrids.filter((entry) => entry.existingDatabaseParents.length > 0).length,
    missingDatabasePairs: hybrids.filter((entry) => entry.existingDatabaseParents.length === 0).length,
    newlyConfirmedPairs: 0,
  },
  flowers: mappedFlowers, hybrids,
};
writeFileSync(join(projectPath, "flower-sources.json"), JSON.stringify(output, null, 2) + "\n");
console.log(`Wrote flower-sources.json: ${mappedFlowers.length} source-linked flowers, ${hybrids.length} hybrids; no newly confirmed breeding pairs.`);
