import { ParameterMetadata } from "./controller-metadata.ts";

export type Transformer = (
  value: unknown,
  metadata: ParameterMetadata
) => unknown | Promise<unknown>;
