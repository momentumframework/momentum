import {
  assert,
  assertEquals,
  test,
} from "./test_deps.ts";

import {
  DependencyResolver,
  DependencyScope,
  DiContainer,
} from "./mod.ts";
import {
  Molecule,
  Atom,
  Proton,
  Neutron,
  Electron,
  Quark,
  ThingOne,
  ThingTwo,
} from "./test-data.ts";

test("DependencyResolver.resolve() - resolves dependency", () => {
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

  const resolver = new DependencyResolver(
    container,
    DependencyScope.beginScope(),
  );

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

test("DependencyResolver.resolve() - allows optional dependencies", () => {
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

  const resolver = new DependencyResolver(
    container,
    DependencyScope.beginScope(),
  );

  // act
  const molecule = resolver.resolve<Molecule>(Molecule);

  // assert
  assert(molecule instanceof Molecule);
  assert(molecule.atom instanceof Atom);
  assert(molecule.atom.electron instanceof Electron);
  assert(molecule.atom.proton === undefined);
  assert(molecule.atom.neutron === undefined);
});

test("DependencyResolver.resolve() - resolves property dependencies", () => {
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

  const resolver = new DependencyResolver(
    container,
    DependencyScope.beginScope(),
  );

  // act
  const thing1 = resolver.resolve<ThingOne>(ThingOne);
  const thing2 = resolver.resolve<ThingTwo>(ThingTwo);

  // assert
  assert(thing1 instanceof ThingOne);
  assert(thing2 instanceof ThingTwo);
  assertEquals(thing1.otherThing, thing2);
  assertEquals(thing2.otherThing, thing1);
});

test("DependencyResolver.resolve() - resolves factory dependencies", () => {
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

  const resolver = new DependencyResolver(
    container,
    DependencyScope.beginScope(),
  );

  // act
  const molecule = resolver.resolve<Molecule>("MOLECULE");

  // assert
  assert(molecule instanceof Molecule);
  assert(molecule.atom instanceof Atom);
});

test("DependencyResolver.resolve() - resolves value dependencies", () => {
  // arrange
  const atom = new Atom();
  const container = new DiContainer();
  container.register(
    Molecule,
    {
      kind: "type",
      type: Molecule,
      params: [{ identifier: "ATOM" }],
    },
  );
  container.register(
    "ATOM",
    { kind: "value", value: atom },
  );

  const resolver = new DependencyResolver(
    container,
    DependencyScope.beginScope(),
  );

  // act
  const molecule = resolver.resolve<Molecule>(Molecule);

  // assert
  assert(molecule instanceof Molecule);
  assertEquals(molecule.atom, atom);
});
