import { platformOak } from "../../platform-oak/mod.ts";
import { AppModule } from "./app/app.module.ts";

const platform = await platformOak()
  .bootstrapModule(AppModule);

await platform.listen({ port: 3000 });
