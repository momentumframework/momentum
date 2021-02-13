import { MvModule } from "../deps.ts";
import { MVF_COMMANDS } from "../tokens.ts";
import { CommandController } from "./command-controller.interface.ts";
import {
  GenerateFileCommandController,
  GenerateFileCommandModule,
} from "./generate-file/mod.ts";
import {
  NewProjectCommandController,
  NewProjectCommandModule,
} from "./new-project/mod.ts";
import {
  ToolCommandController,
  ToolCommandModule,
  ToolManagerService,
} from "./tool/mod.ts";
import {
  UpgradeCommandController,
  UpgradeCommandModule,
} from "./upgrade/mod.ts";

@MvModule({
  imports: [
    GenerateFileCommandModule,
    NewProjectCommandModule,
    ToolCommandModule,
    UpgradeCommandModule,
  ],
  providers: [
    {
      provide: MVF_COMMANDS,
      deps: [
        ToolManagerService,
        GenerateFileCommandController,
        NewProjectCommandController,
        ToolCommandController,
        UpgradeCommandController,
      ],
      useFactory: async (
        toolManager: ToolManagerService,
        ...controllers: CommandController[]
      ) => {
        const tools = await toolManager.createToolCommands();
        const cliCommands = controllers.map((c) => c.createCommand());

        return [
          ...cliCommands,
          ...tools,
        ];
      },
    },
  ],
  exports: [
    "MVF_COMMANDS",
  ],
})
export class CommandsModule {
}
