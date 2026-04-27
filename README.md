# Auto-Parts API — Hands-On NestJS Workshop

A 2-hour hands-on workshop for **C#/.NET developers** discovering the
NestJS framework, framed as a cars / auto-parts web API. Eight core
steps + five stretch features, each living on its own pair of git
branches that you can switch between with a single `git checkout`.

> ⚠️ **Skeleton — being filled in across implementation phases.**
> This README's section bodies are populated as the workshop content
> lands. See [specs/001-nestjs-workshop/quickstart.md](./specs/001-nestjs-workshop/quickstart.md)
> for the canonical "first 5 minutes" until then.

## Open this if you're new to NestJS but fluent in .NET

NestJS leans heavily on patterns C#/.NET developers already know:
modules, dependency injection, decorator-driven controllers, exception
filters, configuration via typed sections. Each step's markdown
includes a `.NET parallel` callout. The canonical mapping table —
`@Module` ≈ `IServiceCollection` registration scope, `ValidationPipe`
≈ `[ApiController]` + `IValidator<T>`, `CanActivate` ≈
`AuthorizationHandler`, etc. — lives at
[docs/dotnet-parallels.md](./docs/dotnet-parallels.md).

## Prerequisites

_Section body lands in [T024](./specs/001-nestjs-workshop/tasks.md) once step 02 ships._

## First 5 minutes

_Section body lands in [T024](./specs/001-nestjs-workshop/tasks.md)._

## The workshop loop

_Section body lands in [T065](./specs/001-nestjs-workshop/tasks.md) once all 8 core steps ship._

## Stretch steps

_Section body lands in [T092](./specs/001-nestjs-workshop/tasks.md) once stretch features ship._

## "I'm stuck" protocol

_Section body lands in [T069](./specs/001-nestjs-workshop/tasks.md) (US4 audit phase)._

## Branch cheat sheet

_Section body lands alongside the workshop loop section above._

---

## For implementers (not for workshop attendees)

The workshop's design lives under [specs/001-nestjs-workshop/](./specs/001-nestjs-workshop/):

- [spec.md](./specs/001-nestjs-workshop/spec.md) — what the workshop is, who it's for
- [plan.md](./specs/001-nestjs-workshop/plan.md) — tech stack, structure, gates
- [research.md](./specs/001-nestjs-workshop/research.md) — design trade-offs
- [data-model.md](./specs/001-nestjs-workshop/data-model.md) — entities and timing
- [contracts/](./specs/001-nestjs-workshop/contracts/) — per-step HTTP surface
- [tasks.md](./specs/001-nestjs-workshop/tasks.md) — implementation task list
- [quickstart.md](./specs/001-nestjs-workshop/quickstart.md) — plan-validation checklist

The constitution governing the workshop's design is at
[.specify/memory/constitution.md](./.specify/memory/constitution.md).
