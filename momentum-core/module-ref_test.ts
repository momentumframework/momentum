import { DiContainer } from "./deps.ts";
import { assert, assertThrows, test } from "./test_deps.ts";

import { MvModule } from "./decorators/mv-module.ts";
import { ModuleCatalog } from "./module-catalog.ts";
import { ModuleRef } from "./module-ref.ts";
import { DependencyScope } from "../momentum-di/mod.ts";
import { fail } from "https://deno.land/std@0.82.0/testing/asserts.ts";

class TestSubService {}
class TestService {
  constructor(public service: TestSubService) {}
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
class TestSubModule {}

@MvModule({
  imports: [TestSubModule],
})
class RootTestModule {
  constructor(public service: TestService) {}
}

test("ModuleRef.createModuleRef() creates module ref", async () => {
  // arrange
  const scope = DependencyScope.beginScope();

  // act
  const testModule = await ModuleRef.createModuleRef(
    DiContainer.root(),
    ModuleCatalog.getMetadata(RootTestModule),
    scope
  );

  // assert
  assert(testModule.instance instanceof RootTestModule);
  assert(testModule.instance.service instanceof TestService);
});

test("ModuleRef.createModuleRef() creates module with parameterized constructor", async () => {
  // arrange
  const scope = DependencyScope.beginScope();

  // act
  const testModule = await ModuleRef.createModuleRef(
    DiContainer.root(),
    ModuleCatalog.getMetadata(RootTestModule),
    scope
  );

  // assert
  assert(testModule.instance instanceof RootTestModule);
  assert(testModule.instance.service instanceof TestService);
});

test("ModuleRef.resolve() resolves dependency", async () => {
  // arrange
  const scope = DependencyScope.beginScope();
  const testModule = await ModuleRef.createModuleRef(
    DiContainer.root(),
    ModuleCatalog.getMetadata(RootTestModule),
    scope
  );

  // act
  const testService = await testModule.resolve(TestService, scope);

  // assert
  assert(testService instanceof TestService);
});

test("ModuleRef.resolve() only resolves exported dependency", async () => {
  // arrange
  const scope = DependencyScope.beginScope();
  const testModule = await ModuleRef.createModuleRef(
    DiContainer.root(),
    ModuleCatalog.getMetadata(RootTestModule),
    scope
  );

  try {
    // act
    await testModule.resolve(TestSubService, scope);
  } catch (err) {
    if (
      err.message ==
      "Error composing TestSubService. TestSubService is not registered"
    ) {
      return;
    }
  }
  // assert
  fail();
});
