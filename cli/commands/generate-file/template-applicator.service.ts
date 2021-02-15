import { Injectable } from "../../deps.ts";
import { FileInfo, FileIOService, SystemService } from "../../global/mod.ts";
import { GenerateFileCommandParameters } from "./generate-file.command-parameters.ts";

@Injectable({ global: false })
export class TemplateApplicatorService {
  constructor(
    private readonly fileIOService: FileIOService,
    private readonly systemService: SystemService,
  ) {
  }

  /**
   * @returns the templated schematic to be written to file
  */
  applySchematicTemplating(
    commandParameters: GenerateFileCommandParameters,
    schematicFileContents: string,
  ) {
    let depsPath = "./deps.ts";
    if (commandParameters.files.depsFile.exists) {
      depsPath = this.fileIOService.getRelativePathBetween(
        commandParameters.files.destinationFile.pathAbsolute,
        commandParameters.files.depsFile.pathAbsolute,
      );
    }

    const templated = schematicFileContents
      .replaceAll("__name__", commandParameters.name)
      .replaceAll("__className__", commandParameters.className)
      .replaceAll(
        "__injectableOptions__",
        Object.keys(commandParameters.injectableOptions).length
          ? JSON.stringify(commandParameters.injectableOptions)
          : "",
      )
      .replaceAll(
        "__depsPath__",
        depsPath,
      );

    return templated;
  }

  /**
   * @returns the templated schematic to be written to file
  */
  applySchematicNameTemplating(
    commandParameters: GenerateFileCommandParameters,
    schematicFileName: string,
  ) {
    return schematicFileName
      .replaceAll("__name__", commandParameters.name);
  }

  async writeGeneratedFile(
    commandParameters: GenerateFileCommandParameters,
    fileContents: string,
  ) {
    this.fileIOService.writeFile(
      commandParameters.files.destinationFile.pathAbsolute,
      fileContents,
    );

    await this.applyDenoFmt(
      commandParameters.files.destinationFile.pathAbsolute,
    );
  }

  async addGeneratedFileToModule(
    commandParameters: GenerateFileCommandParameters,
  ) {
    let moduleFile = commandParameters.files.containingModuleFile;
    if (
      !commandParameters.files.containingModuleFile.exists ||
      commandParameters.schematicType === "module"
    ) {
      moduleFile = commandParameters.files.appModuleFile;
    }
    if (!moduleFile.exists) {
      return;
    }

    const originalModuleFileContents = this.fileIOService.readFile(
      moduleFile.pathAbsolute,
    );

    if (!originalModuleFileContents.includes("@MvModule")) {
      return;
    }

    try {
      await this.applyDenoFmt(moduleFile.pathAbsolute);
      let updatedModuleFileContents = this.injectItemIntoModuleOptions(
        commandParameters,
        originalModuleFileContents,
      );
      updatedModuleFileContents = this.injectImportIntoModuleFile(
        commandParameters,
        moduleFile,
        updatedModuleFileContents,
      );
      this.fileIOService.writeFile(
        moduleFile.pathAbsolute,
        updatedModuleFileContents,
      );
      await this.applyDenoFmt(moduleFile.pathAbsolute);
    } catch (ex) {
      this.fileIOService.writeFile(
        moduleFile.pathAbsolute,
        originalModuleFileContents,
      );
      throw ex;
    }
  }

  private injectItemIntoModuleOptions(
    commandParameters: GenerateFileCommandParameters,
    originalModuleFileContents: string,
  ) {
    let arrayProperty = "providers";
    if (commandParameters.schematicType === "controller") {
      arrayProperty = "controllers";
    } else if (commandParameters.schematicType === "module") {
      arrayProperty = "imports";
    }

    const lines = originalModuleFileContents.split(/\r?\n/);

    const mvModuleLineStartIndex = lines.findIndex((line) =>
      line.includes("@MvModule({")
    );

    const arrayLineStartIndex = lines.findIndex((line, index) =>
      index >= mvModuleLineStartIndex &&
      line.replaceAll(" ", "").includes(`${arrayProperty}:[`)
    );

    if (arrayLineStartIndex >= 0) {
      lines[arrayLineStartIndex] = lines[arrayLineStartIndex].replace(
        "[",
        `[${commandParameters.className},`,
      );
    } else {
      lines[mvModuleLineStartIndex] = lines[mvModuleLineStartIndex].replace(
        "@MvModule({",
        `@MvModule({${arrayProperty}:[${commandParameters.className}],`,
      );
    }

    return lines.join("\n\r");
  }

  private injectImportIntoModuleFile(
    commandParameters: GenerateFileCommandParameters,
    moduleFile: FileInfo,
    updatedModuleFileContents: string,
  ) {
    const importPath = this.fileIOService.getRelativePathBetween(
      moduleFile.pathAbsolute,
      commandParameters.files.destinationFile.pathAbsolute,
    );

    return [
      `import { ${commandParameters.className} } from "${importPath}";`,
      updatedModuleFileContents,
    ].join("\n\r");
  }

  private async applyDenoFmt(filePath: string) {
    const response = await this.systemService.executeCommand([
      "deno",
      "fmt",
      filePath,
    ]);

    if (response.stderror && response.stderror.includes("Error formatting")) {
      throw new Error(
        "There was an error formatting the file. Could not inject generated file.",
      );
    }
  }
}
