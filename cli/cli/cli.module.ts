import { CommandsModule } from "../commands/commands.module.ts";
import { MvModule } from "../deps.ts";
import { CliService } from "./cli.service.ts";

@MvModule({
  imports: [CommandsModule],
  providers: [CliService],
  exports: [CliService],
})
export class CliModule {
}
