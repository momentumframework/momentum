import { ParameterMetadata } from "./controller-metadata.ts";
import { ServerPlatform } from "./platform.ts";

export type ValueProvider = (
  context: unknown,
  platform: ServerPlatform,
  metadata: ParameterMetadata
) => unknown | Promise<unknown>;
