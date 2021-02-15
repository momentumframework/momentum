import { CliModule } from "./cli/cli.module.ts";
import { CliService } from "./cli/cli.service.ts";
import { platformMomentum } from "./deps.ts";

const platform = await platformMomentum().bootstrapModule(CliModule);

const program = await platform.resolve<CliService>(CliService);

program.startProgram();
