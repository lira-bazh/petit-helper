import { spawn } from "node:child_process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const children = [
  spawn("pnpm", ["i18n:compile", "--watch"], { stdio: "inherit" }),
  spawn(process.execPath, [require.resolve("next/dist/bin/next"), "dev", ...process.argv.slice(2)], {
    stdio: "inherit",
  }),
];

let stopping = false;
function stop(code, signal = "SIGTERM") {
  if (stopping) return;
  stopping = true;
  process.exitCode = code;
  for (const child of children) child.kill(signal);
}

for (const child of children) {
  child.on("error", (error) => {
    console.error(error);
    stop(1);
  });
  child.on("exit", (code) => stop(code ?? 1));
}
process.on("SIGINT", () => stop(130, "SIGINT"));
process.on("SIGTERM", () => stop(143));
