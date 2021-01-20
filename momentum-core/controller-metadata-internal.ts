import {
  ActionMetadata,
  ControllerMetadata,
  ParameterMetadata,
} from "./controller-metadata.ts";
import { Type } from "./deps.ts";
import { MvInterceptor } from "./mv-interceptor.ts";
import { ServerPlatform } from "./platform.ts";

export interface ExtendedControllerMetadata extends ControllerMetadata {
  interceptors?: (MvInterceptor | Type<MvInterceptor>)[];
}

export interface ExtendedActionMetadata extends ActionMetadata {
  interceptors?: (MvInterceptor | Type<MvInterceptor>)[];
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
