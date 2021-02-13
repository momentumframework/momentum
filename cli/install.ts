import { getMvInstallationPaths } from "./install/paths.ts";
import {
  createDirectoryIfNotExists,
  createFileIfNotExists,
  executeCommand,
} from "./install/utilities.ts";

async function initializeMvDirectory() {
  const {
    mvDirAbsolutePath,
    toolsFileAbsolutePath,
    tsConfigAbsolutePath,
  } = await getMvInstallationPaths();

  createDirectoryIfNotExists(mvDirAbsolutePath);
  createFileIfNotExists(toolsFileAbsolutePath, `[]`);
  createFileIfNotExists(
    tsConfigAbsolutePath,
    JSON.stringify({
      "compilerOptions": {
        "experimentalDecorators": true,
        "emitDecoratorMetadata": true,
      },
    }),
  );
}

async function runInstall(cliMainTsUrl: string) {
  const {
    tsConfigAbsolutePath,
  } = await getMvInstallationPaths();

  await executeCommand([
    "deno",
    "install",
    "-A",
    "--unstable",
    `-c ${tsConfigAbsolutePath}`,
    cliMainTsUrl,
  ]);
}

await initializeMvDirectory();
await runInstall(
  `./main.ts`,
);
