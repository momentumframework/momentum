import { SchematicType } from "./generate-file.command-parameters.ts";
import { Schematic } from "./schematics/schematic.interface.ts";

export class SchematicsService {
  constructor(
    private readonly schematics: Schematic[], 
  ) {
  }

  getSchematicDetails(type: SchematicType): Schematic {
    const schematic = this.schematics.find(s => s.type === type);
    if (!schematic) {
      throw new Error(`Schematic could not be found for type "${type}".`);
    }
    return schematic;
  }
}
