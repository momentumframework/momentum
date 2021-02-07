import { MvModule } from "../deps.ts";
import { CommandController } from "./command-controller.interface.ts";
import {
  GenerateFileCommandController,
  GenerateFileCommandModule,
} from "./generate-file/index.ts";
import {
  NewProjectCommandController,
  NewProjectCommandModule,
} from "./new-project/index.ts";

@MvModule({
  imports: [
    GenerateFileCommandModule,
    NewProjectCommandModule,
  ],
  providers: [
    {
      provide: "MVF_COMMANDS",
      deps: [
        GenerateFileCommandController,
        NewProjectCommandController,
      ],
      useFactory: (...controllers: CommandController[]) => {
        return controllers.map((c) => c.createCommand());
      },
    },
  ],
  exports: [
    "MVF_COMMANDS",
  ],
})
export class CommandsModule {
}
