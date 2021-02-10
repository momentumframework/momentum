import { Command, Injectable } from "../../deps.ts";
import { CommandController } from "../command-controller.interface.ts";
import { NewProjectCommandHandler } from "./new-project.command-handler.ts";
import { NewProjectCommandParameters } from "./new-project.command-parameters.ts";

@Injectable({ global: false })
export class NewProjectCommandController implements CommandController {
  constructor(
    private readonly commandHandler: NewProjectCommandHandler,
  ) {
  }

  createCommand(): Command {
    const newProjectCommand = new Command("new");
    newProjectCommand.arguments("<name>");
    newProjectCommand.option(
      "-r, --repository-url [repositoryUrl]",
      "full URL of the repository to clone",
    );
    newProjectCommand.action((name: string, command: Command) => {
      const defaultRepositoryUrl =
        "https://github.com/KerryRitter/momentum-api-starter";

      const commandParameters = new NewProjectCommandParameters({
        providedName: name,
        repositoryUrl: command.repositoryUrl ?? defaultRepositoryUrl,
      });

      return this.commandHandler.handle(commandParameters);
    });
    return newProjectCommand;
  }
}
