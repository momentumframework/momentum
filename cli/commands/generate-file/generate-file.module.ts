import { MvModule } from "../../deps.ts";
import { GenerateFileCommandController } from "./generate-file.command-controller.ts";
import { GenerateFileCommandHandler } from "./generate-file.command-handler.ts";
import { SchematicsService } from "./schematics.service.ts";
import {
  CONTROLLER_SCHEMATIC,
  MODULE_SCHEMATIC,
  SERVICE_SCHEMATIC,
} from "./schematics/mod.ts";
import { TemplateApplicatorService } from "./template-applicator.service.ts";

@MvModule({
  providers: [
    TemplateApplicatorService,
    GenerateFileCommandController,
    GenerateFileCommandHandler,
    {
      provide: SchematicsService,
      useValue: new SchematicsService([
        CONTROLLER_SCHEMATIC,
        MODULE_SCHEMATIC,
        SERVICE_SCHEMATIC,
      ]),
    },
  ],
  exports: [
    GenerateFileCommandController,
  ],
})
export class GenerateFileCommandModule {}
