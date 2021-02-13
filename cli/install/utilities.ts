import { existsSync } from "https://deno.land/std@0.85.0/fs/exists.ts";
import { join } from "https://deno.land/std@0.85.0/path/mod.ts";

export async function executeCommand(cmd: string[] | string) {
  if (typeof cmd === "string") {
    cmd = cmd.split(" ");
  }

  const p = Deno.run({ cmd, stderr: "piped", stdout: "piped" });

  const [status, stdoutBytes, stderrBytes] = await Promise.all([
    p.status(),
    p.output(),
    p.stderrOutput(),
  ]);
  p.close();

  const stdout = new TextDecoder("utf-8").decode(stdoutBytes);
  const stderror = new TextDecoder("utf-8").decode(stderrBytes);

  return {
    status,
    stdout,
    stderror,
  };
}

export function createDirectoryIfNotExists(absolutePath: string) {
  if (!existsSync(absolutePath)) {
    Deno.mkdirSync(absolutePath);
  }
}

export function createFileIfNotExists(absolutePath: string, contents: string) {
  if (!existsSync(absolutePath)) {
    Deno.writeFileSync(absolutePath, new TextEncoder().encode(contents));
  }
}

export function joinPaths(...paths: string[]) {
  return join(...paths);
}
