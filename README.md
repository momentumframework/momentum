# ![mv](mv-logo.png) Momentum Framework

Momentum is an open-source framework for building enterprise server-side Deno
applications in TypeScript. It provides the paradigms and design patterns to
guide developers to create robust, scalable, and enterprise-grade applications.

By focusing on a batteries-optional approach, Momentum provides a strong core
that is easily extendable into a rich developer experience via dependency
injection modules. While the framework is opinionated by design, this modular
system aims to be unobtrusive and to allow developers to create abstraction
layers over any codebase or third-party modules.

# Getting Started

## Deno

Momentum is built on Deno, a secure runtime for JavaScript and TypeScript.
Follow the Deno installation guide at https://deno.land/

## Using Momentum

Momentum is distributed as a set of packages on
[deno.land](https://deno.land/x/momentum). To use Momentum, simply import the
packages directly from deno.land

```TypeScript
export { MvModule } from "https://deno.land/x/momentum/core/mod.ts";

@MvModule({})
class AppModule {}
```

## Packages

- [momentum/di](https://deno.land/x/momentum/di) - Momentum dependency injection
- [momentum/core](https://deno.land/x/momentum/core) - Core framework, including
  module system, and decorators
- [momentum/mvc](https://deno.land/x/momentum/mvc) - Module for creating MVC
  (Model-View-Controller) applications
- [momentum/static-files](https://deno.land/x/momentum/static-files) - Module
  for serving static files from a Momentum application
- [momentum/platform-oak](https://deno.land/x/momentum/platform-oak) - Oak
  Platform. Allows Momentum applications to run on top of
  [Oak](https://github.com/oakserver/oak)

# Documentation

Visit https://momentumframework.org for detailed documentation.

# Contributing

First, thank you for your interest in contributing! Momentum is an evolving
framework, and there are still many features to be built. See our roadmap at
https://momentumframework.org

## Unit Tests

- The full test suite should be run before submitting your pull request.
- Tests covering areas of code that have changed should be included with your
  PR.

## Code Formatting

`deno fmt` should be run before submitting a PR.

## Linting

`deno lint` should be run before submitting a PR.

## Documentation

Changes to a publicly exposed component should include
[TSDoc](https://github.com/microsoft/tsdoc) comments

## Commit Message Guidelines

We have very precise rules over how our git commit messages can be formatted.
This leads to **more readable messages** that are easy to follow when looking
through the **project history**.

### Commit Message Format

We follow the
[Conventional Commits specification](https://www.conventionalcommits.org/). A
commit message consists of a header, body and footer. The header has a type,
scope and subject:

```
<type>(<scope>): <subject>
<BLANK LINE>
<body>
<BLANK LINE>
<footer>
```

The **header** is mandatory and the **scope** of the header is optional.

Any line of the commit message cannot be longer than 100 characters! This allows
the message to be easier to read on GitHub as well as in various git tools.

### Revert

If the commit reverts a previous commit, it should begin with `revert:`,
followed by the header of the reverted commit. In the body it should say:
`This reverts commit <hash>.`, where the hash is the SHA of the commit being
reverted.

### Type

Must be one of the following:

- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation only changes
- **style**: Changes that do not affect the meaning of the code (white-space,
  formatting, missing semi-colons, etc)
- **refactor**: A code change that neither fixes a bug nor adds a feature
- **perf**: A code change that improves performance
- **test**: Adding missing tests
- **chore**: Changes to the build process or auxiliary tools and libraries such
  as documentation generation

### Scope

The scope could be anything specifying the place of the commit change.

### Subject

The subject contains succinct description of the change:

- use the imperative, present tense: "change" not "changed" nor "changes"
- don't capitalize first letter
- no dot (.) at the end

### Body

Just as in the **subject**, use the imperative, present tense: "change" not
"changed" nor "changes". The body should include the motivation for the change
and contrast this with previous behavior.

### Footer

The footer should contain any information about **Breaking Changes** and is also
the place to reference GitHub issues that this commit **Closes**.

**Breaking Changes** should start with the word `BREAKING CHANGE:` with a space
or two newlines. The rest of the commit message is then used for this.
