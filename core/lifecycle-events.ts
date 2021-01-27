import { ContextAccessor } from "./context-accessor.ts";

export interface OnPlatformBootstrap {
  mvOnPlatformBootstrap(): void | Promise<void>;
}

export interface OnPlatformShutdown {
  mvOnPlatformShutdown(): void | Promise<void>;
}

export interface OnRequestStart {
  mvOnRequestStart(contextAccessor: ContextAccessor): void | Promise<void>;
}

export interface OnRequestEnd {
  mvOnRequestStart(contextAccessor: ContextAccessor): void | Promise<void>;
}
