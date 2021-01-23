import {
  assertArrayContains,
  assertEquals,
  assertThrows,
  test,
} from "./test_deps.ts";

import { TypeDependencyGraphNode } from "./di-container.ts";
import { DiContainer, Injectable, Inject, Deferred } from "./mod.ts";
import {
  Atom,
  Electron,
  Molecule,
  Neutron,
  Person,
  Proton,
  Quark,
  ThingOne,
} from "./shared-test-types.ts";
import { Defer } from "./decorators/defer.ts";

test("DiContainer.buildDependencyGraph() - builds dependency graph", () => {
  // arrange
  const container = DiContainer.root();

  // act
  const root = container.getDependencyGraph(Molecule);

  // assert
  assertArrayContains(
    (root as TypeDependencyGraphNode).params
      .map((param) => (param.node.kind === "type" ? param.node : undefined))
      .find((node) => node?.ctor === Atom)
      ?.params.map((param) =>
        param.node.kind === "type" ? param.node : undefined
      )
      .find((node) => node?.ctor === Proton)
      ?.params.map((param) =>
        param.node.kind === "type" ? param.node : undefined
      )
      .map((node) => node?.ctor) ?? [],
    [Quark]
  );
  assertArrayContains(
    (root as TypeDependencyGraphNode).params
      .map((param) => (param.node.kind === "type" ? param.node : undefined))
      .find((node) => node?.ctor === Atom)
      ?.params.map((param) =>
        param.node.kind === "type" ? param.node : undefined
      )
      .find((node) => node?.ctor === Neutron)
      ?.params.map((param) =>
        param.node.kind === "type" ? param.node : undefined
      )
      .map((node) => node?.ctor) ?? [],
    [Quark]
  );
  assertEquals(
    (root as TypeDependencyGraphNode).params
      .map((param) => (param.node.kind === "type" ? param.node : undefined))
      .find((node) => node?.ctor === Atom)
      ?.params.map((param) =>
        param.node.kind === "type" ? param.node : undefined
      )
      .find((node) => node?.ctor === Electron)?.params ?? [],
    []
  );
  assertEquals(
    (root as TypeDependencyGraphNode).params
      .map((param) => (param.node.kind === "type" ? param.node : undefined))
      .find((node) => node?.ctor === Atom)
      ?.params.map((param) =>
        param.node.kind === "type" ? param.node : undefined
      )
      .find((node) => node?.ctor === Proton)
      ?.params.map((param) =>
        param.node.kind === "type" ? param.node : undefined
      )
      .find((node) => node?.ctor === Quark)?.params ?? [],
    []
  );
  assertEquals(
    (root as TypeDependencyGraphNode).params
      .map((param) => (param.node.kind === "type" ? param.node : undefined))
      .find((node) => node?.ctor === Atom)
      ?.params.map((param) =>
        param.node.kind === "type" ? param.node : undefined
      )
      .find((node) => node?.ctor === Neutron)
      ?.params.map((param) =>
        param.node.kind === "type" ? param.node : undefined
      )
      .find((node) => node?.ctor === Quark)?.params ?? [],
    []
  );
});

test("DiContainer.buildDependencyGraph() - fails on unknown dependency", () => {
  // arrange
  class Piston {}
  @Injectable()
  class Engine {
    constructor(public pistons: Piston) {}
  }
  @Injectable()
  class Car {
    constructor(public engine: Engine) {}
  }

  // assert
  assertThrows(
    () => {
      // act
      DiContainer.root().getDependencyGraph(Car);
    },
    undefined,
    "Error composing Car < Engine < Piston. Piston is not registered"
  );
});

test("DiContainer.buildDependencyGraph() - allows optional dependency", () => {
  // arrange
  const container = DiContainer.root();

  // act
  container.getDependencyGraph(Person);
});

test("DiContainer.buildDependencyGraph() - fails on circular dependency", () => {
  // arrange
  @Injectable()
  class Money {
    constructor(@Inject("JOB") _job: unknown) {}
  }

  @Injectable()
  class College {
    constructor(_money: Money) {}
  }

  @Injectable("JOB")
  class Job {
    constructor(_college: College) {}
  }

  // assert
  assertThrows(
    () => {
      // act
      DiContainer.root().getDependencyGraph(Money);
    },
    undefined,
    "Circular dependency detected: Money > JOB > College > Money"
  );
});

test("DiContainer.buildDependencyGraph() - allows circular property dependencies", () => {
  // act
  const thingOneGraph = DiContainer.root().getDependencyGraph(ThingOne);
  const thingTwoGraph = DiContainer.root().getDependencyGraph("THING_TWO");

  // assert
  assertEquals(
    (thingOneGraph as TypeDependencyGraphNode).props["otherThing"].node
      .identifier,
    "THING_TWO"
  );
  assertEquals(
    (thingTwoGraph as TypeDependencyGraphNode).props["otherThing"].node
      .identifier,
    ThingOne
  );
});

test("DiContainer.buildDependencyGraph() - child container can override parent", () => {
  // arrange
  const global = DiContainer.root();
  const child = global.createChild();

  child.registerValue("PANTS", "Jeans");

  // act
  const globalPersonGraph = global.getDependencyGraph(Person);
  const childPersonGraph = child.getDependencyGraph(Person);

  // assert
  assertEquals(
    (childPersonGraph as TypeDependencyGraphNode).params[0].node.kind,
    "value"
  );
  assertEquals(
    (globalPersonGraph as TypeDependencyGraphNode).params[0].node.kind,
    "null"
  );
});

test("DiContainer.buildDependencyGraph() - can defer dependencies", () => {
  // arrange
  @Injectable("FOO")
  class Foo {
    constructor(
      @Defer()
      @Inject("BAR")
      _bar: Deferred<Bar>
    ) {}
  }

  @Injectable("BAR")
  class Bar {
    constructor(
      @Defer()
      @Inject("FOO")
      _foo: Deferred<Foo>
    ) {}
  }

  // assert
  DiContainer.root().getDependencyGraph("FOO");
});

test("DiContainer.import() - imports from another container", () => {
  // arrange
  const container1 = new DiContainer();
  const container2 = new DiContainer();
  const container3 = new DiContainer();

  container1.registerType(Quark, Quark);
  container1.registerType(Electron, Electron);
  container2.registerType(Proton, Proton, [{ identifier: Quark }]);
  container2.registerType(Neutron, Neutron, [{ identifier: Quark }]);
  container2.registerType(Atom, Atom, [
    { identifier: Proton },
    { identifier: Neutron },
    { identifier: Electron },
  ]);

  container2.import(Quark, container1);
  container2.import(Electron, container1);
  container3.import(Atom, container2);

  // act
  const atomGraph = container3.getDependencyGraph(Atom);

  // assert
  assertArrayContains(
    (atomGraph as TypeDependencyGraphNode).params
      .map((param) => (param.node.kind === "type" ? param.node : undefined))
      .find((node) => node?.ctor === Proton)
      ?.params.map((param) =>
        param.node.kind === "type" ? param.node : undefined
      )
      .map((node) => node?.ctor) ?? [],
    [Quark]
  );
  assertArrayContains(
    (atomGraph as TypeDependencyGraphNode).params
      .map((param) => (param.node.kind === "type" ? param.node : undefined))
      .find((node) => node?.ctor === Neutron)
      ?.params.map((param) =>
        param.node.kind === "type" ? param.node : undefined
      )
      .map((node) => node?.ctor) ?? [],
    [Quark]
  );
  assertArrayContains(
    (atomGraph as TypeDependencyGraphNode).params
      .map((param) => (param.node.kind === "type" ? param.node : undefined))
      .map((node) => node?.ctor) ?? [],
    [Electron]
  );
  assertThrows(
    () => container3.getDependencyGraph(Neutron),
    undefined,
    "Error composing Neutron. Neutron is not registered"
  );
});

test("DiContainer.import() - does not import non-imported definitions", () => {
  // arrange
  const container1 = new DiContainer();
  const container2 = new DiContainer();
  const container3 = new DiContainer();

  container1.registerType(Quark, Quark);
  container1.registerType(Electron, Electron);
  container2.registerType(Proton, Proton, [{ identifier: Quark }]);
  container2.registerType(Neutron, Neutron, [{ identifier: Quark }]);
  container2.registerType(Atom, Atom, [
    { identifier: Proton },
    { identifier: Neutron },
    { identifier: Electron },
  ]);

  container2.import(Quark, container1);
  container2.import(Electron, container1);
  container3.import(Atom, container2);

  // assert
  assertThrows(
    () => {
      // act
      container3.getDependencyGraph(Neutron);
    },
    undefined,
    "Error composing Neutron. Neutron is not registered"
  );
});
