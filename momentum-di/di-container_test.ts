import {
  assert,
  assertArrayContains,
  assertEquals,
  assertThrows,
  test,
} from "./test_deps.ts";

import {
  DependencyScope,
  DiContainer,
  TypeDependencyTreeNode,
} from "./di-container.ts";

class Molecule {
  constructor(public atom: Atom) {
  }
}
class Atom {
  constructor(
    public proton?: Proton,
    public neutron?: Neutron,
    public electron?: Electron,
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
    { kind: "type", type: Molecule, params: [{ identifier: Atom }] },
  );
  container.register(
    Atom,
    {
      kind: "type",
      type: Atom,
      params: [
        { identifier: Proton },
        { identifier: Neutron },
        { identifier: Electron },
      ],
    },
  );
  container.register(
    Proton,
    { kind: "type", type: Proton, params: [{ identifier: Quark }] },
  );
  container.register(
    Neutron,
    { kind: "type", type: Neutron, params: [{ identifier: Quark }] },
  );
  container.register(Electron, { kind: "type", type: Electron });
  container.register(Quark, { kind: "type", type: Quark });

  // act
  const graph = container.buildDependencyGraph();

  // assert
  assertArrayContains(
    Array
      .from(graph.values())
      .map((node) => (node as TypeDependencyTreeNode).ctor),
    [Molecule, Atom, Proton, Neutron, Electron, Quark],
  );
  assertArrayContains(
    Array.from(graph.values())
      .map((node) => node as TypeDependencyTreeNode)
      .find((node) => node.ctor === Molecule)?.params
      .map((node) => node as TypeDependencyTreeNode)
      .find((node) => node.ctor === Atom)?.params
      .map((node) => node as TypeDependencyTreeNode)
      .find((node) => node.ctor === Proton)?.params
      .map((node) => node as TypeDependencyTreeNode)
      .map((node) => node.ctor) ?? [],
    [Quark],
  );
  assertArrayContains(
    Array.from(graph.values())
      .map((node) => node as TypeDependencyTreeNode)
      .find((node) => node.ctor === Molecule)?.params
      .map((node) => node as TypeDependencyTreeNode)
      .find((node) => node.ctor === Atom)?.params
      .map((node) => node as TypeDependencyTreeNode)
      .find((node) => node.ctor === Neutron)?.params
      .map((node) => node as TypeDependencyTreeNode)
      .map((node) => node.ctor) ?? [],
    [Quark],
  );
  assertEquals(
    Array.from(graph.values())
      .map((node) => node as TypeDependencyTreeNode)
      .find((node) => node.ctor === Molecule)?.params
      .map((node) => node as TypeDependencyTreeNode)
      .find((node) => node.ctor === Atom)?.params
      .map((node) => node as TypeDependencyTreeNode)
      .find((node) => node.ctor === Electron)?.params ?? [],
    [],
  );
  assertEquals(
    Array.from(graph.values())
      .map((node) => node as TypeDependencyTreeNode)
      .find((node) => node.ctor === Molecule)?.params
      .map((node) => node as TypeDependencyTreeNode)
      .find((node) => node.ctor === Atom)?.params
      .map((node) => node as TypeDependencyTreeNode)
      .find((node) => node.ctor === Proton)?.params
      .map((node) => node as TypeDependencyTreeNode)
      .find((node) => node.ctor === Quark)?.params ?? [],
    [],
  );
  assertEquals(
    Array.from(graph.values())
      .map((node) => node as TypeDependencyTreeNode)
      .find((node) => node.ctor === Molecule)?.params
      .map((node) => node as TypeDependencyTreeNode)
      .find((node) => node.ctor === Atom)?.params
      .map((node) => node as TypeDependencyTreeNode)
      .find((node) => node.ctor === Neutron)?.params
      .map((node) => node as TypeDependencyTreeNode)
      .find((node) => node.ctor === Quark)?.params ?? [],
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
      container.buildDependencyGraph();
    },
    undefined,
    "Unknown type",
  );
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
  container.buildDependencyGraph();
});

test("DependencyResolver.resolve()", () => {
  // arrange
  const container = new DiContainer();
  container.register(
    Molecule,
    { kind: "type", type: Molecule, params: [{ identifier: Atom }] },
  );
  container.register(
    Atom,
    {
      kind: "type",
      type: Atom,
      params: [
        { identifier: Proton },
        { identifier: Neutron },
        { identifier: Electron },
      ],
    },
  );
  container.register(
    Proton,
    { kind: "type", type: Proton, params: [{ identifier: Quark }] },
  );
  container.register(
    Neutron,
    { kind: "type", type: Neutron, params: [{ identifier: Quark }] },
  );
  container.register(Electron, { kind: "type", type: Electron });
  container.register(Quark, { kind: "type", type: Quark });

  const resolver = container.compile(DependencyScope.beginScope());

  // act
  const molecule = resolver.resolve<Molecule>(Molecule);

  // assert
  assert(molecule instanceof Molecule);
  assert(molecule.atom instanceof Atom);
  assert(molecule.atom.proton instanceof Proton);
  assert(molecule.atom.proton.quark instanceof Quark);
  assert(molecule.atom.neutron instanceof Neutron);
  assert(molecule.atom.neutron.quark instanceof Quark);
  assert(molecule.atom.electron instanceof Electron);
});

test("DependencyResolver.resolve() with optional constructor params", () => {
  // arrange
  const container = new DiContainer();
  container.register(
    Molecule,
    { kind: "type", type: Molecule, params: [{ identifier: Atom }] },
  );
  container.register(
    Atom,
    {
      kind: "type",
      type: Atom,
      params: [
        { identifier: Proton, isOptional: true },
        { identifier: Neutron, isOptional: true },
        { identifier: Electron },
      ],
    },
  );
  container.register(Electron, { kind: "type", type: Electron });

  const resolver = container.compile(DependencyScope.beginScope());

  // act
  const molecule = resolver.resolve<Molecule>(Molecule);

  // assert
  assert(molecule instanceof Molecule);
  assert(molecule.atom instanceof Atom);
  assert(molecule.atom.electron instanceof Electron);
  assert(molecule.atom.proton === undefined);
  assert(molecule.atom.neutron === undefined);
});

test("DependencyResolver.resolve() property dependencies", () => {
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

  const resolver = container.compile(DependencyScope.beginScope());

  // act
  const thing1 = resolver.resolve<ThingOne>(ThingOne);
  const thing2 = resolver.resolve<ThingTwo>(ThingTwo);

  // assert
  assert(thing1 instanceof ThingOne);
  assert(thing2 instanceof ThingTwo);
  assertEquals(thing1.otherThing, thing2);
  assertEquals(thing2.otherThing, thing1);
});

test("DependencyResolver.resolve() factory dependencies", () => {
  // arrange
  const container = new DiContainer();
  container.register(
    "MOLECULE",
    {
      kind: "factory",
      factory: (atom: Atom) => new Molecule(atom),
      params: [{ identifier: "ATOM" }],
    },
  );
  container.register(
    "ATOM",
    { kind: "factory", factory: () => new Atom() },
  );

  const resolver = container.compile(DependencyScope.beginScope());

  // act
  const molecule = resolver.resolve<Molecule>("MOLECULE");

  // assert
  assert(molecule instanceof Molecule);
  assert(molecule.atom instanceof Atom);
});
