import { platformOak } from "./momentum-oak/platform-oak.ts";
import { Get, Inject, Injectable, MvController, MvModule } from "./deps.ts";
import { Param } from "./momentum-core/mod.ts";

@Injectable()
class AppService {
  @Inject("MESSAGE")
  message?: string;
  getMessage(...args: string[]) {
    let message = this.message;
    for (let i = 0; i < args.length; i++) {
      message = message?.replace(`{${i}}`, args[i]);
    }
    return message;
  }
}

@MvController("/")
class AppController {
  constructor(private readonly service: AppService) {}
  @Get(":name")
  get(@Param("name") name: string) {
    const message = this.service.getMessage(name ?? "Momentum");
    console.log(message);
    return message;
  }
}

@MvModule({
  providers: [
    {
      provide: "MESSAGE",
      useValue: "Hello, {0}!",
    },
  ],
  controllers: [AppController],
})
class AppModule {}

const platform = platformOak(AppModule);

await platform.bootstrapModule(AppModule);
await platform.listen(3000);
