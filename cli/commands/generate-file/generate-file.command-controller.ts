import { Command, Injectable } from "../../deps.ts";
import { CommandController } from "../command-controller.interface.ts";
import {
  GenerateFileCommandParameters,
  SchematicType,
} from "./generate-file.command-parameters.ts";
import { GenerateFileCommandHandler } from "./generate-file.command-handler.ts";

@Injectable({ global: false })
export class GenerateFileCommandController implements CommandController {
  constructor(
    private readonly commandHandler: GenerateFileCommandHandler,
  ) {
  }

  createCommand(): Command {
    const command = new Command("generate");
    command.arguments("<schematic> <name>");
    command.action((schematicType: SchematicType, name: string) => {
      const commandParameters = new GenerateFileCommandParameters({
        schematicType,
        providedName: name,
      });
      return this.commandHandler.handle(commandParameters);
    });
    return command;
  }
}
