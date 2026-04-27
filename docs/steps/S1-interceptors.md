# Stretch S1 — Interceptors

> **Estimated time: 12 min** &nbsp;·&nbsp; **Branch start**: `start/S1-interceptors` (= `solution/08-testing`)  &nbsp;·&nbsp; **Branch solution**: `solution/S1-interceptors`

## Learning objectives

By the end of this stretch you will be able to:

1. Implement a `NestInterceptor` that reads request context **before** the handler runs and emits an effect **after** the handler returns its result.
2. Use RxJS's `tap` operator to splice into the response stream without altering the response body.
3. Register the interceptor globally via `APP_INTERCEPTOR` so every controller — including ones added in stretch features — gets it for free.
4. Recognise interceptors as the right tool for cross-cutting *observability* (timing, logging, tracing) versus guards (authentication) and pipes (validation).

## Principle

NestJS interceptors are the framework's reactive variant of "wrap the handler". Implementing `NestInterceptor` gives you one method:

```ts
intercept(context: ExecutionContext, next: CallHandler): Observable<unknown>
```

You receive an `ExecutionContext` (request, response, handler metadata) and a `CallHandler` whose `.handle()` returns the response stream as an `Observable`. Anything you do **before** calling `next.handle()` runs before the controller method. Anything you `pipe(...)` onto the resulting Observable runs **after** the controller returns — but **before** the response is serialised to the wire, so you can still mutate response headers.

The S1 stretch demonstrates this with `TurboBoostInterceptor`:

```ts
intercept(context, next) {
  const start = Date.now();
  const ctx = context.switchToHttp();
  const req = ctx.getRequest<Request>();
  const res = ctx.getResponse<Response>();

  return next.handle().pipe(
    tap(() => {
      const duration = Date.now() - start;
      const stamp = `${duration}ms`;
      res.setHeader('X-Response-Time', stamp);
      this.logger.log(`${req.method} ${req.url} → ${stamp}`);
    }),
  );
}
```

Three things happen in sequence:

1. Capture `start` time and the request/response objects.
2. Delegate to the next handler in the chain (controller method or another interceptor).
3. After the handler emits its result, `tap` measures elapsed wall-clock and stamps the `X-Response-Time` header. Because `tap` runs before the framework writes the response to the socket, the header is part of the outgoing payload.

The interceptor is registered globally via the `APP_INTERCEPTOR` token in `AppModule.providers` — the same module-level pattern step 04's pipe and step 05's filter use. Tests pick it up automatically.

## .NET parallel

| NestJS construct | ASP.NET Core counterpart | Where the analogy breaks |
|------------------|--------------------------|--------------------------|
| `Interceptor` (`NestInterceptor`) | `IActionFilter` / middleware | NestJS interceptors are RxJS-based; .NET filters are sync/async TPL. |

If you've written an `IActionFilter` (or `IAsyncActionFilter`) in ASP.NET Core, the mental model maps over with one translation:

```csharp
// .NET
public class TurboBoostFilter : IAsyncActionFilter {
    private readonly ILogger<TurboBoostFilter> _logger;

    public async Task OnActionExecutionAsync(
        ActionExecutingContext context,
        ActionExecutionDelegate next) {
        var start = Stopwatch.StartNew();
        var executed = await next();   // run the action
        var ms = start.ElapsedMilliseconds;
        executed.HttpContext.Response.Headers["X-Response-Time"] = $"{ms}ms";
        _logger.LogInformation(
            "{method} {path} → {ms}ms",
            executed.HttpContext.Request.Method,
            executed.HttpContext.Request.Path,
            ms);
    }
}
```

Same shape: `OnActionExecutionAsync` / `intercept` are the seam, you call the next delegate / handler, then mutate the response after. The differences are stylistic: NestJS goes through Observables (`next.handle().pipe(tap(...))`) and TPL goes through `await`. The lifecycle hook position is also different — NestJS interceptors run between guards and pipes (post-handler) and between handlers and exception filters; .NET action filters run inside the MVC pipeline after model binding and before result execution. The sequencing differs, but the "before/after the handler" intuition transfers directly.

The full mapping is at [docs/dotnet-parallels.md](../dotnet-parallels.md).

## How to

You are on `start/S1-interceptors` (= `solution/08-testing`). The full core curriculum is in place — your task is to add observability across every route in one short class.

1. Create `src/common/interceptors/turbo-boost.interceptor.ts`:
   - `@Injectable()` class implementing `NestInterceptor`.
   - Inject NestJS's `Logger` (`new Logger(TurboBoostInterceptor.name)`).
   - In `intercept`: capture `Date.now()`, the `Request`, and the `Response` from the `ExecutionContext.switchToHttp()`.
   - Return `next.handle().pipe(tap(() => { ... }))` where the `tap` callback computes elapsed ms, calls `res.setHeader('X-Response-Time', stamp)`, and logs `${method} ${url} → ${stamp}`.
2. Register it globally in `src/app.module.ts`:
   ```ts
   import { APP_INTERCEPTOR } from '@nestjs/core';
   // …
   { provide: APP_INTERCEPTOR, useClass: TurboBoostInterceptor },
   ```
   Same module-level reasoning as the pipe/filter/guard from steps 04-06: `Test.createTestingModule` sees the `APP_*` providers, so the e2e test gets the interceptor for free without per-test wiring.

That's it. No DTO changes, no module imports, no controller edits.

## Try it

```bash
npm run start:dev
```

```bash
# Every response now includes X-Response-Time
curl -i -s http://localhost:3000/vehicles | grep -i x-response-time
# → x-response-time: 8ms

curl -i -s http://localhost:3000/health | grep -i x-response-time
# → x-response-time: 1ms

# 4xx responses get the header too — interceptors run regardless of
# whether the handler succeeds.
curl -i -s http://localhost:3000/vehicles/V999 | grep -iE 'x-response-time|HTTP/'
# → HTTP/1.1 404 Not Found
# → x-response-time: 3ms
```

The log line in the dev-server terminal looks like:

```
[Nest] LOG [TurboBoostInterceptor] GET /vehicles → 8ms
[Nest] LOG [TurboBoostInterceptor] GET /vehicles/V999 → 3ms
```

## Checkpoint

```bash
npm run test:e2e -- S1-interceptors
```

Two passing tests:

```
PASS test/S1-interceptors.e2e-spec.ts
  ✓ GET /vehicles response carries an X-Response-Time header
  ✓ GET /health (a different controller) also carries the header
```

The assertion is `expect(res.headers['x-response-time']).toMatch(/^\d+ms$/)` — confirms both that the header exists and that its format is the `<n>ms` stamp the interceptor emits.

## Going further

- **Per-controller interceptor**: scope the interceptor with `@UseInterceptors(TurboBoostInterceptor)` on a single controller (and remove the `APP_INTERCEPTOR` provider). All other routes lose the header. Useful when only a subset of endpoints needs the cross-cutting effect.
- **Transform the response body**: use `map(...)` instead of `tap(...)` and return a wrapped envelope: `{ data: <original-body>, meta: { responseTimeMs: <n> } }`. Caveat: this changes the API contract; clients have to unwrap the envelope.
- **Cache responses**: a `CacheInterceptor` can short-circuit the handler entirely by returning an `of(...)` Observable from `intercept` itself (don't call `next.handle()`). The interceptor pattern is flexible enough to *not* delegate when it has its own answer.
- **Trace IDs**: emit a `X-Request-Id` header (UUID per request) and bind it to a per-request log scope. The pattern is the same — capture in `intercept`, expose via `setHeader` in `tap`.

## Common pitfalls

- **Header doesn't appear in the response**: you tried to set it after `next.handle()` resolved but the response had already been written. The fix: use `.pipe(tap(...))` not `.then(...)` — `tap` runs before NestJS calls `res.json(...)`. The Express response object's `setHeader` is a no-op once headers are flushed.
- **Test assertion is `undefined`**: you wrote `res.headers['X-Response-Time']` (capitalised). Express headers are lower-cased; use `res.headers['x-response-time']`.
- **The interceptor doesn't fire in tests**: `app.useGlobalInterceptors(new TurboBoostInterceptor())` in `main.ts` is bypassed by `Test.createTestingModule().createNestApplication()`. Use the `APP_INTERCEPTOR` token in `AppModule.providers` instead, just like the pipe/filter/guard before it.
- **Logger spam in test output**: NestJS's default Logger writes to stdout, and the interceptor logs every request. Either accept the noise (it's quick) or pass a `LoggerLike` mock via `app.useLogger(new Logger())` with `setLogLevels(['warn', 'error'])` in your test setup.
- **`X-Response-Time` reads `0ms` for very fast routes**: that's accurate for sub-millisecond handlers (e.g., `GET /health`). If you need micro-second precision, swap `Date.now()` for `process.hrtime.bigint()` and convert at the end.
- **You expected the interceptor to run on 401/404 responses too**: it does — `tap` runs whenever the Observable emits, which it does even for thrown HttpExceptions caught by the global filter (the filter runs *after* interceptors). Confirm by hitting `GET /vehicles/V999` and inspecting the headers.
