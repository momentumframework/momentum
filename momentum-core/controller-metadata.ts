import { Type } from "../momentum-di/mod.ts";

export type ControllerClass = Type;

export interface ControllerMetadata {
  route?: string;
}

export interface ActionMetadata {
  route?: string;
  method?: "get" | "post" | "put" | "delete" | "head" | "patch";
}
