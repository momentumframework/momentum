import {
  assert,
  assertEquals,
  assertNotEquals,
  assertThrows,
  test,
} from "./test_deps.ts";

import { DependencyScope } from "./dependency-scope.ts";
import { Person } from "./shared-test-types.ts";

test("DependencyScope.beginScope() - creates a new dependency scope", () => {
  // act
  const scope = DependencyScope.beginScope();

  // assert
  assert(scope instanceof DependencyScope);
});

test("DependencyScope.beginChildScope() - creates a child scope", () => {
  // arrange
  const parent = DependencyScope.beginScope();

  // act
  const child = parent.beginChildScope();

  // assert
  assert(child instanceof DependencyScope);
  assertNotEquals(child, parent);
});

test("DependencyScope.set() - caches a dependency", () => {
  // arrange
  const scope = DependencyScope.beginScope();
  const obj = new Person();

  // act
  scope.set(Person, obj);

  // assert
  assertEquals(scope.get(Person), obj);
});

test("DependencyScope.get() - gets a cached dependency", () => {
  // arrange
  const scope = DependencyScope.beginScope();
  const obj = new Person();

  scope.set(Person, obj);

  // act
  const cached = scope.get(Person);

  // assert
  assertEquals(cached, obj);
});

test("DependencyScope.get() - gets a parent cached dependency", () => {
  // arrange
  const parent = DependencyScope.beginScope();
  const child = parent.beginChildScope();

  const obj = new Person();

  parent.set(Person, obj);

  // act
  const cached = child.get(Person);

  // assert
  assertEquals(cached, obj);
});

test("DependencyScope.get() - does not get a child cached dependency", () => {
  // arrange
  const parent = DependencyScope.beginScope();
  const child = parent.beginChildScope();

  const obj = new Person();

  child.set(Person, obj);

  // act
  const cached = parent.get(Person);

  // assert
  assertEquals(cached, undefined);
});

test("DependencyScope.endScope() - ends the scope", () => {
  // arrange
  const scope = DependencyScope.beginScope();

  // act
  scope.endScope();

  // assert
  assert(scope.isEnded);
  assertThrows(() => scope.set(String, ""), undefined, "Scope is ended");
  assertThrows(() => scope.get(String), undefined, "Scope is ended");
  assertThrows(() => scope.beginChildScope(), undefined, "Scope is ended");
  assertThrows(() => scope.endScope(), undefined, "Scope is ended");
});

test("DependencyScope.endScope() - ends child scope", () => {
  // arrange
  const parent = DependencyScope.beginScope();
  const child = parent.beginChildScope();

  // act
  parent.endScope();

  // assert
  assert(child.isEnded);
});
