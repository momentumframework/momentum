import { LoggingFilter, LogLevel } from "../core/mod.ts";
import { Injectable } from "../di/mod.ts";
import { CliModule } from "./cli/cli.module.ts";
import { CliService } from "./cli/cli.service.ts";
import { platformMomentum } from "./deps.ts";

@Injectable()
class InternalLoggingFilter implements LoggingFilter {
  filterLog(
    _logTime: Date,
    _level: LogLevel,
    _data: unknown[],
    _error?: unknown,
    namespace?: string,
    loggerName?: string,
  ) {
    return namespace !== "Momentum" && loggerName != "Internal";
  }
}

const platform = await platformMomentum()
  .registerGlobalLoggingFilter(InternalLoggingFilter)
  .bootstrapModule(CliModule);

const program = await platform.resolve<CliService>(CliService);

program.startProgram();
