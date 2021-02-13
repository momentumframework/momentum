import { Command, Injectable } from "../../deps.ts";
import { CommandController } from "../command-controller.interface.ts";
import {
  GenerateFileCommandParameters,
  SchematicType,
} from "./generate-file.command-parameters.ts";
import { GenerateFileCommandHandler } from "./generate-file.command-handler.ts";
import { InjectableOptions } from "../../../di/mod.ts";

@Injectable({ global: false })
export class GenerateFileCommandController implements CommandController {
  constructor(
    private readonly commandHandler: GenerateFileCommandHandler,
  ) {
  }

  createCommand(): Command {
    const command = new Command("generate");
    command.description("Generates a new file from a schematic.");
    command.alias("g");
    command.arguments("<schematic> <name>");
    command.option(
      "-gl, --global [global]",
      "Enable/disable global injection scope",
    );
    command.option(
      "-si, --skip-import [skipImport]",
      "Prevent auto-importing into the nearest module",
    );
    command.action(
      (schematicType: string, name: string, command: Command) => {
        const injectableOptions: InjectableOptions = {};
        if (command.global === "false" || command.global === false) {
          injectableOptions.global = false;
        }

        const commandParameters = new GenerateFileCommandParameters({
          providedSchematic: schematicType,
          providedName: name,
          injectableOptions,
          skipImport: command.skipImport === "true" ||
            command.skipImport === true,
        });

        return this.commandHandler.handle(commandParameters);
      },
    );
    return command;
  }
}
