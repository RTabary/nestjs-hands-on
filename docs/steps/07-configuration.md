# Step 07 — Configuration

> **Estimated time: 12 min** &nbsp;·&nbsp; **Branch start**: `start/07-configuration`  &nbsp;·&nbsp; **Branch solution**: `solution/07-configuration`

## Learning objectives

By the end of this step you will be able to:

1. Register `@nestjs/config`'s `ConfigModule.forRoot` and read environment variables in a typed way through a wrapper service.
2. Validate config at boot time with a Joi schema — required vars missing? The app fails to start, with a clear message.
3. Switch a value that was previously a hard-coded constant (the API key from step 06) to a configuration setting without changing any callers.
4. Add a config-driven business rule (the maintenance-queue limit) and watch the global filter from step 05 turn its exception into the unified envelope automatically.

## Principle

The NestJS configuration story has two layers:

- **`@nestjs/config`** ships `ConfigModule` (loads `.env` files into `process.env`) and `ConfigService` (the framework's stringly-typed accessor). This is the equivalent of `IConfiguration` in ASP.NET Core.
- **`AppConfigService` (this workshop)** is a thin wrapper that exposes one typed method per setting. Callers don't sprinkle `config.get<string>('apiKey')` across the codebase; they call `appConfig.getApiKey()`. This is the equivalent of `IOptions<TConfig>` in ASP.NET Core.

The pattern this step encodes:

1. Define a typed shape (`AppConfig`) and a factory (`appConfig()`) that produces it from `process.env`.
2. Register `ConfigModule.forRoot({ load: [appConfig], validationSchema: Joi.object({...}) })`. Joi validates required fields on boot.
3. Provide `AppConfigService` in a small global module so any service can inject it.
4. Replace the hard-coded constant in `ApiKeyGuard` with `this.appConfig.getApiKey()`. No other file changes.
5. Add one new business rule (`MaintenanceQueueFullException` when the queued-orders count exceeds the limit) — proves the config flows through to the service layer cleanly.

The boot-time validation is the underrated half. Forgetting to set `WORKSHOP_API_KEY=...` in `.env` doesn't yield a "weird 401 on every request" mystery — the app refuses to start, with a Joi error naming the missing field. Fail-fast on config is the cheapest defence against the "it works on my machine" class of bug.

A subtle wrinkle: `Test.createTestingModule` boots the app without `main.ts`. `ConfigModule` runs at module construction (Joi validation included), so we need a `.env.test` for the test app to find. The `envFilePath` is therefore set dynamically: `.env.test` when `NODE_ENV=test` (Jest sets that automatically), `.env` otherwise.

## .NET parallel

| NestJS construct | ASP.NET Core counterpart | Where the analogy breaks |
|------------------|--------------------------|--------------------------|
| `ConfigService` from `@nestjs/config` | `IConfiguration` + `IOptions<T>` | Direct parallel; both support strongly-typed sections. |

If you've used the .NET pattern:

```csharp
public class AppConfig {
    public int Port { get; set; }
    public string ApiKey { get; set; }
    public int MaintenanceQueueLimit { get; set; }
}

builder.Services.Configure<AppConfig>(builder.Configuration.GetSection("App"));
// then inject IOptions<AppConfig> into your services
```

…then the NestJS version is recognisable:

```ts
export interface AppConfig { port: number; apiKey: string; maintenanceQueueLimit: number; }
export const appConfig = (): AppConfig => ({ port: ..., apiKey: ..., ... });

ConfigModule.forRoot({ load: [appConfig], validationSchema: Joi.object({...}) });
// then inject AppConfigService
```

The NestJS `validationSchema` (Joi) replaces .NET DataAnnotations on the options class; otherwise the model is one-to-one. `IOptions<T>.Value` ≈ NestJS's `ConfigService.get('foo')`. The full mapping is at [docs/dotnet-parallels.md](../dotnet-parallels.md).

## How to

You are on `start/07-configuration`. Step 06's hard-coded API key (`'pit-pass'` constant in `api-key.guard.ts`) is in place.

1. Install: `npm install @nestjs/config joi`. Both are runtime deps.
2. Author **`src/config/configuration.ts`** exporting:
   - `interface AppConfig { port: number; apiKey: string; maintenanceQueueLimit: number; }`
   - `export const appConfig = (): AppConfig => ({ port, apiKey, maintenanceQueueLimit })` reading from `process.env` with sensible defaults (the API key has no default — Joi will require it).
3. Author **`src/config/app-config.service.ts`** with `@Injectable()` class injecting `ConfigService<AppConfig, true>`. Three methods: `getPort()`, `getApiKey()`, `getMaintenanceQueueLimit()`. Each calls `this.config.get(<key>, { infer: true })`.
4. Author **`src/config/configuration.module.ts`** marked `@Global` and `@Module({...})`:
   - `imports: [ConfigModule.forRoot({ isGlobal: true, cache: true, envFilePath: process.env.NODE_ENV === 'test' ? '.env.test' : '.env', load: [appConfig], validationSchema: Joi.object({ PORT: Joi.number().default(3000), WORKSHOP_API_KEY: Joi.string().required(), MAINTENANCE_QUEUE_LIMIT: Joi.number().default(10) }) })]`
   - `providers: [AppConfigService]`, `exports: [AppConfigService]`.
5. Author **`src/common/exceptions/maintenance-queue-full.exception.ts`** — extends `ConflictException`, message `Maintenance queue is full (limit N)`.
6. Modify **`src/auth/api-key.guard.ts`**: remove the `WORKSHOP_API_KEY` constant; inject `AppConfigService`; in `canActivate`, compare against `this.appConfig.getApiKey()`.
7. Modify **`src/maintenance-orders/maintenance-orders.service.ts`**: inject `AppConfigService`; in `create()`, count `'queued'` orders; throw `MaintenanceQueueFullException` if `count >= limit`.
8. Add `ConfigurationModule` to `AppModule.imports` (first in the list — other modules depend on it).
9. Author `.env.example` (template, checked in) and `.env.test` (test fixture, checked in) with the three values. Attendees copy `.env.example` to `.env` for local dev.

## Try it

```bash
npm run start:dev
```

```bash
# With .env in place: same behaviour as before, sourced from .env now
curl -s http://localhost:3000/health
# → { "status": "ok", "uptimeSec": 3 }

# Boot fails clearly when WORKSHOP_API_KEY is missing
mv .env .env.bak
npm run start:dev
# → Error: Config validation error: "WORKSHOP_API_KEY" is required
mv .env.bak .env

# Hit the queue limit. The seed has 1 queued order; default limit
# is 10 — so the 10th newly created order returns 409.
for i in {1..15}; do
  curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:3000/maintenance-orders \
    -H 'content-type: application/json' \
    -H 'x-api-key: pit-pass' \
    -d '{"vehicleId":"V001","mechanicId":"MEC001","partIds":[],"scheduledFor":"2026-12-31T09:00:00Z"}'
done
# → 201 ... 201 ... 201 ... 409 (the queue is full)
```

## Checkpoint

```bash
npm run test:e2e -- 07-
```

One passing test: it posts maintenance orders until at least one comes back as 409 with a "queue" message. On A6 (without the limit), every POST succeeded — that's why this test was red on the previous step.

## Going further

- Add a fourth setting: `LOG_LEVEL` (one of `'debug' | 'info' | 'warn' | 'error'`) and have `AppConfigService.getLogLevel()` enforce the union type via `Joi.string().valid('debug', 'info', 'warn', 'error').default('info')`.
- Try `registerAs('maintenance', () => ({ queueLimit: ... }))` from `@nestjs/config`. It namespaces a config slice — the equivalent of `IOptions<MaintenanceOptions>` in .NET.
- Practise the boot-fail behaviour: temporarily remove `WORKSHOP_API_KEY` from `.env.test` and re-run the suite. Notice every test fails at module init — Joi's error naming is precise enough to fix in one read.

## Common pitfalls

- **`Cannot read properties of undefined (reading 'getApiKey')`** in the guard: you injected `ConfigService` instead of `AppConfigService`, or you forgot to import `ConfigurationModule` in `AppModule`. The wrapper service isn't part of `@nestjs/config` — it's a class you registered.
- **Tests fail with "WORKSHOP_API_KEY is required"**: you forgot to create `.env.test` (or named it `.env.testing`, etc.). The `envFilePath` in `ConfigurationModule` looks for `.env.test` exactly when `NODE_ENV === 'test'`.
- **Queue limit fires on the wrong count**: it should count only `'queued'` orders, not all orders. Completed and cancelled orders shouldn't take a slot.
- **Joi validation runs once at boot — but `.env` was edited**: that's correct behaviour. `cache: true` reads the file once. Restart the app to pick up changes.
- **`config.get('apiKey', { infer: true })` returns `undefined`**: the `load: [appConfig]` factory is what makes the typed `apiKey` key available. Without it, you'd have to call `config.get('WORKSHOP_API_KEY')` (the raw env-var name).
