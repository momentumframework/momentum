import {
  assertArrayContains,
  assertEquals,
  assertThrows,
  test,
} from "./test_deps.ts";

import { DiContainer, TypeDependencyTreeNode } from "./di-container.ts";

class Molecule {
  constructor(public atom: Atom) {
  }
}
class Atom {
  constructor(
    public proton: Proton,
    public neutron: Neutron,
    public electron: Electron,
  ) {
  }
}
class Proton {
  constructor(public quark: Quark) {
  }
}
class Neutron {
  constructor(public quark: Quark) {
  }
}
class Electron {
}
class Quark {
}

class Money {
  constructor(job: Job) {
  }
}
class Job {
  constructor(college: College) {
  }
}
class College {
  constructor(money: Money) {
  }
}

class ThingOne {
  otherThing?: ThingTwo;
}
class ThingTwo {
  otherThing?: ThingOne;
}

test("DiContainer.buildDependencyGraph()", () => {
  // arrange
  const container = new DiContainer();
  container.register(
    Molecule,
    { kind: "type", type: Molecule, params: [Atom] },
  );
  container.register(
    Atom,
    { kind: "type", type: Atom, params: [Proton, Neutron, Electron] },
  );
  container.register(Proton, { kind: "type", type: Proton, params: [Quark] });
  container.register(Neutron, { kind: "type", type: Neutron, params: [Quark] });
  container.register(Electron, { kind: "type", type: Electron });
  container.register(Quark, { kind: "type", type: Quark });

  // act
  const graph = container.buildDependencyGraph();

  // assert
  assertArrayContains(
    Array
      .from(graph.values())
      .map((node) => (node as TypeDependencyTreeNode).type),
    [Molecule, Atom, Proton, Neutron, Electron, Quark],
  );
  assertArrayContains(
    Array.from(graph.values())
      .map((node) => node as TypeDependencyTreeNode)
      .find((node) => node.type === Molecule)?.params
      .map((node) => node as TypeDependencyTreeNode)
      .find((node) => node.type === Atom)?.params
      .map((node) => node as TypeDependencyTreeNode)
      .find((node) => node.type === Proton)?.params
      .map((node) => node as TypeDependencyTreeNode)
      .map((node) => node.type) ?? [],
    [Quark],
  );
  assertArrayContains(
    Array.from(graph.values())
      .map((node) => node as TypeDependencyTreeNode)
      .find((node) => node.type === Molecule)?.params
      .map((node) => node as TypeDependencyTreeNode)
      .find((node) => node.type === Atom)?.params
      .map((node) => node as TypeDependencyTreeNode)
      .find((node) => node.type === Neutron)?.params
      .map((node) => node as TypeDependencyTreeNode)
      .map((node) => node.type) ?? [],
    [Quark],
  );
  assertEquals(
    Array.from(graph.values())
      .map((node) => node as TypeDependencyTreeNode)
      .find((node) => node.type === Molecule)?.params
      .map((node) => node as TypeDependencyTreeNode)
      .find((node) => node.type === Atom)?.params
      .map((node) => node as TypeDependencyTreeNode)
      .find((node) => node.type === Electron)?.params ?? [],
    [],
  );
  assertEquals(
    Array.from(graph.values())
      .map((node) => node as TypeDependencyTreeNode)
      .find((node) => node.type === Molecule)?.params
      .map((node) => node as TypeDependencyTreeNode)
      .find((node) => node.type === Atom)?.params
      .map((node) => node as TypeDependencyTreeNode)
      .find((node) => node.type === Proton)?.params
      .map((node) => node as TypeDependencyTreeNode)
      .find((node) => node.type === Quark)?.params ?? [],
    [],
  );
  assertEquals(
    Array.from(graph.values())
      .map((node) => node as TypeDependencyTreeNode)
      .find((node) => node.type === Molecule)?.params
      .map((node) => node as TypeDependencyTreeNode)
      .find((node) => node.type === Atom)?.params
      .map((node) => node as TypeDependencyTreeNode)
      .find((node) => node.type === Neutron)?.params
      .map((node) => node as TypeDependencyTreeNode)
      .find((node) => node.type === Quark)?.params ?? [],
    [],
  );
});

test("DiContainer.buildDependencyGraph() - fails on unknown dependency", () => {
  // arrange
  const container = new DiContainer();
  container.register(
    Molecule,
    { kind: "type", type: Molecule, params: [Atom] },
  );

  // assert
  assertThrows(
    () => {
      // act
      container.buildDependencyGraph();
    },
    undefined,
    "Unknown type",
  );
});

test("DiContainer.buildDependencyGraph() - fails on circular dependency", () => {
  // arrange
  const container = new DiContainer();
  container.register(Money, { kind: "type", type: Money, params: [Job] });
  container.register(Job, { kind: "type", type: Job, params: [College] });
  container.register(College, { kind: "type", type: College, params: [Money] });

  // assert
  assertThrows(
    () => {
      // act
      container.buildDependencyGraph();
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
    { kind: "type", type: ThingOne, properties: { otherThing: ThingTwo } },
  );
  container.register(
    ThingTwo,
    { kind: "type", type: ThingTwo, properties: { otherThing: ThingOne } },
  );

  // act
  container.buildDependencyGraph();
});
