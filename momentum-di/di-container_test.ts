import {
  assertArrayContains,
  assertEquals,
  assertThrows,
  test,
} from "./test_deps.ts";

import { DiContainer } from "./mod.ts";
import {
  Molecule,
  Atom,
  Proton,
  Neutron,
  Electron,
  Quark,
  Money,
  Job,
  College,
  ThingOne,
  ThingTwo,
} from "./test-types.ts";

test("DiContainer.buildDependencyGraph() - builds dependency graph", () => {
  // arrange
  const container = DiContainer.global();

  // act
  const graph = container.dependencyGraph;

  // assert
  assertArrayContains(
    Array
      .from(graph.values())
      .map((node) => (node.kind === "type" && node.ctor)),
    [Molecule, Atom, Proton, Neutron, Electron, Quark],
  );
  assertArrayContains(
    Array.from(graph.values())
      .map((node) => node.kind === "type" ? node : undefined)
      .find((node) => node?.ctor === Molecule)?.params
      .map((node) => node.kind === "type" ? node : undefined)
      .find((node) => node?.ctor === Atom)?.params
      .map((node) => node.kind === "type" ? node : undefined)
      .find((node) => node?.ctor === Proton)?.params
      .map((node) => node.kind === "type" ? node : undefined)
      .map((node) => node?.ctor) ?? [],
    [Quark],
  );
  assertArrayContains(
    Array.from(graph.values())
      .map((node) => node.kind === "type" ? node : undefined)
      .find((node) => node?.ctor === Molecule)?.params
      .map((node) => node.kind === "type" ? node : undefined)
      .find((node) => node?.ctor === Atom)?.params
      .map((node) => node.kind === "type" ? node : undefined)
      .find((node) => node?.ctor === Neutron)?.params
      .map((node) => node.kind === "type" ? node : undefined)
      .map((node) => node?.ctor) ?? [],
    [Quark],
  );
  assertEquals(
    Array.from(graph.values())
      .map((node) => node.kind === "type" ? node : undefined)
      .find((node) => node?.ctor === Molecule)?.params
      .map((node) => node.kind === "type" ? node : undefined)
      .find((node) => node?.ctor === Atom)?.params
      .map((node) => node.kind === "type" ? node : undefined)
      .find((node) => node?.ctor === Electron)?.params ?? [],
    [],
  );
  assertEquals(
    Array.from(graph.values())
      .map((node) => node.kind === "type" ? node : undefined)
      .find((node) => node?.ctor === Molecule)?.params
      .map((node) => node.kind === "type" ? node : undefined)
      .find((node) => node?.ctor === Atom)?.params
      .map((node) => node.kind === "type" ? node : undefined)
      .find((node) => node?.ctor === Proton)?.params
      .map((node) => node.kind === "type" ? node : undefined)
      .find((node) => node?.ctor === Quark)?.params ?? [],
    [],
  );
  assertEquals(
    Array.from(graph.values())
      .map((node) => node.kind === "type" ? node : undefined)
      .find((node) => node?.ctor === Molecule)?.params
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
  const container = new DiContainer();
  container.register(
    Molecule,
    { kind: "type", type: Molecule, params: [{ identifier: Atom }] },
  );

  // assert
  assertThrows(
    () => {
      // act
      container.dependencyGraph;
    },
    undefined,
    "Unknown type",
  );
});

test("DiContainer.buildDependencyGraph() - allows optional dependency", () => {
  // arrange
  const container = new DiContainer();
  container.register(
    Molecule,
    {
      kind: "type",
      type: Molecule,
      params: [{ identifier: Atom, isOptional: true }],
    },
  );

  // act
  container.dependencyGraph;
});

test("DiContainer.buildDependencyGraph() - fails on circular dependency", () => {
  // arrange
  const container = new DiContainer();
  container.register(
    Money,
    { kind: "type", type: Money, params: [{ identifier: Job }] },
  );
  container.register(
    Job,
    { kind: "type", type: Job, params: [{ identifier: College }] },
  );
  container.register(
    College,
    { kind: "type", type: College, params: [{ identifier: Money }] },
  );

  // assert
  assertThrows(
    () => {
      // act
      container.dependencyGraph;
    },
    undefined,
    "Circular dependency detected: Money > Job > College > Money",
  );
});

test("DiContainer.buildDependencyGraph() - allows circular property dependencies", () => {
  // arrange
  const container = new DiContainer();
  container.register(
    ThingOne,
    {
      kind: "type",
      type: ThingOne,
      props: { otherThing: { identifier: ThingTwo } },
    },
  );
  container.register(
    ThingTwo,
    {
      kind: "type",
      type: ThingTwo,
      props: { otherThing: { identifier: ThingOne } },
    },
  );

  // act
  container.dependencyGraph;
});
