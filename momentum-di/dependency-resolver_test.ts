import { assert, assertEquals, test } from "./test_deps.ts";

import { DependencyResolver, DependencyScope, DiContainer } from "./mod.ts";
import {
  Atom,
  Electron,
  Molecule,
  Neutron,
  Person,
  Proton,
  Quark,
  ThingOne,
  ThingTwo,
} from "./shared-test-types.ts";
import { Injectable } from "./decorators/injectable.ts";
import { Inject } from "./decorators/inject.ts";

test("DependencyResolver.resolve() - resolves dependency", async () => {
  // arrange
  const resolver = new DependencyResolver(
    DiContainer.root(),
    DependencyScope.beginScope()
  );

  // act
  const molecule = await resolver.resolve<Molecule>(Molecule);

  // assert
  assert(molecule instanceof Molecule);
  assert(molecule.atom instanceof Atom);
  assert(molecule.atom.proton instanceof Proton);
  assert(molecule.atom.proton.quark instanceof Quark);
  assert(molecule.atom.neutron instanceof Neutron);
  assert(molecule.atom.neutron.quark instanceof Quark);
  assert(molecule.atom.electron instanceof Electron);
});

test("DependencyResolver.resolve() - allows optional dependencies", async () => {
  // arrange
  const resolver = new DependencyResolver(
    DiContainer.root(),
    DependencyScope.beginScope()
  );

  // act
  const person = await resolver.resolve<Person>(Person);

  // assert
  assert(person instanceof Person);
  assertEquals(person.pants, undefined);
});

test("DependencyResolver.resolve() - resolves property dependencies", async () => {
  // arrange
  const resolver = new DependencyResolver(
    DiContainer.root(),
    DependencyScope.beginScope()
  );

  // act
  const thing1 = await resolver.resolve<ThingOne>(ThingOne);
  const thing2 = await resolver.resolve<ThingTwo>("THING_TWO");

  // assert
  assert(thing1 instanceof ThingOne);
  assert(thing2 instanceof ThingTwo);
  assertEquals(thing1.otherThing, thing2);
  assertEquals(thing2.otherThing, thing1);
});

test("DependencyResolver.resolve() - resolves factory dependencies", async () => {
  // arrange
  const container = new DiContainer();
  container.registerFactory("MOLECULE", (atom: Atom) => new Molecule(atom), [
    "ATOM",
  ]);
  container.registerFactory("ATOM", () => new Atom());

  const resolver = new DependencyResolver(
    container,
    DependencyScope.beginScope()
  );

  // act
  const molecule = await resolver.resolve<Molecule>("MOLECULE");

  // assert
  assert(molecule instanceof Molecule);
  assert(molecule.atom instanceof Atom);
});

test("DependencyResolver.resolve() - resolves value dependencies", async () => {
  // arrange
  @Injectable()
  class Pizza {
    constructor(@Inject("TOPPINGS") public toppings: string[]) {}
  }
  const container = DiContainer.root().createChild();
  const toppings = ["anchovies", "pineapple"];
  container.registerValue("TOPPINGS", toppings);

  const resolver = new DependencyResolver(
    container,
    DependencyScope.beginScope()
  );

  // act
  const pizza = await resolver.resolve<Pizza>(Pizza);

  // assert
  assert(pizza instanceof Pizza);
  assertEquals(pizza.toppings, toppings);
});
