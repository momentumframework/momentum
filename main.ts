import { platformOak } from "./momentum-oak/platform-oak.ts";
import {
  Application,
  Get,
  Inject,
  Injectable,
  MvController,
  MvModule,
  Post,
} from "./deps.ts";

@Injectable()
class AppService {
  @Inject("MESSAGE")
  message?: string;
  getMessage() {
    return this.message;
  }
}

@MvController("/")
class AppController {
  constructor(private readonly service: AppService) {}
  @Get()
  get() {
    const message = this.service.getMessage();
    console.log(message);
    return message;
  }
  @Post()
  post() {
    const message = this.service.getMessage();
    console.log(message);
    return message;
  }
}

@MvModule({
  providers: [
    {
      provide: "MESSAGE",
      useValue: "Hello, Momentum!",
    },
  ],
  controllers: [AppController],
})
class AppModule {}

const app = new Application();
const platform = platformOak(app);

platform.bootstrapModule(AppModule);

await app.listen({ port: 3000 });
