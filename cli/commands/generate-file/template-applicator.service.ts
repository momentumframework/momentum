import { Injectable } from "../../deps.ts";
import { FileIOService, SystemService } from "../../global/index.ts";
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
        this.fileIOService.recursiveFileSearch("deps.ts"),
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
      .replaceAll("__name__", commandParameters.name)
      .replaceAll(
        ".tpl",
        "",
      );
  }

  async addGeneratedFileToModule(
    commandParameters: GenerateFileCommandParameters,
    generatedFilePath: string,
  ) {
    const moduleFilePath = this.fileIOService.recursiveFileSearch(
      ".module.ts",
      {
        findType: "endsWith",
        maxDirectoryAttempts: 5,
      },
    );

    const originalModuleFileContents = this.fileIOService.readFile(
      moduleFilePath,
    );

    if (!originalModuleFileContents.includes("@MvModule")) {
      return;
    }

    try {
      await this.applyDenoFmt(moduleFilePath);
      let updatedModuleFileContents = this.injectItemIntoModuleFile(
        commandParameters,
        originalModuleFileContents,
      );
      updatedModuleFileContents = this.injectImportIntoModuleFile(
        updatedModuleFileContents,
        commandParameters,
        moduleFilePath,
        generatedFilePath,
      );
      this.fileIOService.writeFile(moduleFilePath, updatedModuleFileContents);
      await this.applyDenoFmt(moduleFilePath);
    } catch (ex) {
      this.fileIOService.writeFile(moduleFilePath, originalModuleFileContents);
      throw ex;
    }
  }

  private injectItemIntoModuleFile(
    commandParameters: GenerateFileCommandParameters,
    originalModuleFileContents: string,
  ) {
    const arrayProperty = commandParameters.schematicType === "controller"
      ? "controllers"
      : "providers";

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
    updatedModuleFileContents: string,
    commandParameters: GenerateFileCommandParameters,
    moduleFile: string,
    generatedFilePath: string,
  ) {
    const importPath = this.fileIOService.getRelativePathBetween(
      this.fileIOService.getUserWorkingDirectoryPath(moduleFile),
      generatedFilePath,
    ).replaceAll("..\\", "./").replaceAll("\\", "./");
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
