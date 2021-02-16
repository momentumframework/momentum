import { Command, Inject, Injectable } from "../deps.ts";
import { MvfManagerService } from "../global/mod.ts";
import { MVF_COMMANDS } from "../tokens.ts";

@Injectable({ global: false })
export class CliService {
  constructor(
    @Inject(MVF_COMMANDS) private readonly commands: Command[],
    private readonly mvfManager: MvfManagerService,
  ) {
  }

  startProgram() {
    const program = new Command("mvf");

    program.version(this.mvfManager.getInstallVersion() ?? "");

    program
      .option("-v, --verbose", "enable verbose mode");

    this.commands.forEach((c) => program.addCommand(c));

    program.parse(Deno.args);
  }
}
