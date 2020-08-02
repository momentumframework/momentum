import {
  assertArrayContains,
  assertEquals,
  assertThrows,
  test,
} from "./test_deps.ts";

import { DiContainer } from "./di-container.ts";

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
  container.register(Molecule, { type: Molecule, constructorParams: [Atom] });
  container.register(
    Atom,
    { type: Atom, constructorParams: [Proton, Neutron, Electron] },
  );
  container.register(Proton, { type: Proton, constructorParams: [Quark] });
  container.register(Neutron, { type: Neutron, constructorParams: [Quark] });
  container.register(Electron, { type: Electron });
  container.register(Quark, { type: Quark });

  // act
  const graph = container.buildDependencyGraph();

  // assert
  assertArrayContains(
    Array.from(graph.values()).map((g) => g.type),
    [Molecule, Atom, Proton, Neutron, Electron, Quark],
  );
  assertArrayContains(
    Array.from(graph.values())
      .find((f) => f.type === Molecule)?.constructorParams
      .find((f) => f.type === Atom)?.constructorParams
      .find((p) => p.type === Proton)?.constructorParams
      .map((p) => p.type) ?? [],
    [Quark],
  );
  assertArrayContains(
    Array.from(graph.values())
      .find((f) => f.type === Molecule)?.constructorParams
      .find((f) => f.type === Atom)?.constructorParams
      .find((p) => p.type === Neutron)?.constructorParams
      .map((p) => p.type) ?? [],
    [Quark],
  );
  assertEquals(
    Array.from(graph.values())
      .find((f) => f.type === Molecule)?.constructorParams
      .find((f) => f.type === Atom)?.constructorParams
      .find((p) => p.type === Electron)?.constructorParams ?? [],
    [],
  );
  assertEquals(
    Array.from(graph.values())
      .find((f) => f.type === Molecule)?.constructorParams
      .find((f) => f.type === Atom)?.constructorParams
      .find((p) => p.type === Proton)?.constructorParams
      .find((p) => p.type === Quark)?.constructorParams ?? [],
    [],
  );
  assertEquals(
    Array.from(graph.values())
      .find((f) => f.type === Molecule)?.constructorParams
      .find((f) => f.type === Atom)?.constructorParams
      .find((p) => p.type === Neutron)?.constructorParams
      .find((p) => p.type === Quark)?.constructorParams ?? [],
    [],
  );
});

test("DiContainer.buildDependencyGraph() - fails on unknown dependency", () => {
  // arrange
  const container = new DiContainer();
  container.register(Molecule, { type: Molecule, constructorParams: [Atom] });

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

test("DiContainer.buildDependencyGraph() - fails on circular constructor dependency", () => {
  // arrange
  const container = new DiContainer();
  container.register(Money, { type: Money, constructorParams: [Job] });
  container.register(Job, { type: Job, constructorParams: [College] });
  container.register(College, { type: College, constructorParams: [Money] });

  // assert
  assertThrows(
    () => {
      // act
      container.buildDependencyGraph();
    },
    undefined,
    "Circular constructor dependency detected: Money > Job > College > Money",
  );
});

test("DiContainer.buildDependencyGraph() - allows circular property dependencies", () => {
  // arrange
  const container = new DiContainer();
  container.register(
    ThingOne,
    { type: ThingOne, properties: { otherThing: ThingTwo } },
  );
  container.register(
    ThingTwo,
    { type: ThingTwo, properties: { otherThing: ThingOne } },
  );

  // act
  container.buildDependencyGraph();
});
