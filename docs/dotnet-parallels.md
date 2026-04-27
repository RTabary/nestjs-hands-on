# NestJS ↔ .NET / ASP.NET Core Parallels

This file is the **single source of truth** for the ".NET parallel"
callouts that appear in every step markdown under [docs/steps/](./steps/).
Each step's callout pulls the rows it needs from the table below
verbatim — keep this file authoritative; never let a step markdown's
callout drift from this canonical mapping.

Sourced from [research.md R11](../specs/001-nestjs-workshop/research.md#r11-net-↔-nestjs-parallels-reference-table-for-fr-006).

| NestJS construct | .NET / ASP.NET Core counterpart | Where the analogy breaks |
|------------------|--------------------------------|--------------------------|
| `@Module({ imports, controllers, providers, exports })` | `IServiceCollection` registrations + assembly boundary + a `ConfigureServices` per "module" | NestJS modules are explicit at the class level; .NET has no first-class "module" type — the convention is per-assembly. |
| `@Injectable()` provider (default scope) | `services.AddScoped<T>()` | NestJS default is **singleton**, not scoped; the per-request scope is opt-in via `{ scope: Scope.REQUEST }`. |
| Constructor injection in NestJS | Constructor injection in .NET | Identical pattern; only difference is decorator metadata vs source generators. |
| `@Controller('vehicles')` | `[ApiController] [Route("vehicles")]` | NestJS routing is purely decorator-driven; .NET has both attribute and conventional routing. |
| `@Get()` / `@Post()` / `@Body()` / `@Param()` | `[HttpGet] [HttpPost] [FromBody] [FromRoute]` | Direct one-to-one. |
| `ValidationPipe` + `class-validator` DTOs | `[ApiController]` auto-validation + `IValidator<T>` (FluentValidation) | NestJS pipes also **transform** (via `class-transformer`); .NET model binding is separate from validation. |
| `HttpException` + `ExceptionFilter` | `IExceptionFilter` + `ProblemDetails` | Conceptually identical; .NET ships a richer `ProblemDetails` standard out of the box. |
| `CanActivate` (Guards) | `AuthorizationHandler` + `[Authorize]` policy | NestJS guards run before pipes; .NET authorization runs in a different middleware stage. |
| `Interceptor` (`NestInterceptor`) | `IActionFilter` / middleware | NestJS interceptors are RxJS-based; .NET filters are sync/async TPL. |
| `ConfigService` from `@nestjs/config` | `IConfiguration` + `IOptions<T>` | Direct parallel; both support strongly-typed sections. |
| Jest + `@nestjs/testing` `Test.createTestingModule` | xUnit / NUnit + `WebApplicationFactory<TStartup>` | Direct parallel; "testing module" plays the same role as the test factory. |
| `@WebSocketGateway()` (S4) | SignalR `Hub` | Direct parallel; both decorator/attribute-driven. |
| TypeORM `@Entity` (S2) | EF Core `DbContext` + entity classes | Direct parallel; TypeORM repositories ≈ EF DbSet. |

## How step markdowns use this

Each `docs/steps/<step>.md` includes a `.NET parallel` section that:

1. Names the **closest** .NET / ASP.NET Core construct from the table above for the NestJS concept being introduced.
2. Quotes the matching row's "Where the analogy breaks" caveat.
3. Optionally includes a one-paragraph elaboration for non-obvious cases (e.g., the NestJS lifecycle for guards-vs-interceptors-vs-filters).

If a step introduces a NestJS concept missing from this table, **add the row here first** — do not let the step markdown invent a parallel that no other step references.

## Pre-existing reading for the audience

The workshop assumes attendees already understand the .NET side of these mappings. If an attendee is rusty on a particular .NET construct, the official Microsoft Learn page for that construct is the recommended refresher (linked from the relevant step markdown).
