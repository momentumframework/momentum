import { Command } from "https://deno.land/x/cmd@v1.2.0/mod.ts";
export * as cmd from "https://deno.land/x/cmd@v1.2.0/mod.ts";

export abstract class Tool {
  abstract createCommand(command: Command): void | Promise<void>;
  abstract getName(): string;
}
