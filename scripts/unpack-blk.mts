import { createCipheriv, createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import { basename, dirname, isAbsolute, join, resolve, sep } from "node:path";

// Verified against live_0.95 / revision 1217551. These are data-table RVAs,
// not functions: the DLL is read as bytes and is never loaded or executed.
const playerHash = "b28d3cb0990cec4366704aa21d448aa3464cd2a6c6afe1b226fadc71a794d7a8";
const [gameArgument, archiveArgument, outputArgument] = process.argv.slice(2);
if (!gameArgument || !archiveArgument || !outputArgument) {
  throw new Error("Usage: pnpm exec node scripts/unpack-blk.mts <game directory> <archive.blk> <new output directory>");
}
const gamePath = realpathSync(gameArgument);
const archivePath = realpathSync(archiveArgument);
const outputPath = resolve(outputArgument);
if (existsSync(outputPath)) throw new Error("Output directory must not already exist.");
const outputParent = realpathSync(dirname(outputPath));
const actualOutputPath = join(outputParent, basename(outputPath));
if (actualOutputPath === gamePath || actualOutputPath.startsWith(gamePath + sep)) {
  throw new Error("Choose an output directory outside the game directory.");
}
const dll = readFileSync(join(gamePath, "UnityPlayer.dll"));
const sha256 = (data: Buffer) => createHash("sha256").update(data).digest("hex");
if (sha256(dll) !== playerHash) throw new Error("Unsupported UnityPlayer.dll: crypto table locations must be checked for this build.");
const pe = dll.readUInt32LE(0x3c);
const sectionCount = dll.readUInt16LE(pe + 6);
const sectionStart = pe + 24 + dll.readUInt16LE(pe + 20);
function table(rva: number, length: number): Buffer {
  for (let index = 0; index < sectionCount; index++) {
    const section = sectionStart + index * 40;
    const start = dll.readUInt32LE(section + 12);
    const size = dll.readUInt32LE(section + 16);
    if (rva >= start && rva + length <= start + size) {
      const offset = dll.readUInt32LE(section + 20) + rva - start;
      return dll.subarray(offset, offset + length);
    }
  }
  throw new Error("Crypto table is outside the DLL sections.");
}
function multiply(a: number, b: number): number {
  let result = 0;
  for (let bit = 0; bit < 8; bit++) {
    if (b & 1) result ^= a;
    a = ((a << 1) ^ (a & 128 ? 0x11b : 0)) & 255;
    b >>= 1;
  }
  return result;
}
function aesSubstitution(value: number): number {
  let inverse = value ? 1 : 0;
  for (let index = 0; index < 254; index++) inverse = multiply(inverse, value);
  let result = inverse ^ 0x63;
  for (let shift = 1; shift <= 4; shift++) result ^= ((inverse << shift) | (inverse >> (8 - shift))) & 255;
  return result;
}
const master = Buffer.from([...table(0x1a52600, 256)].map((value, index) => value ^ index ^ aesSubstitution(index)));
const streamSalt = Buffer.concat([Buffer.from([0xbf]), table(0x1a52520, 224), table(0x1a55d30 + 225, 31)]);
const streamState = Buffer.from([...master].map((value, index) => value ^ streamSalt[index]));
const substitution = table(0x1a566c0, 1024);
const logarithms = table(0x1a564c0, 256);
const exponents = table(0x1a565c0, 256);
const multipliers = table(0x1a564b0, 8);
const masks = table(0x1a56ac0, 8);
function parameters(uncompressed: number, compressed: number): Buffer {
  const result = Buffer.alloc(16);
  result.writeUInt32LE(uncompressed);
  result.writeUInt32LE(compressed, 8);
  return result;
}
function decrypt(input: Buffer, keyParameters: Buffer): Buffer {
  if (input.length < 16) throw new Error("Encrypted chunk is shorter than 16 bytes.");
  const result = Buffer.from(input);
  for (let index = 0; index < 16; index++) result[index] ^= keyParameters[index];
  const aes = createCipheriv("aes-128-ecb", keyParameters, null);
  aes.setAutoPadding(false);
  const key = Buffer.concat([aes.update(result.subarray(0, 16)), aes.final()]);
  key.copy(result);
  const state = Buffer.from(streamState);
  let j = 0;
  for (let index = 0; index < 256; index++) {
    j = (j + state[index] + key[index & 7]) & 255;
    [state[index], state[j]] = [state[j], state[index]];
  }
  let i = 0;
  j = 0;
  for (let offset = 16; offset < result.length; offset++) {
    i = (i + 1) & 255;
    j = (j + state[i]) & 255;
    [state[i], state[j]] = [state[j], state[i]];
    const value = state[(state[i] + state[j]) & 255];
    const operation = key[8 + (i & 7)] % 3;
    result[offset] = operation === 0 ? result[offset] ^ value : operation === 1 ? result[offset] - value : result[offset] + value;
  }
  for (let round = 0; round < 3; round++) {
    const permutation = table(0x1a564a0 - round * 16, 16);
    const chunk = Buffer.from(permutation.map((position) => result[position]));
    for (let index = 0; index < 16; index++) {
      const value = chunk[index];
      const factor = multipliers[index & 7];
      const product = value && factor ? exponents[(logarithms[value] + logarithms[factor]) % 255] : 0;
      result[index] = substitution[(index & 3) * 256 + product] ^ masks[index & 7];
    }
  }
  return result;
}
function decompressLz4(input: Buffer, expected: number): Buffer {
  if (expected > 256 * 1024 * 1024) throw new Error("Decompression chunk exceeds the 256 MiB limit.");
  const output = Buffer.alloc(expected);
  let source = 0;
  let destination = 0;
  function length(initial: number): number {
    let result = initial;
    if (initial === 15) {
      let next: number;
      do {
        if (source >= input.length) throw new Error("Truncated LZ4 length.");
        next = input[source++];
        result += next;
      } while (next === 255);
    }
    return result;
  }
  while (source < input.length) {
    const token = input[source++];
    const literals = length(token >> 4);
    if (source + literals > input.length || destination + literals > output.length) throw new Error("Invalid LZ4 literals.");
    input.copy(output, destination, source, source + literals);
    source += literals;
    destination += literals;
    if (source === input.length) break;
    if (source + 2 > input.length) throw new Error("Truncated LZ4 match offset.");
    const distance = input.readUInt16LE(source);
    source += 2;
    const matches = length(token & 15) + 4;
    if (!distance || distance > destination || destination + matches > output.length) throw new Error("Invalid LZ4 match.");
    for (let index = 0; index < matches; index++) {
      output[destination] = output[destination - distance];
      destination++;
    }
  }
  if (destination !== expected) throw new Error(`LZ4 size mismatch: ${destination} / ${expected}.`);
  return output;
}
function unpack(input: Buffer, expected: number, flags: number): Buffer {
  const compression = flags & 0x3f;
  if (compression === 0 && input.length === expected) return input;
  if (compression === 2 || compression === 3) return decompressLz4(input, expected);
  if (compression === 5) return decompressLz4(decrypt(input, parameters(expected, input.length)), expected);
  throw new Error(`Unsupported compression: ${compression}.`);
}
function unpackBundle(archive: Buffer, bundleOffset: number) {
  if (archive.length < 64 || !archive.subarray(0, 7).equals(Buffer.from("c39cc3a3c38a00", "hex"))) {
    throw new Error("Not a supported encrypted BLK archive. AssetBundle/0.blk is an index, not this archive format.");
  }
  if (archive.readUInt32BE(7) !== 0) throw new Error("Unsupported BLK header version.");
  const headerParameters = Buffer.alloc(16);
  Buffer.from(archive.subarray(11, 19)).reverse().copy(headerParameters);
  const header = decrypt(archive.subarray(19, 51), headerParameters);
  const bundleSize = header.readUInt32LE(0);
  if (header.readUInt32LE(4) !== 0 || bundleSize < 64 || bundleSize > archive.length) throw new Error("Invalid size in decrypted bundle header.");
  archive = archive.subarray(0, bundleSize);
  const compressedInfo = header.readUInt32LE(8);
  const uncompressedInfo = header.readUInt32LE(12);
  const archiveFlags = header.readUInt32LE(16);
  if (archiveFlags & 0x80) throw new Error("Metadata at the end of the archive is not supported.");
  if (!(archiveFlags & 0x200)) throw new Error("Unaligned header is not supported.");
  if (64 + compressedInfo > archive.length) throw new Error("Truncated metadata.");
  const info = unpack(archive.subarray(64, 64 + compressedInfo), uncompressedInfo, archiveFlags);
  let position = 16; // Unity's hash of the uncompressed data, not a directory entry.
  function take(length: number): number {
    const start = position;
    position += length;
    if (position > info.length) throw new Error("Truncated directory metadata.");
    return start;
  }
  const blockCount = info.readUInt32BE(take(4));
  const blocks = Array.from({ length: blockCount }, () => {
    const offset = take(10);
    return { uncompressed: info.readUInt32BE(offset), compressed: info.readUInt32BE(offset + 4), flags: info.readUInt16BE(offset + 8) };
  });
  const fileCount = info.readUInt32BE(take(4));
  const files = Array.from({ length: fileCount }, () => {
    const offset = take(20);
    const start = Number(info.readBigUInt64BE(offset));
    const size = Number(info.readBigUInt64BE(offset + 8));
    const flags = info.readUInt32BE(offset + 16);
    const end = info.indexOf(0, position);
    if (end === -1) throw new Error("Unterminated directory filename.");
    const name = info.subarray(position, end).toString("utf8").replaceAll("\\", "/");
    position = end + 1;
    if (!Number.isSafeInteger(start) || !Number.isSafeInteger(size) || !name || isAbsolute(name) || name.split("/").some((part) => part === ".." || part === "")) {
      throw new Error("Invalid file range or filename in archive.");
    }
    return { name, offset: start, size, flags };
  });
  if (position !== info.length) throw new Error("Unexpected trailing directory metadata.");
  const totalSize = blocks.reduce((sum, block) => sum + block.uncompressed, 0);
  if (totalSize > 1024 * 1024 * 1024) throw new Error("Archive exceeds the 1 GiB uncompressed limit.");
  if (new Set(files.map((file) => file.name)).size !== files.length || files.some((file) => file.name === "manifest.json" || file.offset + file.size > totalSize)) {
    throw new Error("Duplicate filenames or file ranges outside the uncompressed stream.");
  }
  let inputPosition = Math.ceil((64 + compressedInfo) / 16) * 16;
  const decoded = blocks.map((block) => {
    const end = inputPosition + block.compressed;
    if (end > archive.length) throw new Error("Truncated data block.");
    const output = unpack(archive.subarray(inputPosition, end), block.uncompressed, block.flags);
    inputPosition = end;
    return output;
  });
  if (inputPosition !== archive.length) throw new Error("Unexpected trailing archive bytes.");
  const stream = Buffer.concat(decoded, totalSize);
  const bundleDirectory = bundleOffset.toString(16).padStart(8, "0");
  const manifestFiles = files.map((file) => {
    const data = stream.subarray(file.offset, file.offset + file.size);
    const path = join(bundleDirectory, file.name);
    const target = join(actualOutputPath, path);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, data, { flag: "wx" });
    return { ...file, path, sha256: sha256(data) };
  });
  return { offset: bundleOffset, size: bundleSize, archiveFlags, compressedInfo, uncompressedInfo, blocks, files: manifestFiles };
}
const source = readFileSync(archivePath);
const bundles: ReturnType<typeof unpackBundle>[] = [];
mkdirSync(actualOutputPath);
let bundleOffset = 0;
while (bundleOffset < source.length) {
  // BLK files may concatenate multiple bundles with zero padding between them.
  if (source[bundleOffset] === 0) {
    bundleOffset++;
    continue;
  }
  const bundle = unpackBundle(source.subarray(bundleOffset), bundleOffset);
  bundles.push(bundle);
  bundleOffset += bundle.size;
}
if (!bundles.length) throw new Error("No supported bundles found.");
writeFileSync(join(actualOutputPath, "manifest.json"), JSON.stringify({
  source: archivePath, sourceSha256: sha256(source), unityPlayerSha256: playerHash, bundles,
}, null, 2) + "\n", { flag: "wx" });
console.log(`Extracted ${bundles.reduce((count, bundle) => count + bundle.files.length, 0)} files from ${bundles.length} bundles to ${actualOutputPath}`);
