import { existsSync } from "https://deno.land/std@0.85.0/fs/exists.ts";
import { join } from "https://deno.land/std@0.85.0/path/mod.ts";
import { Injectable } from "../../../di/decorators/injectable.ts";

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
@Injectable()
export class MvfManagerService {
  private readonly versionRegex = /v[0-9]*\.[0-9]*\.[0-9]*/g;

  /**
   * Updates the local installation of `mvf`.
   *
   * @param requestedVersion The requested version in the format of #.#.# (no v prefix)
   */
  async upgrade(requestedVersion: string | null) {
    const installUrl = await this.getInstallUrlForRequestedVersion(
      requestedVersion,
    );

    await this.runInstall(installUrl);
  }

  async install() {
    await this.initializeMvDirectory();
    const installUrl = await this.getInstallUrlForRequestedVersion(null);
    await this.runInstall(installUrl);
  }

  async getMvInstallationPaths() {
    const { stdout: denoInfoJson } = await this.executeCommand(
      `deno info --unstable --json`,
    );
    const { denoDir } = JSON.parse(denoInfoJson);

    const mvDirAbsolutePath = this.joinPaths(denoDir, ".mv");
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
    };
  }

  private async getInstallUrlForRequestedVersion(
    requestedVersion: string | null,
  ) {
    const versionInfo = await this.getVersionInfoFromDenoLand();

    let version = versionInfo.latest;
    if (requestedVersion?.length) {
      const foundRequestedVersion = versionInfo.versions.find((v) =>
        v === `v${version}`
      );
      if (!foundRequestedVersion) {
        throw new Error("Could not find specified version.");
      }
      version = foundRequestedVersion;
    }

    return `https://deno.land/x/momentum@${version}/cli/main.ts`;
  }

  private async initializeMvDirectory() {
    const {
      mvDirAbsolutePath,
      toolsFileAbsolutePath,
      tsConfigAbsolutePath,
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
  }

  private async runInstall(cliMainTsUrl: string) {
    const {
      tsConfigAbsolutePath,
    } = await this.getMvInstallationPaths();

    const results = await this.executeCommand([
      "deno",
      "install",
      "--unstable",
      "-A",
      "-f",
      "-n",
      "mvf",
      "-c",
      tsConfigAbsolutePath,
      cliMainTsUrl,
    ]);

    if (!results.status.success) {
      console.error(`Error installing: ${results.stderror}`);
    } else {
      console.log(
        "Successfully installed mvf! Run `mvf --version` to validate.",
      );
    }
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
      Deno.writeTextFileSync(absolutePath, contents);
    }
  }

  /**
   * @returns Version with a "v" prefix
   */
  getInstallVersion() {
    const path = `${Deno.env.get("HOME")}/.deno/bin/mvf`;
    const shellContents = Deno.readTextFileSync(path);
    return shellContents.match(this.versionRegex)?.pop();
  }

  private joinPaths(...paths: string[]) {
    return join(...paths);
  }
}
