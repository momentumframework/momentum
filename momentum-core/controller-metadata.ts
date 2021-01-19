import { Type } from "../momentum-di/mod.ts";
import { ServerPlatform } from "./platform.ts";

export type ControllerClass = Type;

export interface ControllerMetadata {
  route?: string;
}

export interface ActionMetadata {
  route?: string;
  method?: "get" | "post" | "put" | "delete" | "head" | "patch";
}

export interface ParameterMetadata {
  index: number;
  name: string;
  type: Type;
  priority?: boolean;
  isValueProvider: boolean;
  callback: (
    context: unknown,
    platform: ServerPlatform,
    metadata: Omit<ParameterMetadata, "callback">
  ) => unknown | Promise<unknown>;
}
