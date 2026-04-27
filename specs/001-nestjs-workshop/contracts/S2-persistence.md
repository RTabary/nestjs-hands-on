# Contract: Stretch S2 — Persistence

**Branch pair**: `start/S2-persistence` ↔ `solution/S2-persistence`
(branched from `solution/08-testing`)

No new endpoints. Replaces the in-memory `Map`-backed repositories
with TypeORM repositories backed by a file-backed SQLite database.

## What changes structurally

- `package.json` adds `@nestjs/typeorm`, `typeorm`, `sqlite3`.
- `app.module.ts` adds `TypeOrmModule.forRoot({ type: 'sqlite',
  database: 'data/workshop.sqlite', entities: [...], synchronize: true })`.
- Each existing `*.entity.ts` is decorated with `@Entity()`,
  `@PrimaryColumn()`, `@Column()` etc.
- Each `*Service` swaps its `Map<string, Entity>` for an injected
  `Repository<Entity>` from TypeORM, retaining the same public
  method shape.
- A new `seed.ts` script populates the SQLite file from the seed
  roster (R10) on first run if the table is empty.
- `.gitignore` adds `data/` so the SQLite file is local-only.

## Behavioral change visible to clients

- Identical HTTP surface — every endpoint behaves the same.
- Restart the server: data persists. (Workshop "aha" moment.)

## .NET parallel called out

TypeORM `@Entity` + `Repository<T>` ≈ EF Core `DbContext` + `DbSet<T>`.
`synchronize: true` ≈ EF migrations on `Database.EnsureCreated()`
(with the same "do not use in prod" caveat).

## Checkpoint test (`test/S2-persistence.e2e-spec.ts`)

- Boots the app pointed at `data/workshop.test.sqlite` (separate
  file to keep the dev DB clean).
- Asserts an inserted vehicle survives a `app.close()` →
  `await NestFactory.create(...)` → `app.init()` cycle inside the test.
- Cleans up the test DB file in `afterAll`.
- ≤ 60 lines total.
