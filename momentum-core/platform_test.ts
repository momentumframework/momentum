import { Injectable, Inject } from "./deps.ts";
import { assert, assertEquals, test } from "./test_deps.ts";

import { ModuleRef, MvModule, platformMomentum } from "./mod.ts";

@Injectable()
class Service {
  @Inject("MESSAGE")
  message?: string;
}

@MvModule({
  providers: [
    {
      provide: "MESSAGE",
      useValue: "Hello, Momentum!",
    },
  ],
})
class AppModule {}

test("Platform.bootstrapModule() - bootstraps module", async () => {
  // arrange
  const platform = platformMomentum();

  // act
  const bootstrapped = await platform.bootstrapModule(AppModule);

  // assert
  assert(bootstrapped.module instanceof ModuleRef);
});

test("Platform.resolve() - resolves module dependency", async () => {
  // arrange
  const platform = await platformMomentum().bootstrapModule(AppModule);

  // act
  const service = platform.resolve<Service>(Service);

  // assert
  assertEquals(service.message, "Hello, Momentum!");
});
