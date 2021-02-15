import { Schematic } from "./schematic.interface.ts";

export const CONTROLLER_SCHEMATIC: Schematic = {
  type: "controller",
  fileNameTemplate: "__name__.controller.ts",
  template: `import { Controller } from "__depsPath__";

@Controller("__name__")
export class __className__ {}
`,
};
