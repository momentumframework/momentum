import { DependencyScope } from "./dependency-scope.ts";
import { Person } from "./shared-test-types.ts";
import { Scope } from "./scope.ts";
import { assert, assertEquals, assertThrows, test } from "./test_deps.ts";
import { Injectable } from "./decorators/injectable.ts";

test("DependencyScope.beginScope() - creates a new dependency scope", () => {
  // act
  const scope = DependencyScope.beginScope(Scope.Singleton).beginChildScope(
    Scope.Injection
  );

  // assert
  assert(scope instanceof DependencyScope);
});

test("DependencyScope.beginChildScope() - creates a child scope", () => {
  // arrange
  const parent = DependencyScope.beginScope("parent");

  // act
  const child = parent.beginChildScope("child");

  // assert
  assert(child instanceof DependencyScope);
  assertEquals(child.parent, parent);
});

test("DependencyScope.set() - caches a dependency", () => {
  // arrange
  const scope = DependencyScope.beginScope(Scope.Singleton).beginChildScope(
    Scope.Injection
  );
  const obj = new Person();

  // act
  scope.set(Person, obj);

  // assert
  assertEquals(scope.get(Person), obj);
});

test("DependencyScope.get() - gets a cached dependency", () => {
  // arrange
  const scope = DependencyScope.beginScope(Scope.Singleton).beginChildScope(
    Scope.Injection
  );
  const obj = new Person();

  scope.set(Person, obj);

  // act
  const cached = scope.get(Person);

  // assert
  assertEquals(cached, obj);
});

test("DependencyScope.get() - gets a parent cached dependency", () => {
  // arrange
  @Injectable({ scope: Scope.Singleton })
  class SingletonScopedService {}

  const parent = DependencyScope.beginScope(Scope.Singleton);
  const child = parent.beginChildScope(Scope.Injection);

  const obj = new SingletonScopedService();

  parent.set(SingletonScopedService, obj);

  // act
  const cached = child.get(SingletonScopedService);

  // assert
  assertEquals(cached, obj);
});

test("DependencyScope.get() - does not get a child cached dependency", () => {
  // arrange
  @Injectable({ scope: Scope.Injection })
  class InjectionScopedService {}

  const parent = DependencyScope.beginScope(Scope.Singleton);
  const child = parent.beginChildScope(Scope.Injection);

  const obj = new InjectionScopedService();

  child.set(InjectionScopedService, obj);

  // act
  const cached = parent.get(InjectionScopedService);

  // assert
  assertEquals(cached, undefined);
});

test("DependencyScope.endScope() - ends the scope", () => {
  // arrange
  const scope = DependencyScope.beginScope(Scope.Singleton).beginChildScope(
    Scope.Injection
  );

  // act
  scope.endScope();

  // assert
  assert(scope.isEnded);
  assertThrows(() => scope.set(String, ""), undefined, "Scope is ended");
  assertThrows(() => scope.get(String), undefined, "Scope is ended");
});

test("DependencyScope.endScope() - ends child scope", () => {
  // arrange
  const parent = DependencyScope.beginScope("parent");
  const child = parent.beginChildScope("child");

  // act
  parent.endScope();

  // assert
  assert(child.isEnded);
});
