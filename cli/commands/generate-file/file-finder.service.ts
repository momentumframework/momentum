import { Injectable } from "../../deps.ts";
import { FileInfo, FileIOService } from "../../global/mod.ts";
import { GenerateFileCommandParameters } from "./generate-file.command-parameters.ts";

@Injectable()
export class FileFinderService {
  constructor(
    private readonly fileIOService: FileIOService,
  ) {
  }

  getDestinationFile(
    commandParameters: GenerateFileCommandParameters,
    fileName: string,
  ): FileInfo {
    if (commandParameters.schematicType === "module") {
      let directory = this.fileIOService.getFileInfo(`src`);
      if (!directory.exists) {
        directory = this.fileIOService.getFileInfo(`../src`);
      }
      if (!directory.exists) {
        directory = this.fileIOService.getFileInfo(`./`);
      }
      const moduleDirectory = this.fileIOService.getFileInfo(
        this.fileIOService.joinPaths(
          directory.pathRelativeToUserDirectory,
          commandParameters.name,
        ),
      );
      if (!moduleDirectory.exists) {
        this.fileIOService.createDirectory(
          moduleDirectory.pathRelativeToUserDirectory,
        );
      }
      return this.fileIOService.getFileInfo(
        this.fileIOService.joinPaths(
          moduleDirectory.pathRelativeToUserDirectory,
          fileName,
        ),
      );
    }

    let directory = this.fileIOService.getFileInfo(
      `src/${commandParameters.name}`,
    );
    if (!directory.exists) {
      directory = this.fileIOService.getFileInfo(`${commandParameters.name}`);
    }
    if (!directory.exists) {
      directory = this.fileIOService.getFileInfo(`./`);
    }
    return this.fileIOService.getFileInfo(
      this.fileIOService.joinPaths(
        directory.pathRelativeToUserDirectory,
        fileName,
      ),
    );
  }

  getContainingModuleFile(
    commandParameters: GenerateFileCommandParameters,
  ): FileInfo {
    let moduleFile = this.searchForFileInfoByExactName(
      commandParameters,
      `${commandParameters.name}.module.ts`,
    );
    if (!moduleFile.exists) {
      moduleFile = this.findFileInDirectoryEndingWith(
        `${commandParameters.name}`,
        ".module.ts",
      );
    }
    if (!moduleFile.exists) {
      moduleFile = this.findFileInDirectoryEndingWith(`./`, ".module.ts");
    }
    if (!moduleFile.exists) {
      moduleFile = this.findFileInDirectoryEndingWith(`../`, ".module.ts");
    }
    if (!moduleFile.exists) {
      moduleFile = this.findFileInDirectoryEndingWith(`../../`, ".module.ts");
    }
    return moduleFile;
  }

  getDepsFile(commandParameters: GenerateFileCommandParameters): FileInfo {
    return this.searchForFileInfoByExactName(commandParameters, "deps.ts");
  }

  getAppModuleFile(commandParameters: GenerateFileCommandParameters): FileInfo {
    return this.searchForFileInfoByExactName(
      commandParameters,
      "app.module.ts",
    );
  }

  private searchForFileInfoByExactName(
    commandParameters: GenerateFileCommandParameters,
    fileOrDirectoryName: string,
  ) {
    let file = this.downwardFileInfoSearch(
      commandParameters,
      fileOrDirectoryName,
    );
    if (!file.exists) {
      file = this.upwardFileInfoSearch(fileOrDirectoryName, 5);
    }
    return file;
  }

  private downwardFileInfoSearch(
    commandParameters: GenerateFileCommandParameters,
    fileOrDirectoryName: string,
  ) {
    let file = this.fileIOService.getFileInfo(
      `src/${commandParameters.name}/${fileOrDirectoryName}`,
    );
    if (!file.exists) {
      file = this.fileIOService.getFileInfo(
        `${commandParameters.name}/${fileOrDirectoryName}`,
      );
    }
    if (!file.exists) {
      file = this.fileIOService.getFileInfo(`src/${fileOrDirectoryName}`);
    }
    if (!file.exists) {
      file = this.fileIOService.getFileInfo(`${fileOrDirectoryName}`);
    }
    return file;
  }

  private upwardFileInfoSearch(
    fileOrDirectoryName: string,
    maxIterations: number,
  ) {
    const tree = ["./"];

    for (let i = 0; i < maxIterations; i++) {
      const file = this.fileIOService.getFileInfo(
        this.fileIOService.joinPaths(...tree, fileOrDirectoryName),
      );
      if (file.exists) {
        return file;
      }
      tree.push("../");
    }

    return new FileInfo();
  }

  private findFileInDirectoryEndingWith(directory: string, endsWith: string) {
    const files = this.fileIOService.getDirectoryContents(directory);
    const file = files.find((f) => f.name.endsWith(endsWith));
    return file ? this.fileIOService.getFileInfo(file.name) : new FileInfo();
  }
}
