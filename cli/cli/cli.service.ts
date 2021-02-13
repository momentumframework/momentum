import { Command, Inject, Injectable } from "../deps.ts";
import { FileIOService, MvfFile, MvfManagerService } from "../global/mod.ts";
import { MVF_COMMANDS } from "../tokens.ts";

@Injectable({ global: false })
export class CliService {
  constructor(
    @Inject(MVF_COMMANDS) private readonly commands: Command[],
    private readonly mvfManager: MvfManagerService,
    private readonly fileIOService: FileIOService,
  ) {
  }

  async startProgram() {
    const program = new Command("mvf");

    program.version(await this.getCurrentVersion());

    program
      .option("-v, --verbose", "enable verbose mode");

    this.commands.forEach((c) => program.addCommand(c));

    program.parse(Deno.args);
  }

  private async getCurrentVersion() {
    const { mvfFileAbsolutePath } = await this.mvfManager
      .getMvInstallationPaths();
    const mvfFileContents = this.fileIOService.readFile(mvfFileAbsolutePath);
    const mvfFile: MvfFile = JSON.parse(mvfFileContents);
    return mvfFile.version;
  }
}
