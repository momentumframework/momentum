import {
  assertArrayContains,
  assertEquals,
  assertThrows,
  test,
} from "./test_deps.ts";

import { TypeDependencyGraphNode } from "./di-container.ts";
import { DiContainer, Injectable, Inject } from "./mod.ts";
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

test("DiContainer.buildDependencyGraph() - builds dependency graph", () => {
  // arrange
  const container = DiContainer.global();

  // act
  const root = container.getDependencyGraph(Molecule);

  // assert
  assertArrayContains(
    (root as TypeDependencyGraphNode).params
      .map((node) => node.kind === "type" ? node : undefined)
      .find((node) => node?.ctor === Atom)?.params
      .map((node) => node.kind === "type" ? node : undefined)
      .find((node) => node?.ctor === Proton)?.params
      .map((node) => node.kind === "type" ? node : undefined)
      .map((node) => node?.ctor) ?? [],
    [Quark],
  );
  assertArrayContains(
    (root as TypeDependencyGraphNode).params
      .map((node) => node.kind === "type" ? node : undefined)
      .find((node) => node?.ctor === Atom)?.params
      .map((node) => node.kind === "type" ? node : undefined)
      .find((node) => node?.ctor === Neutron)?.params
      .map((node) => node.kind === "type" ? node : undefined)
      .map((node) => node?.ctor) ?? [],
    [Quark],
  );
  assertEquals(
    (root as TypeDependencyGraphNode).params
      .map((node) => node.kind === "type" ? node : undefined)
      .find((node) => node?.ctor === Atom)?.params
      .map((node) => node.kind === "type" ? node : undefined)
      .find((node) => node?.ctor === Electron)?.params ?? [],
    [],
  );
  assertEquals(
    (root as TypeDependencyGraphNode).params
      .map((node) => node.kind === "type" ? node : undefined)
      .find((node) => node?.ctor === Atom)?.params
      .map((node) => node.kind === "type" ? node : undefined)
      .find((node) => node?.ctor === Proton)?.params
      .map((node) => node.kind === "type" ? node : undefined)
      .find((node) => node?.ctor === Quark)?.params ?? [],
    [],
  );
  assertEquals(
    (root as TypeDependencyGraphNode).params
      .map((node) => node.kind === "type" ? node : undefined)
      .find((node) => node?.ctor === Atom)?.params
      .map((node) => node.kind === "type" ? node : undefined)
      .find((node) => node?.ctor === Neutron)?.params
      .map((node) => node.kind === "type" ? node : undefined)
      .find((node) => node?.ctor === Quark)?.params ?? [],
    [],
  );
});

test("DiContainer.buildDependencyGraph() - fails on unknown dependency", () => {
  // arrange
  class Unknown {
  }
  @Injectable()
  class Known {
    constructor(public unknown: Unknown) {}
  }

  // assert
  assertThrows(
    () => {
      // act
      DiContainer.global().getDependencyGraph(Known);
    },
    undefined,
    "Unable to inject unregisterd type Unknown into Known",
  );
});

test("DiContainer.buildDependencyGraph() - allows optional dependency", () => {
  // arrange
  const container = DiContainer.global();

  // act
  container.getDependencyGraph(Person);
});

test("DiContainer.buildDependencyGraph() - fails on circular dependency", () => {
  // arrange
  @Injectable()
  class Money {
    constructor(@Inject("JOB") job: unknown) {
    }
  }

  @Injectable()
  class College {
    constructor(money: Money) {
    }
  }

  @Injectable("JOB")
  class Job {
    constructor(college: College) {
    }
  }

  // assert
  assertThrows(
    () => {
      // act
      DiContainer.global().getDependencyGraph(Money);
    },
    undefined,
    "Circular dependency detected: Money > JOB > College > Money",
  );
});

test("DiContainer.buildDependencyGraph() - allows circular property dependencies", () => {
  // act
  const thingOneGraph = DiContainer.global().getDependencyGraph(ThingOne);
  const thingTwoGraph = DiContainer.global().getDependencyGraph("THING_TWO");

  // assert
  assertEquals(
    (thingOneGraph as TypeDependencyGraphNode).props["otherThing"].identifier,
    "THING_TWO",
  );
  assertEquals(
    (thingTwoGraph as TypeDependencyGraphNode).props["otherThing"].identifier,
    ThingOne,
  );
});
