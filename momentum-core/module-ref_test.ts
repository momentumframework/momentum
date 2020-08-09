import { DiContainer } from "./deps.ts";
import { assert, assertThrows, test } from "./test_deps.ts";

import { MvModule } from "./decorators/mv-module.ts";
import { ModuleCatalog } from "./module-catalog.ts";
import { ModuleRef } from "./module-ref.ts";
import { DependencyScope } from "../momentum-di/mod.ts";

class TestSubService {
}
class TestService {
  constructor(public service: TestSubService) {
  }
}

@MvModule({
  providers: [
    TestSubService,
    {
      provide: TestService,
      deps: [TestSubService],
    },
  ],
  exports: [TestService],
})
class TestSubModule {
}

@MvModule({
  imports: [TestSubModule],
})
class RootTestModule {
  constructor(public service: TestService) {
  }
}

test("ModuleRef.createModuleRef() creates module ref", () => {
  // arrange
  const scope = DependencyScope.beginScope();

  // act
  const testModule = ModuleRef.createModuleRef(
    DiContainer.root(),
    ModuleCatalog.getMetadata(RootTestModule),
    scope,
  );

  // assert
  assert(testModule.instance instanceof RootTestModule);
  assert(testModule.instance.service instanceof TestService);
});

test("ModuleRef.createModuleRef() creates module with parameterized constructor", () => {
  // arrange
  const scope = DependencyScope.beginScope();

  // act
  const testModule = ModuleRef.createModuleRef(
    DiContainer.root(),
    ModuleCatalog.getMetadata(RootTestModule),
    scope,
  );

  // assert
  assert(testModule.instance instanceof RootTestModule);
  assert(testModule.instance.service instanceof TestService);
});

test("ModuleRef.resolve() resolves dependency", () => {
  // arrange
  const scope = DependencyScope.beginScope();
  const testModule = ModuleRef.createModuleRef(
    DiContainer.root(),
    ModuleCatalog.getMetadata(RootTestModule),
    scope,
  );

  // act
  const testService = testModule.resolve(TestService, scope);

  // assert
  assert(testService instanceof TestService);
});

test("ModuleRef.resolve() only resolves exported dependency", () => {
  // arrange
  const scope = DependencyScope.beginScope();
  const testModule = ModuleRef.createModuleRef(
    DiContainer.root(),
    ModuleCatalog.getMetadata(RootTestModule),
    scope,
  );

  // assert
  assertThrows(
    () => {
      // act
      testModule.resolve(TestSubService, scope);
    },
    undefined,
    "Error composing TestSubService. TestSubService is not registered",
  );
});
