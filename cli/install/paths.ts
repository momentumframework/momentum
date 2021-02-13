import { executeCommand, joinPaths } from "./utilities.ts";

export async function getMvInstallationPaths() {
  const { stdout: denoInfoJson } = await executeCommand(
    `deno info --unstable --json`,
  );
  const { denoDir } = JSON.parse(denoInfoJson);

  const mvDirAbsolutePath = joinPaths(denoDir, ".mv");
  const toolsFileAbsolutePath = joinPaths(mvDirAbsolutePath, "tools.json");
  const tsConfigAbsolutePath = joinPaths(mvDirAbsolutePath, "tsconfig.json");

  return {
    mvDirAbsolutePath,
    toolsFileAbsolutePath,
    tsConfigAbsolutePath,
  };
}
