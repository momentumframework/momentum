import { Type } from "./deps.ts";

export type ControllerClass = Type;

export interface ControllerMetadata {
  type: ControllerClass;
  route?: string;
}

export interface ActionMetadata {
  action: string;
  route?: string;
  method?: "get" | "post" | "put" | "delete" | "head" | "patch";
}

export interface ParameterMetadata {
  index: number;
  type?: Type;
}
