import { Injectable } from "../../deps.ts";
import { FileIOService } from "../../global/index.ts";
import { GenerateFileCommandParameters } from "./generate-file.command-parameters.ts";
import { SchematicsService } from "./schematics.service.ts";
import { TemplateApplicatorService } from "./template-applicator.service.ts";
import { CommandHandler } from "../command-handler.interface.ts";

@Injectable({ global: false })
export class GenerateFileCommandHandler
  implements CommandHandler<GenerateFileCommandParameters> {
  constructor(
    private readonly schematicsService: SchematicsService,
    private readonly templateApplicator: TemplateApplicatorService,
    private readonly fileIOService: FileIOService,
  ) {
  }

  async handle(commandParameters: GenerateFileCommandParameters) {
    const { schematicFileContents, schematicFileName } = this.schematicsService
      .getSchematicDetails(commandParameters.schematicType);

    const generatedFileContents = this.templateApplicator
      .applySchematicTemplating(commandParameters, schematicFileContents);

    const generatedFileName = this.templateApplicator
      .applySchematicNameTemplating(commandParameters, schematicFileName);

    const generatedFilePath = this.writeGeneratedFile(
      generatedFileName,
      generatedFileContents,
    );

    if (
      !commandParameters.skipImport &&
      (commandParameters.isGlobalService ||
        commandParameters.schematicType === "controller")
    ) {
      await this.templateApplicator.addGeneratedFileToModule(
        commandParameters,
        generatedFilePath,
      );
    }
  }

  private writeGeneratedFile(fileName: string, fileContents: string) {
    const path = this.fileIOService.getUserWorkingDirectoryPath(fileName);

    if (this.fileIOService.doesPathExist(path)) {
      throw new Error(
        `A file already exists at ${path}. Could not write file.`,
      );
    }

    this.fileIOService.writeFile(path, fileContents);

    return path;
  }
}
