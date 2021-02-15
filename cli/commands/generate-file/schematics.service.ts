import { Injectable } from "../../deps.ts";
import { FileIOService } from "../../global/mod.ts";
import { SchematicType } from "./generate-file.command-parameters.ts";

export interface SchematicDetails {
  schematicFileContents: string;
  schematicFileName: string;
}

@Injectable({ global: false })
export class SchematicsService {
  constructor(
    private readonly fileIOService: FileIOService,
  ) {
  }

  getSchematicDetails(type: SchematicType): SchematicDetails {
    const schematicsDirectoryPath = this.fileIOService
      .getCliWorkingDirectoryPath("schematics");

    const files = this.fileIOService.getDirectoryContents(
      schematicsDirectoryPath,
    );

    const file = files.find((f: Deno.DirEntry) =>
      f.isFile && f.name.endsWith(`.${type}.ts.tpl`)
    );

    if (!file) {
      throw new Error(`Could not find schematic for type "${type}".`);
    }

    const schematicFilePath = this.fileIOService.getCliWorkingDirectoryPath([
      "schematics",
      file.name,
    ]);

    return {
      schematicFileContents: this.fileIOService.readFile(schematicFilePath),
      schematicFileName: file.name,
    };
  }
}
