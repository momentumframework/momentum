import { Injectable } from "../../deps.ts";
import { SystemService } from "../../global/index.ts";
import { CommandHandler } from "../command-handler.interface.ts";
import { NewProjectCommandParameters } from "./new-project.command-parameters.ts";

@Injectable({ global: false })
export class NewProjectCommandHandler
  implements CommandHandler<NewProjectCommandParameters> {
  constructor(
    private readonly systemService: SystemService,
  ) {
  }

  handle(commandParameters: NewProjectCommandParameters) {
    // TODO: Pull git repo
    // TODO: Apply templating
    throw new Error("Method not implemented.");
  }
}
