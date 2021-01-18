import {
  Get,
  Inject,
  Injectable,
  Controller,
  MvModule,
  platformOak,
} from "./deps.ts";
import { Body, Param, Post } from "./momentum-core/mod.ts";

@Injectable()
class AppService {
  @Inject("MESSAGE")
  message?: string;
  getGreeting(name: string) {
    return this.message + name;
  }
}

@Controller("/")
class AppController {
  constructor(private readonly service: AppService) {}
  @Get(":name")
  get(@Param("name") name: string) {
    return this.service.getGreeting(name ?? "Momentum");
  }
  @Post()
  post(@Body() name: string) {
    return this.service.getGreeting(name ?? "Momentum");
  }
}

@MvModule({
  providers: [
    {
      provide: "MESSAGE",
      useValue: "Hello, ",
    },
  ],
  controllers: [AppController],
})
class AppModule {}

const platform = platformOak(AppModule);

await platform.bootstrapModule(AppModule);
await platform.listen(3000);
