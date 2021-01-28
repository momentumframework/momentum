import { DiContainer, Injectable, Scope } from "./deps.ts";
import { MvModule } from "./decorators/mv-module.ts";
import { ModuleCatalog } from "./module-catalog.ts";
import { ModuleRef } from "./module-ref.ts";
import { assert, assertEquals, fail, test } from "./test_deps.ts";
import { DiCache } from "../di/mod.ts";

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
  const diCache = new DiCache()
    .beginScope(Scope.Singleton)
    .beginScope(Scope.Injection);

  // act
  const testModule = await ModuleRef.createModuleRef(
    ModuleCatalog.getMetadata(RootTestModule),
    DiContainer.root(),
    diCache
  );

  // assert
  assert(testModule.instance instanceof RootTestModule);
  assert(testModule.instance.service instanceof TestService);
});

test("ModuleRef.createModuleRef() creates module with parameterized constructor", async () => {
  // arrange
  const diCache = new DiCache()
    .beginScope(Scope.Singleton)
    .beginScope(Scope.Injection);

  // act
  const testModule = await ModuleRef.createModuleRef(
    ModuleCatalog.getMetadata(RootTestModule),
    DiContainer.root(),
    diCache
  );

  // assert
  assert(testModule.instance instanceof RootTestModule);
  assert(testModule.instance.service instanceof TestService);
});

test("ModuleRef.resolve() resolves dependency", async () => {
  // arrange
  const diCache = new DiCache()
    .beginScope(Scope.Singleton)
    .beginScope(Scope.Injection);
  const testModule = await ModuleRef.createModuleRef(
    ModuleCatalog.getMetadata(RootTestModule),
    DiContainer.root(),
    diCache
  );

  // act
  const testService = await testModule.resolve(TestService, diCache);

  // assert
  assert(testService instanceof TestService);
});

test("ModuleRef.resolve() only resolves exported dependency", async () => {
  // arrange
  const diCache = new DiCache()
    .beginScope(Scope.Singleton)
    .beginScope(Scope.Injection);
  const testModule = await ModuleRef.createModuleRef(
    ModuleCatalog.getMetadata(RootTestModule),
    DiContainer.root(),
    diCache
  );

  try {
    // act
    await testModule.resolve(TestSubService, diCache);
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
  @Injectable(SubService)
  class SubService {}
  @Injectable(Service)
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

  const diCache = new DiCache()
    .beginScope(Scope.Singleton)
    .beginScope(Scope.Injection);
  const testModule = await ModuleRef.createModuleRef(
    ModuleCatalog.getMetadata(RootModule),
    DiContainer.root(),
    diCache
  );

  // act
  const service = await testModule.resolve(Service, diCache);

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

  const diCache = new DiCache()
    .beginScope(Scope.Singleton)
    .beginScope(Scope.Injection);
  const testModule = await ModuleRef.createModuleRef(
    ModuleCatalog.getMetadata(RootModule),
    DiContainer.root(),
    diCache
  );

  // act
  const service = await testModule.resolve<Service>(SERVICE, diCache);

  // assert
  assert(service instanceof Service);
  assert(service.subService instanceof SubService);
});

test("ModuleRef.resolve() does not resolve non-exported", async () => {
  // arrange
  @Injectable(SubService)
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

  const diCache = new DiCache()
    .beginScope(Scope.Singleton)
    .beginScope(Scope.Injection);
  const testModule = await ModuleRef.createModuleRef(
    ModuleCatalog.getMetadata(RootModule),
    DiContainer.root(),
    diCache
  );

  let errorMessage = undefined;
  try {
    // act
    await testModule.resolve(Service, diCache);
  } catch (err) {
    errorMessage = err.message;
  }
  // assert
  assertEquals(
    errorMessage,
    "Error composing Service. Service is not registered"
  );
});

test("ModuleRef.resolve() provides parent provider to child", async () => {
  // arrange
  @Injectable()
  class SubService {}
  @Injectable()
  class Service {
    constructor(public subService: SubService) {}
  }
  @MvModule({
    providers: [Service],
    exports: [Service],
  })
  class ChildModule {}
  @MvModule({
    providers: [SubService],
    imports: [ChildModule],
  })
  class RootModule {}

  const diCache = new DiCache()
    .beginScope(Scope.Singleton)
    .beginScope(Scope.Injection);
  const testModule = await ModuleRef.createModuleRef(
    ModuleCatalog.getMetadata(RootModule),
    DiContainer.root(),
    diCache
  );

  // act
  const service = await testModule.resolve<Service>(Service, diCache);

  // assert
  assert(service instanceof Service);
  assert(service.subService instanceof SubService);
});
