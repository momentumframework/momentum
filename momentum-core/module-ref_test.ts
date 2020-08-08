import { DiContainer } from "./deps.ts";
import { test } from "./test_deps.ts";

import { MvModule } from "./decorators/mv-module.ts";
import { ModuleCatalog } from "./module-catalog.ts";
import { ModuleRef } from "./module-ref.ts";
import { assert } from "../momentum-di/test_deps.ts";

test("ModuleRef.createModuleRef()", () => {
  // arrange
  class TestService {
    log(msg: string) {
      console.log(msg);
    }
  }

  @MvModule({
    providers: [TestService],
    exports: [TestService],
  })
  class SubTestModule {
  }

  @MvModule({
    imports: [SubTestModule],
  })
  class RootTestModule {
    constructor(public service: TestService) {
      service.log("Hello World");
    }
  }

  // act
  const testModule = ModuleRef.createModuleRef(
    DiContainer.root(),
    ModuleCatalog.getMetadata(RootTestModule),
  );

  // assert
  assert(testModule.instance instanceof RootTestModule);
  assert(testModule.instance.service instanceof TestService);
});
