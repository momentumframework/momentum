import { Type } from "../momentum-di/mod.ts";
import { Platform } from "./platform.ts";

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
  isValueProvider: boolean;
  callback: (
    context: unknown,
    platform: Platform
  ) => unknown | Promise<unknown>;
}
