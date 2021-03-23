import { ConfigService } from "./config.service.ts";
import { CONFIG_OPTIONS } from "./constants.ts";
import { ConfigOptions, MvModule } from "./deps.ts";

@MvModule({
  providers: [
    ConfigService,
    {
      provide: CONFIG_OPTIONS,
      useValue: {},
    },
  ],
  exports: [
    ConfigService,
  ],
})
export class ConfigModule {
  static register(config: ConfigOptions) {
    return {
      type: ConfigModule,
      providers: [
        {
          provide: CONFIG_OPTIONS,
          useValue: config,
        },
      ],
    };
  }
}
