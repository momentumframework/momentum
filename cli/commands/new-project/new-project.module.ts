import { MvModule } from "../../deps.ts";
import { NewProjectCommandController } from "./new-project.command-controller.ts";
import { NewProjectCommandHandler } from "./new-project.command-handler.ts";

@MvModule({
  providers: [
    NewProjectCommandController,
    NewProjectCommandHandler,
  ],
  exports: [
    NewProjectCommandController,
  ],
})
export class NewProjectCommandModule {}
