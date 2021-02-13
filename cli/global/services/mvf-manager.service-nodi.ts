import { existsSync } from "https://deno.land/std@0.85.0/fs/exists.ts";
import { join } from "https://deno.land/std@0.85.0/path/mod.ts";

export interface MvfFile {
  version: string;
}

export interface ToolConfig {
  name: string;
  url: string;
}

/**
 * Note that this is run out of a DI context for installation. We want to run
 * without metadata requirements to simply the `deno run` call, so DI will not
 * work. Therefore, do not use dependencies... for now.
 */
export class MvfManagerService {
  /**
   * Updates the local installation of `mvf`.
   *
   * @param version The requested version in the format of #.#.# (no v prefix)
   */
  async update(version: string | null) {
    let installUrl = "https://deno.land/x/momentum/cli/main.ts";

    if (version?.length) {
      const { versions } = await this.getVersionInfoFromDenoLand();
      if (!versions.find((v) => v === `v${version}`)) {
        throw new Error("Could not find specified version.");
      }

      installUrl = [
        "https://deno.land/x/momentum@v",
        version,
        "cli/main.ts",
      ].join("/");
    }

    await this.runInstall(
      installUrl,
    );
  }

  /**
   * Updates the local installation of `mvf`.
   *
   * @param version The requested version in the format of #.#.# (no v prefix)
   */
  async install() {
    await this.initializeMvDirectory();
    await this.runInstall(
      `./main.ts`,
    );
  }

  async getMvInstallationPaths() {
    const { stdout: denoInfoJson } = await this.executeCommand(
      `deno info --unstable --json`,
    );
    const { denoDir } = JSON.parse(denoInfoJson);

    const mvDirAbsolutePath = this.joinPaths(denoDir, ".mv");
    const mvfFileAbsolutePath = this.joinPaths(mvDirAbsolutePath, "mvf.json");
    const toolsFileAbsolutePath = this.joinPaths(
      mvDirAbsolutePath,
      "tools.json",
    );
    const tsConfigAbsolutePath = this.joinPaths(
      mvDirAbsolutePath,
      "tsconfig.json",
    );

    return {
      mvDirAbsolutePath,
      toolsFileAbsolutePath,
      tsConfigAbsolutePath,
      mvfFileAbsolutePath,
    };
  }

  private async initializeMvDirectory() {
    const {
      mvDirAbsolutePath,
      toolsFileAbsolutePath,
      tsConfigAbsolutePath,
      mvfFileAbsolutePath,
    } = await this.getMvInstallationPaths();

    this.createDirectoryIfNotExists(mvDirAbsolutePath);
    this.createFileIfNotExists(
      toolsFileAbsolutePath,
      JSON.stringify([] as ToolConfig[]),
    );
    this.createFileIfNotExists(
      tsConfigAbsolutePath,
      JSON.stringify({
        "compilerOptions": {
          "experimentalDecorators": true,
          "emitDecoratorMetadata": true,
        },
      }),
    );
    this.createFileIfNotExists(
      mvfFileAbsolutePath,
      JSON.stringify({
        version: await this.getRequestedVersion(),
      } as MvfFile),
    );
  }

  private async getRequestedVersion() {
    const version = import.meta.url
      .split("/")
      .find((part) => part.match(/v[0-9]*\.[0-9]*\.[0-9]*/g));

    if (version) {
      return version.replace("v", "");
    }

    const denoLandVersions = await this.getVersionInfoFromDenoLand();
    return denoLandVersions.latest.replace("v", "");
  }

  private async runInstall(cliMainTsUrl: string) {
    const {
      tsConfigAbsolutePath,
    } = await this.getMvInstallationPaths();

    await this.executeCommand([
      "deno",
      "install",
      "-A",
      "--unstable",
      `-c ${tsConfigAbsolutePath}`,
      cliMainTsUrl,
    ]);
  }

  private async getVersionInfoFromDenoLand() {
    const response = await fetch(
      "https://cdn.deno.land/momentum/meta/versions.json",
    );
    const body: {
      latest: string;
      versions: string[];
    } = await response.json();
    return body;
  }

  private async executeCommand(cmd: string[] | string) {
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

  private createDirectoryIfNotExists(absolutePath: string) {
    if (!existsSync(absolutePath)) {
      Deno.mkdirSync(absolutePath);
    }
  }

  private createFileIfNotExists(absolutePath: string, contents: string) {
    if (!existsSync(absolutePath)) {
      Deno.writeFileSync(absolutePath, new TextEncoder().encode(contents));
    }
  }

  private writeToFile(absolutePath: string, contents: string) {
    Deno.writeFileSync(absolutePath, new TextEncoder().encode(contents));
  }

  private joinPaths(...paths: string[]) {
    return join(...paths);
  }
}
