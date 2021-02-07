import { assert, assertEquals, test } from "./test_deps.ts";

import { Deferred, DependencyResolver, DiContainer } from "./mod.ts";
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
import { Scope } from "./scope.ts";
import { DiCache } from "./di-cache.ts";

test("DependencyResolver.resolve() - resolves dependency", async () => {
  // arrange
  const resolver = new DependencyResolver(
    DiContainer.root(),
    new DiCache().beginScope(Scope.Singleton).beginScope(Scope.Injection),
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
    new DiCache().beginScope(Scope.Singleton).beginScope(Scope.Injection),
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
    new DiCache().beginScope(Scope.Singleton).beginScope(Scope.Injection),
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
  const container = DiContainer.root().createChild("test");
  container.registerFactory("MOLECULE", (atom: Atom) => new Molecule(atom), [
    "ATOM",
  ]);
  container.registerFactory("ATOM", () => new Atom());

  const resolver = new DependencyResolver(
    container,
    new DiCache().beginScope(Scope.Singleton).beginScope(Scope.Injection),
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
  const container = DiContainer.root().createChild("test");
  const toppings = ["anchovies", "pineapple"];
  container.registerValue("TOPPINGS", toppings);

  const resolver = new DependencyResolver(
    container,
    new DiCache().beginScope(Scope.Singleton).beginScope(Scope.Injection),
  );

  // act
  const pizza = await resolver.resolve<Pizza>(Pizza);

  // assert
  assert(pizza instanceof Pizza);
  assertEquals(pizza.toppings, toppings);
});

test("DependencyResolver.resolve() - resolves deferred dependencies", async () => {
  // arrange
  @Injectable("A")
  class A {
    constructor(
      @Inject("B", { defer: true }) public b: Deferred<B>,
    ) {}
  }
  @Injectable("B")
  class B {
    constructor(
      @Inject("A", { defer: true }) public a: Deferred<A>,
    ) {}
  }
  const resolver = new DependencyResolver(
    DiContainer.root(),
    new DiCache().beginScope(Scope.Singleton).beginScope(Scope.Injection),
  );

  // act
  const a = await resolver.resolve<A>("A");
  const b = await resolver.resolve<B>("B");

  // assert
  assert(a instanceof A);
  assert(b instanceof B);
  assertEquals(await a.b.value(), b);
  assertEquals(await b.a.value(), a);
});
