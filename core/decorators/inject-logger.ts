import {
  LOGGER_NAMESPACE,
  LOGGING_FILTER,
  LOGGING_FORMATTER,
  LOGGING_PROVIDER,
} from "../constants.ts";
import { DiContainer, Type } from "../deps.ts";
import { Logger } from "../logger.ts";

/**
 * Decorator used to inject a logger
 */
export function InjectLogger(
  name?: string,
): PropertyDecorator & ParameterDecorator {
  return function (
    // deno-lint-ignore ban-types
    target: Object,
    propName?: string | symbol,
    paramIndex?: number,
  ) {
    const logger = class extends Logger {};
    let loggerName = name;

    if (propName) {
      loggerName = loggerName ?? target.constructor.name;
      DiContainer.root().registerProperty(
        target.constructor as Type,
        propName.toString(),
        { identifier: logger },
      );
    }
    if (paramIndex || paramIndex === 0) {
      loggerName = loggerName ?? (target as Type).name;
      DiContainer.root().registerCtorParam(target as Type, paramIndex, {
        identifier: logger,
      });
    }

    const loggerNameIdentifier = `LOGGER_NAME_${loggerName?.toUpperCase()}`;
    DiContainer.root().registerType(logger, logger, [
      { identifier: LOGGING_PROVIDER },
      { identifier: LOGGING_FORMATTER },
      { identifier: LOGGING_FILTER, isOptional: true },
    ], {
      namespace: { identifier: LOGGER_NAMESPACE, isOptional: true },
      loggerName: { identifier: loggerNameIdentifier },
    });
    DiContainer.root().registerValue(loggerNameIdentifier, loggerName);
  };
}
