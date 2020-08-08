import { DiContainer } from "./deps.ts";
import { assert, test } from "./test_deps.ts";

import { MvModule } from "./decorators/mv-module.ts";
import { ModuleCatalog } from "./module-catalog.ts";
import { ModuleRef } from "./module-ref.ts";
import { DependencyScope } from "../momentum-di/mod.ts";

test("ModuleRef.createModuleRef()", () => {
  // arrange
  class TestService {
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
    }
  }

  // act
  const scope = DependencyScope.beginScope();
  const testModule = ModuleRef.createModuleRef(
    DiContainer.root(),
    ModuleCatalog.getMetadata(RootTestModule),
    scope
  );

  // assert
  assert(testModule.instance instanceof RootTestModule);
  assert(testModule.instance.service instanceof TestService);
});
