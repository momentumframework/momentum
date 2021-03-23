import { CONFIG_OPTIONS } from "./constants.ts";
import {
  config,
  ConfigOptions,
  DotenvConfig,
  Inject,
  Injectable,
  Scope,
} from "./deps.ts";

@Injectable({ global: false, scope: Scope.Singleton })
export class ConfigService {
  private env: DotenvConfig;

  constructor(
    @Inject(CONFIG_OPTIONS) configOptions: ConfigOptions,
  ) {
    this.env = config(configOptions);
  }

  get(key: string): string {
    return this.env[key];
  }
}
