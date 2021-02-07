import { MvModule } from "../../deps.ts";
import { GenerateFileCommandController } from "./generate-file.command-controller.ts";
import { GenerateFileCommandHandler } from "./generate-file.command-handler.ts";
import { SchematicsService } from "./schematics.service.ts";
import { TemplateApplicatorService } from "./template-applicator.service.ts";

@MvModule({
  providers: [
    SchematicsService,
    TemplateApplicatorService,
    GenerateFileCommandController,
    GenerateFileCommandHandler,
  ],
  exports: [
    GenerateFileCommandController,
  ],
})
export class GenerateFileCommandModule {}
