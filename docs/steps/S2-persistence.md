# Stretch S2 — Persistence (TypeORM + SQLite)

> **Estimated time: 25 min** &nbsp;·&nbsp; **Branch start**: `start/S2-persistence` (= `solution/08-testing`)  &nbsp;·&nbsp; **Branch solution**: `solution/S2-persistence`

## Learning objectives

By the end of this stretch you will be able to:

1. Decorate a plain TypeScript class with `@Entity` / `@PrimaryColumn` / `@Column` so TypeORM treats it as a persistent record.
2. Inject a typed `Repository<T>` into a service via `@InjectRepository(T)` and replace an in-memory `Map` with persistent CRUD without changing public method shapes.
3. Configure `TypeOrmModule.forRootAsync` against a config-service-driven database path so the same module wiring works for dev, test (`:memory:`), and the persistence checkpoint (file-backed).
4. Make a workshop's "aha" moment land: insert a row, restart the server, query the row, watch it survive — the difference between in-memory and persisted state in a single test.

## Principle

The pre-S2 codebase stored everything in `Map<string, T>` instances inside each service. State lived for the lifetime of the Node process; restarting the server reset the workshop. That's fine for the core curriculum (steps 01–08) — it removes a whole class of "did the DB actually start?" friction from the first hour. But "real" NestJS services almost always sit in front of a database, so the stretch swaps the in-memory store for the most common pattern: **TypeORM repositories**.

The swap is conservative on purpose:

- **Public method shapes stay identical.** `findAll()`, `findOne(id)`, `create(dto)`, `update(id, dto)`, `remove(id)` — same names, same return types (now wrapped in `Promise<>`). Controllers don't change. Existing e2e tests still pass.
- **The seed bootstrap stays in the same place.** `onModuleInit` now checks if its table is empty before reseeding — idempotent, so re-running the dev server doesn't duplicate rows.
- **`synchronize: true`** auto-creates the schema from `@Entity` decorators on boot. Acceptable for a workshop demo; **not** acceptable for production — you'd flip to `typeorm migration:generate` + a migration runner instead. Flagged loudly in Common pitfalls.
- **The database path comes from `AppConfigService.getDatabasePath()`.** Same wrapper-service pattern step 07 introduced for env vars; one place to configure, three resolution rules: `WORKSHOP_DB` env override > `:memory:` in test mode > `data/workshop.sqlite` for dev.

The pedagogical payoff is the e2e test: insert → close the app → boot a fresh app pointed at the same SQLite file → query → row is still there. Two lines of extra setup vs. the in-memory version, one massive conceptual shift.

## .NET parallel

| NestJS construct | ASP.NET Core counterpart | Where the analogy breaks |
|------------------|--------------------------|--------------------------|
| TypeORM `@Entity` (S2) | EF Core `DbContext` + entity classes | Direct parallel; TypeORM repositories ≈ EF DbSet. |

The mapping is unusually clean for this stretch — TypeORM is the closest-to-EF-Core ORM in the JS ecosystem:

| TypeORM | EF Core |
|---|---|
| `@Entity('vehicles')` on a class | A class registered in `DbContext.OnModelCreating` (or via convention) |
| `@PrimaryColumn()` / `@Column()` | `[Key]` / `[Column]` (or fluent `HasKey` / `Property`) |
| `Repository<Vehicle>` (`@InjectRepository(Vehicle)`) | `DbSet<Vehicle>` (via `_db.Vehicles`) |
| `repo.find()`, `repo.findOneBy({ id })`, `repo.save(...)`, `repo.delete(id)` | `_db.Vehicles.ToListAsync()`, `FindAsync(id)`, `Add` + `SaveChangesAsync()`, `Remove` + `SaveChangesAsync()` |
| `TypeOrmModule.forRoot({ type: 'sqlite', database: ..., synchronize: true })` | `services.AddDbContext<AppDbContext>(o => o.UseSqlite(...))` + `db.Database.EnsureCreated()` |
| `synchronize: true` | `Database.EnsureCreated()` (with the same "never in prod" caveat) |
| `@Column({ type: 'simple-array' })` | A `Conversion` registered in `OnModelCreating` (e.g., `HasConversion(v => string.Join(',', v), v => v.Split(','))`) |

The full mapping is at [docs/dotnet-parallels.md](../dotnet-parallels.md).

## How to

You are on `start/S2-persistence` (= `solution/08-testing`). The full core curriculum is in place — your task is to swap the storage layer without breaking anything.

1. **Install** `npm install @nestjs/typeorm typeorm sqlite3` — three runtime deps.
2. **Decorate every entity** under `src/**/entities/*.entity.ts`:
   - `@Entity('table_name')` on the class.
   - `@PrimaryColumn({ type: 'varchar' })` on `id`.
   - `@Column({ type: ... })` on every other field.
   - **Date fields** (`createdAt`, `updatedAt`, `scheduledFor`) → `@Column({ type: 'datetime' })`.
   - **String arrays** (`compatibleVehicleIds`, `mechanicIds`, `partIds`) → `@Column({ type: 'simple-array' })`. TypeORM serialises them as comma-separated text — good enough for the workshop, but a real schema would normalise to a join table.
   - **Decimal numbers** (`SparePart.priceEur`) → `@Column({ type: 'real' })`. SQLite's `REAL` is double precision and round-trips the flux capacitor's `88_888.88` cleanly. An `integer` column would truncate.
   - **Optional fields** (`MaintenanceOrder.notes`) → `@Column({ type: 'varchar', nullable: true })`.
3. **Refactor each service** to use `Repository<T>` instead of `Map<string, T>`:
   - Constructor: `@InjectRepository(T) private readonly repo: Repository<T>`.
   - `findAll()` → `return this.repo.find()`.
   - `findOne(id)` → `await this.repo.findOneBy({ id })`; throw `NotFoundException` if null.
   - `create(dto)` → derive next id (read max(id) from the DB), `repo.create(...)` + `repo.save(...)`.
   - `update(id, dto)` → fetch existing, `Object.assign(existing, dto, { updatedAt: new Date() })`, `repo.save(existing)`.
   - `remove(id)` → `repo.delete(id)`; throw `NotFoundException` if `affected === 0`.
   - All methods become `async` and return `Promise<T>`.
4. **Update each module** to `imports: [TypeOrmModule.forFeature([T])]` so the repository is injectable in the matching service.
5. **Wire `TypeOrmModule.forRootAsync`** in `AppModule.imports`:
   ```ts
   TypeOrmModule.forRootAsync({
     imports: [ConfigurationModule],
     inject: [AppConfigService],
     useFactory: (config: AppConfigService) => ({
       type: 'sqlite',
       database: config.getDatabasePath(),
       entities: [Vehicle, SparePart, Manufacturer, Garage, Mechanic, MaintenanceOrder],
       synchronize: true,
     }),
   }),
   ```
6. **Add `getDatabasePath()`** to `AppConfigService`:
   ```ts
   getDatabasePath(): string {
     if (process.env.WORKSHOP_DB) return process.env.WORKSHOP_DB;
     if (process.env.NODE_ENV === 'test') return ':memory:';
     return 'data/workshop.sqlite';
   }
   ```
   Three rules: env override (used by the persistence test) → `:memory:` for the rest of the e2e suite (fast, isolated) → file-backed for dev/prod.
7. **Make the seed bootstrap idempotent**: in each service's `onModuleInit`, check `await this.repo.count() === 0` before inserting. Survives restarts (the dev SQLite file accumulates rows; reseeding would explode).
8. **Update `CompatibilityService`** to `async findCompatible(...)` — its underlying calls are now async.
9. **Update the unit test** at `src/spare-parts/spare-parts.service.spec.ts` to mock `Repository<SparePart>` instead of `SeedService`. Use `getRepositoryToken(SparePart)` to get the right DI token.
10. The seed file paths (`src/seed/*.seed.ts`), the controllers, and every existing test should keep working unchanged.

## Try it

```bash
npm install
npm run start:dev
```

```bash
# A normal POST works the same as before
curl -s -X POST http://localhost:3000/vehicles \
  -H 'content-type: application/json' \
  -H 'x-api-key: pit-pass' \
  -d '{"make":"Ariel","model":"Atom 4","year":2023,"vin":"GBARLATM4S2D54321","mileageKm":1200,"manufacturerId":"MFR005"}' \
| jq

# Note the returned id — say V013.
```

Now the persistence "aha":

```bash
# Stop the server (Ctrl+C in the dev-server terminal).
# Then start it again:
npm run start:dev

# In another terminal:
curl -s http://localhost:3000/vehicles/V013 | jq
# → the Ariel Atom is still there. Surviving a server restart is exactly
#   the difference between "in-memory" and "persisted" state.

# The SQLite file lives at data/workshop.sqlite. Inspect it directly:
sqlite3 data/workshop.sqlite "SELECT id, make, model FROM vehicles WHERE id='V013';"
```

## Checkpoint

```bash
npm run test:e2e -- S2-persistence
```

Two passing tests:

```
PASS test/S2-persistence.e2e-spec.ts
  ✓ seeds the roster on first boot (≥ 12 vehicles, ≥ 20 spare-parts)
  ✓ a vehicle inserted before close() is still readable after re-init (the persistence "aha")
```

## Going further

- **Migrations instead of `synchronize: true`**. Run `npx typeorm migration:generate src/migrations/Initial` after declaring the entities. Then disable `synchronize`, register the migrations directory in `forRoot`, and run `migration:run` on boot. That's the production pattern.
- **Switch to PostgreSQL**. Change `type: 'sqlite'` to `type: 'postgres'` and add a `host`/`port`/`username`/`password`/`database` set (read via the same `AppConfigService` pattern). The `simple-array` columns become `text[]` natively. Try it with a `docker compose` Postgres.
- **Try Prisma instead of TypeORM**. Prisma's developer ergonomics are arguably better; the entity decoration is replaced by a `schema.prisma` file. The .NET parallel is fuzzier (Prisma's API is more like an active-record style than EF Core's), which is why the workshop's canonical choice is TypeORM.
- **Index `MaintenanceOrder.status`** with `@Index()`. The maintenance-queue-limit check from step 07 (`SELECT COUNT(*) WHERE status = 'queued'`) would benefit measurably on a real-world dataset.

## Common pitfalls

- **`Cannot find module '@nestjs/typeorm'`**: install with `npm install @nestjs/typeorm typeorm sqlite3`. All three are runtime deps, not devDependencies.
- **`No metadata for "Vehicle" was found`** at boot: you forgot to add `Vehicle` to the `entities: [...]` array in `TypeOrmModule.forRoot`. Listing them explicitly (instead of `autoLoadEntities: true`) is more verbose but much easier to debug when something is missing.
- **`SQLITE_ERROR: no such table: vehicles`**: `synchronize: false` was left as the default and no migration ran. For the workshop, set `synchronize: true`. For production, run migrations.
- **The flux capacitor's price comes back as 88888**: you used `@Column({ type: 'integer' })` instead of `'real'` on `priceEur`. SQLite truncates the decimal silently.
- **Tests fail with "table already exists" between runs**: the test database is `:memory:` by default — each test file boots its own app, fresh schema, no leakage. If you see this error, you've hard-coded a file path somewhere that should respect `WORKSHOP_DB` / `NODE_ENV`.
- **The persistence test fails because the file is empty after re-init**: you re-used the same `app` instance instead of calling `createTestApp()` again. Re-init means a fresh `INestApplication` from a fresh `Test.createTestingModule({ imports: [AppModule] }).compile()` — same DB, new app.
- **`synchronize: true` in production**: don't. It will silently drop / re-create columns whose decorators don't match the existing schema. Use migrations.
- **`Repository.findOneByOrFail` throws `EntityNotFoundError`, not `NotFoundException`**: the workshop's pattern is `findOneBy({ id })` + manual `throw new NotFoundException(...)` so the global exception filter from step 05 produces the unified envelope. Don't switch to `findOneByOrFail` unless you also write a filter for `EntityNotFoundError`.
