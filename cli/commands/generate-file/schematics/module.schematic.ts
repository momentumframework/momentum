import { Schematic } from "./schematic.interface.ts";

export const MODULE_SCHEMATIC: Schematic = {
  type: "module",
  fileNameTemplate: "__name__.module.ts",
  template: `import { MvModule } from "__depsPath__";

@MvModule({})
export class __className__ {}
`,
};
