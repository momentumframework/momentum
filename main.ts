import {
  Get,
  Inject,
  Injectable,
  Controller,
  MvModule,
  platformOak,
  Request,
  Response,
} from "./deps.ts";
import {
  Body,
  Cookie,
  Ctx,
  Delete,
  Head,
  Header,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  Res,
} from "./momentum-core/mod.ts";
import { RouterContext } from "./momentum-oak/deps.ts";

@Injectable()
class AppService {
  @Inject("MESSAGE")
  message?: string;
  getGreeting(name?: string) {
    return `${this.message}${name ?? "Momentum"}`;
  }
}

@Controller("/")
class AppController {
  constructor(private readonly service: AppService) {}
  @Get("query")
  getQuery(@Query("name") name: string) {
    return this.service.getGreeting(name);
  }
  @Get("cookie")
  getCookie(@Cookie("name") name: string) {
    return this.service.getGreeting(name);
  }
  @Get("header")
  getHeader(@Header("name") name: string) {
    return this.service.getGreeting(name);
  }
  @Get("req")
  getReq(@Req() request: Request, @Res() response: Response) {
    response.body = this.service.getGreeting(
      request.headers.get("name")?.toString()
    );
  }
  @Get("ctx/:name")
  getCtx(@Ctx() context: RouterContext) {
    context.response.body = this.service.getGreeting(context.params["name"]);
  }
  @Get(":name")
  get(@Param("name") name: string) {
    return this.service.getGreeting(name);
  }
  @Post()
  post(@Body() name: string) {
    return this.service.getGreeting(name);
  }
  @Put(":name")
  put(@Param("name") name: string) {
    return this.service.getGreeting(name);
  }
  @Delete(":name")
  delete(@Param("name") name: string) {
    return this.service.getGreeting(name);
  }
  @Patch(":name")
  patch(@Param("name") name: string) {
    return this.service.getGreeting(name);
  }
  @Head(":name")
  head(@Param("name") name: string) {
    return this.service.getGreeting(name);
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

await platformOak()
  .bootstrapModule(AppModule)
  .then((platform) => platform.listen(3000));
