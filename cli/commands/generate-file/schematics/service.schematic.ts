import { Schematic } from "./schematic.interface.ts";

export const SERVICE_SCHEMATIC: Schematic = {
  type: "service",
  fileNameTemplate: "__name__.service.ts",
  template: `import { Injectable } from "__depsPath__";

@Injectable(__injectableOptions__)
export class __className__ {}
`,
};
