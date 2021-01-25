import { DiContainer } from "./deps.ts";
import { assert, assertThrows, test } from "./test_deps.ts";

import { MvModule } from "./decorators/mv-module.ts";
import { ModuleCatalog } from "./module-catalog.ts";
import { ModuleRef } from "./module-ref.ts";
import { DependencyScope, Inject, Injectable } from "../momentum-di/mod.ts";
import { fail } from "https://deno.land/std@0.82.0/testing/asserts.ts";
import { assertEquals } from "../momentum-di/test_deps.ts";

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

test("ModuleRef.resolve() resolves from deeply nested exports", async () => {
  // arrange
  @Injectable(SubService, { global: false })
  class SubService {}
  @Injectable(Service, { global: false })
  class Service {
    constructor(public subService: SubService) {}
  }
  @MvModule({
    providers: [Service, SubService],
    exports: [Service],
  })
  class GreatGrandchildModule {}

  @MvModule({
    imports: [GreatGrandchildModule],
    exports: [Service],
  })
  class GrandchildModule {}

  @MvModule({
    imports: [GrandchildModule],
    exports: [Service],
  })
  class ChildModule {}

  @MvModule({
    imports: [ChildModule],
  })
  class RootModule {}

  const scope = DependencyScope.beginScope();
  const testModule = await ModuleRef.createModuleRef(
    DiContainer.root(),
    ModuleCatalog.getMetadata(RootModule),
    scope
  );

  // act
  const service = await testModule.resolve(Service, scope);

  // assert
  assert(service instanceof Service);
  assert(service.subService instanceof SubService);
});

test("ModuleRef.resolve() resolves tokenized from deeply nested modules", async () => {
  // arrange
  const SERVICE = "SERVICE_20210124";
  const SUB_SERVICE = "SUBSERVICE_20210124";
  @Injectable(SUB_SERVICE)
  class SubService {}
  @Injectable(SERVICE)
  class Service {
    constructor(public subService: SubService) {}
  }
  @MvModule({
    providers: [Service, SubService],
    exports: [SERVICE],
  })
  class GreatGrandchildModule {}

  @MvModule({
    imports: [GreatGrandchildModule],
    exports: [SERVICE],
  })
  class GrandchildModule {}

  @MvModule({
    imports: [GrandchildModule],
    exports: [SERVICE],
  })
  class ChildModule {}

  @MvModule({
    imports: [ChildModule],
  })
  class RootModule {}

  const scope = DependencyScope.beginScope();
  const testModule = await ModuleRef.createModuleRef(
    DiContainer.root(),
    ModuleCatalog.getMetadata(RootModule),
    scope
  );

  // act
  const service = await testModule.resolve<Service>(SERVICE, scope);

  // assert
  assert(service instanceof Service);
  assert(service.subService instanceof SubService);
});

test("ModuleRef.resolve() does not resolve non-exported", async () => {
  // arrange
  @Injectable(SubService, { global: false })
  class SubService {}
  @Injectable(Service, { global: false })
  class Service {
    constructor(public subService: SubService) {}
  }
  @MvModule({
    providers: [Service, SubService],
  })
  class GreatGrandchildModule {}

  @MvModule({
    imports: [GreatGrandchildModule],
  })
  class GrandchildModule {}

  @MvModule({
    imports: [GrandchildModule],
  })
  class ChildModule {}

  @MvModule({
    imports: [ChildModule],
  })
  class RootModule {}

  const scope = DependencyScope.beginScope();
  const testModule = await ModuleRef.createModuleRef(
    DiContainer.root(),
    ModuleCatalog.getMetadata(RootModule),
    scope
  );

  let errorMessage = undefined;
  try {
    // act
    await testModule.resolve(Service, scope);
  } catch (err) {
    errorMessage = err.message;
  }
  // assert
  assertEquals(
    errorMessage,
    "Error composing Service. Service is not registered"
  );
});
