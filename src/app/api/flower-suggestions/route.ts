import flowerData from "@/lib/flowers.json";
import { getFlowerCrossParents } from "@/lib/flower-crosses";
import { sendFlowerSuggestion } from "@/lib/telegram";
import { siteUrl } from "@/lib/site";

export async function POST(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!request.headers.get("content-type")?.startsWith("application/json")) {
    return Response.json({ error: "Expected JSON" }, { status: 415 });
  }

  let body: unknown;
  try {
    const text = await request.text();
    if (text.length > 10000) {
      return Response.json({ error: "Request too large" }, { status: 413 });
    }
    body = JSON.parse(text);
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (typeof body !== "object" || body === null
    || !("resultId" in body) || typeof body.resultId !== "string"
    || !("parentIds" in body) || !Array.isArray(body.parentIds) || body.parentIds.length !== 2
    || !body.parentIds.every((id: unknown) => typeof id === "string")
    || !("comment" in body) || typeof body.comment !== "string" || body.comment.length > 2000) {
    return Response.json({ error: "Invalid suggestion" }, { status: 400 });
  }

  const result = flowerData.flowers.find((flower) => flower.id === body.resultId);
  if (!result || !flowerData.crosses.some((cross) => cross.resultId === result.id && cross.parentIds.length === 0)) {
    return Response.json({ error: "Unknown hybrid required" }, { status: 400 });
  }
  const eligibleParents = getFlowerCrossParents(result);
  const [parent1, parent2] = body.parentIds.map((id: unknown) => eligibleParents.find((flower) => flower.id === id));
  if (!parent1 || !parent2) {
    return Response.json({ error: "Invalid parents" }, { status: 400 });
  }
  const species = flowerData.species.find((species) => species.id === result.speciesId);
  const text = [
    "Новое предложение скрещивания — Petit Planet",
    "",
    `Вид: ${species?.name.ru ?? result.speciesId}`,
    `Результат: ${result.colorName.ru} (${result.id})`,
    `Родители: ${parent1.colorName.ru} + ${parent2.colorName.ru}`,
    `ID родителей: ${parent1.id} + ${parent2.id}`,
    "",
    `Комментарий: ${body.comment.trim() || "—"}`,
    "",
    `${siteUrl}/ru/flowers#${result.speciesId}`,
  ].join("\n");

  const status = await sendFlowerSuggestion(text);
  if (status === "unavailable") {
    return Response.json({ error: "Sending unavailable" }, { status: 503 });
  }
  if (status === "error") {
    return Response.json({ error: "Could not send suggestion" }, { status: 502 });
  }
  return Response.json({ ok: true });
}
