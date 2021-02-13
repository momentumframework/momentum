import { Command, Injectable } from "../../deps.ts";
import {
  FileIOService,
  MvfManagerService,
  ToolConfig,
} from "../../global/mod.ts";
import { Tool } from "./base.tool.ts";

@Injectable({ global: false })
export class ToolManagerService {
  constructor(
    private readonly mvfManager: MvfManagerService,
    private readonly fileIOService: FileIOService,
  ) {
  }

  async getToolConfigs() {
    const { toolsFileAbsolutePath } = await this.mvfManager
      .getMvInstallationPaths();
    const toolsConfigJson = this.fileIOService.readFile(toolsFileAbsolutePath);
    const toolsConfig: ToolConfig[] = JSON.parse(toolsConfigJson);
    return toolsConfig;
  }

  async installTools(toolConfigs: ToolConfig[]) {
    const { toolsFileAbsolutePath } = await this.mvfManager
      .getMvInstallationPaths();

    const currentTools = await this.getToolConfigs();

    toolConfigs.forEach((toolConfig) => {
      const existingToolConfig = currentTools.find((ct) =>
        ct.name === toolConfig.name
      );
      if (existingToolConfig) {
        existingToolConfig.url = toolConfig.url;
      } else {
        currentTools.push(toolConfig);
      }
    });

    this.fileIOService.writeFile(
      toolsFileAbsolutePath,
      JSON.stringify(currentTools),
    );
  }

  async uninstallTools(names: string[]) {
    const { toolsFileAbsolutePath } = await this.mvfManager
      .getMvInstallationPaths();
    const currentTools = await this.getToolConfigs();
    const currentToolsFiltered = currentTools.filter((t) =>
      !names.includes(t.name)
    );
    this.fileIOService.writeFile(
      toolsFileAbsolutePath,
      JSON.stringify(currentToolsFiltered),
    );
  }

  async createToolCommands(): Promise<Command[]> {
    const toolConfigs = await this.getToolConfigs();

    const commands = await Promise.all(toolConfigs.map(async (toolConfig) => {
      const tool = await this.parseToolModule(toolConfig.url);
      const command = new Command(tool.getName());
      tool.createCommand(command);
      if (command.name() !== toolConfig.name) {
        console.warn(
          `Invalid config for ${toolConfig.name}. Command name "${command.name}" does not match.`,
        );
        return null;
      }
      return command;
    }));

    return commands.filter((x) => !!x) as Command[];
  }

  async parseToolModule(toolUrl: string): Promise<Tool> {
    const modExports = await import(toolUrl);

    const exportedCommands: Tool[] = Object.keys(modExports).map((key) => {
      const classProtoype = modExports[key].prototype;
      const hasCreateCommand =
        typeof classProtoype.createCommand === "function";
      const hasGetName = typeof classProtoype.getName === "function";
      if (hasCreateCommand && hasGetName) {
        return new modExports[key]();
      }
      return null;
    }).filter((x) => !!x);

    return exportedCommands[0];
  }
}
