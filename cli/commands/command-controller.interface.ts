import { Command } from "../deps.ts";

export interface CommandController {
  createCommand(): Command;
}
