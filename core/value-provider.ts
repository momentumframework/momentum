import { ContextAccessor } from "./context-accessor.ts";
import { ParameterMetadata } from "./controller-metadata.ts";
import { ServerPlatform } from "./platform.ts";

export type ValueProvider = (
  contextAccessor: ContextAccessor,
  metadata: ParameterMetadata,
  platform: ServerPlatform,
) => Promise<unknown>;
