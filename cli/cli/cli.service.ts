import { Command, Inject, Injectable } from "../deps.ts";

@Injectable({ global: false })
export class CliService {
  constructor(
    @Inject("MVF_COMMANDS") private readonly commands: Command[],
  ) {
  }

  startProgram() {
    const program = new Command("mvf");

    program.version("0.0.1");

    program
      .option("-v, --verbose", "enable verbose mode");

    this.commands.forEach((c) => program.addCommand(c));

    program.parse(Deno.args);
  }
}
