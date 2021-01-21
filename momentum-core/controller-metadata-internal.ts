import {
  ActionMetadata,
  ControllerMetadata,
  ParameterMetadata,
} from "./controller-metadata.ts";
import { Type } from "./deps.ts";
import { MvFilter } from "./mv-filter.ts";
import { ServerPlatform } from "./platform.ts";

export interface ExtendedControllerMetadata extends ControllerMetadata {
  filters?: (MvFilter | Type<MvFilter>)[];
}

export interface ExtendedActionMetadata extends ActionMetadata {
  filters?: (MvFilter | Type<MvFilter>)[];
}

export type ValueProvider = (
  context: unknown,
  platform: ServerPlatform,
  metadata: ParameterMetadata
) => unknown | Promise<unknown>;

export type Transformer = (
  value: unknown,
  metadata: ParameterMetadata
) => unknown | Promise<unknown>;

export interface ExtendedParameterMetadata extends ParameterMetadata {
  valueProvider?: ValueProvider;
  transformers?: Transformer[];
}
