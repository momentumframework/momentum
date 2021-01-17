import { Platform } from "../deps.ts";
import { Type } from "../momentum-di/mod.ts";

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
  callback: (context: unknown, platform: Platform) => Promise<unknown>;
  data?: unknown;
}
