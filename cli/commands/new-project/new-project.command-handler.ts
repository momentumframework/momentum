import { Injectable } from "../../deps.ts";
import { SystemService } from "../../global/mod.ts";
import { CommandHandler } from "../command-handler.interface.ts";
import { NewProjectCommandParameters } from "./new-project.command-parameters.ts";

@Injectable({ global: false })
export class NewProjectCommandHandler
  implements CommandHandler<NewProjectCommandParameters> {
  constructor(
    private readonly systemService: SystemService,
  ) {
  }

  async handle(commandParameters: NewProjectCommandParameters) {
    await this.systemService.executeCommand(
      `git clone ${commandParameters.repositoryUrl} ./${commandParameters.name}`,
    );
  }
}
