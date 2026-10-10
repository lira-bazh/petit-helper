import { execFile } from "node:child_process";

export async function requestTelegramWithCurl(url: string, body: string): Promise<Response> {
  const output = await new Promise<string>((resolve, reject) => {
    const child = execFile("curl", [
      "--silent", "--show-error", "--no-verbose", "--max-time", "10",
      "--config", "-", "--request", "POST",
      "--header", "Content-Type: application/json",
      "--write-out", "\n%{http_code}",
    ], { timeout: 12000, maxBuffer: 2 * 1024 * 1024 }, (error, stdout) => {
      if (error) {
        const failure = new Error("curl request failed");
        if (error.code === 28 || error.killed) failure.name = "TimeoutError";
        failure.cause = { code: typeof error.code === "number" ? `CURL_EXIT_${error.code}` : error.code };
        reject(failure);
      } else {
        resolve(stdout);
      }
    });
    // Keep the token and message content out of command arguments.
    child.stdin?.on("error", () => {});
    child.stdin?.end(`url = ${JSON.stringify(url)}\ndata = ${JSON.stringify(body)}\n`);
  });
  const separator = output.lastIndexOf("\n");
  return new Response(output.slice(0, separator), { status: Number(output.slice(separator + 1)) });
}
