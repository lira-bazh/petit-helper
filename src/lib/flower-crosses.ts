import flowerData from "@/lib/flowers.json";

export function getFlowerCrossParents(result: (typeof flowerData.flowers)[number]) {
  return flowerData.flowers.filter((flower) => (
    flower.speciesId === result.speciesId
    && flower.id !== result.id
    && (result.quality !== "blue" || flower.quality === "white")
    && (result.quality !== "purple" || flower.quality === "white" || flower.quality === "blue")
    && (result.quality !== "gold" || flower.quality !== "gold")
  ));
}
