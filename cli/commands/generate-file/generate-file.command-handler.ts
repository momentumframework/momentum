import { Injectable } from "../../deps.ts";
import { GenerateFileCommandParameters } from "./generate-file.command-parameters.ts";
import { SchematicsService } from "./schematics.service.ts";
import { TemplateApplicatorService } from "./template-applicator.service.ts";
import { CommandHandler } from "../command-handler.interface.ts";
import { FileFinderService } from "./file-finder.service.ts";

@Injectable({ global: false })
export class GenerateFileCommandHandler
  implements CommandHandler<GenerateFileCommandParameters> {
  constructor(
    private readonly schematicsService: SchematicsService,
    private readonly templateApplicator: TemplateApplicatorService,
    private readonly fileFinderService: FileFinderService,
  ) {
  }

  async handle(commandParameters: GenerateFileCommandParameters) {
    const schematic = this.schematicsService
      .getSchematicDetails(commandParameters.schematicType);

    const generatedFileName = this.templateApplicator
      .applySchematicNameTemplating(
        commandParameters,
        schematic.fileNameTemplate,
      );

    commandParameters.files.destinationFile = this.fileFinderService
      .getDestinationFile(commandParameters, generatedFileName);

    if (commandParameters.files.destinationFile.exists) {
      throw new Error(
        `Could not generate: File found at ${commandParameters.files.destinationFile.pathAbsolute}`,
      );
    }

    commandParameters.files.depsFile = this.fileFinderService.getDepsFile(
      commandParameters,
    );
    commandParameters.files.appModuleFile = this.fileFinderService
      .getAppModuleFile(commandParameters);
    commandParameters.files.containingModuleFile = this.fileFinderService
      .getContainingModuleFile(commandParameters);

    const generatedFileContents = this.templateApplicator
      .applySchematicTemplating(commandParameters, schematic.template);

    await this.templateApplicator.writeGeneratedFile(
      commandParameters,
      generatedFileContents,
    );

    if (commandParameters.schematicType === "controller") {
      await this.templateApplicator.addGeneratedFileToModule(
        commandParameters,
      );
    } else if (commandParameters.schematicType === "service") {
      if (!commandParameters.skipImport && !commandParameters.isGlobalService) {
        await this.templateApplicator.addGeneratedFileToModule(
          commandParameters,
        );
      }
    } else if (commandParameters.schematicType === "module") {
      await this.templateApplicator.addGeneratedFileToModule(
        commandParameters,
      );
    }
  }
}
