import { SchematicType } from "../generate-file.command-parameters.ts";

export interface Schematic {
  type: SchematicType;
  fileNameTemplate: string;
  template: string;
}
